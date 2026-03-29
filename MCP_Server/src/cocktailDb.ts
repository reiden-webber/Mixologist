const key = (process.env.COCKTAIL_DB_API_KEY ?? "1").trim() || "1";
const COCKTAIL_DB_BASE = `https://www.thecocktaildb.com/api/json/v1/${encodeURIComponent(key)}/`;

export async function fetchCocktailDbJson(pathAndQuery: string): Promise<unknown> {
  const url = new URL(pathAndQuery, COCKTAIL_DB_BASE).toString();
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`CocktailDB HTTP ${res.status}: ${res.statusText}`);
  }
  return res.json() as Promise<unknown>;
}

/**
 * The API returns `drinks: null` when there are no matches. Tool outputs always use a `drinks` array (empty when none).
 */
export function normalizeDrinksResponse(data: unknown): { drinks: unknown[] } {
  if (data === null || typeof data !== "object") {
    return { drinks: [] };
  }
  const raw = data as { drinks?: unknown };
  if (raw.drinks == null) {
    return { drinks: [] };
  }
  if (!Array.isArray(raw.drinks)) {
    return { drinks: [] };
  }
  return { drinks: raw.drinks };
}
