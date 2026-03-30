import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import {
  AIMessage,
  HumanMessage,
  ToolMessage,
  type BaseMessage,
} from "langchain";
import { z } from "zod";
import {
  createMixologistSession,
  extractAssistantText,
} from "./agentSession.js";
import { MenuSchema } from "./tools/menuSchema.js";
import {
  MENU_SENTINEL_OPEN,
  MENU_SENTINEL_CLOSE,
} from "./tools/submitMenu.js";

const chatBodySchema = z.object({
  messages: z.array(
    z.object({
      role: z.enum(["user", "assistant"]),
      content: z.string(),
    }),
  ),
});

const PORT = Number(process.env.MIXOLOGIST_HTTP_PORT) || 4100;

function sendJson(res: ServerResponse, status: number, body: unknown): void {
  const payload = JSON.stringify(body);
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(payload),
  });
  res.end(payload);
}

function toBaseMessages(
  rows: z.infer<typeof chatBodySchema>["messages"],
): BaseMessage[] {
  return rows.map((m) =>
    m.role === "user"
      ? new HumanMessage(m.content)
      : new AIMessage(m.content),
  );
}

function requestCorrelationId(req: IncomingMessage): string | undefined {
  const h = req.headers;
  const raw = h["x-request-id"] ?? h["x-trace-id"];
  if (typeof raw !== "string" || !raw.trim()) return undefined;
  return raw.trim();
}

function messageContentToString(content: unknown): string {
  if (typeof content === "string") return content;
  if (!Array.isArray(content)) return String(content ?? "");
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
  return parts.join("\n");
}

function extractMenuFromReply(text: string): { reply: string; menu: unknown | null } {
  const openIdx = text.indexOf(MENU_SENTINEL_OPEN);
  const closeIdx = text.indexOf(MENU_SENTINEL_CLOSE);
  if (openIdx === -1 || closeIdx === -1 || closeIdx <= openIdx) {
    return { reply: text, menu: null };
  }
  const jsonStr = text.slice(openIdx + MENU_SENTINEL_OPEN.length, closeIdx);
  const before = text.slice(0, openIdx);
  const after = text.slice(closeIdx + MENU_SENTINEL_CLOSE.length);
  const cleanReply = (before + after).trim();
  try {
    const menu = JSON.parse(jsonStr) as unknown;
    return { reply: cleanReply, menu };
  } catch {
    return { reply: text, menu: null };
  }
}

/** Text from a message that might contain MENU_JSON sentinels (tool output or assistant). */
function searchableTextForMenuScan(msg: BaseMessage): string | null {
  if (msg instanceof AIMessage) return extractAssistantText(msg);
  if (msg instanceof ToolMessage) {
    return messageContentToString(msg.content).trim();
  }
  return null;
}

/** Latest menu in this turn: scan newest messages first (submit_menu output is usually a ToolMessage). */
function extractLatestMenuFromTranscript(msgs: BaseMessage[]): unknown | null {
  for (let i = msgs.length - 1; i >= 0; i--) {
    const text = searchableTextForMenuScan(msgs[i]!);
    if (!text) continue;
    const { menu } = extractMenuFromReply(text);
    if (menu !== null) return menu;
  }
  return null;
}

function lastAIMessageReplyText(msgs: BaseMessage[]): string {
  for (let i = msgs.length - 1; i >= 0; i--) {
    const m = msgs[i];
    if (m instanceof AIMessage) return extractAssistantText(m);
  }
  return "";
}

async function readJsonBody(req: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(chunk as Buffer);
  }
  const raw = Buffer.concat(chunks).toString("utf8");
  if (!raw.trim()) return {};
  return JSON.parse(raw) as unknown;
}

async function main(): Promise<void> {
  console.info("[mixologist] Starting agent session…");
  const session = await createMixologistSession();

  const server = createServer(async (req: IncomingMessage, res: ServerResponse) => {
    const url = req.url?.split("?")[0] ?? "/";

    if (req.method === "GET" && (url === "/health" || url === "/health/")) {
      sendJson(res, 200, { status: "ok", service: "mixologist" });
      return;
    }

    if (req.method === "POST" && (url === "/v1/chat" || url === "/v1/chat/")) {
      try {
        const raw = await readJsonBody(req);
        const parsed = chatBodySchema.safeParse(raw);
        if (!parsed.success) {
          sendJson(res, 400, { error: "invalid_body", detail: parsed.error.flatten() });
          return;
        }
        const messages = toBaseMessages(parsed.data.messages);
        if (messages.length === 0) {
          sendJson(res, 400, { error: "messages_required" });
          return;
        }
        const requestId = requestCorrelationId(req);
        const result = await session.agent.invoke(
          { messages },
          {
            runName: "mixologist-http-chat",
            tags: ["mixologist", "http"],
            metadata: {
              source: "http",
              ...(requestId ? { requestId } : {}),
            },
          },
        );
        const msgs = result.messages as BaseMessage[];
        const menuRaw = extractLatestMenuFromTranscript(msgs);
        const menuParsed =
          menuRaw !== null ? MenuSchema.safeParse(menuRaw) : null;
        const menu =
          menuParsed && menuParsed.success ? menuParsed.data : undefined;

        const rawReply = lastAIMessageReplyText(msgs);
        const { reply } = extractMenuFromReply(rawReply);

        sendJson(res, 200, menu ? { reply, menu } : { reply });
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error("[mixologist] /v1/chat error:", msg);
        sendJson(res, 500, { error: "chat_failed", message: msg });
      }
      return;
    }

    sendJson(res, 404, { error: "not_found" });
  });

  server.listen(PORT, "0.0.0.0", () => {
    console.info(`[mixologist] Listening on 0.0.0.0:${PORT}`);
  });

  const shutdown = async (): Promise<void> => {
    server.close();
    await session.close();
  };

  process.on("SIGINT", () => {
    void shutdown().finally(() => process.exit(0));
  });
  process.on("SIGTERM", () => {
    void shutdown().finally(() => process.exit(0));
  });
}

await main();
