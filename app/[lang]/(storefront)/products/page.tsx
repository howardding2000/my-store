import Link from "next/link";
import { notFound } from "next/navigation";
import { getDictionary } from "../../dictionaries";
import {
  getCategories,
  getProducts,
  localizedDesc,
  localizedName,
} from "@/lib/catalog";
import ProductCard from "@/components/storefront/ProductCard";

type SearchParams = Promise<{
  [key: string]: string | string[] | undefined;
}>;

/**
 * 商品列表页 /[lang]/products
 * 分类筛选走查询参数：/en/products?category=3d-prints
 * （单页 + 参数的方案：代码最少、最可靠；独立分类路由对小店是多余复杂度）
 *
 * 用到 searchParams，所以这个页面是请求时动态渲染的（不做构建时预渲染）。
 */
export default async function ProductsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { dict, locale } = await getDictionary();
  const sp = await searchParams;

  // category 参数只取第一个值；数组/多值视为无效输入
  const rawCategory = sp.category;
  const categorySlug =
    typeof rawCategory === "string" ? rawCategory : undefined;

  const categories = await getCategories();

  // 传了不存在的分类 slug → 404（拼写错误不该静默显示全部商品）
  if (categorySlug && !categories.some((c) => c.slug === categorySlug)) {
    notFound();
  }

  const products = await getProducts(categorySlug);
  const activeCategory = categorySlug
    ? categories.find((c) => c.slug === categorySlug)
    : undefined;
  const home = `/${locale}`;
  const base = `${home}/products`;

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900">
        {activeCategory
          ? localizedName(activeCategory, locale)
          : dict.products.title}
      </h1>
      <p className="mt-1 text-stone-500">
        {activeCategory
          ? localizedDesc(activeCategory, locale) || dict.products.subtitle
          : dict.products.subtitle}
      </p>

      {/* 分类筛选 tab */}
      <nav
        aria-label={dict.products.filterLabel}
        className="mt-6 flex flex-wrap gap-2"
      >
        <Link
          href={base}
          aria-current={!categorySlug ? "true" : undefined}
          className={`rounded-full px-4 py-2 text-sm font-semibold border ${
            !categorySlug
              ? "bg-brand-700 text-white border-brand-700"
              : "bg-white text-stone-700 border-stone-300 hover:border-brand-400"
          }`}
        >
          {dict.products.allCategories}
        </Link>
        {categories.map((c) => {
          const active = c.slug === categorySlug;
          return (
            <Link
              key={c.slug}
              href={`${base}?category=${encodeURIComponent(c.slug)}`}
              aria-current={active ? "true" : undefined}
              className={`rounded-full px-4 py-2 text-sm font-semibold border ${
                active
                  ? "bg-brand-700 text-white border-brand-700"
                  : "bg-white text-stone-700 border-stone-300 hover:border-brand-400"
              }`}
            >
              {localizedName(c, locale)}
            </Link>
          );
        })}
      </nav>

      {/* 商品网格 */}
      {products.length === 0 ? (
        <p className="mt-10 text-stone-500">{dict.products.noProducts}</p>
      ) : (
        <div className="mt-8 grid gap-4 grid-cols-2 lg:grid-cols-4">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} locale={locale} />
          ))}
        </div>
      )}
    </div>
  );
}
