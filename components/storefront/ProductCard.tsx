import Link from "next/link";
import type { Locale } from "@/app/[lang]/dictionaries";
import { formatPriceCents } from "@/lib/format";
import { localizedName, type ProductWithCategory } from "@/lib/catalog";
import { AddToCartButton } from "./cart/AddToCartButton";

/**
 * 商品卡片：列表页、首页精选、详情页"猜你喜欢"共用。
 * 图片/标题/价格是详情页链接；底部是独立的"加入购物车"按钮
 * （按钮不能嵌在 <a> 里，所以卡片主体改成 div + 内部 Link）。
 */
export default function ProductCard({
  product,
  locale,
}: {
  product: ProductWithCategory;
  locale: Locale;
}) {
  const name = localizedName(product, locale);
  const categoryName = product.category
    ? locale === "fr"
      ? product.category.nameFr
      : product.category.nameEn
    : null;

  return (
    <div className="group rounded-2xl border border-stone-200 overflow-hidden bg-white hover:shadow-lg hover:border-brand-300 transition flex flex-col">
      <Link
        href={`/${locale}/products/${product.slug}`}
        className="block"
        aria-label={name}
      >
        <div className="aspect-square bg-gradient-to-br from-stone-100 to-stone-300 flex items-center justify-center">
          {/* Phase 3 起步用占位图；真实图片上传在后台管理阶段做 */}
          {categoryName && (
            <span className="text-xs font-semibold uppercase tracking-widest text-stone-500 bg-white/70 rounded-full px-3 py-1">
              {categoryName}
            </span>
          )}
        </div>
        <div className="p-4 pb-3">
          <h3 className="font-semibold text-stone-900 text-sm sm:text-base group-hover:text-brand-700 line-clamp-2">
            {name}
          </h3>
          <p className="mt-1 flex items-baseline gap-2">
            <span className="text-brand-700 font-bold">
              {formatPriceCents(product.priceCents, locale)}
            </span>
            {product.compareAtCents != null &&
              product.compareAtCents > product.priceCents && (
                <span className="text-stone-400 text-sm line-through">
                  {formatPriceCents(product.compareAtCents, locale)}
                </span>
              )}
          </p>
        </div>
      </Link>
      <div className="px-4 pb-4 mt-auto">
        <AddToCartButton
          product={{
            productId: product.id,
            slug: product.slug,
            nameEn: product.nameEn,
            nameFr: product.nameFr,
            priceCents: product.priceCents,
            isActive: product.isActive,
          }}
          locale={locale}
          className="w-full rounded-full bg-brand-50 text-brand-800 border border-brand-200 font-semibold py-2 text-sm hover:bg-brand-700 hover:text-white hover:border-brand-700 transition"
        />
      </div>
    </div>
  );
}
