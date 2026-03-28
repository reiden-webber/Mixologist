import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./cocktailDb.js", async (importOriginal) => {
  const mod = await importOriginal<typeof import("./cocktailDb.js")>();
  return {
    ...mod,
    fetchCocktailDbJson: vi.fn(),
  };
});

import { fetchCocktailDbJson, normalizeDrinksResponse } from "./cocktailDb.js";
import {
  executeGetCocktailDetails,
  executeGetCocktailsByIngredient,
  executeSearchCocktailByName,
  loadGlasswareResourceText,
  loadIngredientsResourceText,
} from "./cocktailHandlers.js";

const mockFetch = vi.mocked(fetchCocktailDbJson);

function drinkIngredients(d: Record<string, unknown>): string[] {
  const out: string[] = [];
  for (let i = 1; i <= 15; i++) {
    const v = d[`strIngredient${i}`];
    if (typeof v === "string" && v.trim()) {
      out.push(v.trim());
    }
  }
  return out;
}

function missingFromInventory(drink: Record<string, unknown>, inventory: string[]): string[] {
  const inv = new Set(inventory.map((s) => s.trim().toLowerCase()));
  return drinkIngredients(drink).filter((ing) => !inv.has(ing.toLowerCase()));
}

beforeEach(() => {
  mockFetch.mockReset();
});

describe("normalizeDrinksResponse", () => {
  it("maps drinks: null to an empty array", () => {
    expect(normalizeDrinksResponse({ drinks: null })).toEqual({ drinks: [] });
  });

  it("handles null payload", () => {
    expect(normalizeDrinksResponse(null)).toEqual({ drinks: [] });
  });

  it("handles non-object payload", () => {
    expect(normalizeDrinksResponse("x")).toEqual({ drinks: [] });
  });

  it("handles non-array drinks", () => {
    expect(normalizeDrinksResponse({ drinks: "bad" })).toEqual({ drinks: [] });
  });

  it("preserves a valid drinks array", () => {
    const drinks = [{ idDrink: "1" }];
    expect(normalizeDrinksResponse({ drinks })).toEqual({ drinks });
  });
});

describe("resource payloads (mocked API)", () => {
  it("cocktaildb://list/ingredients — non-empty strIngredient1 strings", async () => {
    mockFetch.mockResolvedValue({
      drinks: [{ strIngredient1: "Vodka" }, { strIngredient1: "Gin" }],
    });
    const text = await loadIngredientsResourceText();
    const body = JSON.parse(text) as { drinks: Array<{ strIngredient1?: string }> };
    expect(body.drinks.length).toBeGreaterThan(0);
    for (const row of body.drinks) {
      expect(typeof row.strIngredient1).toBe("string");
      expect(row.strIngredient1!.length).toBeGreaterThan(0);
    }
  });

  it("cocktaildb://list/glassware — valid glass types", async () => {
    mockFetch.mockResolvedValue({
      drinks: [{ strGlass: "Highball glass" }, { strGlass: "Cocktail glass" }],
    });
    const text = await loadGlasswareResourceText();
    const body = JSON.parse(text) as { drinks: Array<{ strGlass?: string }> };
    expect(body.drinks.length).toBeGreaterThan(0);
    for (const row of body.drinks) {
      expect(typeof row.strGlass).toBe("string");
      expect(row.strGlass!.length).toBeGreaterThan(0);
    }
  });
});

describe("tools (mocked API)", () => {
  it("get_cocktails_by_ingredient — Gin returns idDrink and strDrink", async () => {
    mockFetch.mockResolvedValue({
      drinks: [
        { idDrink: "1", strDrink: "Negroni" },
        { idDrink: "2", strDrink: "Gin Fizz" },
      ],
    });
    const text = await executeGetCocktailsByIngredient("Gin");
    expect(mockFetch).toHaveBeenCalledWith("filter.php?i=Gin");
    const body = JSON.parse(text) as {
      drinks: Array<{ idDrink?: string; strDrink?: string }>;
    };
    expect(body.drinks).toHaveLength(2);
    for (const d of body.drinks) {
      expect(d.idDrink).toBeDefined();
      expect(d.strDrink).toBeDefined();
    }
  });

  it("get_cocktail_details — Old Fashioned ingredients and measures", async () => {
    mockFetch.mockResolvedValue({
      drinks: [
        {
          idDrink: "11001",
          strDrink: "Old Fashioned",
          strIngredient1: "Bourbon",
          strIngredient2: "Angostura bitters",
          strIngredient3: "Sugar",
          strIngredient4: "Water",
          strMeasure1: "4.5 cL",
          strMeasure2: "2 dashes",
          strMeasure3: "1 cube",
          strMeasure4: "1 tsp",
        },
      ],
    });
    const text = await executeGetCocktailDetails("11001");
    const body = JSON.parse(text) as { drinks: Array<Record<string, unknown>> };
    expect(body.drinks).toHaveLength(1);
    const d = body.drinks[0]!;
    expect(d.strIngredient1).toBe("Bourbon");
    expect(d.strIngredient2).toBe("Angostura bitters");
    expect(d.strMeasure1).toBe("4.5 cL");
    expect(d.strMeasure2).toBe("2 dashes");
  });

  it("search_cocktail_by_name — Margarita returns at least one drink", async () => {
    mockFetch.mockResolvedValue({
      drinks: [{ idDrink: "11007", strDrink: "Margarita" }],
    });
    const text = await executeSearchCocktailByName("Margarita");
    const body = JSON.parse(text) as { drinks: unknown[] };
    expect(Array.isArray(body.drinks)).toBe(true);
    expect(body.drinks.length).toBeGreaterThanOrEqual(1);
  });

  it("normalizes API { drinks: null } to empty array for tools", async () => {
    mockFetch.mockResolvedValue({ drinks: null });
    const text = await executeGetCocktailsByIngredient("Nothing");
    const body = JSON.parse(text) as { drinks: unknown[] };
    expect(body.drinks).toEqual([]);
  });
});

describe("subset analysis (inventory vs recipe)", () => {
  const inventory = ["Vodka", "Orange Juice"];

  it("Screwdriver — all ingredients covered by inventory", () => {
    const screwdriver: Record<string, unknown> = {
      strIngredient1: "Vodka",
      strIngredient2: "Orange juice",
    };
    expect(missingFromInventory(screwdriver, inventory)).toEqual([]);
  });

  it("Harvey Wallbanger — Galliano is missing", () => {
    const harvey: Record<string, unknown> = {
      strIngredient1: "Vodka",
      strIngredient2: "Orange juice",
      strIngredient3: "Galliano",
    };
    const missing = missingFromInventory(harvey, inventory);
    expect(missing.map((m) => m.toLowerCase())).toContain("galliano");
  });
});
