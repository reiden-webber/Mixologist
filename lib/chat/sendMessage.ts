import type { Message } from "./types";

/**
 * Client-side entry point for sending a user turn. Replace the body with
 * `fetch("/api/chat", …)` or a Server Action when LangChain / MCP is wired up.
 */
export async function submitUserMessage(
  messages: Message[],
  text: string,
): Promise<Message> {
  void messages;
  void text;

  await new Promise((r) => setTimeout(r, 400));

  return {
    id:
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `assistant-${Date.now()}`,
    role: "assistant",
    content:
      "Backend is not connected yet. Once it is, I will help curate your 30-drink menu from inventory.",
    createdAt: Date.now(),
  };
}
