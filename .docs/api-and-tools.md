# APIs and tools

## TheCocktailDB (HTTP)

Implemented in [`MCP_Server/src/cocktailDb.ts`](../MCP_Server/src/cocktailDb.ts).

- **Base URL**: `https://www.thecocktaildb.com/api/json/v1/{key}/` where `{key}` comes from `COCKTAIL_DB_API_KEY` (trimmed; default `"1"` for the public tier).
- **Client helper**: `fetchCocktailDbJson(pathAndQuery)` resolves paths against that base.
- **Normalization**: `normalizeDrinksResponse` ensures tool outputs are always JSON strings encoding `{ "drinks": [...] }` (empty array when the API returns `drinks: null`).

### Endpoints used ([`cocktailHandlers.ts`](../MCP_Server/src/cocktailHandlers.ts))

| Handler | Path | Purpose |
| --- | --- | --- |
| Ingredients resource | `list.php?i=list` | Canonical ingredient list |
| Categories resource | `list.php?c=list` | Drink categories |
| Glassware resource | `list.php?g=list` | Glass types |
| `get_cocktails_by_ingredient` | `filter.php?i={ingredient}` | Drinks containing an ingredient |
| `get_cocktail_details` | `lookup.php?i={id}` | Full drink by `idDrink` |
| `search_cocktail_by_name` | `search.php?s={name}` | Name / substring search |

All tool `execute` functions return **`JSON.stringify({ drinks })`** strings.

## MCP server (`mcp-server`)

Source: [`MCP_Server/src/index.ts`](../MCP_Server/src/index.ts). Transport: **stdio** (FastMCP).

### Resources

| URI | MIME | Purpose |
| --- | --- | --- |
| `cocktaildb://list/ingredients` | `application/json` | Canonical ingredient strings for agent + tool args |
| `cocktaildb://list/categories` | `application/json` | Category labels from the API |
| `cocktaildb://list/glassware` | `application/json` | Glass names from the API |

### Tools (Zod parameters → return value)

All returns are **strings** containing JSON with shape `{ "drinks": unknown[] }`.

| Tool | Parameters | Notes |
| --- | --- | --- |
| `get_cocktails_by_ingredient` | `ingredient: string` (min 1) | Ingredient as in TheCocktailDB |
| `get_cocktail_details` | `id: string` (min 1) | `idDrink` |
| `search_cocktail_by_name` | `name: string` (min 1) | Full or partial name |

Tools are annotated `readOnlyHint: true` in FastMCP.

**Mixologist filtering**: Only the three tools above are passed to the agent; other MCP capabilities could be added server-side but would be ignored unless `MCP_TOOL_NAMES` is updated.

## Local agent tools (`mixologist-cli`)

### `validate_theme`

- **Schema**: `drinkName: string`, `theme: string`, `drinkStyle: string`.
- **Return**: JSON string `{ "valid": boolean, "reason": string }` (see [`validateTheme.ts`](../mixologist-cli/src/tools/validateTheme.ts)).

### `submit_menu`

- **Schema**: `MenuSchema` — `menuName`, `concept`, `items[]` with `name`, `ingredients[]`, `margin`, `description` ([`menuSchema.ts`](../mixologist-cli/src/tools/menuSchema.ts)).
- **Return**: String containing `<!--MENU_JSON-->{...}<!--/MENU_JSON-->` and a one-line human confirmation ([`submitMenu.ts`](../mixologist-cli/src/tools/submitMenu.ts)).

## Mixologist HTTP API

Server: [`mixologist-cli/src/server.ts`](../mixologist-cli/src/server.ts). Default port: `MIXOLOGIST_HTTP_PORT` or **4100**.

### `GET /health`

JSON: `{ "status": "ok", "service": "mixologist" }`.

### `POST /v1/chat`

- **Request body** (JSON): `{ "messages": [ { "role": "user" | "assistant", "content": string }, ... ] }` (Zod-validated). At least one message required.
- **Success response**: `Content-Type: application/x-ndjson`
  - Zero or more lines: `{ "type": "status", "message": string }`
  - Final line: `{ "type": "result", "reply": string, "menu"?: Menu }` — `menu` present only when extracted JSON passes `MenuSchema.safeParse`.
- **Errors**: If headers not yet sent, `500` JSON `{ "error": "chat_failed", "message": ... }`. If streaming already started, NDJSON `{ "type": "error", "message": ... }`.
- **Correlation**: Optional headers `x-request-id` or `x-trace-id` (first non-empty wins) recorded in run metadata for LangSmith.

## Backend HTTP API

[`backend/src/index.ts`](../backend/src/index.ts). Default port **4000** (`PORT`).

- `GET /health` → `{ "status": "ok", "service": "mixologist-backend" }`
- `POST /api/chat` → forwards body to `{MIXOLOGIST_URL}/v1/chat`, streams response through. Requires `MIXOLOGIST_URL` (e.g. `http://127.0.0.1:4100`). CORS: `Access-Control-Allow-Origin: *` for this route.

## LangSmith (optional)

From [`.env.example`](../.env.example), mixologist-cli may use:

- `LANGSMITH_TRACING`
- `LANGSMITH_API_KEY`
- `LANGSMITH_PROJECT` (example: `bartender-mixologist`)
- `LANGSMITH_ENDPOINT` (EU / self-hosted)
- `LANGCHAIN_CALLBACKS_BACKGROUND` — recommended `true` for HTTP so tracer I/O does not block responses

Omit these to disable tracing.
