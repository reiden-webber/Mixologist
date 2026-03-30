import { DynamicStructuredTool } from "langchain";
import { MenuSchema } from "./menuSchema.js";
export const MENU_SENTINEL_OPEN = "<!--MENU_JSON-->";
export const MENU_SENTINEL_CLOSE = "<!--/MENU_JSON-->";
export const submitMenuTool = new DynamicStructuredTool({
    name: "submit_menu",
    description: "Present the finalized cocktail menu as structured data. " +
        "Call this once the menu is complete and all drinks have passed theme validation. " +
        "Provide menuName, concept, and an items array with name, ingredients, margin (0-1 decimal), and description for each drink.",
    schema: MenuSchema,
    func: async (input) => {
        const menu = MenuSchema.parse(input);
        const json = JSON.stringify(menu);
        return `${MENU_SENTINEL_OPEN}${json}${MENU_SENTINEL_CLOSE}\nMenu "${menu.menuName}" submitted successfully with ${menu.items.length} item(s).`;
    },
});
//# sourceMappingURL=submitMenu.js.map