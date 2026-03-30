"use client";

import type { Menu } from "@/lib/chat/types";

type Props = {
  menu: Menu | null;
};

function EmptyState() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
      <div className="rounded-xl border border-dashed border-zinc-300 p-8 dark:border-zinc-700">
        <p className="text-sm font-medium text-zinc-600 dark:text-zinc-300">
          Live Menu Canvas
        </p>
        <p className="mt-1 text-xs text-zinc-400 dark:text-zinc-500">
          Your curated menu will appear here once the Mixologist finalizes it.
        </p>
      </div>
    </div>
  );
}

function MarginBadge({ margin }: { margin: number }) {
  const pct = Math.round(margin * 100);
  const color =
    pct >= 70
      ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300"
      : pct >= 50
        ? "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300"
        : "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300";

  return (
    <span
      className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold ${color}`}
    >
      {pct}% margin
    </span>
  );
}

export function MenuCanvas({ menu }: Props) {
  if (!menu) return <EmptyState />;

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="shrink-0 border-b border-zinc-200 px-5 py-4 dark:border-zinc-800">
        <h2 className="text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          {menu.menuName}
        </h2>
        <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
          {menu.concept}
        </p>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        <div className="grid gap-3">
          {menu.items.map((item, i) => (
            <div
              key={`${item.name}-${i}`}
              className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm transition hover:shadow-md dark:border-zinc-700 dark:bg-zinc-900/60"
            >
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  {item.name}
                </h3>
                <MarginBadge margin={item.margin} />
              </div>
              <p className="mt-1 text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">
                {item.description}
              </p>
              <div className="mt-2 flex flex-wrap gap-1">
                {item.ingredients.map((ing) => (
                  <span
                    key={ing}
                    className="rounded-md bg-zinc-100 px-1.5 py-0.5 text-[10px] font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
                  >
                    {ing}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="shrink-0 border-t border-zinc-200 px-5 py-2 dark:border-zinc-800">
        <p className="text-[10px] text-zinc-400 dark:text-zinc-500">
          {menu.items.length} item{menu.items.length !== 1 ? "s" : ""} on menu
        </p>
      </div>
    </div>
  );
}
