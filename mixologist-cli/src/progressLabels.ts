import { AIMessage, ToolMessage } from "langchain";

/** Must match `MCP_SERVER_NAME` in agentSession (MCP tool name prefix when namespaced). */
const MCP_TOOL_NAME_PREFIX = "cocktaildb__";

/**
 * LangChain `createAgent` registers the LLM node as `model_request` (see AGENT_NODE_NAME
 * in langchain agents), not `model`. Older docs/examples use `model`.
 */
const MODEL_UPDATE_KEYS = new Set(["model", "model_request"]);

/** User-facing copy while a tool is requested or running. */
export const TOOL_PROGRESS_LABELS: Record<string, string> = {
  get_cocktails_by_ingredient: "Looking up drinks by ingredient…",
  get_cocktail_details: "Pulling recipe details…",
  search_cocktail_by_name: "Searching the cocktail database…",
  validate_theme: "Checking drinks against your theme…",
  submit_menu: "Building your curated menu…",
};

/** Normalize MCP / LangChain tool names (e.g. `cocktaildb__get_cocktail_details` → `get_cocktail_details`). */
export function normalizeToolName(name: string): string {
  const known = Object.keys(TOOL_PROGRESS_LABELS);
  if (known.includes(name)) return name;

  if (name.startsWith(MCP_TOOL_NAME_PREFIX)) {
    const rest = name.slice(MCP_TOOL_NAME_PREFIX.length);
    if (known.includes(rest)) return rest;
  }

  const idx = name.lastIndexOf("__");
  if (idx !== -1) {
    const rest = name.slice(idx + 2);
    if (known.includes(rest)) return rest;
  }

  return name;
}

function labelForToolName(name: string): string {
  const n = normalizeToolName(name);
  return TOOL_PROGRESS_LABELS[n] ?? `Running ${n}…`;
}

function getMessagesArray(payload: unknown): unknown[] {
  if (!payload || typeof payload !== "object") return [];
  const p = payload as Record<string, unknown>;
  if (!Array.isArray(p.messages)) return [];
  return p.messages;
}

function getContent(msg: unknown): unknown {
  if (!msg || typeof msg !== "object") return undefined;
  const o = msg as Record<string, unknown>;
  if ("content" in o) return o.content;
  if (o.kwargs && typeof o.kwargs === "object") {
    const k = o.kwargs as Record<string, unknown>;
    if ("content" in k) return k.content;
  }
  return undefined;
}

function toolNamesFromContentBlocks(content: unknown): string[] {
  if (!Array.isArray(content)) return [];
  const names: string[] = [];
  for (const block of content) {
    if (!block || typeof block !== "object") continue;
    const b = block as { type?: string; name?: string };
    if (
      (b.type === "tool_use" || b.type === "server_tool_use") &&
      typeof b.name === "string"
    ) {
      names.push(b.name);
    }
  }
  return names;
}

function toolNamesFromAiLike(msg: unknown): string[] {
  const fromCalls: string[] = [];
  if (AIMessage.isInstance(msg)) {
    for (const tc of msg.tool_calls ?? []) {
      if (tc.name) fromCalls.push(tc.name);
    }
  } else if (msg && typeof msg === "object") {
    const o = msg as Record<string, unknown>;
    if (Array.isArray(o.tool_calls)) {
      for (const t of o.tool_calls as { name?: string }[]) {
        if (t.name) fromCalls.push(t.name);
      }
    }
    if (o.kwargs && typeof o.kwargs === "object") {
      fromCalls.push(...toolNamesFromAiLike(o.kwargs));
    }
  }

  const fromContent = toolNamesFromContentBlocks(getContent(msg));

  const merged: string[] = [];
  const seen = new Set<string>();
  for (const raw of [...fromCalls, ...fromContent]) {
    const n = normalizeToolName(raw);
    if (!n || seen.has(n)) continue;
    seen.add(n);
    merged.push(n);
  }
  return merged;
}

function lastAiFromMessages(msgs: unknown[]): unknown | undefined {
  for (let i = msgs.length - 1; i >= 0; i--) {
    const m = msgs[i];
    if (AIMessage.isInstance(m)) return m;
    if (m && typeof m === "object") {
      const t = (m as { type?: string; _getType?: () => string }).type;
      const gt =
        typeof (m as { _getType?: () => string })._getType === "function"
          ? (m as { _getType: () => string })._getType()
          : undefined;
      if (t === "ai" || gt === "ai") return m;
    }
  }
  return undefined;
}

function toolNameFromToolMessageLike(m: unknown): string | undefined {
  if (ToolMessage.isInstance(m) && m.name) return normalizeToolName(m.name);
  if (m && typeof m === "object") {
    const o = m as { type?: string; name?: string; kwargs?: { name?: string } };
    if (o.type === "tool" && typeof o.name === "string") {
      return normalizeToolName(o.name);
    }
    if (o.kwargs && typeof o.kwargs.name === "string") {
      return normalizeToolName(o.kwargs.name);
    }
  }
  return undefined;
}

/**
 * Derive short status lines from a single LangGraph "updates" chunk (one or more node keys).
 */
export function statusMessagesFromUpdatesChunk(data: unknown): string[] {
  if (!data || typeof data !== "object") return [];
  const out: string[] = [];

  for (const [step, payload] of Object.entries(
    data as Record<string, unknown>,
  )) {
    if (MODEL_UPDATE_KEYS.has(step)) {
      const msgs = getMessagesArray(payload);
      const lastAi = lastAiFromMessages(msgs);
      const names = lastAi ? toolNamesFromAiLike(lastAi) : [];
      if (names.length === 0) {
        out.push("Drafting a reply…");
      } else {
        for (const n of names) {
          out.push(labelForToolName(n));
        }
      }
    } else if (step === "tools") {
      const msgs = getMessagesArray(payload);
      for (const m of msgs) {
        const toolName = toolNameFromToolMessageLike(m);
        if (toolName === "submit_menu") {
          out.push("Finalizing your curated menu…");
          break;
        }
      }
    }
  }

  return out;
}
