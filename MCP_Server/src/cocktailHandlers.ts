import { fetchCocktailDbJson, normalizeDrinksResponse } from "./cocktailDb.js";

export async function loadIngredientsResourceText(): Promise<string> {
  const raw = await fetchCocktailDbJson("list.php?i=list");
  return JSON.stringify(normalizeDrinksResponse(raw));
}

export async function loadCategoriesResourceText(): Promise<string> {
  const raw = await fetchCocktailDbJson("list.php?c=list");
  return JSON.stringify(normalizeDrinksResponse(raw));
}

export async function loadGlasswareResourceText(): Promise<string> {
  const raw = await fetchCocktailDbJson("list.php?g=list");
  return JSON.stringify(normalizeDrinksResponse(raw));
}

export async function executeGetCocktailsByIngredient(ingredient: string): Promise<string> {
  const raw = await fetchCocktailDbJson(`filter.php?i=${encodeURIComponent(ingredient)}`);
  return JSON.stringify(normalizeDrinksResponse(raw));
}

export async function executeGetCocktailDetails(id: string): Promise<string> {
  const raw = await fetchCocktailDbJson(`lookup.php?i=${encodeURIComponent(id)}`);
  return JSON.stringify(normalizeDrinksResponse(raw));
}

export async function executeSearchCocktailByName(name: string): Promise<string> {
  const raw = await fetchCocktailDbJson(`search.php?s=${encodeURIComponent(name)}`);
  return JSON.stringify(normalizeDrinksResponse(raw));
}
