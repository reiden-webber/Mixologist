import type { Menu, Message } from "./types";

type ChatApiMessage = { role: "user" | "assistant"; content: string };

type ChatApiOk = { reply: string; menu?: Menu };
type ChatApiErr = { error?: string; message?: string };

function newId(prefix: string): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `${prefix}-${Date.now()}`;
}

/**
 * Sends the full thread to the Next.js API route, which proxies to the backend / mixologist.
 */
export async function submitUserMessage(messages: Message[]): Promise<Message> {
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

  const raw = await res.text();
  let data: ChatApiOk & ChatApiErr;
  try {
    data = JSON.parse(raw) as ChatApiOk & ChatApiErr;
  } catch {
    throw new Error("The server returned an invalid response.");
  }

  if (!res.ok) {
    const detail = data.message ?? data.error ?? `HTTP ${res.status}`;
    throw new Error(detail);
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

  if (data.menu && typeof data.menu === "object" && Array.isArray(data.menu.items)) {
    msg.menu = data.menu;
  }

  return msg;
}
