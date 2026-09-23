/**
 * 购物车领域逻辑（纯函数 + 类型，服务端和客户端都能 import）。
 *
 * 约定：
 * - 金额一律用整数分（cents），货币 CAD。
 * - 快照价格只用于展示；结算前必须走 POST /api/cart/validate 用数据库重算。
 * - localStorage 持久化只在浏览器里发生（函数内部守卫 typeof window），
 *   所以这个模块被服务端 import 时是安全的。
 */

export interface CartItem {
  productId: string;
  slug: string;
  nameEn: string;
  nameFr: string;
  priceCents: number;
  quantity: number;
}

/** 可加入购物车的商品快照。isActive=false 的商品会被 reducer 拒绝加入。 */
export type AddableProduct = Omit<CartItem, "quantity"> & {
  isActive: boolean;
};

export const CART_STORAGE_KEY = "my-store:cart:v1";
const MAX_QTY_PER_LINE = 99;

export type CartAction =
  | { type: "hydrate"; items: CartItem[] }
  | { type: "add"; product: AddableProduct; quantity: number }
  | { type: "setQuantity"; productId: string; quantity: number }
  | { type: "remove"; productId: string }
  | { type: "clear" };

function isValidItem(v: unknown): v is CartItem {
  if (typeof v !== "object" || v === null) return false;
  const o = v as Record<string, unknown>;
  return (
    typeof o.productId === "string" &&
    o.productId.length > 0 &&
    typeof o.slug === "string" &&
    typeof o.nameEn === "string" &&
    typeof o.nameFr === "string" &&
    typeof o.priceCents === "number" &&
    Number.isInteger(o.priceCents) &&
    o.priceCents >= 0 &&
    typeof o.quantity === "number" &&
    Number.isInteger(o.quantity) &&
    o.quantity >= 1 &&
    o.quantity <= MAX_QTY_PER_LINE
  );
}

function snapshotOf(p: AddableProduct): Omit<CartItem, "quantity"> {
  return {
    productId: p.productId,
    slug: p.slug,
    nameEn: p.nameEn,
    nameFr: p.nameFr,
    priceCents: p.priceCents,
  };
}

export function cartReducer(state: CartItem[], action: CartAction): CartItem[] {
  switch (action.type) {
    case "hydrate":
      return action.items.filter(isValidItem);

    case "add": {
      // 前端保护：下架商品不可加入（详情页本身已 404，这里是第二道防线）。
      if (!action.product.isActive) return state;
      const qty = Math.max(
        1,
        Math.min(MAX_QTY_PER_LINE, Math.floor(action.quantity || 1)),
      );
      const snapshot = snapshotOf(action.product);
      const existing = state.find((i) => i.productId === snapshot.productId);
      if (existing) {
        return state.map((i) =>
          i.productId === snapshot.productId
            ? { ...i, quantity: Math.min(MAX_QTY_PER_LINE, i.quantity + qty) }
            : i,
        );
      }
      return [...state, { ...snapshot, quantity: qty }];
    }

    case "setQuantity": {
      const qty = Math.floor(action.quantity);
      if (qty < 1) return state.filter((i) => i.productId !== action.productId);
      return state.map((i) =>
        i.productId === action.productId
          ? { ...i, quantity: Math.min(MAX_QTY_PER_LINE, qty) }
          : i,
      );
    }

    case "remove":
      return state.filter((i) => i.productId !== action.productId);

    case "clear":
      return [];
  }
}

/** 徽章用的商品总件数（各行数量之和）。 */
export function cartCount(items: CartItem[]): number {
  return items.reduce((n, i) => n + i.quantity, 0);
}

/** 小计（整数分）。展示用；结算价以服务端校验为准。 */
export function cartSubtotalCents(items: CartItem[]): number {
  return items.reduce((s, i) => s + i.priceCents * i.quantity, 0);
}

/** 挂载后从 localStorage 恢复；损坏/过期的数据会被过滤掉。 */
export function loadCartFromStorage(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(CART_STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    const items = Array.isArray(parsed)
      ? parsed
      : (parsed as { items?: unknown } | null)?.items;
    return Array.isArray(items) ? items.filter(isValidItem) : [];
  } catch {
    return [];
  }
}

export function saveCartToStorage(items: CartItem[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      CART_STORAGE_KEY,
      JSON.stringify({ version: 1, items }),
    );
  } catch {
    // 配额满等情况静默忽略：购物车仍在内存中可用
  }
}
