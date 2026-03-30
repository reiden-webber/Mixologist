# Data and schema

## No application database

This repository does **not** ship a Postgres/SQLite ORM, migrations, or server-side persistence for chats or menus.

- **HTTP API**: Each request carries the full conversation as `messages`. The mixologist process does not load prior turns from a database.
- **CLI**: Transcript lives in the **current process** (`history` in [`main.ts`](../mixologist-cli/src/main.ts)); exiting the CLI discards it unless you copy it yourself.
- **Frontend**: Chat and optional menu UI state are **client-held** (React state / memory); refresh behavior depends on how the app is used — there is no first-party “conversation store” in the repo.

Optional **LangSmith** tracing may retain telemetry in LangChain’s cloud according to your project settings; that is observability, not the app’s source of truth for menus.

## Domain model: menu (Zod)

The canonical structured output for a finalized menu is defined in [`mixologist-cli/src/tools/menuSchema.ts`](../mixologist-cli/src/tools/menuSchema.ts):

```ts
MenuItemSchema = z.object({
  name: z.string(),
  ingredients: z.array(z.string()),
  margin: z.number(),
  description: z.string(),
});

MenuSchema = z.object({
  menuName: z.string(),
  concept: z.string(),
  items: z.array(MenuItemSchema),
});
```

| Field | Meaning |
| --- | --- |
| `menuName` | Display name for the menu |
| `concept` | High-level concept / positioning |
| `items[].name` | Cocktail name |
| `items[].ingredients` | Ingredient list (strings; costing detail is conversational/tool-driven) |
| `items[].margin` | Numeric margin; the `submit_menu` tool description instructs the model to use a **0–1 decimal** (e.g. `0.32` for 32%) |
| `items[].description` | Short description for the menu |

The HTTP server validates any extracted menu JSON with `MenuSchema.safeParse` before including `menu` on the final NDJSON `result` line.

## External data

- **TheCocktailDB**: The only remote **dataset** the application reads. Access is mediated by the MCP server; API key segment `COCKTAIL_DB_API_KEY` is part of the URL path (see [`cocktailDb.ts`](../MCP_Server/src/cocktailDb.ts)).
- **MCP resources** (`cocktaildb://list/*`): Fetched from CocktailDB list endpoints at resource load time. The ingredients resource is also embedded into the agent system prompt at session startup for consistent tool arguments.

There are no SQL tables or entity relationships to document; the meaningful “schema” for integrators is **`MenuSchema`** plus the CocktailDB JSON shapes returned inside tool strings (`{ drinks: [...] }`).
