### Cursor Chat Prompt: MCP Server Testing Suite

I need to create a test suite for my FastMCP CocktailDB server using **Vitest**. The goal is to ensure the tools and resources correctly interface with the API and provide the AI Agent with valid data.

Please generate a test file `server.test.ts` that includes:

#### 1. Resource Connectivity Tests
* **Test `cocktaildb://list/ingredients`**: Verify it returns an array of strings and matches the naming conventions required for inventory filtering.
* **Test `cocktaildb://list/glassware`**: Ensure it returns a valid list of glass types.

#### 2. Tool Logic Tests (Mocked API Responses)
* **`get_cocktails_by_ingredient`**: Mock a response for "Gin" and verify the tool returns a list of drink objects with `idDrink` and `strDrink`.
* **`get_cocktail_details`**: Mock a full recipe response (e.g., for an Old Fashioned). Verify the test can correctly identify all ingredients and measures.
* **`search_cocktail_by_name`**: Test searching for a classic like "Margarita" and ensure the result is not null.

#### 3. Subset Analysis Mock (Edge Cases)
* Create a test case where a "Bar Inventory" list is provided (e.g., `['Vodka', 'Orange Juice']`).
* Simulate the AI calling `get_cocktail_details` for a "Screwdriver" and verify the logic correctly identifies that all ingredients are present.
* Simulate a "Harvey Wallbanger" and verify the logic identifies that "Galliano" is missing from the inventory.

#### Requirements:
* Use **msw** (Mock Service Worker) or simple `vi.mock` to prevent hitting the live CocktailDB API during every test run.
* Ensure tests check for **Error Handling** (e.g., what happens if the API returns `{ "drinks": null }`).