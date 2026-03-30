import type { MenuItem } from "@/lib/chat/types";

/** Unique category labels in first-seen order, each with its items. */
export function groupMenuItemsByCategory(
  items: MenuItem[],
): { category: string; items: MenuItem[] }[] {
  const order: string[] = [];
  const byCategory = new Map<string, MenuItem[]>();

  for (const item of items) {
    const cat = item.category?.trim() || "Uncategorized";
    if (!byCategory.has(cat)) {
      byCategory.set(cat, []);
      order.push(cat);
    }
    byCategory.get(cat)!.push(item);
  }

  return order.map((category) => ({
    category,
    items: byCategory.get(category)!,
  }));
}
