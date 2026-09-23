import { lang } from "next/root-params";
import { notFound } from "next/navigation";

/**
 * 双语字典：根据 URL 里的语言（/en 或 /fr）加载对应文案。
 * 只在服务端运行，不会增加浏览器下载的 JS 体积。
 */
const dictionaries = {
  en: () => import("./dictionaries/en.json").then((m) => m.default),
  fr: () => import("./dictionaries/fr.json").then((m) => m.default),
};

export type Locale = keyof typeof dictionaries;
export type Dictionary = Awaited<ReturnType<(typeof dictionaries)["en"]>>;

export async function getDictionary(): Promise<{
  dict: Dictionary;
  locale: Locale;
}> {
  const locale = await lang();
  if (locale !== "en" && locale !== "fr") notFound();
  const dict = (await dictionaries[locale]()) as Dictionary;
  return { dict, locale };
}
