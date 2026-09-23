import "../globals.css";

/**
 * 后台的根布局：独立于前台，不带语言前缀（/admin）。
 * 后台界面 Phase 6 正式开发，这里只是占位。
 */
export const metadata = {
  title: "Admin — My Store",
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full bg-stone-100 text-stone-900">{children}</body>
    </html>
  );
}
