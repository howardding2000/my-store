import Link from "next/link";
import { getDictionary } from "../dictionaries";
import {
  getCategories,
  getFeaturedProducts,
  localizedDesc,
  localizedName,
} from "@/lib/catalog";
import ProductCard from "@/components/storefront/ProductCard";

/** 首页：分类和精选商品从数据库读真实数据 */
export default async function HomePage() {
  const { dict, locale } = await getDictionary();
  const home = `/${locale}`;

  const [categories, featured] = await Promise.all([
    getCategories(),
    getFeaturedProducts(4),
  ]);

  const categoryStyles = [
    "from-brand-600 to-brand-900",
    "from-accent-500 to-accent-600",
    "from-stone-500 to-stone-800",
  ];

  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-b from-brand-50 to-stone-50">
        <div className="max-w-6xl mx-auto px-4 py-16 sm:py-24 text-center">
          <span className="inline-block text-xs font-semibold uppercase tracking-widest text-brand-700 bg-brand-100 rounded-full px-3 py-1">
            {dict.hero.badge}
          </span>
          <h1 className="mt-4 text-3xl sm:text-5xl font-extrabold text-stone-900 leading-tight">
            {dict.hero.title}
          </h1>
          <p className="mt-4 max-w-2xl mx-auto text-stone-600 sm:text-lg">
            {dict.hero.subtitle}
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href={`${home}#featured`}
              className="rounded-full bg-brand-700 text-white font-semibold px-8 py-3 hover:bg-brand-800"
            >
              {dict.hero.primaryCta}
            </Link>
            <Link
              href={`${home}#categories`}
              className="rounded-full border-2 border-brand-700 text-brand-800 font-semibold px-8 py-3 hover:bg-brand-50"
            >
              {dict.hero.secondaryCta}
            </Link>
          </div>
        </div>
      </section>

      {/* 分类 */}
      <section id="categories" className="max-w-6xl mx-auto px-4 py-14">
        <h2 className="text-2xl font-bold text-stone-900">
          {dict.categories.title}
        </h2>
        <p className="mt-1 text-stone-500">{dict.categories.subtitle}</p>
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          {categories.map((cat, i) => (
            <Link
              key={cat.slug}
              href={`${home}/products?category=${encodeURIComponent(cat.slug)}`}
              className={`rounded-2xl p-6 text-white bg-gradient-to-br ${categoryStyles[i % categoryStyles.length]} hover:opacity-95`}
            >
              <h3 className="text-lg font-bold">
                {localizedName(cat, locale)}
              </h3>
              <p className="mt-2 text-sm text-white/85">
                {localizedDesc(cat, locale)}
              </p>
            </Link>
          ))}
        </div>
      </section>

      {/* 精选商品（数据库真实数据） */}
      {featured.length > 0 && (
        <section id="featured" className="bg-white border-y border-stone-200">
          <div className="max-w-6xl mx-auto px-4 py-14">
            <h2 className="text-2xl font-bold text-stone-900">
              {dict.featured.title}
            </h2>
            <p className="mt-1 text-stone-500">{dict.featured.subtitle}</p>
            <div className="mt-6 grid gap-4 grid-cols-2 lg:grid-cols-4">
              {featured.map((p) => (
                <ProductCard key={p.id} product={p} locale={locale} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 价值主张 */}
      <section className="max-w-6xl mx-auto px-4 py-14">
        <div className="grid gap-4 sm:grid-cols-3">
          {dict.valueProps.map((v) => (
            <div
              key={v.title}
              className="rounded-2xl border border-stone-200 bg-white p-6"
            >
              <h3 className="font-bold text-stone-900">{v.title}</h3>
              <p className="mt-2 text-sm text-stone-600">{v.description}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
