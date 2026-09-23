import Link from "next/link";
import en from "../[lang]/dictionaries/en.json";

/** 后台占位页：Phase 6 开发真正的 Dashboard */
export default function AdminHome() {
  const stats = [
    { label: "Orders today", value: "—" },
    { label: "Revenue today", value: "—" },
    { label: "Products", value: "—" },
    { label: "Low stock", value: "—" },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{en.admin.title}</h1>
        <Link
          href="/en"
          className="text-sm font-medium text-brand-700 hover:underline"
        >
          ← {en.admin.backToStore}
        </Link>
      </div>
      <p className="mt-2 text-stone-500">{en.admin.welcome}</p>

      <div className="mt-8 grid gap-4 grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <div
            key={s.label}
            className="rounded-2xl border border-stone-200 bg-white p-5"
          >
            <p className="text-xs uppercase tracking-wide text-stone-500">
              {s.label}
            </p>
            <p className="mt-2 text-3xl font-extrabold text-stone-900">
              {s.value}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
