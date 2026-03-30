"use client";

import type { CSSProperties } from "react";
import type { Menu } from "@/lib/chat/types";
import { groupMenuItemsByCategory } from "@/lib/menu/groupByCategory";

type Props = {
  menu: Menu;
};

/** Matches A4 minus default html2pdf margins (~10mm each side), avoids right-edge clipping. */
const root: CSSProperties = {
  backgroundColor: "#ffffff",
  color: "#18181b",
  padding: "6mm 8mm 8mm",
  fontFamily: "system-ui, sans-serif",
  fontSize: "12px",
  lineHeight: 1.45,
  width: "190mm",
  maxWidth: "190mm",
  boxSizing: "border-box",
};

const title: CSSProperties = {
  fontSize: "22px",
  fontWeight: 700,
  margin: "0 0 8px 0",
  color: "#18181b",
};

const concept: CSSProperties = {
  fontSize: "11px",
  color: "#52525b",
  margin: "0 0 24px 0",
};

const sectionHeading: CSSProperties = {
  fontSize: "14px",
  fontWeight: 700,
  color: "#18181b",
  margin: "20px 0 10px 0",
  borderBottom: "1px solid #e4e4e7",
  paddingBottom: "6px",
};

const card: CSSProperties = {
  border: "1px solid #e4e4e7",
  borderRadius: "10px",
  padding: "12px 14px",
  marginBottom: "10px",
  backgroundColor: "#ffffff",
};

const cardTitleRow: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: "8px",
};

const drinkName: CSSProperties = {
  fontSize: "13px",
  fontWeight: 600,
  margin: 0,
  color: "#18181b",
  flex: "1 1 0%",
  minWidth: 0,
  overflowWrap: "break-word",
  wordBreak: "break-word",
};

const marginBadge: CSSProperties = {
  fontSize: "9px",
  fontWeight: 700,
  color: "#166534",
  backgroundColor: "#dcfce7",
  borderRadius: "999px",
  padding: "3px 8px",
  whiteSpace: "nowrap",
  flexShrink: 0,
};

const desc: CSSProperties = {
  fontSize: "11px",
  color: "#52525b",
  margin: "8px 0 0 0",
  overflowWrap: "break-word",
  wordBreak: "break-word",
};

const ingWrap: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: "4px",
  marginTop: "8px",
};

const ing: CSSProperties = {
  fontSize: "9px",
  fontWeight: 500,
  color: "#52525b",
  backgroundColor: "#f4f4f5",
  borderRadius: "4px",
  padding: "3px 6px",
};

function marginStyle(margin: number): CSSProperties {
  const pct = Math.round(margin * 100);
  if (pct >= 70) return { ...marginBadge, color: "#166534", backgroundColor: "#dcfce7" };
  if (pct >= 50) return { ...marginBadge, color: "#a16207", backgroundColor: "#fef9c3" };
  return { ...marginBadge, color: "#991b1b", backgroundColor: "#fee2e2" };
}

/** Printable HTML for PDF: white background, dark text, grouped by category. */
export function MenuPdfLayout({ menu }: Props) {
  const sections = groupMenuItemsByCategory(menu.items);

  return (
    <div style={root}>
      <h1 style={title}>{menu.menuName}</h1>
      <p style={concept}>{menu.concept}</p>

      {sections.map(({ category, items }) => (
        <section key={category}>
          <h2 style={sectionHeading}>{category}</h2>
          {items.map((item, i) => (
            <div
              key={`${category}-${item.name}-${i}`}
              style={card}
            >
              <div style={cardTitleRow}>
                <h3 style={drinkName}>{item.name}</h3>
                <span style={marginStyle(item.margin)}>
                  {Math.round(item.margin * 100)}% margin
                </span>
              </div>
              <p style={desc}>{item.description}</p>
              <div style={ingWrap}>
                {item.ingredients.map((ingName, j) => (
                  <span key={`${ingName}-${j}`} style={ing}>
                    {ingName}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </section>
      ))}
    </div>
  );
}
