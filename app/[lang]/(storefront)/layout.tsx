import Header from "@/components/storefront/Header";
import Footer from "@/components/storefront/Footer";
import { CartProvider } from "@/components/storefront/cart/CartProvider";
import { getDictionary } from "../dictionaries";

/** 前台外壳：页眉 + 内容 + 页脚（购物车状态由 CartProvider 提供给全站） */
export default async function StorefrontLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { dict, locale } = await getDictionary();
  return (
    <CartProvider locale={locale}>
      <Header dict={dict} locale={locale} />
      <main className="flex-1">{children}</main>
      <Footer dict={dict} locale={locale} />
    </CartProvider>
  );
}
