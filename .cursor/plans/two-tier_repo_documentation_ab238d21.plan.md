---
name: Two-tier repo documentation
overview: Add a root README as the project front door and a new `.docs/` folder with four technical deep-dives, grounded in the actual workspaces (`frontend`, `backend`, `mixologist-cli`, `MCP_Server`), Docker Compose wiring, and the real agent/MCP/HTTP contracts.
todos:
  - id: readme-root
    content: "Create repo-root README.md: tagline, features, stack, quick start (Docker + local), .docs index"
    status: completed
  - id: docs-architecture
    content: Add .docs/architecture.md with component diagram + Mermaid agent/stream flow
    status: completed
  - id: docs-agent
    content: "Add .docs/agent-logic.md: model, prompts, state, menu extraction"
    status: completed
  - id: docs-api-tools
    content: "Add .docs/api-and-tools.md: CocktailDB, MCP resources/tools, HTTP NDJSON, local tools"
    status: completed
  - id: docs-db
    content: "Add .docs/database-schema.md: no app DB + Menu Zod domain model + external data"
    status: completed
isProject: false
---

# Two-tier documentation for Mixologist (bartender monorepo)

## Context from the codebase

- **No root [README.md](README.md) today** — only the stock [frontend/README.md](frontend/README.md). The plan requires a **new repo-root README**.
- **Four npm workspaces** ([package.json](package.json)): `frontend` (Next.js), `backend` (Node HTTP proxy), `MCP_Server` (package name `mcp-server`, FastMCP stdio server), `mixologist-cli` (LangChain agent + CLI + optional HTTP server).
- **Agent runtime** ([mixologist-cli/src/agentSession.ts](mixologist-cli/src/agentSession.ts)): `MultiServerMCPClient` (stdio → `MCP_Server/dist/index.js`), `ChatAnthropic` with `model: "claude-sonnet-4-6"` and `thinking: { type: "adaptive" }`, `createAgent({ model, tools, systemPrompt })` from `langchain`, plus local tools `validate_theme` and `submit_menu` ([mixologist-cli/src/tools/validateTheme.ts](mixologist-cli/src/tools/validateTheme.ts), [mixologist-cli/src/tools/submitMenu.ts](mixologist-cli/src/tools/submitMenu.ts)). MCP tools filtered to `get_cocktails_by_ingredient`, `get_cocktail_details`, `search_cocktail_by_name`. System prompt embeds JSON from resource `cocktaildb://list/ingredients` (`INGREDIENTS_URI`).
- **HTTP API** ([mixologist-cli/src/server.ts](mixologist-cli/src/server.ts)): `POST /v1/chat` with Zod body `{ messages: { role: "user" | "assistant", content: string }[] }`, response `application/x-ndjson` with lines `{ type: "status", message }`, final `{ type: "result", reply, menu? }`, or `{ type: "error", message }`. Menu extraction uses `<!--MENU_JSON-->` sentinels from [submitMenu.ts](mixologist-cli/src/tools/submitMenu.ts) and [MenuSchema](mixologist-cli/src/tools/menuSchema.ts) validation.
- **Backend** ([backend/src/index.ts](backend/src/index.ts)): `POST /api/chat` proxies to `MIXOLOGIST_URL/v1/chat` with CORS; `GET /health`.
- **MCP / external API** ([MCP_Server/src/index.ts](MCP_Server/src/index.ts), [MCP_Server/src/cocktailHandlers.ts](MCP_Server/src/cocktailHandlers.ts)): TheCocktailDB via `fetch` (key from `COCKTAIL_DB_API_KEY` per [.env.example](.env.example)); resources `cocktaildb://list/{ingredients,categories,glassware}`; tools return JSON strings with normalized `{ drinks: [...] }` shapes.
- **Deployment path** ([docker-compose.yml](docker-compose.yml)): `web` :3000 → `backend` :4000 → `mixologist` :4100; root `.env` for `ANTHROPIC_API_KEY`, etc.
- **Database**: There is **no application database or ORM** in this repo. Persistent storage is limited to **external** TheCocktailDB (read-only from the app’s perspective) and optional **LangSmith** tracing env vars. [database-schema.md](.docs/database-schema.md) should state this explicitly and document the **menu domain model** (Zod) as the structured “schema” consumers care about, not SQL tables.

## Tier 1: Root [README.md](README.md)

Write a concise, professional README that matches [.prompts/documentation_plan.md](.prompts/documentation_plan.md):


| Section             | Content to verify in code                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Title & tagline     | Hospitality consultant agent (“Mixologist”) for menu design / costing / curation — align with `buildSystemPrompt` in [agentSession.ts](mixologist-cli/src/agentSession.ts).                                                                                                                                                                                                                                                                                                                                               |
| Key features        | Discovery-then-design workflow, CocktailDB-backed research, `validate_theme`, structured `submit_menu` + UI menu canvas, NDJSON streaming status, CLI and full-stack Docker.                                                                                                                                                                                                                                                                                                                                              |
| Tech stack          | Next.js frontend, Node HTTP backend + mixologist HTTP server, LangChain + `@langchain/anthropic` + `@langchain/mcp-adapters`, FastMCP MCP server, Anthropic Claude, TheCocktailDB REST — **no app DB**.                                                                                                                                                                                                                                                                                                                   |
| Quick start         | (1) Copy [.env.example](.env.example) → `.env` and set `ANTHROPIC_API_KEY`. (2) **Docker**: `docker compose up --build` (ports 3000/4000/4100 per compose comments). (3) **Local dev** (document accurately): build order `mcp-server` → `mixologist-cli` (MCP `dist/index.js` must exist), run mixologist HTTP (`mixologist-cli` `dev:http` / `start:http`), backend with `MIXOLOGIST_URL`, frontend with `BACKEND_URL` — cite actual scripts from root [package.json](package.json) and workspace `package.json` files. |
| Documentation index | Bullet list linking to each `.docs/*.md` file.                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |


Tone: accessible “what / how to run,” not implementation detail.

## Tier 2: `.docs/` technical files

Create `**.docs/`** (new directory) with:

### 1. `[.docs/architecture.md](.docs/architecture.md)`

- Narrative: request paths for **web → backend → mixologist** vs **CLI → mixologist-cli only**; MCP child process stdio; CocktailDB HTTP.
- **Mermaid diagram** (per plan): agent reasoning loop — user messages → LangChain agent (`createAgent`) → model decides tool calls → MCP / local tools → tool messages → loop until final AI message; parallel annotation for HTTP NDJSON (`updates`/`values` stream, status lines from [progressLabels.ts](mixologist-cli/src/progressLabels.ts), final `result` line).
- Reference real paths: [frontend/lib/chat/sendMessage.ts](frontend/lib/chat/sendMessage.ts) (NDJSON client), [backend/src/index.ts](backend/src/index.ts), [mixologist-cli/src/server.ts](mixologist-cli/src/server.ts).

### 2. `[.docs/agent-logic.md](.docs/agent-logic.md)`

- **Brain**: `ChatAnthropic` model id, `maxTokens`, `thinking`, retries; `createAgent` + tool list (`TOOL_NAMES` / `MCP_TOOL_NAMES` from [agentSession.ts](mixologist-cli/src/agentSession.ts)).
- **System prompt**: Summarize discovery vs menu-design phases and tool grounding rules — optionally short excerpt from `buildSystemPrompt` (not the full ingredients blob).
- **State / memory**: CLI maintains `history: BaseMessage[]` in [main.ts](mixologist-cli/src/main.ts); HTTP is **stateless** — full transcript sent as `messages` each request; no vector store or server-side session DB.
- **Menu handling**: `submit_menu` sentinel wrapping JSON; server-side `extractLatestMenuFromTranscript` / `MenuSchema.safeParse` — cite [server.ts](mixologist-cli/src/server.ts) and [submitMenu.ts](mixologist-cli/src/tools/submitMenu.ts).

### 3. `[.docs/api-and-tools.md](.docs/api-and-tools.md)`

- **TheCocktailDB**: Base URL pattern from [MCP_Server/src/cocktailDb.ts](MCP_Server/src/cocktailDb.ts) (read file when writing), `COCKTAIL_DB_API_KEY`, list/filter/lookup/search endpoints as used in handlers.
- **MCP**: Resource URIs and purposes; each tool’s **Zod parameters** and **return shape** (JSON string content conventions) from [MCP_Server/src/index.ts](MCP_Server/src/index.ts).
- **Local tools**: `validate_theme` input schema + `{ valid, reason }` JSON string; `submit_menu` input = `MenuSchema` + sentinel-wrapped return string.
- **HTTP**: `POST /v1/chat` request/response NDJSON contract; `GET /health` on mixologist and backend; correlation headers `x-request-id` / `x-trace-id` ([server.ts](mixologist-cli/src/server.ts)).
- **LangSmith** (optional): vars from [.env.example](.env.example).

### 4. `[.docs/database-schema.md](.docs/database-schema.md)`

- **Explicit section**: “No application database” — conversations and menus are not persisted server-side; explain request-scoped messages and optional client-held UI state.
- **Domain model**: Document `MenuSchema` / `MenuItemSchema` fields (`menuName`, `concept`, `items[].{ name, ingredients, margin, description }`) as the canonical structured output — mirror [menuSchema.ts](mixologist-cli/src/menuSchema.ts).
- **External data**: TheCocktailDB as the only remote dataset; MCP resources as cached-at-load reference data for the agent prompt.

## Quality bar

- Use **actual** identifiers: workspace names (`mcp-server`, `mixologist-cli`), env vars from [.env.example](.env.example), file paths, tool names, URIs (`cocktaildb://list/ingredients`), model string `claude-sonnet-4-6`.
- **README** stays short; `**.docs/`** carries Mermaid, schemas, and snippets.
- Do not duplicate obsolete material from [.prompts/bartender_technical_plan.md](.prompts/bartender_technical_plan.md) where it conflicts with the hospitality-consultant pivot (e.g., “30 drinks” target) — prefer current code behavior.

## Files to add


| File                                                 | Action |
| ---------------------------------------------------- | ------ |
| [README.md](README.md)                               | Create |
| [.docs/architecture.md](.docs/architecture.md)       | Create |
| [.docs/agent-logic.md](.docs/agent-logic.md)         | Create |
| [.docs/api-and-tools.md](.docs/api-and-tools.md)     | Create |
| [.docs/database-schema.md](.docs/database-schema.md) | Create |


No code changes required unless you discover a factual mismatch while writing (then fix docs or code in a follow-up).