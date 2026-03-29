import { config } from "dotenv";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { MultiServerMCPClient } from "@langchain/mcp-adapters";
import { ChatAnthropic } from "@langchain/anthropic";
import { createAgent } from "langchain";
export const TOOL_NAMES = new Set([
    "get_cocktails_by_ingredient",
    "get_cocktail_details",
    "search_cocktail_by_name",
]);
export const INGREDIENTS_URI = "cocktaildb://list/ingredients";
export const MCP_SERVER_NAME = "cocktaildb";
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
config({ path: join(__dirname, "..", "..", ".env") });
function packageRoot() {
    return join(__dirname, "..");
}
export function resolveMcpServerEntry() {
    const fromEnv = process.env.MCP_SERVER_PATH?.trim();
    if (fromEnv)
        return fromEnv;
    const repoRoot = join(packageRoot(), "..");
    return join(repoRoot, "MCP_Server", "dist", "index.js");
}
export function extractAssistantText(message) {
    const { content } = message;
    if (typeof content === "string")
        return content.trim();
    if (!Array.isArray(content))
        return String(content ?? "").trim();
    const parts = [];
    for (const block of content) {
        if (typeof block === "string") {
            parts.push(block);
            continue;
        }
        if (block && typeof block === "object" && "type" in block) {
            const t = block.type;
            if (t === "text" && "text" in block) {
                parts.push(String(block.text));
            }
        }
    }
    return parts.join("\n").trim();
}
function buildSystemPrompt(ingredientsJson) {
    return `You are the Master Mixologist — a warm, knowledgeable bar expert. You help with cocktail recommendations and ingredient questions using only data from the CocktailDB MCP tools.

**Canonical ingredients (from resource ${INGREDIENTS_URI}):**
Before calling get_cocktails_by_ingredient, map the user's ingredient to the exact string from this list when possible (spelling and casing matter for the API).
${ingredientsJson}

**Tools:**
- Recommendations / "what can I make with X?": use get_cocktails_by_ingredient with the canonical name, then get_cocktail_details for recipes or subset checks against the user's bar inventory.
- Named drinks / "what's in a Paloma?": use search_cocktail_by_name, then get_cocktail_details with the idDrink from results.

Ask the user to share their bar inventory when you need it for makeability advice. Stay conversational and ground every factual claim in tool results.`;
}
export async function createMixologistSession() {
    if (!process.env.ANTHROPIC_API_KEY?.trim()) {
        throw new Error("Missing ANTHROPIC_API_KEY. Set it in the environment or in `.env` at the repository root (see `.env.example`).");
    }
    const mcpPath = resolveMcpServerEntry();
    if (!existsSync(mcpPath)) {
        throw new Error(`MCP server not found at ${mcpPath}. Build with: npm run build -w mcp-server`);
    }
    const mcpClient = new MultiServerMCPClient({
        [MCP_SERVER_NAME]: {
            transport: "stdio",
            command: "node",
            args: [mcpPath],
        },
    });
    const contents = await mcpClient.readResource(MCP_SERVER_NAME, INGREDIENTS_URI);
    const ingredientsJson = contents
        .map((c) => c.text ?? "")
        .filter(Boolean)
        .join("\n")
        .trim();
    if (!ingredientsJson) {
        await mcpClient.close().catch(() => { });
        throw new Error(`Empty resource ${INGREDIENTS_URI}; cannot build ingredient-aware system prompt.`);
    }
    const allTools = await mcpClient.getTools(MCP_SERVER_NAME);
    const tools = allTools.filter((t) => TOOL_NAMES.has(t.name));
    if (tools.length !== TOOL_NAMES.size) {
        const got = new Set(tools.map((t) => t.name));
        const missing = [...TOOL_NAMES].filter((n) => !got.has(n));
        await mcpClient.close().catch(() => { });
        throw new Error(`Expected MCP tools ${[...TOOL_NAMES].join(", ")}; missing: ${missing.join(", ") || "unknown"}`);
    }
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
            await mcpClient.close().catch(() => { });
        },
    };
}
//# sourceMappingURL=agentSession.js.map