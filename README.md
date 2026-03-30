# Mixologist

**Mixologist** is a hospitality-consultant agent that helps bar owners **design, cost, and curate** seasonal cocktail menus. It combines discovery-style conversation with CocktailDB-backed research, theme checks, and a structured menu you can surface in the web UI.

## Key features

- **Discovery, then design**: Mandatory discovery (theme, demographics, price targets, inventory) before drink recommendations.
- **TheCocktailDB-backed research**: Filter by ingredient, fetch full recipes by `idDrink`, and search by name via an MCP server.
- **`validate_theme`**: Local tool to gate candidate drinks against the declared bar concept.
- **`submit_menu`**: Final menu as structured JSON (Zod-validated); the HTTP API can return it for the **menu canvas** in the frontend.
- **Streaming progress**: Mixologist serves `application/x-ndjson` status lines while the agent runs; the Next.js client parses the stream (`frontend/lib/chat/sendMessage.ts`).
- **CLI or full stack**: Interactive REPL in `mixologist-cli`, or **Docker Compose** for web + backend + mixologist.

## Tech stack


| Layer       | Technologies                                                                                                                 |
| ----------- | ---------------------------------------------------------------------------------------------------------------------------- |
| Frontend    | Next.js 15, React 19, Tailwind                                                                                               |
| Backend     | Node HTTP proxy (`backend`) — CORS + `POST /api/chat` → mixologist                                                           |
| Agent / API | `mixologist-cli`: LangChain `createAgent`, `@langchain/anthropic`, `@langchain/mcp-adapters`, optional HTTP on port **4100** |
| MCP         | `mcp-server` workspace: FastMCP stdio server wrapping TheCocktailDB                                                          |
| Models      | Anthropic **Claude** (`claude-sonnet-4-6` in code)                                                                           |
| Data        | **No application database** — read-only CocktailDB HTTP API; optional LangSmith tracing                                      |


Workspaces (root `package.json`): `frontend`, `backend`, `MCP_Server` (package name `mcp-server`), `mixologist-cli`.

## Quick start

### Prerequisites

- Node.js and npm
- An [Anthropic](https://www.anthropic.com/) API key

### Environment file

1. Copy `.env.example` to `.env` at the **repository root** (same folder as `package.json` and `docker-compose.yml`).
2. Fill in the keys below. Mixologist loads this `.env` when you run `mixologist-cli` locally; Docker Compose also reads it for variable substitution.

### API keys (how to get them and where they go)

| Variable | Required? | Used by |
| --- | --- | --- |
| `ANTHROPIC_API_KEY` | **Yes** (for the agent) | `mixologist-cli` → Anthropic Claude API |
| `COCKTAIL_DB_API_KEY` | No | `MCP_Server` → TheCocktailDB URL path segment |
| `LANGSMITH_API_KEY` | No | Optional tracing in LangSmith (see `.env.example`) |

#### Anthropic (`ANTHROPIC_API_KEY`)

The agent calls Anthropic’s API; without this key, `createMixologistSession()` fails at startup.

1. Sign in at the [Anthropic Console](https://console.anthropic.com/) (create an account if needed).
2. Open **API keys** (or **Settings → API keys**, depending on the console layout).
3. **Create key**, give it a label, and copy the secret **once** when shown — you cannot view it again later (only rotate or create a new key).
4. In your repo-root `.env`, set:

   ```bash
   ANTHROPIC_API_KEY=paste_the_full_secret_here
   ```

   Use a single line, no spaces around `=`, and no quotes unless your shell requires them. Do not commit `.env` (it should stay gitignored).

#### TheCocktailDB (`COCKTAIL_DB_API_KEY`)

Requests are built as `https://www.thecocktaildb.com/api/json/v1/{key}/...` — the value is the **path segment** after `/v1/`, not a Bearer header.

- **Default / free tier**: use `1`, as in `.env.example`. That is the public demo key TheCocktailDB documents for JSON endpoints.
- **Paid / supporter tier**: If you subscribe and receive a different key from [TheCocktailDB](https://www.thecocktaildb.com/), replace the value in `.env`:

  ```bash
  COCKTAIL_DB_API_KEY=your_key_here
  ```

Docker Compose passes this into the mixologist service so the bundled MCP server can reach the API (see `docker-compose.yml`). For local runs, ensure `.env` is at the repo root so processes that load it see the same value.

#### LangSmith (optional)

For LangChain/LangSmith traces (`LANGSMITH_TRACING`, `LANGSMITH_API_KEY`, `LANGSMITH_PROJECT`, etc.), create a project and API key in [LangSmith](https://smith.langchain.com/) and uncomment or add the variables from `.env.example`. This is optional and unrelated to running the chat UI.

### Docker (full stack)

From the repo root:

```bash
docker compose up --build
```

- **Web**: [http://localhost:3000](http://localhost:3000) (Next.js)
- **Backend**: [http://localhost:4000](http://localhost:4000) (`GET /health`, `POST /api/chat`)
- **Mixologist**: [http://localhost:4100](http://localhost:4100) (`GET /health`, `POST /v1/chat`)

Compose wires `BACKEND_URL`, `MIXOLOGIST_URL`, and `MCP_SERVER_PATH` inside the containers (see `docker-compose.yml`).

### Local development

Build the MCP server **before** running the agent — mixologist expects `MCP_Server/dist/index.js` (or `MCP_SERVER_PATH`).

```bash
npm run build -w mcp-server
npm run build -w mixologist-cli
```

Optional one-shot build of everything:

```bash
npm run build:all
```

Run three processes (three terminals), from the repo root:

1. **Mixologist HTTP** (port 4100):
  ```bash
   npm run dev:http -w mixologist-cli
  ```
2. **Backend** (proxies to mixologist):
  ```bash
   MIXOLOGIST_URL=http://127.0.0.1:4100 npm run dev -w backend
  ```
3. **Frontend** (Next.js; API route defaults to `http://127.0.0.1:4000` if `BACKEND_URL` is unset):
  ```bash
   npm run dev -w frontend
  ```

**CLI only** (stdio MCP child process, no backend/frontend):

```bash
npm run build -w mcp-server
npm run dev -w mixologist-cli
```

Interactive CLI scripts: `dev` / `start` in `mixologist-cli/package.json`. HTTP server: `dev:http` / `start:http`.

## Documentation

Technical deep-dives live in `[.docs/](.docs/)`:

- [Architecture & data flow](.docs/architecture.md) — web vs CLI paths, MCP, NDJSON streaming
- [Agent logic](.docs/agent-logic.md) — model, system prompt, state, menu extraction
- [APIs & tools](.docs/api-and-tools.md) — CocktailDB, MCP resources/tools, HTTP contract, local tools, LangSmith
- [Data & schema](.docs/database-schema.md) — no app DB; `MenuSchema` domain model; external data

