import { getDictionary } from "../../dictionaries";
import { searchProducts } from "@/lib/catalog";
import ProductCard from "@/components/storefront/ProductCard";

type SearchParams = Promise<{
  [key: string]: string | string[] | undefined;
}>;

const MAX_QUERY_LENGTH = 100;

/**
 * 搜索页 /[lang]/search?q=关键词
 * - 纯服务端表单（GET），无 JS 也能用
 * - q 缺失/空/超长/数组形式都按"未输入有效关键词"处理，不查库
 * - 只搜在售商品（searchProducts 内部已过滤 isActive）
 */
export default async function SearchPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { dict, locale } = await getDictionary();
  const sp = await searchParams;

  const raw = sp.q;
  const query =
    typeof raw === "string" ? raw.trim() : "";
  const tooLong = query.length > MAX_QUERY_LENGTH;

  const results =
    query && !tooLong ? await searchProducts(query) : [];

  const countText =
    results.length === 1
      ? dict.search.oneResult
      : dict.search.manyResults.replace("{count}", String(results.length));

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900">
        {dict.search.title}
      </h1>
      <p className="mt-1 text-stone-500">{dict.search.subtitle}</p>

      <form
        method="get"
        action={`/${locale}/search`}
        className="mt-6 flex gap-2 max-w-xl"
      >
        <label htmlFor="q" className="sr-only">
          {dict.search.title}
        </label>
        <input
          id="q"
          name="q"
          type="search"
          defaultValue={query}
          maxLength={MAX_QUERY_LENGTH}
          placeholder={dict.search.placeholder}
          className="flex-1 rounded-full border border-stone-300 px-5 py-2.5 text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-brand-500"
        />
        <button
          type="submit"
          className="rounded-full bg-brand-700 text-white font-semibold px-6 py-2.5 hover:bg-brand-800"
        >
          {dict.search.button}
        </button>
      </form>

      <div className="mt-8">
        {!query && <p className="text-stone-500">{dict.search.noQuery}</p>}

        {tooLong && <p className="text-red-700">{dict.search.tooLong}</p>}

        {query && !tooLong && (
          <>
            <p className="text-stone-600">
              {dict.search.resultsFor.replace("{q}", query)} · {countText}
            </p>
            {results.length === 0 ? (
              <p className="mt-4 text-stone-500">
                {dict.search.noResults.replace("{q}", query)}
              </p>
            ) : (
              <div className="mt-4 grid gap-4 grid-cols-2 lg:grid-cols-4">
                {results.map((p) => (
                  <ProductCard key={p.id} product={p} locale={locale} />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
