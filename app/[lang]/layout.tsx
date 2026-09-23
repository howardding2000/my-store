import { Geist } from "next/font/google";
import { lang } from "next/root-params";
import "../globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata = {
  title: "My Store — 3D prints & acrylic goods, made in Canada",
  description:
    "Small-batch 3D-printed home goods and acrylic DIY supplies, shipped across Canada.",
};

/** 预渲染 /en 和 /fr 两个版本 */
export async function generateStaticParams() {
  return [{ lang: "en" }, { lang: "fr" }];
}

/**
 * 前台的根布局（拿掉 app/layout.tsx 后，这里就是前台的根）。
 * 负责 <html lang> 和全站字体。
 */
export default async function LangLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await lang();
  return (
    <html lang={locale} className={`${geistSans.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
