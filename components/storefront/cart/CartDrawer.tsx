"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useCart } from "./CartProvider";
import { CartLineItem } from "./CartLineItem";
import { getCartStrings } from "./cart-strings";
import { formatPriceCents } from "@/lib/format";

/**
 * 购物车抽屉（右侧滑出）。
 * 由 CartProvider 统一渲染，全站可用；Esc / 点击遮罩关闭，打开时锁定 body 滚动。
 */
export function CartDrawer() {
  const { isOpen, closeCart, items, count, subtotalCents, locale } = useCart();
  const t = getCartStrings(locale);
  const home = `/${locale}`;

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeCart();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [isOpen, closeCart]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50"
      role="dialog"
      aria-modal="true"
      aria-label={t.cart}
    >
      <div
        className="absolute inset-0 bg-black/40"
        onClick={closeCart}
        aria-hidden="true"
      />
      <aside className="absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-stone-200">
          <h2 className="text-lg font-bold text-stone-900">
            {t.cart} · {t.itemCount(count)}
          </h2>
          <button
            type="button"
            onClick={closeCart}
            aria-label={t.closeCart}
            className="p-2 text-stone-500 hover:text-stone-900"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5">
          {items.length === 0 ? (
            <div className="py-16 text-center">
              <p className="text-4xl" aria-hidden="true">
                🛒
              </p>
              <p className="mt-4 text-stone-500">{t.empty}</p>
              <Link
                href={`${home}/products`}
                onClick={closeCart}
                className="mt-6 inline-block rounded-full bg-brand-700 text-white font-semibold px-6 py-2.5 hover:bg-brand-800 transition"
              >
                {t.browseProducts}
              </Link>
            </div>
          ) : (
            items.map((item) => (
              <CartLineItem key={item.productId} item={item} locale={locale} />
            ))
          )}
        </div>

        {items.length > 0 && (
          <div className="border-t border-stone-200 px-5 py-4 space-y-3">
            <div className="flex items-baseline justify-between">
              <span className="font-semibold text-stone-700">{t.subtotal}</span>
              <span className="text-xl font-bold text-stone-900 tabular-nums">
                {formatPriceCents(subtotalCents, locale)}
              </span>
            </div>
            <p className="text-xs text-stone-500">{t.note}</p>
            <div className="flex gap-2">
              <Link
                href={`${home}/cart`}
                onClick={closeCart}
                className="flex-1 text-center rounded-full border border-stone-300 font-semibold py-2.5 hover:border-brand-500 hover:text-brand-700 transition"
              >
                {t.viewCart}
              </Link>
              {/* Phase 5 占位：在线结算还没做，按钮禁用并注明 */}
              <button
                type="button"
                disabled
                aria-disabled="true"
                title={t.checkoutSoon}
                className="flex-1 rounded-full bg-stone-200 text-stone-500 font-semibold py-2.5 cursor-not-allowed"
              >
                {t.checkout}
              </button>
            </div>
            <button
              type="button"
              onClick={closeCart}
              className="w-full text-center text-sm text-stone-500 hover:text-brand-700 py-1"
            >
              {t.continueShopping}
            </button>
          </div>
        )}
      </aside>
    </div>
  );
}
