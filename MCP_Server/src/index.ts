import { FastMCP } from "fastmcp";
import { z } from "zod";
import {
  executeGetCocktailDetails,
  executeGetCocktailsByIngredient,
  executeSearchCocktailByName,
  loadCategoriesResourceText,
  loadGlasswareResourceText,
  loadIngredientsResourceText,
} from "./cocktailHandlers.js";

const server = new FastMCP({
  name: "cocktaildb",
  version: "0.1.0",
});

server.addResource({
  uri: "cocktaildb://list/ingredients",
  name: "CocktailDB ingredient names",
  description:
    "Canonical ingredient strings from TheCocktailDB (e.g. spelling/casing). Read before searching or filtering so tool arguments match the API.",
  mimeType: "application/json",
  async load() {
    return {
      mimeType: "application/json",
      text: await loadIngredientsResourceText(),
    };
  },
});

server.addResource({
  uri: "cocktaildb://list/categories",
  name: "CocktailDB drink categories",
  description: "Category labels used by TheCocktailDB for grouping drinks.",
  mimeType: "application/json",
  async load() {
    return {
      mimeType: "application/json",
      text: await loadCategoriesResourceText(),
    };
  },
});

server.addResource({
  uri: "cocktaildb://list/glassware",
  name: "CocktailDB glassware names",
  description: "Glass types as named in TheCocktailDB for presentation and filtering context.",
  mimeType: "application/json",
  async load() {
    return {
      mimeType: "application/json",
      text: await loadGlasswareResourceText(),
    };
  },
});

const toolAnnotations = { readOnlyHint: true as const };

server.addTool({
  name: "get_cocktails_by_ingredient",
  description:
    "List cocktails that contain a given ingredient from TheCocktailDB. Use the cocktaildb://list/ingredients resource first so `ingredient` matches API naming (e.g. 'Light rum' vs 'White rum'). Helpful for inventory-driven discovery: see which drinks use a stocked item. Returns JSON: { drinks: [...] } where `drinks` is always an array (empty if none). Each item includes idDrink and strDrink for follow-up lookup.",
  parameters: z.object({
    ingredient: z.string().min(1).describe("Ingredient name as in TheCocktailDB"),
  }),
  annotations: toolAnnotations,
  execute: async ({ ingredient }) => executeGetCocktailsByIngredient(ingredient),
});

server.addTool({
  name: "get_cocktail_details",
  description:
    "Full recipe for one cocktail by TheCocktailDB drink id (idDrink from search or filter results). Use for subset analysis: compare strIngredient1–strIngredient15 and strMeasure1–strMeasure15 against bar inventory to verify a drink is makeable. Returns JSON: { drinks: [...] } with zero or one full drink object; `drinks` is always an array.",
  parameters: z.object({
    id: z.string().min(1).describe("TheCocktailDB idDrink"),
  }),
  annotations: toolAnnotations,
  execute: async ({ id }) => executeGetCocktailDetails(id),
});

server.addTool({
  name: "search_cocktail_by_name",
  description:
    "Search TheCocktailDB by full or partial cocktail name. Use to resolve a name to idDrink, then call get_cocktail_details for measures and ingredients. Returns JSON: { drinks: [...] } where `drinks` is always an array (empty if no matches).",
  parameters: z.object({
    name: z.string().min(1).describe("Cocktail name or substring"),
  }),
  annotations: toolAnnotations,
  execute: async ({ name }) => executeSearchCocktailByName(name),
});

await server.start({
  transportType: "stdio",
});
