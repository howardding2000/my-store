import Link from "next/link";
import type { Dictionary, Locale } from "@/app/[lang]/dictionaries";
import { CartButton } from "./cart/CartButton";

/**
 * 前台页眉（服务端组件；购物车按钮是客户端组件，徽章数字走 CartContext）。
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
            <Link href={`${home}/products`} className="hover:text-brand-700">
              {dict.nav.products}
            </Link>
            <Link href={`${home}/search`} className="hover:text-brand-700">
              {dict.nav.search}
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

            {/* 搜索 */}
            <Link
              href={`${home}/search`}
              title={dict.nav.search}
              aria-label={dict.nav.search}
              className="p-2 text-stone-500 hover:text-brand-700"
            >
              🔍
            </Link>

            {/* 购物车：Phase 4 已实现，点击打开抽屉 */}
            <CartButton label={dict.nav.cart} />
            {/* 账户：Phase 5 实现，这里先占位 */}
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
