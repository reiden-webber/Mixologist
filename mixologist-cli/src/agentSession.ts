import { config } from "dotenv";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { MultiServerMCPClient } from "@langchain/mcp-adapters";
import { ChatAnthropic } from "@langchain/anthropic";
import { createAgent } from "langchain";
import type { ReactAgent } from "langchain";
import { validateThemeTool } from "./tools/validateTheme.js";
import { submitMenuTool } from "./tools/submitMenu.js";

export const MCP_TOOL_NAMES = new Set([
  "get_cocktails_by_ingredient",
  "get_cocktail_details",
  "search_cocktail_by_name",
]);

export const TOOL_NAMES = new Set([
  ...MCP_TOOL_NAMES,
  "validate_theme",
  "submit_menu",
]);

export const INGREDIENTS_URI = "cocktaildb://list/ingredients";
export const MCP_SERVER_NAME = "cocktaildb";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

config({ path: join(__dirname, "..", "..", ".env") });

function packageRoot(): string {
  return join(__dirname, "..");
}

export function resolveMcpServerEntry(): string {
  const fromEnv = process.env.MCP_SERVER_PATH?.trim();
  if (fromEnv) return fromEnv;
  const repoRoot = join(packageRoot(), "..");
  return join(repoRoot, "MCP_Server", "dist", "index.js");
}

export function extractAssistantText(message: {
  content: unknown;
}): string {
  const { content } = message;
  if (typeof content === "string") return content.trim();
  if (!Array.isArray(content)) return String(content ?? "").trim();
  const parts: string[] = [];
  for (const block of content) {
    if (typeof block === "string") {
      parts.push(block);
      continue;
    }
    if (block && typeof block === "object" && "type" in block) {
      const t = (block as { type: string }).type;
      if (t === "text" && "text" in block) {
        parts.push(String((block as { text: string }).text));
      }
    }
  }
  return parts.join("\n").trim();
}

function buildSystemPrompt(ingredientsJson: string): string {
  return `You are the Mixologist — an expert Hospitality Consultant who helps bar owners design, cost, and curate seasonal cocktail menus. Your approach is professional, analytical, and efficiency-oriented.

## Workflow

### Discovery Phase (MANDATORY first step)
Before suggesting any drinks you MUST complete a discovery conversation. Ask about:
1. **Bar theme / concept** (e.g., 1920s Speakeasy, Tiki Lounge, Modern Craft)
2. **Target demographics** (age range, preferences, spending habits)
3. **Price-point targets** (average drink price, food-cost percentage goals)
4. **Inventory constraints** (spirits on hand, seasonal availability)

Do not skip this phase. Gather at least theme and price context before proceeding.

### Menu Design Phase
Once discovery is complete:
- Use CocktailDB tools to research drinks that match the owner's concept.
- Call **validate_theme** for every candidate drink to ensure it fits the declared bar theme.
- Drop or replace drinks that fail validation.
- Assign each drink a **category** string for menu sections (use a small, consistent set of labels matching how guests would see the menu, e.g. Signature, Classics, Seasonal).
- When the menu is finalized, call **submit_menu** with the complete structured menu object. This is required — always present the final menu through the submit_menu tool.

## Canonical Ingredients (from resource ${INGREDIENTS_URI})
Map ingredient names to these exact strings before calling get_cocktails_by_ingredient:
${ingredientsJson}

## CocktailDB Tools
- **get_cocktails_by_ingredient**: list drinks containing an ingredient (use canonical name).
- **get_cocktail_details**: full recipe by idDrink — use for costing and ingredient analysis.
- **search_cocktail_by_name**: resolve a cocktail name to its idDrink.

## Validation & Output Tools
- **validate_theme**: check whether a drink fits the bar's declared theme before including it.
- **submit_menu**: present the finalized menu as structured data. Call this once the menu is ready.

Ground every recommendation in tool results. Be concise and action-oriented.`;
}

export type MixologistSession = {
  agent: ReactAgent;
  mcpClient: MultiServerMCPClient;
  close: () => Promise<void>;
};

export async function createMixologistSession(): Promise<MixologistSession> {
  if (!process.env.ANTHROPIC_API_KEY?.trim()) {
    throw new Error(
      "Missing ANTHROPIC_API_KEY. Set it in the environment or in `.env` at the repository root (see `.env.example`).",
    );
  }

  const mcpPath = resolveMcpServerEntry();
  if (!existsSync(mcpPath)) {
    throw new Error(
      `MCP server not found at ${mcpPath}. Build with: npm run build -w mcp-server`,
    );
  }

  const mcpClient = new MultiServerMCPClient({
    [MCP_SERVER_NAME]: {
      transport: "stdio",
      command: "node",
      args: [mcpPath],
    },
  });

  const contents = await mcpClient.readResource(
    MCP_SERVER_NAME,
    INGREDIENTS_URI,
  );
  const ingredientsJson = contents
    .map((c) => c.text ?? "")
    .filter(Boolean)
    .join("\n")
    .trim();
  if (!ingredientsJson) {
    await mcpClient.close().catch(() => {});
    throw new Error(
      `Empty resource ${INGREDIENTS_URI}; cannot build ingredient-aware system prompt.`,
    );
  }

  const allMcpTools = await mcpClient.getTools(MCP_SERVER_NAME);
  const mcpTools = allMcpTools.filter((t) => MCP_TOOL_NAMES.has(t.name));
  if (mcpTools.length !== MCP_TOOL_NAMES.size) {
    const got = new Set(mcpTools.map((t) => t.name));
    const missing = [...MCP_TOOL_NAMES].filter((n) => !got.has(n));
    await mcpClient.close().catch(() => {});
    throw new Error(
      `Expected MCP tools ${[...MCP_TOOL_NAMES].join(", ")}; missing: ${missing.join(", ") || "unknown"}`,
    );
  }

  const tools = [...mcpTools, validateThemeTool, submitMenuTool];

  const model = new ChatAnthropic({
    model: "claude-sonnet-4-6",
    maxTokens: 16_384,
    thinking: { type: "adaptive" },
    maxRetries: 2,
  });

  const systemPrompt = buildSystemPrompt(ingredientsJson);

  const agent = createAgent({
    model,
    tools,
    systemPrompt,
  });

  return {
    agent,
    mcpClient,
    close: async () => {
      await mcpClient.close().catch(() => {});
    },
  };
}
