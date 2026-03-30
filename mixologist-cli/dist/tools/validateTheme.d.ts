import { DynamicStructuredTool } from "langchain";
import { z } from "zod";
export declare const validateThemeTool: DynamicStructuredTool<z.ZodObject<{
    drinkName: z.ZodString;
    theme: z.ZodString;
    drinkStyle: z.ZodString;
}, "strip", z.ZodTypeAny, {
    drinkName: string;
    theme: string;
    drinkStyle: string;
}, {
    drinkName: string;
    theme: string;
    drinkStyle: string;
}>, {
    drinkName: string;
    theme: string;
    drinkStyle: string;
}, {
    drinkName: string;
    theme: string;
    drinkStyle: string;
}, string, unknown, "validate_theme">;
