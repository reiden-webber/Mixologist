import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { AIMessage, HumanMessage, type BaseMessage } from "langchain";
import { z } from "zod";
import {
  createMixologistSession,
  extractAssistantText,
} from "./agentSession.js";

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
        const result = await session.agent.invoke({ messages });
        const msgs = result.messages as BaseMessage[];
        const last = msgs[msgs.length - 1];
        const reply =
          last instanceof AIMessage
            ? extractAssistantText(last)
            : last
              ? JSON.stringify(last.content)
              : "";
        sendJson(res, 200, { reply });
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
