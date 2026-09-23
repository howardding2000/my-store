"use client";

import { useCart } from "./CartProvider";
import { getCartStrings } from "./cart-strings";
import { formatPriceCents } from "@/lib/format";
import type { CartItem } from "@/lib/cart";
import type { Locale } from "@/app/[lang]/dictionaries";

/**
 * 购物车行：商品名、单价、数量步进器、行小计、删除。
 * 抽屉和独立购物车页共用。
 * 注意：lib/catalog 的 localizedName 依赖 Prisma（服务端），这里直接按 locale 取字段。
 */
export function CartLineItem({
  item,
  locale,
}: {
  item: CartItem;
  locale: Locale;
}) {
  const { setQuantity, removeItem } = useCart();
  const t = getCartStrings(locale);
  const name = locale === "fr" ? item.nameFr : item.nameEn;

  return (
    <div className="flex gap-3 py-4 border-b border-stone-200 last:border-0">
      {/* 图片占位：真实图片在后台上传阶段接入 */}
      <div className="w-16 h-16 shrink-0 rounded-xl bg-gradient-to-br from-stone-100 to-stone-300" />

      <div className="flex-1 min-w-0">
        <p className="font-semibold text-stone-900 text-sm line-clamp-2">
          {name}
        </p>
        <p className="mt-0.5 text-xs text-stone-500">
          {formatPriceCents(item.priceCents, locale)}
        </p>

        <div className="mt-2 flex items-center justify-between">
          <div
            className="inline-flex items-center rounded-full border border-stone-300"
            role="group"
            aria-label={t.quantity}
          >
            <button
              type="button"
              onClick={() => setQuantity(item.productId, item.quantity - 1)}
              disabled={item.quantity <= 1}
              aria-label={t.decrease}
              className="w-8 h-8 flex items-center justify-center text-stone-600 hover:text-brand-700 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              −
            </button>
            <span
              className="w-8 text-center text-sm font-semibold tabular-nums"
              aria-live="polite"
            >
              {item.quantity}
            </span>
            <button
              type="button"
              onClick={() => setQuantity(item.productId, item.quantity + 1)}
              aria-label={t.increase}
              className="w-8 h-8 flex items-center justify-center text-stone-600 hover:text-brand-700"
            >
              ＋
            </button>
          </div>

          <p className="text-sm font-bold text-stone-900 tabular-nums">
            {formatPriceCents(item.priceCents * item.quantity, locale)}
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={() => removeItem(item.productId)}
        aria-label={t.remove}
        title={t.remove}
        className="self-start p-1 text-stone-400 hover:text-red-600 transition"
      >
        ✕
      </button>
    </div>
  );
}
