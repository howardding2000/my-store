import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getStripe } from "@/lib/stripe";
import {
  CheckoutError,
  computeCheckoutTotals,
  generateOrderNumber,
} from "@/lib/checkout";

/**
 * POST /api/checkout/create-session —— 创建 Stripe Checkout Session。
 *
 * 流程：
 * 1. 浏览器只传 { items: [{ productId, quantity }], locale }。
 * 2. 服务端用数据库重算每一行单价/小计/运费/总计（不信任客户端金额），
 *    下架或库存不足直接 400/409，绝不用错误的价格建会话。
 * 3. 在 DB 建 pending 订单（含商品快照），再建 Stripe Checkout Session，
 *    把 stripeSessionId 回写到订单。
 * 4. 返回 Stripe 托管付款页 URL，浏览器跳转过去付。
 *
 * 幂等/异常：Stripe 会话 30 分钟过期；用户放弃付款只会留下一条 pending
 * 订单（后台 Phase 6 可清理），不会扣库存——库存只在 webhook 收到
 * checkout.session.completed 后才扣。
 */

export const runtime = "nodejs";

const ERROR_STATUS: Record<CheckoutError["code"], number> = {
  invalid_cart: 400,
  unavailable: 400,
  insufficient_stock: 409,
};

async function createOrderWithUniqueNumber(data: {
  email: string;
  subtotalCents: number;
  shippingCents: number;
  taxCents: number;
  totalCents: number;
  items: {
    productId: string;
    nameEn: string;
    nameFr: string;
    unitPriceCents: number;
    quantity: number;
  }[];
}) {
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      return await prisma.order.create({
        data: {
          orderNumber: generateOrderNumber(),
          email: data.email,
          status: "pending",
          subtotalCents: data.subtotalCents,
          shippingCents: data.shippingCents,
          taxCents: data.taxCents,
          totalCents: data.totalCents,
          currency: "CAD",
          items: {
            create: data.items.map((i) => ({
              productId: i.productId,
              nameEn: i.nameEn,
              nameFr: i.nameFr,
              unitPriceCents: i.unitPriceCents,
              quantity: i.quantity,
            })),
          },
        },
      });
    } catch (e) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === "P2002"
      ) {
        continue; // 订单号极小概率冲突，重试
      }
      throw e;
    }
  }
  throw new Error("failed to generate unique order number");
}

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const locale =
    typeof (body as { locale?: unknown }).locale === "string" &&
    ["en", "fr"].includes((body as { locale: string }).locale)
      ? ((body as { locale: string }).locale as "en" | "fr")
      : null;
  if (!locale) {
    return NextResponse.json({ error: "invalid_locale" }, { status: 400 });
  }

  let totals;
  try {
    totals = await computeCheckoutTotals(body);
  } catch (e) {
    if (e instanceof CheckoutError) {
      return NextResponse.json(
        { error: e.code, productIds: e.productIds },
        { status: ERROR_STATUS[e.code] },
      );
    }
    throw e;
  }

  // email 在 Stripe 付款页收集；webhook 回来后再回填。
  const order = await createOrderWithUniqueNumber({
    email: "",
    subtotalCents: totals.subtotalCents,
    shippingCents: totals.shippingCents,
    taxCents: totals.taxCents,
    totalCents: totals.totalCents,
    items: totals.lines,
  });

  const origin =
    req.headers.get("origin") ?? new URL(req.url).origin;

  let session;
  try {
    session = await getStripe().checkout.sessions.create({
      mode: "payment",
      line_items: [
        ...totals.lines.map((l) => ({
          price_data: {
            currency: "cad",
            unit_amount: l.unitPriceCents,
            product_data: {
              name: locale === "fr" ? l.nameFr : l.nameEn,
            },
          },
          quantity: l.quantity,
        })),
        ...(totals.shippingCents > 0
          ? [
              {
                price_data: {
                  currency: "cad",
                  unit_amount: totals.shippingCents,
                  product_data: {
                    name: locale === "fr" ? "Livraison" : "Shipping",
                  },
                },
                quantity: 1,
              },
            ]
          : []),
      ],
      shipping_address_collection: { allowed_countries: ["CA"] },
      metadata: { orderId: order.id },
      success_url: `${origin}/${locale}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/${locale}/checkout/cancel`,
      expires_at: Math.floor(Date.now() / 1000) + 30 * 60,
    });
  } catch (e) {
    // Stripe 建会话失败：pending 订单保留（可重试），不抛给用户看堆栈
    console.error("stripe checkout session create failed", e);
    return NextResponse.json(
      { error: "stripe_unavailable", orderNumber: order.orderNumber },
      { status: 502 },
    );
  }

  if (!session.url) {
    return NextResponse.json({ error: "stripe_unavailable" }, { status: 502 });
  }

  await prisma.order.update({
    where: { id: order.id },
    data: { stripeSessionId: session.id },
  });

  return NextResponse.json({ url: session.url });
}
