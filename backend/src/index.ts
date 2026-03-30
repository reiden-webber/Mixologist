import { createServer, type IncomingMessage, type ServerResponse } from "node:http";

const PORT = Number(process.env.PORT) || 4000;
const MIXOLOGIST_URL = (process.env.MIXOLOGIST_URL ?? "").replace(/\/$/, "");

function sendJson(res: ServerResponse, status: number, body: unknown): void {
  const payload = JSON.stringify(body);
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(payload),
  });
  res.end(payload);
}

async function readRawBody(req: IncomingMessage): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(chunk as Buffer);
  }
  return Buffer.concat(chunks);
}

function main(): void {
  const server = createServer(async (req: IncomingMessage, res: ServerResponse) => {
    const url = req.url?.split("?")[0] ?? "/";

    if (req.method === "OPTIONS" && (url === "/api/chat" || url === "/api/chat/")) {
      res.writeHead(204, {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      });
      res.end();
      return;
    }

    if (req.method === "GET" && (url === "/health" || url === "/health/")) {
      sendJson(res, 200, { status: "ok", service: "mixologist-backend" });
      return;
    }

    if (req.method === "POST" && (url === "/api/chat" || url === "/api/chat/")) {
      if (!MIXOLOGIST_URL) {
        sendJson(res, 503, {
          error: "mixologist_unconfigured",
          message: "Set MIXOLOGIST_URL (e.g. http://mixologist:4100) to proxy chat.",
        });
        return;
      }
      try {
        const body = await readRawBody(req);
        const target = `${MIXOLOGIST_URL}/v1/chat`;
        const upstream = await fetch(target, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: body.length ? new Uint8Array(body) : "{}",
        });
        const ct =
          upstream.headers.get("content-type") ??
          "application/json; charset=utf-8";
        const outHeaders: Record<string, string> = {
          "Content-Type": ct,
          "Access-Control-Allow-Origin": "*",
        };
        const cacheCtl = upstream.headers.get("cache-control");
        if (cacheCtl) outHeaders["Cache-Control"] = cacheCtl;
        res.writeHead(upstream.status, outHeaders);
        if (upstream.body) {
          const reader = upstream.body.getReader();
          try {
            for (;;) {
              const { done, value } = await reader.read();
              if (done) break;
              if (value?.length) res.write(Buffer.from(value));
            }
          } finally {
            reader.releaseLock();
          }
        }
        res.end();
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        sendJson(res, 502, { error: "mixologist_unreachable", message: msg });
      }
      return;
    }

    sendJson(res, 404, { error: "not_found" });
  });

  server.listen(PORT, "0.0.0.0", () => {
    console.info(
      `[backend] http://0.0.0.0:${PORT}  GET /health  POST /api/chat → ${MIXOLOGIST_URL || "(MIXOLOGIST_URL not set)"}`,
    );
  });
}

main();
