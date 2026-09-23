import Link from "next/link";
import { getDictionary } from "../dictionaries";
import { formatPrice } from "@/lib/format";

/** 首页：纯静态展示，真实商品数据 Phase 2/3 接入 */
export default async function HomePage() {
  const { dict, locale } = await getDictionary();
  const home = `/${locale}`;

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
          {dict.categories.items.map((cat, i) => (
            <div
              key={cat.name}
              className={`rounded-2xl p-6 text-white bg-gradient-to-br ${categoryStyles[i % categoryStyles.length]}`}
            >
              <h3 className="text-lg font-bold">{cat.name}</h3>
              <p className="mt-2 text-sm text-white/85">{cat.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 精选商品（静态占位） */}
      <section id="featured" className="bg-white border-y border-stone-200">
        <div className="max-w-6xl mx-auto px-4 py-14">
          <h2 className="text-2xl font-bold text-stone-900">
            {dict.featured.title}
          </h2>
          <p className="mt-1 text-stone-500">{dict.featured.subtitle}</p>
          <div className="mt-6 grid gap-4 grid-cols-2 lg:grid-cols-4">
            {dict.featured.products.map((p) => (
              <div
                key={p.name}
                className="rounded-2xl border border-stone-200 overflow-hidden bg-white"
              >
                <div className="aspect-square bg-gradient-to-br from-stone-100 to-stone-300 flex items-center justify-center">
                  <span className="text-xs font-semibold uppercase tracking-widest text-stone-500 bg-white/70 rounded-full px-3 py-1">
                    {p.tag}
                  </span>
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-stone-900 text-sm sm:text-base">
                    {p.name}
                  </h3>
                  <p className="mt-1 text-brand-700 font-bold">
                    {formatPrice(p.price, locale)}
                  </p>
                  <button
                    type="button"
                    className="mt-3 w-full rounded-full bg-stone-900 text-white text-sm font-semibold py-2 hover:bg-stone-700"
                  >
                    {dict.featured.addToCart}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

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
