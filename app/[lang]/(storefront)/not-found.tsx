import Link from "next/link";
import { getDictionary } from "../dictionaries";

/**
 * 前台 404：商品不存在、已下架、分类 slug 拼错时都会落到这里。
 * 双语：按当前语言显示文案。
 */
export default async function StorefrontNotFound() {
  const { dict, locale } = await getDictionary();
  const home = `/${locale}`;

  return (
    <div className="max-w-2xl mx-auto px-4 py-24 text-center">
      <p className="text-6xl font-extrabold text-stone-200">404</p>
      <h1 className="mt-4 text-2xl font-bold text-stone-900">
        {dict.notFound.title}
      </h1>
      <p className="mt-2 text-stone-500">{dict.notFound.message}</p>
      <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
        <Link
          href={home}
          className="rounded-full bg-brand-700 text-white font-semibold px-8 py-3 hover:bg-brand-800"
        >
          {dict.notFound.backHome}
        </Link>
        <Link
          href={`${home}/products`}
          className="rounded-full border-2 border-brand-700 text-brand-800 font-semibold px-8 py-3 hover:bg-brand-50"
        >
          {dict.notFound.browseProducts}
        </Link>
      </div>
    </div>
  );
}
