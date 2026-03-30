"use client";

import { useCallback, useRef, useState } from "react";
import type { Menu } from "@/lib/chat/types";
import { groupMenuItemsByCategory } from "@/lib/menu/groupByCategory";
import { MenuPdfLayout } from "./MenuPdfLayout";

type Props = {
  menu: Menu | null;
};

function sanitizePdfFilename(name: string): string {
  const base = name
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .slice(0, 80);
  return base || "menu";
}

function defaultPdfFilename(menu: Menu): string {
  return `${sanitizePdfFilename(menu.menuName)}.pdf`;
}

async function buildMenuPdfBlob(
  element: HTMLElement,
  filename: string,
): Promise<Blob> {
  const html2pdf = (await import("html2pdf.js")).default;
  return html2pdf()
    .set({
      margin: [10, 10, 10, 10],
      filename,
      image: { type: "jpeg", quality: 0.95 },
      html2canvas: {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
      },
      jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
      pagebreak: { mode: ["css", "legacy"] },
    })
    .from(element)
    .outputPdf("blob");
}

type SavePickerResult = "saved" | "cancelled" | "unsupported";

async function savePdfWithPicker(
  blob: Blob,
  suggestedName: string,
): Promise<SavePickerResult> {
  if (typeof window === "undefined") return "unsupported";
  const w = window as Window & {
    showSaveFilePicker?: (options: {
      suggestedName?: string;
      types?: { description: string; accept: Record<string, string[]> }[];
    }) => Promise<FileSystemFileHandle>;
  };
  if (typeof w.showSaveFilePicker !== "function") return "unsupported";
  try {
    const handle = await w.showSaveFilePicker({
      suggestedName: suggestedName,
      types: [
        {
          description: "PDF",
          accept: { "application/pdf": [".pdf"] },
        },
      ],
    });
    const writable = await handle.createWritable();
    await writable.write(blob);
    await writable.close();
    return "saved";
  } catch (e) {
    if (e instanceof Error && e.name === "AbortError") return "cancelled";
    throw e;
  }
}

function downloadPdfBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

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
  const pdfRef = useRef<HTMLDivElement>(null);
  const [pdfExporting, setPdfExporting] = useState(false);

  const runExport = useCallback(
    async (mode: "picker" | "download") => {
      if (!menu || !pdfRef.current) return;
      setPdfExporting(true);
      try {
        const filename = defaultPdfFilename(menu);
        const blob = await buildMenuPdfBlob(pdfRef.current, filename);
        if (mode === "picker") {
          const result = await savePdfWithPicker(blob, filename);
          if (result === "unsupported") {
            downloadPdfBlob(blob, filename);
          }
        } else {
          downloadPdfBlob(blob, filename);
        }
      } finally {
        setPdfExporting(false);
      }
    },
    [menu],
  );

  if (!menu) return <EmptyState />;

  const sections = groupMenuItemsByCategory(menu.items);

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div
        className="pointer-events-none fixed left-[-10000px] top-0 z-0"
        aria-hidden
      >
        <div ref={pdfRef}>
          <MenuPdfLayout menu={menu} />
        </div>
      </div>

      <div className="shrink-0 border-b border-zinc-200 px-5 py-4 dark:border-zinc-800">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
              {menu.menuName}
            </h2>
            <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
              {menu.concept}
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap items-center justify-end gap-1.5">
            <button
              type="button"
              disabled={pdfExporting}
              title="Choose folder and filename (supported in Chrome, Edge, Opera)"
              onClick={() => void runExport("picker")}
              className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 shadow-sm transition hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
            >
              {pdfExporting ? "Exporting…" : "Save as…"}
            </button>
            <button
              type="button"
              disabled={pdfExporting}
              title="Save to your browser’s download folder"
              onClick={() => void runExport("download")}
              className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 shadow-sm transition hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
            >
              {pdfExporting ? "…" : "Download"}
            </button>
          </div>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        <div className="flex flex-col gap-6">
          {sections.map(({ category, items }) => (
            <div key={category}>
              <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                {category}
              </h3>
              <div className="grid gap-3">
                {items.map((item, i) => (
                  <div
                    key={`${category}-${item.name}-${i}`}
                    className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm transition hover:shadow-md dark:border-zinc-700 dark:bg-zinc-900/60"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                        {item.name}
                      </h4>
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
