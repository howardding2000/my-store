"use client";

import Link from "next/link";
import { useCart } from "./CartProvider";
import { CartLineItem } from "./CartLineItem";
import { CheckoutButton } from "./CheckoutButton";
import { getCartStrings } from "./cart-strings";
import { formatPriceCents } from "@/lib/format";
import type { Locale } from "@/app/[lang]/dictionaries";

/**
 * 独立购物车页 /[lang]/cart 的交互主体。
 * 空态 / 商品列表 / 汇总卡片；结算按钮是 Phase 5 占位（禁用）。
 */
export function CartPageClient({ locale }: { locale: Locale }) {
  const { items, count, subtotalCents, clearCart } = useCart();
  const t = getCartStrings(locale);
  const home = `/${locale}`;

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900">
        {t.title}
      </h1>
      <p className="mt-1 text-stone-500">{t.itemCount(count)}</p>

      {items.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-stone-200 bg-white p-12 text-center">
          <p className="text-5xl" aria-hidden="true">
            🛒
          </p>
          <p className="mt-4 text-stone-600">{t.empty}</p>
          <Link
            href={`${home}/products`}
            className="mt-6 inline-block rounded-full bg-brand-700 text-white font-semibold px-8 py-3 hover:bg-brand-800 transition"
          >
            {t.browseProducts}
          </Link>
        </div>
      ) : (
        <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_320px]">
          <section
            aria-label={t.title}
            className="rounded-2xl border border-stone-200 bg-white px-5"
          >
            {items.map((item) => (
              <CartLineItem key={item.productId} item={item} locale={locale} />
            ))}
            <div className="py-4 flex justify-between">
              <button
                type="button"
                onClick={clearCart}
                className="text-sm text-stone-500 hover:text-red-600"
              >
                {t.clearCart}
              </button>
              <Link
                href={`${home}/products`}
                className="text-sm font-semibold text-brand-700 hover:underline"
              >
                {t.continueShopping}
              </Link>
            </div>
          </section>

          <aside className="h-fit rounded-2xl border border-stone-200 bg-white p-5 space-y-4 lg:sticky lg:top-24">
            <div className="flex items-baseline justify-between">
              <span className="font-semibold text-stone-700">{t.subtotal}</span>
              <span className="text-2xl font-bold text-stone-900 tabular-nums">
                {formatPriceCents(subtotalCents, locale)}
              </span>
            </div>
            <p className="text-xs text-stone-500">{t.note}</p>
            <CheckoutButton
              locale={locale}
              className="w-full rounded-full bg-brand-700 text-white font-semibold py-3 hover:bg-brand-800 transition disabled:opacity-60 disabled:cursor-wait"
            />
          </aside>
        </div>
      )}
    </div>
  );
}
