### Cursor Chat Prompt: FastMCP Server for TheCocktailDB

I need to build a custom MCP server using **FastMCP (TypeScript)** to act as the data layer for an AI-driven cocktail menu. The server must interface with **TheCocktailDB API** using the free test key `1`.

Please implement the following **Resources** and **Tools** as defined in the technical specification:

#### 1. MCP Resources (Source of Truth)

These allow the AI to "study" naming conventions to prevent ingredient name hallucinations.

- `**cocktaildb://list/ingredients`**: Fetches from `https://www.thecocktaildb.com/api/json/v1/1/list.php?i=list`.
- `**cocktaildb://list/categories**`: Fetches from `https://www.thecocktaildb.com/api/json/v1/1/list.php?c=list`.
- `**cocktaildb://list/glassware**`: Fetches from `https://www.thecocktaildb.com/api/json/v1/1/list.php?g=list`.

#### 2. MCP Tools (Action Layer)

- `**get_cocktails_by_ingredient**`: 
  - **Argument**: `ingredient` (string)
  - **Endpoint**: `filter.php?i={ingredient}` 
  - **Description**: Returns a list of drinks containing the specified ingredient.
- `**get_cocktail_details`**: 
  - **Argument**: `id` (string)
  - **Endpoint**: `lookup.php?i={id}` 
  - **Description**: Returns full recipe details, measurements, and instructions for a specific drink ID.
- `**search_cocktail_by_name`**: 
  - **Argument**: `name` (string)
  - **Endpoint**: `search.php?s={name}`
  - **Description**: Searches for cocktails by their full or partial name.

#### Technical Requirements:

- **Runtime**: Node.js with TypeScript.
- **Library**: Use the **FastMCP** framework.
- **Logic**: 
  - Handle cases where the API returns no results gracefully.
  - Provide clear descriptions for each tool so the LangChain agent knows when to use them for "Subset Analysis" (verifying if a drink can be made with current inventory).
  - Ensure the tool outputs are clean JSON for the Agent to process.

