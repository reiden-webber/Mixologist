### Goal: Integrate LangChain Agent with Claude Sonnet 4.6 & FastMCP Server

I need to build a LangChain-powered chat interface that connects to my custom FastMCP "CocktailDB" server. The agent must act as a "Master Mixologist" capable of answering ingredient questions and making recommendations based on my bar inventory.

#### 1. Security & Environment Setup
* **`.env`**: Create a file to store sensitive keys. Include `ANTHROPIC_API_KEY`.
* **`.gitignore`**: Ensure it ignores `.env`, `node_modules`, and any build artifacts.
* **Dependencies**: Install `@langchain/anthropic`, `@langchain/mcp-adapters`, `dotenv`, and `@modelcontextprotocol/sdk`.

#### 2. LangChain Integration Logic
* **MCP Client**: Initialize a client that connects to my local FastMCP server via `stdio` (or SSE if remote).
* **Tool Loading**: Use `@langchain/mcp-adapters` (e.g., `loadMcpTools`) to discover and convert the following MCP tools into LangChain tools:
    * `get_cocktails_by_ingredient`
    * `get_cocktail_details`
    * `search_cocktail_by_name`
* **Model Configuration**: Initialize `ChatAnthropic` using model `claude-sonnet-4-6`. Enable `thinking` (extended thinking) for complex subset analysis if needed.
* **Agent Creation**: Use `create_react_agent` or a similar constructor to assemble the agent with the loaded tools and model.

#### 3. Chat Interface & Logic
* **System Prompt**: Set a persona for the "Master Mixologist." Instruct it to always consult the `cocktaildb://list/ingredients` resource to ensure naming consistency before calling search tools.
* **Text Chat Loop**: Implement a command-line interface (using `readline` or similar) where a user can enter queries.
* **Handling Queries**: Ensure the agent can handle:
    * **Recommendation Queries**: e.g., "What drink do you recommend that has lime?" (Should use `get_cocktails_by_ingredient`).
    * **Ingredient Lookups**: e.g., "What ingredients does a Paloma have?" (Should use `search_cocktail_by_name` or `get_cocktail_details`).

#### 4. Requirements
* Proper error handling for failed tool calls or API timeouts.
* Use TypeScript with strict type checking.
* Ensure the agent's output is helpful, conversational, and grounded in the data fetched from the MCP server.