# Agent logic

## Model (“brain”)

Configured in [`mixologist-cli/src/agentSession.ts`](../mixologist-cli/src/agentSession.ts):

| Setting | Value |
| --- | --- |
| Class | `ChatAnthropic` (`@langchain/anthropic`) |
| Model ID | `claude-sonnet-4-6` |
| `maxTokens` | `16384` |
| `thinking` | `{ type: "adaptive" }` |
| `maxRetries` | `2` |

The runnable agent is created with LangChain’s `createAgent({ model, tools, systemPrompt })`.

## Tools exposed to the agent

`TOOL_NAMES` is the union of MCP cocktail tools and local tools:

- **MCP** (filtered from the FastMCP server; names must all be present): `get_cocktails_by_ingredient`, `get_cocktail_details`, `search_cocktail_by_name` — see [`MCP_TOOL_NAMES` / `TOOL_NAMES`](../mixologist-cli/src/agentSession.ts).
- **Local**: `validate_theme`, `submit_menu` — [`validateTheme.ts`](../mixologist-cli/src/tools/validateTheme.ts), [`submitMenu.ts`](../mixologist-cli/src/tools/submitMenu.ts).

The MCP client is registered under server name `cocktaildb` (`MCP_SERVER_NAME`). Progress labels in [`progressLabels.ts`](../mixologist-cli/src/progressLabels.ts) normalize names like `cocktaildb__get_cocktail_details` back to the base tool name for UI copy.

## System prompt

`buildSystemPrompt(ingredientsJson)` embeds:

1. **Role**: Mixologist as a professional hospitality consultant for menu design, costing, and curation.
2. **Discovery phase (mandatory first)**: Theme/concept, demographics, price targets, inventory — must not be skipped; at least theme and price context before moving on.
3. **Menu design phase**: Use CocktailDB tools for research; call `validate_theme` for every candidate; drop failures; finalize with `submit_menu`.
4. **Canonical ingredients**: Full JSON text from MCP resource `cocktaildb://list/ingredients` (`INGREDIENTS_URI`) so `get_cocktails_by_ingredient` uses exact CocktailDB strings.
5. **Grounding**: Recommendations must be grounded in tool results; concise, action-oriented tone.

The full ingredients blob is large; it is loaded once at session startup via `mcpClient.readResource` and injected into the system prompt — not repeated here.

## State and memory

| Mode | Behavior |
| --- | --- |
| **CLI** | [`main.ts`](../mixologist-cli/src/main.ts) keeps `history: BaseMessage[]`. After each `agent.invoke`, it replaces `history` with `result.messages` so the thread grows with the full tool/assistant exchange. |
| **HTTP** | **Stateless**: each `POST /v1/chat` sends the full `messages` array ([`server.ts`](../mixologist-cli/src/server.ts)). No server-side session store, no vector DB, no persistent transcript database. |

## Menu handling

1. **`submit_menu` tool**: Validates input with `MenuSchema` (Zod), then returns a string that includes JSON wrapped in sentinels `<!--MENU_JSON-->` … `<!--/MENU_JSON-->` plus a short success line ([`submitMenu.ts`](../mixologist-cli/src/tools/submitMenu.ts)).

2. **Server extraction** ([`server.ts`](../mixologist-cli/src/server.ts)):
   - After the stream completes, `extractLatestMenuFromTranscript` scans messages **newest first**, looking at `AIMessage` and `ToolMessage` text for sentinel-wrapped JSON (`extractMenuFromReply`).
   - Parsed JSON is validated with `MenuSchema.safeParse` from [`tools/menuSchema.ts`](../mixologist-cli/src/tools/menuSchema.ts).
   - The **assistant reply** shown to the client strips sentinel blocks via the same `extractMenuFromReply` on the last AI message text so raw JSON is not duplicated in `reply`.
   - If parsing/validation fails, the NDJSON `result` may omit `menu` even if sentinels appeared in the raw stream.

This design lets the model “speak” normally while still producing machine-readable menu data for the frontend menu canvas.
