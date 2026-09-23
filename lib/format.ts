export function formatPrice(dollars: number, locale: "en" | "fr"): string {
  return new Intl.NumberFormat(locale === "fr" ? "fr-CA" : "en-CA", {
    style: "currency",
    currency: "CAD",
  }).format(dollars);
}

/** 数据库里金额存的是整数分（cents），展示前转成加元。 */
export function formatPriceCents(cents: number, locale: "en" | "fr"): string {
  return formatPrice(cents / 100, locale);
}
