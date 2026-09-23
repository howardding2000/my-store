"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from "react";
import type { ReactNode } from "react";
import {
  cartCount,
  cartReducer,
  cartSubtotalCents,
  loadCartFromStorage,
  saveCartToStorage,
} from "@/lib/cart";
import type { AddableProduct, CartItem } from "@/lib/cart";
import type { Locale } from "@/app/[lang]/dictionaries";
import { CartDrawer } from "./CartDrawer";

interface CartContextValue {
  items: CartItem[];
  /** 徽章用的总件数 */
  count: number;
  /** 小计（整数分） */
  subtotalCents: number;
  locale: Locale;
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  /** 加入后会自动打开抽屉；isActive=false 的商品会被静默拒绝 */
  addItem: (product: AddableProduct, quantity?: number) => void;
  setQuantity: (productId: string, quantity: number) => void;
  removeItem: (productId: string) => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

/**
 * 购物车 Provider（客户端组件）。
 * - 状态：useReducer；持久化：localStorage（挂载后恢复，避免 SSR hydration 不一致）。
 * - 登录态合并 Phase 4 不做：保持匿名购物车，简单可靠。
 * - 抽屉直接挂在这里渲染，全站任何位置 addItem / openCart 都可用。
 */
export function CartProvider({
  children,
  locale,
}: {
  children: ReactNode;
  locale: Locale;
}) {
  const [items, dispatch] = useReducer(cartReducer, []);
  const [isOpen, setIsOpen] = useState(false);
  const hydrated = useRef(false);

  // 挂载后从 localStorage 恢复（首屏先渲染空购物车，避免 hydration mismatch）
  useEffect(() => {
    dispatch({ type: "hydrate", items: loadCartFromStorage() });
    hydrated.current = true;
  }, []);

  // 恢复完成后再写回，避免首屏把空购物车覆盖掉已有数据
  useEffect(() => {
    if (hydrated.current) saveCartToStorage(items);
  }, [items]);

  const openCart = useCallback(() => setIsOpen(true), []);
  const closeCart = useCallback(() => setIsOpen(false), []);
  const addItem = useCallback((product: AddableProduct, quantity = 1) => {
    dispatch({ type: "add", product, quantity });
    setIsOpen(true);
  }, []);
  const setQuantity = useCallback(
    (productId: string, quantity: number) =>
      dispatch({ type: "setQuantity", productId, quantity }),
    [],
  );
  const removeItem = useCallback(
    (productId: string) => dispatch({ type: "remove", productId }),
    [],
  );
  const clearCart = useCallback(() => dispatch({ type: "clear" }), []);

  const value = useMemo<CartContextValue>(
    () => ({
      items,
      count: cartCount(items),
      subtotalCents: cartSubtotalCents(items),
      locale,
      isOpen,
      openCart,
      closeCart,
      addItem,
      setQuantity,
      removeItem,
      clearCart,
    }),
    [
      items,
      locale,
      isOpen,
      openCart,
      closeCart,
      addItem,
      setQuantity,
      removeItem,
      clearCart,
    ],
  );

  return (
    <CartContext.Provider value={value}>
      {children}
      <CartDrawer />
    </CartContext.Provider>
  );
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside <CartProvider>");
  return ctx;
}
