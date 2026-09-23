import Link from "next/link";
import type { Locale } from "@/app/[lang]/dictionaries";
import { formatPriceCents } from "@/lib/format";
import { localizedName, type ProductWithCategory } from "@/lib/catalog";

/**
 * 商品卡片：列表页、首页精选、详情页"猜你喜欢"共用。
 * 整张卡片是一个链接，指向商品详情页。
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
    <Link
      href={`/${locale}/products/${product.slug}`}
      className="group rounded-2xl border border-stone-200 overflow-hidden bg-white hover:shadow-lg hover:border-brand-300 transition"
    >
      <div className="aspect-square bg-gradient-to-br from-stone-100 to-stone-300 flex items-center justify-center">
        {/* Phase 3 起步用占位图；真实图片上传在后台管理阶段做 */}
        {categoryName && (
          <span className="text-xs font-semibold uppercase tracking-widest text-stone-500 bg-white/70 rounded-full px-3 py-1">
            {categoryName}
          </span>
        )}
      </div>
      <div className="p-4">
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
  );
}
