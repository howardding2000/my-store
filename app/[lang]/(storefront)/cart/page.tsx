import { getDictionary } from "../../dictionaries";
import { getCartStrings } from "@/components/storefront/cart/cart-strings";
import { CartPageClient } from "@/components/storefront/cart/CartPageClient";

/** 独立购物车页 /[lang]/cart（服务端外壳 + 客户端交互主体） */
export async function generateMetadata() {
  const { dict, locale } = await getDictionary();
  const t = getCartStrings(locale);
  return { title: `${t.title} — ${dict.storeName}` };
}

export default async function CartPage() {
  const { locale } = await getDictionary();
  return <CartPageClient locale={locale} />;
}
