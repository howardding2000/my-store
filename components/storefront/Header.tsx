import Link from "next/link";
import type { Dictionary, Locale } from "@/app/[lang]/dictionaries";

/**
 * 前台页眉（服务端组件，无 JS 下发）。
 * 语言切换：Phase 1 切到另一语言的首页；后续阶段会保留当前页面。
 */
export default function Header({
  dict,
  locale,
}: {
  dict: Dictionary;
  locale: Locale;
}) {
  const home = `/${locale}`;

  return (
    <>
      <div className="bg-brand-900 text-white text-center text-xs sm:text-sm py-2 px-4">
        {dict.announcement}
      </div>
      <header className="sticky top-0 z-10 bg-white/95 backdrop-blur border-b border-stone-200">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
          <Link href={home} className="text-xl font-bold text-brand-800">
            {dict.storeName}
          </Link>

          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-stone-700">
            <Link href={home} className="hover:text-brand-700">
              {dict.nav.home}
            </Link>
            <Link href={`${home}#categories`} className="hover:text-brand-700">
              {dict.nav.categories}
            </Link>
            <Link href={`${home}#featured`} className="hover:text-brand-700">
              {dict.featured.title}
            </Link>
          </nav>

          <div className="flex items-center gap-1 sm:gap-2">
            {/* 语言切换 */}
            <div className="flex rounded-full border border-stone-300 text-xs font-semibold overflow-hidden">
              {(["en", "fr"] as const).map((l) => (
                <Link
                  key={l}
                  href={`/${l}`}
                  aria-current={l === locale ? "true" : undefined}
                  className={`px-2.5 py-1.5 uppercase ${
                    l === locale
                      ? "bg-brand-700 text-white"
                      : "text-stone-600 hover:bg-stone-100"
                  }`}
                >
                  {l}
                </Link>
              ))}
            </div>

            {/* 购物车 / 账户：Phase 4、5 实现，这里先占位 */}
            <span
              title={dict.nav.cart}
              aria-disabled="true"
              className="p-2 text-stone-500 cursor-not-allowed"
            >
              🛒
            </span>
            <span
              title={dict.nav.account}
              aria-disabled="true"
              className="p-2 text-stone-500 cursor-not-allowed"
            >
              👤
            </span>
          </div>
        </div>
      </header>
    </>
  );
}
