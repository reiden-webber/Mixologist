import type { Menu, Message } from "./types";

type ChatApiMessage = { role: "user" | "assistant"; content: string };

type ChatApiOk = { reply: string; menu?: Menu };
type ChatApiErr = { error?: string; message?: string };

type NdjsonStatus = { type: "status"; message: string };
type NdjsonResult = { type: "result"; reply: string; menu?: Menu };
type NdjsonError = { type: "error"; message: string };

/** Keep enough lines to show a full tool-heavy turn (multiple MCP + validation + menu). */
const MAX_PROGRESS_STEPS = 16;

function newId(prefix: string): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `${prefix}-${Date.now()}`;
}

function pushProgressStep(
  steps: string[],
  message: string,
  onProgress?: (steps: string[]) => void,
): void {
  steps.push(message);
  while (steps.length > MAX_PROGRESS_STEPS) steps.shift();
  onProgress?.([...steps]);
}

function messageFromResult(data: NdjsonResult): Message {
  if (typeof data.reply !== "string" || !data.reply.trim()) {
    throw new Error("The mixologist returned an empty reply.");
  }

  const msg: Message = {
    id: newId("assistant"),
    role: "assistant",
    content: data.reply.trim(),
    createdAt: Date.now(),
  };

  if (
    data.menu &&
    typeof data.menu === "object" &&
    Array.isArray(data.menu.items)
  ) {
    msg.menu = data.menu;
  }

  return msg;
}

async function readNdjsonChatStream(
  body: ReadableStream<Uint8Array>,
  onProgress?: (steps: string[]) => void,
): Promise<Message> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  const steps: string[] = [];

  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (value?.length) {
        buffer += decoder.decode(value, { stream: true });
      }
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;

        let ev: NdjsonStatus | NdjsonResult | NdjsonError;
        try {
          ev = JSON.parse(trimmed) as NdjsonStatus | NdjsonResult | NdjsonError;
        } catch {
          throw new Error("The server returned an invalid response.");
        }

        if (ev.type === "status" && typeof ev.message === "string") {
          pushProgressStep(steps, ev.message, onProgress);
        } else if (ev.type === "result") {
          return messageFromResult(ev);
        } else if (ev.type === "error" && typeof ev.message === "string") {
          throw new Error(ev.message);
        }
      }

      if (done) break;
    }
  } finally {
    reader.releaseLock();
  }

  const tail = buffer.trim();
  if (tail) {
    let ev: NdjsonResult | NdjsonError;
    try {
      ev = JSON.parse(tail) as NdjsonResult | NdjsonError;
    } catch {
      throw new Error("The mixologist ended the stream without a final reply.");
    }
    if (ev.type === "result") return messageFromResult(ev);
    if (ev.type === "error" && typeof ev.message === "string") {
      throw new Error(ev.message);
    }
  }

  throw new Error("The mixologist ended the stream without a final reply.");
}

/**
 * Sends the full thread to the Next.js API route, which proxies to the backend / mixologist.
 * Streams progress lines when the API returns NDJSON.
 */
export async function submitUserMessage(
  messages: Message[],
  onProgress?: (steps: string[]) => void,
): Promise<Message> {
  const payload: { messages: ChatApiMessage[] } = {
    messages: messages.map((m) => ({
      role: m.role,
      content: m.content,
    })),
  };

  const res = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const ct = res.headers.get("content-type") ?? "";

  if (!res.ok) {
    const raw = await res.text();
    let data: ChatApiErr;
    try {
      data = JSON.parse(raw) as ChatApiErr;
    } catch {
      throw new Error("The server returned an invalid response.");
    }
    const detail = data.message ?? data.error ?? `HTTP ${res.status}`;
    throw new Error(detail);
  }

  if (ct.includes("ndjson") && res.body) {
    return readNdjsonChatStream(res.body, onProgress);
  }

  const raw = await res.text();
  let data: ChatApiOk & ChatApiErr;
  try {
    data = JSON.parse(raw) as ChatApiOk & ChatApiErr;
  } catch {
    throw new Error("The server returned an invalid response.");
  }

  if (typeof data.reply !== "string" || !data.reply.trim()) {
    throw new Error("The mixologist returned an empty reply.");
  }

  const msg: Message = {
    id: newId("assistant"),
    role: "assistant",
    content: data.reply.trim(),
    createdAt: Date.now(),
  };

  if (
    data.menu &&
    typeof data.menu === "object" &&
    Array.isArray(data.menu.items)
  ) {
    msg.menu = data.menu;
  }

  return msg;
}
