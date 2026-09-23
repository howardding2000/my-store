import Link from "next/link";
import type { Dictionary, Locale } from "@/app/[lang]/dictionaries";

/** 前台页脚（服务端组件） */
export default function Footer({
  dict,
  locale,
}: {
  dict: Dictionary;
  locale: Locale;
}) {
  const home = `/${locale}`;
  return (
    <footer className="bg-stone-900 text-stone-300 mt-16">
      <div className="max-w-6xl mx-auto px-4 py-12 grid gap-8 sm:grid-cols-3">
        <div>
          <p className="text-lg font-bold text-white">{dict.storeName}</p>
          <p className="mt-2 text-sm text-stone-400">{dict.footer.tagline}</p>
        </div>
        <div>
          <p className="text-sm font-semibold text-white uppercase tracking-wide">
            {dict.footer.shop}
          </p>
          <ul className="mt-3 space-y-2 text-sm">
            <li>
              <Link href={`${home}/products`} className="hover:text-white">
                {dict.nav.products}
              </Link>
            </li>
            <li>
              <Link href={`${home}/search`} className="hover:text-white">
                {dict.nav.search}
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <p className="text-sm font-semibold text-white uppercase tracking-wide">
            {dict.footer.help}
          </p>
          <ul className="mt-3 space-y-2 text-sm text-stone-400">
            <li>{dict.footer.shipping}</li>
            <li>{dict.footer.faq}</li>
            <li>{dict.footer.contact}</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-stone-800">
        <div className="max-w-6xl mx-auto px-4 py-4 text-xs text-stone-500">
          © 2026 {dict.storeName}. {dict.footer.rights}
        </div>
      </div>
    </footer>
  );
}
