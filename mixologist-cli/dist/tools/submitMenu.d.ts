import { DynamicStructuredTool } from "langchain";
export declare const MENU_SENTINEL_OPEN = "<!--MENU_JSON-->";
export declare const MENU_SENTINEL_CLOSE = "<!--/MENU_JSON-->";
export declare const submitMenuTool: DynamicStructuredTool<import("zod").ZodObject<{
    menuName: import("zod").ZodString;
    concept: import("zod").ZodString;
    items: import("zod").ZodArray<import("zod").ZodObject<{
        name: import("zod").ZodString;
        ingredients: import("zod").ZodArray<import("zod").ZodString, "many">;
        margin: import("zod").ZodNumber;
        description: import("zod").ZodString;
    }, "strip", import("zod").ZodTypeAny, {
        name: string;
        ingredients: string[];
        margin: number;
        description: string;
    }, {
        name: string;
        ingredients: string[];
        margin: number;
        description: string;
    }>, "many">;
}, "strip", import("zod").ZodTypeAny, {
    menuName: string;
    concept: string;
    items: {
        name: string;
        ingredients: string[];
        margin: number;
        description: string;
    }[];
}, {
    menuName: string;
    concept: string;
    items: {
        name: string;
        ingredients: string[];
        margin: number;
        description: string;
    }[];
}>, {
    menuName: string;
    concept: string;
    items: {
        name: string;
        ingredients: string[];
        margin: number;
        description: string;
    }[];
}, {
    menuName: string;
    concept: string;
    items: {
        name: string;
        ingredients: string[];
        margin: number;
        description: string;
    }[];
}, string, unknown, "submit_menu">;
