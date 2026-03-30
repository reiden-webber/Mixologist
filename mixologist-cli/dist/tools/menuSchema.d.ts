import { z } from "zod";
export declare const MenuItemSchema: z.ZodObject<{
    name: z.ZodString;
    category: z.ZodString;
    ingredients: z.ZodArray<z.ZodString, "many">;
    margin: z.ZodNumber;
    description: z.ZodString;
}, "strip", z.ZodTypeAny, {
    name: string;
    category: string;
    ingredients: string[];
    margin: number;
    description: string;
}, {
    name: string;
    category: string;
    ingredients: string[];
    margin: number;
    description: string;
}>;
export declare const MenuSchema: z.ZodObject<{
    menuName: z.ZodString;
    concept: z.ZodString;
    items: z.ZodArray<z.ZodObject<{
        name: z.ZodString;
        category: z.ZodString;
        ingredients: z.ZodArray<z.ZodString, "many">;
        margin: z.ZodNumber;
        description: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        name: string;
        category: string;
        ingredients: string[];
        margin: number;
        description: string;
    }, {
        name: string;
        category: string;
        ingredients: string[];
        margin: number;
        description: string;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    menuName: string;
    concept: string;
    items: {
        name: string;
        category: string;
        ingredients: string[];
        margin: number;
        description: string;
    }[];
}, {
    menuName: string;
    concept: string;
    items: {
        name: string;
        category: string;
        ingredients: string[];
        margin: number;
        description: string;
    }[];
}>;
export type MenuItem = z.infer<typeof MenuItemSchema>;
export type Menu = z.infer<typeof MenuSchema>;
