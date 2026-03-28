import { MultiServerMCPClient } from "@langchain/mcp-adapters";
import type { ReactAgent } from "langchain";
export declare const TOOL_NAMES: Set<string>;
export declare const INGREDIENTS_URI = "cocktaildb://list/ingredients";
export declare const MCP_SERVER_NAME = "cocktaildb";
export declare function resolveMcpServerEntry(): string;
export declare function extractAssistantText(message: {
    content: unknown;
}): string;
export type MixologistSession = {
    agent: ReactAgent;
    mcpClient: MultiServerMCPClient;
    close: () => Promise<void>;
};
export declare function createMixologistSession(): Promise<MixologistSession>;
