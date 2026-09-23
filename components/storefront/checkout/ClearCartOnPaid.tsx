"use client";

import { useEffect, useRef } from "react";
import { useCart } from "../cart/CartProvider";

/**
 * 付款成功后清空本地购物车。
 * 订单已在服务端建好、webhook 负责标 paid；这里只清浏览器的本地状态，
 * 避免用户回到购物车页看到"已买过"的商品还躺着。
 */
export function ClearCartOnPaid({ paid }: { paid: boolean }) {
  const { clearCart } = useCart();
  const done = useRef(false);
  useEffect(() => {
    if (paid && !done.current) {
      done.current = true;
      clearCart();
    }
  }, [paid, clearCart]);
  return null;
}
