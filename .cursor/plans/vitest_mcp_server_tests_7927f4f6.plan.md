---
name: Vitest MCP Server Tests
overview: "Add a Vitest-based `server.test.ts` for the CocktailDB FastMCP server by extracting shared handler logic so tests can run with `vi.mock` on `fetchCocktailDbJson` without starting stdio, plus pure subset-analysis assertions and explicit `drinks: null` coverage."
todos:
  - id: extract-handlers
    content: Add cocktailHandlers.ts and wire index.ts resources/tools to it
    status: completed
  - id: vitest-setup
    content: Add Vitest devDep, vitest.config.ts, test scripts in MCP_Server/package.json
    status: completed
  - id: server-tests
    content: "Implement server.test.ts: resources, tools (mocked), null handling, subset cases"
    status: completed
isProject: false
---

# Vitest test suite for FastMCP CocktailDB server

## Blocker: `index.ts` starts the server on import

`[MCP_Server/src/index.ts](MCP_Server/src/index.ts)` ends with top-level `await server.start({ transportType: "stdio" })`. Importing it in Vitest would hang or own stdio. **Refactor required** before meaningful tests.

## 1. Extract handlers (single source of truth)

Add `[MCP_Server/src/cocktailHandlers.ts](MCP_Server/src/cocktailHandlers.ts)` (name can vary) exporting async functions that contain **exactly** the logic currently in each resource `load()` and each tool `execute()`:

- `loadIngredientsResourceText()`, `loadGlasswareResourceText()` (and optionally categories if you want symmetry later).
- `executeGetCocktailsByIngredient(ingredient)`, `executeGetCocktailDetails(id)`, `executeSearchCocktailByName(name)` — each returns the same **stringified JSON** as today.

Wire `[MCP_Server/src/index.ts](MCP_Server/src/index.ts)` so `addResource` / `addTool` call these exports only (no duplicated fetch/normalize logic).

Keep `[MCP_Server/src/cocktailDb.ts](MCP_Server/src/cocktailDb.ts)` as the only HTTP boundary; tests will mock `fetchCocktailDbJson`.

## 2. Vitest setup

- Add **Vitest** (and `**@vitest/coverage-v8`** only if you want coverage; optional) as `devDependencies` in `[MCP_Server/package.json](MCP_Server/package.json)`.
- Add `[MCP_Server/vitest.config.ts](MCP_Server/vitest.config.ts)` with `environment: "node"`, ESM-friendly settings aligned with `"type": "module"` and existing `[MCP_Server/tsconfig.json](MCP_Server/tsconfig.json)` (Vitest 2+ handles TS via `vite-node`).
- Scripts: `"test": "vitest run"`, `"test:watch": "vitest"` in `[MCP_Server/package.json](MCP_Server/package.json)`.

**Mocking strategy (`[.prompts/mcp_tests.md](.prompts/mcp_tests.md)`):** use `**vi.mock("./cocktailDb.js")`** (path relative to test file after build resolution) to replace `fetchCocktailDbJson` with `vi.fn()` returning fixed payloads. This avoids live API calls and avoids importing `index.ts`. **MSW** is optional here; `vi.mock` is simpler because all HTTP goes through one function.

## 3. `[MCP_Server/src/server.test.ts](MCP_Server/src/server.test.ts)` structure

### Resource connectivity (mocked “live” behavior)

- **Ingredients:** Mock `list.php?i=list`-shaped payload (small fixture: a few `{ strIngredient1: "..." }` entries). Call `loadIngredientsResourceText()`, `JSON.parse`, assert `drinks` is a non-empty array and **every** element has a non-empty `strIngredient1` string (this matches how the API encodes names for filtering; the prompt’s “array of strings” is satisfied by deriving/checking those string fields).
- **Glassware:** Same pattern with `strGlass` on each item via `loadGlasswareResourceText()`.

### Tool logic (mocked API)

- `**get_cocktails_by_ingredient`:** Mock response for Gin with 1–2 drinks; `JSON.parse(executeGetCocktailsByIngredient("Gin"))`; assert `drinks[].idDrink` and `drinks[].strDrink` exist.
- `**get_cocktail_details`:** Fixture modeled on an Old Fashioned-style drink with `strIngredient1…N` and `strMeasure1…N`; parse and assert expected ingredient strings and measures are present (counts/keys as you encode in the fixture).
- `**search_cocktail_by_name`:** Mock Margarita search; assert `drinks.length >= 1` and not “null” shape (normalized array).

### Error handling

- Mock `fetchCocktailDbJson` to resolve `{ drinks: null }` for a tool path; assert parsed result is `{ drinks: [] }`.
- Direct unit tests on `**normalizeDrinksResponse`** (`null`, non-object, malformed `drinks`) in the same file or a tiny `cocktailDb.test.ts` — at minimum one test file should cover `{ drinks: null }` explicitly per requirements.

### Subset analysis (edge cases)

Implement a **small pure helper** in the test file (or `[MCP_Server/src/subsetAnalysis.ts](MCP_Server/src/subsetAnalysis.ts)` if you prefer reuse — optional):

- Collect non-null `strIngredient1…strIngredient15` from a parsed drink object.
- Normalize for comparison (e.g. trim, case-insensitive) against an inventory `Set`.
- **Screwdriver** fixture + inventory `['Vodka', 'Orange Juice']` → assert no missing ingredients.
- **Harvey Wallbanger** fixture + same inventory → assert **Galliano** (or your fixture’s spelling) appears in `missing`.

No FastMCP runtime needed for this block — only parsed JSON fixtures.

## 4. Verification

From repo root: `npm run test -w mcp-server` (or `cd MCP_Server && npm test`). Ensure `npm run build -w mcp-server` still passes.

## Files touched (summary)


| Action | File                                                  |
| ------ | ----------------------------------------------------- |
| New    | `MCP_Server/src/cocktailHandlers.ts`                  |
| Edit   | `MCP_Server/src/index.ts` (delegate to handlers only) |
| New    | `MCP_Server/src/server.test.ts`                       |
| New    | `MCP_Server/vitest.config.ts`                         |
| Edit   | `MCP_Server/package.json` (vitest + scripts)          |


