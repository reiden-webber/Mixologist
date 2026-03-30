# Technical Specification: AI-Driven "Makeable" Cocktail Menu

## 1. Project Overview
The goal is to build a lightweight, intelligent cocktail menu that dynamically displays a curated selection of **30 drinks** a bar can currently make based on its live inventory. Instead of an exhaustive search, the system uses a **LangChain AI Agent** to reason out which classics, trending drinks, and non-alcoholic options are most in-demand, verifying them against **The CocktailDB (Free Tier)** via an **MCP (Model Context Protocol)** server.

## 2. The Tech Stack
* **Runtime:** Node.js (TypeScript)
* **Framework:** Next.js (App Router) using Server Components.
* **Orchestration:** LangChain.js
* **Interface:** MCP (Model Context Protocol) SDK for Node.js.
* **Data Source:** The CocktailDB (Free API Key: `1`).
* **Caching:** Local File-based JSON storage (e.g., `menu_cache.json`).
* **Styling:** Tailwind CSS (Mobile-first, grid-based layout).

## 3. System Architecture

### A. The MCP Server (Priority Layer)
The MCP server acts as the standardized interface for the AI Agent, providing both dynamic **Tools** and static **Resources**.

#### 1. MCP Resources (The Source of Truth)
To prevent hallucination, the Agent must first read these resources to understand how the API indexes data:
* `resource://cocktaildb/list/ingredients`: Calls `.../list.php?i=list`. Provides the exact strings for all ingredients (e.g., "Light rum" vs "White Rum").
* `resource://cocktaildb/list/categories`: Calls `.../list.php?c=list`. Shows available groupings (e.g., "Ordinary Drink", "Cocktail").
* `resource://cocktaildb/list/glassware`: Calls `.../list.php?g=list`. Helps the Agent suggest the correct presentation.

#### 2. MCP Tools (The Action Layer)
* `get_cocktails_by_ingredient(ingredient: string)`: Calls `.../filter.php?i={ingredient}`.
* `get_cocktail_details(id: string)`: Calls `.../lookup.php?i={id}`.
* `search_cocktail_by_name(name: string)`: Calls `.../search.php?s={name}`.

### B. The AI Agent (Curator & Reasoning Layer)
* **Menu Target:** 30 Drinks Total.
* **Curation Mix:** * **Classics (20):** Standards like Old Fashioned, Negroni, Margarita.
    * **Trending (8):** Favorites like Espresso Martini, Paper Plane, Paloma.
    * **Non-Alcoholic (2):** Virgin options like Shirley Temple, Virgin Mary.
* **Contextual Reasoning:** Before searching, the Agent reads the Ingredient Resource to ensure its brainstormed list matches the API's naming conventions.
* **Subset Analysis:** Evaluates full recipes from `get_cocktail_details` against the provided inventory list.

### C. Lightweight Caching
* **Lookup Cache:** Store `idDrink` objects in `cocktail_cache.json`.
* **Resource Cache:** Cache the ingredients and categories lists for 24 hours to minimize startup latency.
* **Menu Manifest:** Store the final "30-Drink List" for a specific inventory version in `menu_manifest.json`.

## 4. Implementation Workflow

### Phase 1: Resource & Tool Definition
Define MCP Resources first. This allows the Agent to "study" the database schema. Then define Tools for execution.

### Phase 2: Agent Configuration (The Curator)
Initialize the LangChain agent with a specialized **System Prompt**:

> "You are a Master Mixologist. Your task is to curate a 30-drink menu based on the provided bar inventory.
> 
> 1. **Consult Resources:** First, read the available ingredients and categories resources to learn the database naming conventions.
> 2. **Brainstorm:** Generate 40-50 high-probability candidates: 70% Classics, 25% Trending, and 5% Non-Alcoholic.
> 3. **