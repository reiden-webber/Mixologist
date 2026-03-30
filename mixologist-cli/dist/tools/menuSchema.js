import { z } from "zod";
export const MenuItemSchema = z.object({
    name: z.string(),
    category: z.string().min(1),
    ingredients: z.array(z.string()),
    margin: z.number(),
    description: z.string(),
});
export const MenuSchema = z.object({
    menuName: z.string(),
    concept: z.string(),
    items: z.array(MenuItemSchema),
});
//# sourceMappingURL=menuSchema.js.map