import Link from "next/link";
import { notFound } from "next/navigation";
import { getDictionary } from "../../../dictionaries";
import {
  getProductBySlug,
  getProductSlugs,
  getRelatedProducts,
  localizedDesc,
  localizedName,
} from "@/lib/catalog";
import { formatPriceCents } from "@/lib/format";
import ProductCard from "@/components/storefront/ProductCard";

/**
 * 商品详情页 /[lang]/products/[slug]
 * - 构建时预渲染所有在售商品（generateStaticParams 从数据库读 slug）
 * - 不存在或已下架（isActive=false）的商品 → 404
 */
export async function generateStaticParams() {
  try {
    const slugs = await getProductSlugs();
    return slugs.map((slug) => ({ slug }));
  } catch {
    // 构建环境没有数据库连接时不让构建失败；页面走请求时渲染
    return [];
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { dict, locale } = await getDictionary();
  const { slug } = await params;
  let product = null;
  try {
    product = await getProductBySlug(slug);
  } catch {
    product = null;
  }
  if (!product || !product.isActive) {
    return { title: dict.notFound.productTitle };
  }
  const name = localizedName(product, locale);
  const desc = localizedDesc(product, locale);
  return {
    title: `${name} — ${dict.storeName}`,
    description: desc ?? name,
  };
}

function StockBadge({
  stockQty,
  inStock,
  lowStock,
  outOfStock,
}: {
  stockQty: number;
  inStock: string;
  lowStock: string;
  outOfStock: string;
}) {
  if (stockQty <= 0) {
    return (
      <span className="inline-block rounded-full bg-stone-200 text-stone-600 text-sm font-semibold px-3 py-1">
        {outOfStock}
      </span>
    );
  }
  if (stockQty <= 10) {
    return (
      <span className="inline-block rounded-full bg-accent-100 text-accent-800 text-sm font-semibold px-3 py-1">
        {lowStock.replace("{count}", String(stockQty))}
      </span>
    );
  }
  return (
    <span className="inline-block rounded-full bg-brand-100 text-brand-800 text-sm font-semibold px-3 py-1">
      {inStock}
    </span>
  );
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { dict, locale } = await getDictionary();
  const { slug } = await params;

  const product = await getProductBySlug(slug);
  if (!product || !product.isActive) {
    notFound();
  }

  const name = localizedName(product, locale);
  const desc = localizedDesc(product, locale);
  const categoryName = product.category
    ? localizedName(product.category, locale)
    : null;
  const home = `/${locale}`;
  const related = await getRelatedProducts(product.id, product.categoryId);

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      {/* 面包屑 */}
      <nav aria-label="Breadcrumb" className="text-sm text-stone-500">
        <Link href={home} className="hover:text-brand-700">
          {dict.productDetail.home}
        </Link>
        <span className="mx-2">/</span>
        <Link href={`${home}/products`} className="hover:text-brand-700">
          {dict.productDetail.products}
        </Link>
        <span className="mx-2">/</span>
        <span className="text-stone-800 font-medium">{name}</span>
      </nav>

      <div className="mt-6 grid gap-8 md:grid-cols-2">
        {/* 图片：Phase 3 占位，后台上传阶段替换 */}
        <div className="aspect-square rounded-2xl bg-gradient-to-br from-stone-100 to-stone-300 flex items-center justify-center">
          {categoryName && (
            <span className="text-xs font-semibold uppercase tracking-widest text-stone-500 bg-white/70 rounded-full px-3 py-1">
              {categoryName}
            </span>
          )}
        </div>

        <div>
          {categoryName && product.category && (
            <Link
              href={`${home}/products?category=${encodeURIComponent(product.category.slug)}`}
              className="text-sm font-semibold text-brand-700 hover:underline"
            >
              {categoryName}
            </Link>
          )}
          <h1 className="mt-2 text-2xl sm:text-3xl font-extrabold text-stone-900">
            {name}
          </h1>

          <p className="mt-3 flex items-baseline gap-3">
            <span className="text-2xl font-bold text-brand-700">
              {formatPriceCents(product.priceCents, locale)}
            </span>
            {product.compareAtCents != null &&
              product.compareAtCents > product.priceCents && (
                <span className="text-stone-400 line-through">
                  {formatPriceCents(product.compareAtCents, locale)}
                </span>
              )}
          </p>

          <div className="mt-3">
            <StockBadge
              stockQty={product.stockQty}
              inStock={dict.productDetail.inStock}
              lowStock={dict.productDetail.lowStock}
              outOfStock={dict.productDetail.outOfStock}
            />
          </div>

          {/* 加入购物车：Phase 4 实现，这里先占位禁用 */}
          <button
            type="button"
            disabled
            aria-disabled="true"
            title={dict.productDetail.addToCart}
            className="mt-6 w-full rounded-full bg-stone-300 text-stone-500 font-semibold py-3 cursor-not-allowed"
          >
            {dict.productDetail.addToCart}
          </button>

          <h2 className="mt-8 font-bold text-stone-900">
            {dict.productDetail.description}
          </h2>
          <p className="mt-2 text-stone-600 whitespace-pre-line">
            {desc || dict.productDetail.noDescription}
          </p>
        </div>
      </div>

      {/* 猜你喜欢 */}
      {related.length > 0 && (
        <section className="mt-14">
          <h2 className="text-xl font-bold text-stone-900">
            {dict.productDetail.related}
          </h2>
          <div className="mt-4 grid gap-4 grid-cols-2 lg:grid-cols-4">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} locale={locale} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
