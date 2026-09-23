"use client";

import { useCart } from "./CartProvider";

/**
 * 页眉购物车图标（客户端组件）：显示商品件数徽章，点击打开购物车抽屉。
 * Header 本身保持服务端组件，只把这个小按钮做成客户端组件嵌进去。
 */
export function CartButton({ label }: { label: string }) {
  const { count, openCart } = useCart();

  return (
    <button
      type="button"
      onClick={openCart}
      title={label}
      aria-label={label}
      className="relative p-2 text-stone-500 hover:text-brand-700 transition"
    >
      <span aria-hidden="true">🛒</span>
      {count > 0 && (
        <span
          aria-hidden="true"
          className="absolute top-0 right-0 min-w-5 h-5 px-1 rounded-full bg-accent-500 text-white text-[11px] font-bold flex items-center justify-center"
        >
          {count > 99 ? "99+" : count}
        </span>
      )}
    </button>
  );
}
