"use client";

import { useState } from "react";
import { useCart } from "./CartProvider";
import { getCartStrings } from "./cart-strings";
import type { Locale } from "@/app/[lang]/dictionaries";

/**
 * 结算按钮：调 /api/checkout/create-session 建 Stripe 会话，跳托管付款页。
 * - 金额以服务端 DB 重算为准；409 表示库存不足，400 表示商品有变。
 * - 失败不清空购物车，用户改完可重试。
 */
export function CheckoutButton({
  locale,
  className,
}: {
  locale: Locale;
  className?: string;
}) {
  const { items } = useCart();
  const t = getCartStrings(locale);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onClick() {
    if (loading || items.length === 0) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/checkout/create-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          locale,
          items: items.map((i) => ({
            productId: i.productId,
            quantity: i.quantity,
          })),
        }),
      });
      const data = (await res.json().catch(() => null)) as {
        url?: string;
        error?: string;
      } | null;
      if (!res.ok || !data?.url) {
        setError(
          data?.error === "insufficient_stock" ? t.stockError : t.checkoutError,
        );
        return;
      }
      window.location.href = data.url;
    } catch {
      setError(t.checkoutError);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={onClick}
        disabled={loading || items.length === 0}
        className={className}
      >
        {loading ? t.checkoutProcessing : t.checkout}
      </button>
      {error && (
        <p role="alert" className="mt-2 text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
