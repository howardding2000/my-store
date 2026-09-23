"use client";

import { useCart } from "./CartProvider";
import { getCartStrings } from "./cart-strings";
import type { AddableProduct } from "@/lib/cart";
import type { Locale } from "@/app/[lang]/dictionaries";

/**
 * "加入购物车"按钮（客户端组件）。
 * 商品卡片、详情页等服务端组件里直接渲染它，传可序列化的商品快照即可。
 */
export function AddToCartButton({
  product,
  locale,
  quantity = 1,
  className,
}: {
  product: AddableProduct;
  locale: Locale;
  quantity?: number;
  className?: string;
}) {
  const { addItem } = useCart();
  const t = getCartStrings(locale);

  return (
    <button
      type="button"
      onClick={() => addItem(product, quantity)}
      className={
        className ??
        "w-full rounded-full bg-brand-700 text-white font-semibold py-3 px-6 hover:bg-brand-800 active:scale-[0.99] transition"
      }
    >
      {t.addToCart}
    </button>
  );
}
