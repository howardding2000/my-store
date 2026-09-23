import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/cart/validate —— 服务端价格校验。
 *
 * Phase 5 结算前调用：浏览器传来的购物车只含 { productId, quantity }，
 * 这里用数据库重算每一行的单价和行小计，下架/不存在的商品标记 valid:false。
 * 价格永远以 DB 为准，不信任浏览器传来的任何金额。
 *
 * 输入:  { "items": [{ "productId": "…", "quantity": 2 }] }
 * 输出:  { "currency": "CAD",
 *          "lines": [{ productId, quantity, valid, slug?, nameEn?, nameFr?,
 *                       priceCents?, lineTotalCents?, inStock?, stockQty?,
 *                       reason? }],
 *          "subtotalCents": 1234 }
 *
 * 注意：这里不创建 Stripe Checkout 会话 —— 那是 Phase 5 的工作，
 * 到时会先调这个接口拿到可信价格，再用可信价格建会话。
 */

interface ValidateItemInput {
  productId: string;
  quantity: number;
}

const MAX_LINES = 100;
const MAX_QTY = 99;

function parseItems(body: unknown): ValidateItemInput[] | null {
  if (typeof body !== "object" || body === null) return null;
  const items = (body as { items?: unknown }).items;
  if (!Array.isArray(items) || items.length === 0 || items.length > MAX_LINES) {
    return null;
  }
  const out: ValidateItemInput[] = [];
  for (const raw of items) {
    if (typeof raw !== "object" || raw === null) return null;
    const { productId, quantity } = raw as Record<string, unknown>;
    if (typeof productId !== "string" || productId.length === 0) return null;
    if (
      typeof quantity !== "number" ||
      !Number.isInteger(quantity) ||
      quantity < 1 ||
      quantity > MAX_QTY
    ) {
      return null;
    }
    out.push({ productId, quantity });
  }
  return out;
}

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const items = parseItems(body);
  if (!items) {
    return NextResponse.json({ error: "invalid_cart" }, { status: 400 });
  }

  const ids = [...new Set(items.map((i) => i.productId))];
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

  const lines = items.map(({ productId, quantity }) => {
    const p = byId.get(productId);
    if (!p || !p.isActive) {
      return {
        productId,
        quantity,
        valid: false as const,
        reason: "unavailable" as const,
      };
    }
    return {
      productId,
      quantity,
      valid: true as const,
      slug: p.slug,
      nameEn: p.nameEn,
      nameFr: p.nameFr,
      priceCents: p.priceCents,
      lineTotalCents: p.priceCents * quantity,
      inStock: p.stockQty >= quantity,
      stockQty: p.stockQty,
    };
  });

  const subtotalCents = lines.reduce(
    (sum, l) => sum + (l.valid ? l.lineTotalCents : 0),
    0,
  );

  return NextResponse.json({ currency: "CAD", lines, subtotalCents });
}
