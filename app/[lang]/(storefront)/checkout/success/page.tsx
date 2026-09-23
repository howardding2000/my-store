import Link from "next/link";
import { getDictionary } from "../../../dictionaries";
import { getStripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { formatPriceCents } from "@/lib/format";
import { ClearCartOnPaid } from "@/components/storefront/checkout/ClearCartOnPaid";
import type Stripe from "stripe";

/**
 * /[lang]/checkout/success —— Stripe 付款成功回跳页。
 *
 * 安全：不信任 URL 参数。服务端用 session_id 去 Stripe 查会话，
 * 只有 payment_status === "paid" 才算成功，再用 metadata.orderId
 * 从 DB 取订单展示。伪造的 session_id 会落到"未完成"分支。
 */
export async function generateMetadata() {
  const { dict } = await getDictionary();
  return { title: `${dict.checkout.successTitle} — ${dict.storeName}` };
}

interface Props {
  searchParams: Promise<{ session_id?: string }>;
}

export default async function CheckoutSuccessPage({ searchParams }: Props) {
  const { dict, locale } = await getDictionary();
  const t = dict.checkout;
  const { session_id: sessionId } = await searchParams;

  let session: Stripe.Checkout.Session | null = null;
  if (sessionId) {
    try {
      session = await getStripe().checkout.sessions.retrieve(sessionId);
    } catch {
      session = null;
    }
  }

  const paid = session?.payment_status === "paid";
  let order: {
    orderNumber: string;
    totalCents: number;
    email: string;
  } | null = null;

  if (paid && session) {
    const orderId = session.metadata?.orderId;
    const found = orderId
      ? await prisma.order.findUnique({ where: { id: orderId } })
      : await prisma.order.findUnique({
          where: { stripeSessionId: session.id },
        });
    if (found) {
      order = {
        orderNumber: found.orderNumber,
        totalCents: found.totalCents,
        email: found.email,
      };
    }
  }

  if (!paid || !order) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <p className="text-5xl" aria-hidden="true">
          ⚠️
        </p>
        <h1 className="mt-4 text-2xl font-extrabold text-stone-900">
          {t.notCompletedTitle}
        </h1>
        <p className="mt-2 text-stone-600">{t.notCompletedMessage}</p>
        <Link
          href={`/${locale}/cart`}
          className="mt-8 inline-block rounded-full bg-brand-700 text-white font-semibold px-8 py-3 hover:bg-brand-800 transition"
        >
          {t.backToCart}
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-16 text-center">
      <ClearCartOnPaid paid />
      <p className="text-5xl" aria-hidden="true">
        ✅
      </p>
      <h1 className="mt-4 text-2xl font-extrabold text-stone-900">
        {t.successTitle}
      </h1>
      <p className="mt-2 text-stone-600">{t.successMessage}</p>
      <dl className="mt-8 rounded-2xl border border-stone-200 bg-white p-6 text-left space-y-3">
        <div className="flex justify-between">
          <dt className="text-stone-500">{t.orderNumber}</dt>
          <dd className="font-bold text-stone-900 tabular-nums">
            {order.orderNumber}
          </dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-stone-500">{t.totalPaid}</dt>
          <dd className="font-bold text-stone-900 tabular-nums">
            {formatPriceCents(order.totalCents, locale)}
          </dd>
        </div>
      </dl>
      <Link
        href={`/${locale}/products`}
        className="mt-8 inline-block rounded-full bg-brand-700 text-white font-semibold px-8 py-3 hover:bg-brand-800 transition"
      >
        {t.continueShopping}
      </Link>
    </div>
  );
}
