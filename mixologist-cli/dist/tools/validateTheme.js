import { DynamicStructuredTool } from "langchain";
import { z } from "zod";
const THEME_RULES = [
    {
        keywords: ["speakeasy", "1920s", "prohibition", "jazz age"],
        allowed: ["classic", "stirred", "spirit-forward", "bitter", "elegant", "old-fashioned"],
        disallowed: ["tropical", "tiki", "frozen", "blended", "fruity", "neon", "shot"],
    },
    {
        keywords: ["tiki", "tropical", "island", "polynesian", "beach"],
        allowed: ["tropical", "fruity", "rum", "exotic", "frozen", "blended", "colada"],
        disallowed: ["bitter", "stirred", "neat", "austere", "minimalist"],
    },
    {
        keywords: ["craft", "modern", "artisan", "farm-to-table", "gastropub"],
        allowed: ["seasonal", "herbal", "craft", "bespoke", "infusion", "shrub", "bitter"],
        disallowed: ["frozen", "premixed", "shot", "neon"],
    },
    {
        keywords: ["dive", "neighborhood", "casual", "pub", "sports"],
        allowed: ["simple", "classic", "highball", "beer", "shot", "mixed"],
        disallowed: ["molecular", "deconstructed", "foam", "luxury"],
    },
    {
        keywords: ["rooftop", "lounge", "upscale", "luxury", "hotel"],
        allowed: ["elegant", "champagne", "spirit-forward", "craft", "signature", "classic"],
        disallowed: ["shot", "frozen", "neon", "premixed", "dive"],
    },
    {
        keywords: ["wine", "wine bar", "enoteca"],
        allowed: ["spritz", "wine-based", "aperitif", "vermouth", "sangria", "light"],
        disallowed: ["tiki", "frozen", "shot", "heavy", "creamy"],
    },
];
function normalize(s) {
    return s.toLowerCase().trim();
}
function matchesAny(text, terms) {
    const lower = normalize(text);
    return terms.filter((t) => lower.includes(normalize(t)));
}
function validateDrinkTheme(drinkName, theme, drinkStyle) {
    const combinedText = `${drinkName} ${drinkStyle}`;
    const matchingRules = THEME_RULES.filter((rule) => rule.keywords.some((kw) => normalize(theme).includes(normalize(kw))));
    if (matchingRules.length === 0) {
        return {
            valid: true,
            reason: `No specific rules for theme "${theme}". Drink is allowed by default.`,
        };
    }
    for (const rule of matchingRules) {
        const violations = matchesAny(combinedText, rule.disallowed);
        if (violations.length > 0) {
            return {
                valid: false,
                reason: `"${drinkName}" has traits [${violations.join(", ")}] that conflict with a "${theme}" concept. Consider a drink that is more ${rule.allowed.slice(0, 3).join(", ")}.`,
            };
        }
    }
    return {
        valid: true,
        reason: `"${drinkName}" fits the "${theme}" concept.`,
    };
}
export const validateThemeTool = new DynamicStructuredTool({
    name: "validate_theme",
    description: "Check whether a candidate drink fits the bar's declared theme. " +
        "Call this for every drink before adding it to a menu. " +
        "Returns { valid, reason }.",
    schema: z.object({
        drinkName: z.string().describe("Name of the cocktail to validate"),
        theme: z
            .string()
            .describe("The bar's declared theme or concept (e.g. '1920s Speakeasy')"),
        drinkStyle: z
            .string()
            .describe("Style descriptors for the drink (e.g. 'tropical, frozen, rum-based')"),
    }),
    func: async ({ drinkName, theme, drinkStyle }) => {
        const result = validateDrinkTheme(drinkName, theme, drinkStyle);
        return JSON.stringify(result);
    },
});
//# sourceMappingURL=validateTheme.js.map