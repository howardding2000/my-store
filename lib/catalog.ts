import { cache } from "react";
import { prisma } from "./prisma";
import type { Category, Product } from "@prisma/client";
import type { Locale } from "@/app/[lang]/dictionaries";

/**
 * 商品目录的数据访问层（只在服务端运行）。
 * 用 React.cache 包一层：同一次请求里多处调用相同参数时只查一次数据库。
 * 注意：前台只返回 isActive 的商品，下架商品永远不会出现在店面。
 */

export type ProductWithCategory = Product & { category: Category | null };

export const getCategories = cache(async (): Promise<Category[]> => {
  return prisma.category.findMany({ orderBy: { sortOrder: "asc" } });
});

export const getProducts = cache(
  async (categorySlug?: string): Promise<ProductWithCategory[]> => {
    return prisma.product.findMany({
      where: {
        isActive: true,
        ...(categorySlug ? { category: { slug: categorySlug } } : {}),
      },
      include: { category: true },
      orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }],
    });
  },
);

export const getFeaturedProducts = cache(
  async (take = 4): Promise<ProductWithCategory[]> => {
    return prisma.product.findMany({
      where: { isActive: true, isFeatured: true },
      include: { category: true },
      orderBy: { createdAt: "desc" },
      take,
    });
  },
);

export const getProductBySlug = cache(
  async (slug: string): Promise<ProductWithCategory | null> => {
    return prisma.product.findUnique({
      where: { slug },
      include: { category: true },
    });
  },
);

export const getProductSlugs = cache(async (): Promise<string[]> => {
  const rows = await prisma.product.findMany({
    where: { isActive: true },
    select: { slug: true },
  });
  return rows.map((r) => r.slug);
});

/** 简单搜索：中英法名称和描述做不区分大小写的包含匹配，上限 50 条。 */
export const searchProducts = cache(
  async (query: string): Promise<ProductWithCategory[]> => {
    return prisma.product.findMany({
      where: {
        isActive: true,
        OR: [
          { nameEn: { contains: query, mode: "insensitive" } },
          { nameFr: { contains: query, mode: "insensitive" } },
          { descEn: { contains: query, mode: "insensitive" } },
          { descFr: { contains: query, mode: "insensitive" } },
        ],
      },
      include: { category: true },
      orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }],
      take: 50,
    });
  },
);

export const getRelatedProducts = cache(
  async (productId: string, categoryId: string | null, take = 4): Promise<ProductWithCategory[]> => {
    if (!categoryId) return [];
    return prisma.product.findMany({
      where: { isActive: true, categoryId, id: { not: productId } },
      include: { category: true },
      orderBy: { createdAt: "desc" },
      take,
    });
  },
);

/** 按当前语言取商品/分类的双语名称。 */
export function localizedName(
  item: { nameEn: string; nameFr: string },
  locale: Locale,
): string {
  return locale === "fr" ? item.nameFr : item.nameEn;
}

/** 按当前语言取商品/分类的双语描述（可能为空）。 */
export function localizedDesc(
  item: { descEn: string | null; descFr: string | null },
  locale: Locale,
): string | null {
  return locale === "fr" ? item.descFr : item.descEn;
}
