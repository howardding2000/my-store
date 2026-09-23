import Link from "next/link";
import { getDictionary } from "../../../dictionaries";

/** /[lang]/checkout/cancel —— 用户在 Stripe 付款页取消后回跳。没扣款，购物车原样保留。 */
export async function generateMetadata() {
  const { dict } = await getDictionary();
  return { title: `${dict.checkout.cancelTitle} — ${dict.storeName}` };
}

export default async function CheckoutCancelPage() {
  const { dict, locale } = await getDictionary();
  const t = dict.checkout;

  return (
    <div className="max-w-xl mx-auto px-4 py-16 text-center">
      <p className="text-5xl" aria-hidden="true">
        🛒
      </p>
      <h1 className="mt-4 text-2xl font-extrabold text-stone-900">
        {t.cancelTitle}
      </h1>
      <p className="mt-2 text-stone-600">{t.cancelMessage}</p>
      <Link
        href={`/${locale}/cart`}
        className="mt-8 inline-block rounded-full bg-brand-700 text-white font-semibold px-8 py-3 hover:bg-brand-800 transition"
      >
        {t.tryAgain}
      </Link>
    </div>
  );
}
