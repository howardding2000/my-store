import { randomBytes } from "node:crypto";
import { prisma } from "@/lib/prisma";

/**
 * 结算时的可信金额计算（服务端专用）。
 *
 * 原则：浏览器传来的购物车只含 { productId, quantity }，
 * 单价一律用数据库重算，不信任客户端传来的任何金额。
 * `/api/cart/validate` 是给前端看的资讯接口；这里是真正决定收多少钱的地方。
 */

// ---------------------------------------------------------------------------
// 运费 / 税政策（可调参数，改这里即可，不用动业务逻辑）
// ---------------------------------------------------------------------------
/**
 * 免邮开关：测试阶段关闭——所有订单统一收运费，不设免邮门槛。
 * 店主确认免邮政策后把这里改成 true 即可（门槛见下行）。
 */
export const FREE_SHIPPING_ENABLED = false;
/** 免邮门槛（开关打开后生效）：满 CA$75 全加拿大免邮。 */
export const FREE_SHIPPING_THRESHOLD_CENTS = 7500;
/** 统一运费 CA$9。 */
export const FLAT_SHIPPING_CENTS = 900;
/**
 * 税：店主无 GST/QST 税号，价格含税，结账时不另计税。
 * 将来有税号并确认征收方式后，再把税做成按省计算的 line item。
 */
export const TAX_CENTS = 0;

export interface CartInputItem {
  productId: string;
  quantity: number;
}

export interface CheckoutLine {
  productId: string;
  slug: string;
  nameEn: string;
  nameFr: string;
  unitPriceCents: number;
  quantity: number;
  lineTotalCents: number;
  stockQty: number;
}

export interface CheckoutTotals {
  lines: CheckoutLine[];
  subtotalCents: number;
  shippingCents: number;
  taxCents: number;
  totalCents: number;
}

const MAX_LINES = 100;
const MAX_QTY = 99;

export class CheckoutError extends Error {
  code: "invalid_cart" | "unavailable" | "insufficient_stock";
  productIds: string[];

  constructor(
    code: CheckoutError["code"],
    productIds: string[] = [],
    message?: string,
  ) {
    super(message ?? code);
    this.code = code;
    this.productIds = productIds;
  }
}

function parseItems(body: unknown): CartInputItem[] {
  if (typeof body !== "object" || body === null) {
    throw new CheckoutError("invalid_cart");
  }
  const raw = body as { items?: unknown };
  if (!Array.isArray(raw.items) || raw.items.length === 0 || raw.items.length > MAX_LINES) {
    throw new CheckoutError("invalid_cart");
  }
  const out: CartInputItem[] = [];
  for (const item of raw.items) {
    if (typeof item !== "object" || item === null) {
      throw new CheckoutError("invalid_cart");
    }
    const { productId, quantity } = item as Record<string, unknown>;
    if (typeof productId !== "string" || productId.length === 0) {
      throw new CheckoutError("invalid_cart");
    }
    if (
      typeof quantity !== "number" ||
      !Number.isInteger(quantity) ||
      quantity < 1 ||
      quantity > MAX_QTY
    ) {
      throw new CheckoutError("invalid_cart");
    }
    out.push({ productId, quantity });
  }
  // 同一商品多行合并，避免重复扣库存
  const merged = new Map<string, number>();
  for (const { productId, quantity } of out) {
    merged.set(productId, Math.min(MAX_QTY, (merged.get(productId) ?? 0) + quantity));
  }
  return [...merged.entries()].map(([productId, quantity]) => ({
    productId,
    quantity,
  }));
}

/**
 * 用数据库重算可信金额。任一商品不存在/下架/库存不足都抛 CheckoutError，
 * 调用方按 code 转成 400 / 409。
 */
export async function computeCheckoutTotals(
  body: unknown,
): Promise<CheckoutTotals> {
  const items = parseItems(body);

  const ids = items.map((i) => i.productId);
  const products = await prisma.product.findMany({
    where: { id: { in: ids } },
    select: {
      id: true,
      slug: true,
      nameEn: true,
      nameFr: true,
      priceCents: true,
      isActive: true,
      stockQty: true,
    },
  });
  const byId = new Map(products.map((p) => [p.id, p]));

  const unavailable = items
    .filter(({ productId }) => {
      const p = byId.get(productId);
      return !p || !p.isActive;
    })
    .map(({ productId }) => productId);
  if (unavailable.length > 0) {
    throw new CheckoutError("unavailable", unavailable);
  }

  const lines: CheckoutLine[] = items.map(({ productId, quantity }) => {
    const p = byId.get(productId)!;
    return {
      productId,
      slug: p.slug,
      nameEn: p.nameEn,
      nameFr: p.nameFr,
      unitPriceCents: p.priceCents,
      quantity,
      lineTotalCents: p.priceCents * quantity,
      stockQty: p.stockQty,
    };
  });

  const understocked = lines
    .filter((l) => l.stockQty < l.quantity)
    .map((l) => l.productId);
  if (understocked.length > 0) {
    throw new CheckoutError("insufficient_stock", understocked);
  }

  const subtotalCents = lines.reduce((s, l) => s + l.lineTotalCents, 0);
  const shippingCents =
    FREE_SHIPPING_ENABLED &&
    subtotalCents >= FREE_SHIPPING_THRESHOLD_CENTS
      ? 0
      : FLAT_SHIPPING_CENTS;
  const taxCents = TAX_CENTS;
  const totalCents = subtotalCents + shippingCents + taxCents;

  return { lines, subtotalCents, shippingCents, taxCents, totalCents };
}

/** 订单号：MS-YYYYMMDD-XXXXXX（X 为大写字母数字），小店量级下冲突概率可忽略。 */
export function generateOrderNumber(now: Date = new Date()): string {
  const date = now.toISOString().slice(0, 10).replaceAll("-", "");
  const rand = randomBytes(3).toString("hex").toUpperCase();
  return `MS-${date}-${rand}`;
}
