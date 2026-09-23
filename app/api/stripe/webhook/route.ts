import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import type Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { getStripe } from "@/lib/stripe";

/**
 * POST /api/stripe/webhook —— Stripe 事件接收。
 *
 * 安全要点（逐条对照）：
 * 1. 验签名：用原始 body 文本 + stripe-signature 头 + STRIPE_WEBHOOK_SECRET
 *    做 constructEvent，签名不对直接 400，绝不处理伪造事件。
 * 2. 幂等：StripeEvent.eventId 有唯一索引。同一事件重发时：
 *    - 已有记录且 processed=true → 直接 200，不重复处理；
 *    - 已有记录但 processed=false（上次处理中途崩了）→ 重新处理。
 * 3. 业务幂等：事务里先查订单状态，只有 pending 才转 paid / 扣库存，
 *    即使事件被处理两次，库存也只扣一次。
 * 4. 订单和库存变更包在一个 transaction 里，要么全成要么全不成。
 *
 * 注意：proxy.ts 的 matcher 已排除 /api/*，webhook 不会被语言跳转干扰。
 */

export const runtime = "nodejs";

function isUniqueViolation(e: unknown): boolean {
  return (
    e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002"
  );
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const orderId =
    session.metadata?.orderId ??
    (await prisma.order
      .findUnique({ where: { stripeSessionId: session.id }, select: { id: true } })
      .then((o) => o?.id)) ??
    null;
  if (!orderId) {
    console.error("webhook: order not found for session", session.id);
    return;
  }

  await prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });
    if (!order || order.status !== "pending") return; // 已处理过，幂等跳过

    const paymentIntentId =
      typeof session.payment_intent === "string"
        ? session.payment_intent
        : session.payment_intent?.id ?? null;

    await tx.order.update({
      where: { id: order.id },
      data: {
        status: "paid",
        email: session.customer_details?.email ?? order.email,
        stripePaymentIntentId: paymentIntentId,
        shippingAddress:
          (session.collected_information?.shipping_details
            ?.address as unknown as Prisma.InputJsonValue) ?? undefined,
      },
    });

    for (const item of order.items) {
      if (!item.productId) continue;
      await tx.product.update({
        where: { id: item.productId },
        data: { stockQty: { decrement: item.quantity } },
      });
      await tx.inventoryLog.create({
        data: {
          productId: item.productId,
          change: -item.quantity,
          reason: `sale:${order.orderNumber}`,
        },
      });
    }
  });
}

async function handleCheckoutExpired(session: Stripe.Checkout.Session) {
  const orderId = session.metadata?.orderId;
  if (!orderId) return;
  await prisma.order.updateMany({
    where: { id: orderId, status: "pending" },
    data: { status: "cancelled" },
  });
}

export async function POST(req: Request) {
  const signature = req.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!signature || !webhookSecret) {
    return new NextResponse("missing signature", { status: 400 });
  }

  // 必须是原始文本：JSON.parse 再 stringify 会改变空白/顺序，导致验签失败
  const rawBody = await req.text();

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(
      rawBody,
      signature,
      webhookSecret,
    );
  } catch {
    return new NextResponse("invalid signature", { status: 400 });
  }

  // 事件级幂等：先占位，处理完再标 processed
  let stripeEvent;
  try {
    stripeEvent = await prisma.stripeEvent.create({
      data: { eventId: event.id, type: event.type },
    });
  } catch (e) {
    if (!isUniqueViolation(e)) throw e;
    stripeEvent = await prisma.stripeEvent.findUniqueOrThrow({
      where: { eventId: event.id },
    });
    if (stripeEvent.processed) {
      return new NextResponse("duplicate", { status: 200 });
    }
    // processed=false：上次崩在处理中，重试继续处理
  }

  try {
    if (event.type === "checkout.session.completed") {
      await handleCheckoutCompleted(
        event.data.object as Stripe.Checkout.Session,
      );
    } else if (event.type === "checkout.session.expired") {
      await handleCheckoutExpired(
        event.data.object as Stripe.Checkout.Session,
      );
    }
    // 其他事件类型：只记录，不处理

    await prisma.stripeEvent.update({
      where: { eventId: event.id },
      data: { processed: true },
    });
  } catch (e) {
    // 处理失败时不标 processed，Stripe 重发时可继续处理；
    // 返回 500 让 Stripe 按退避策略重试
    console.error("webhook handler failed", event.id, event.type, e);
    return new NextResponse("handler error", { status: 500 });
  }

  return new NextResponse("ok", { status: 200 });
}
