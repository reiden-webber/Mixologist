/** User-facing copy while a tool is requested or running. */
export declare const TOOL_PROGRESS_LABELS: Record<string, string>;
/** Normalize MCP / LangChain tool names (e.g. `cocktaildb__get_cocktail_details` → `get_cocktail_details`). */
export declare function normalizeToolName(name: string): string;
/**
 * Derive short status lines from a single LangGraph "updates" chunk (one or more node keys).
 */
export declare function statusMessagesFromUpdatesChunk(data: unknown): string[];
