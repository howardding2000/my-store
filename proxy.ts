import { NextResponse } from "next/server";

/**
 * proxy.ts（Next.js 16 起替代 middleware.ts）
 * 职责：根据浏览器语言把 / 重定向到 /en 或 /fr。
 * /admin、/api、静态文件不走这里。
 */
const locales = ["en", "fr"] as const;
const defaultLocale = "en";

function getLocale(request: Request): string {
  const acceptLanguage = request.headers.get("accept-language") ?? "";
  // "fr-CA,fr;q=0.9,en;q=0.8" -> 取第一项的主语言部分 -> "fr"
  const preferred = acceptLanguage
    .split(",")[0]
    .split("-")[0]
    .trim()
    .toLowerCase();
  return (locales as readonly string[]).includes(preferred)
    ? preferred
    : defaultLocale;
}

export function proxy(request: Request) {
  const url = new URL(request.url);
  const { pathname } = url;

  const pathnameHasLocale = locales.some(
    (locale) => pathname === `/${locale}` || pathname.startsWith(`/${locale}/`)
  );
  if (pathnameHasLocale) return NextResponse.next();

  url.pathname = `/${getLocale(request)}${pathname}`;
  return NextResponse.redirect(url);
}

export const config = {
  // 跳过 Next.js 内部路径、API、后台和带后缀的静态文件
  matcher: ["/((?!_next|api|admin|.*\\..*).*)"],
};
