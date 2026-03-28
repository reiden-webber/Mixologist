"use client";

import { useCallback, useState } from "react";
import { submitUserMessage } from "@/lib/chat/sendMessage";
import type { Message } from "@/lib/chat/types";
import { Composer } from "./Composer";
import { MessageList } from "./MessageList";

function newUserMessage(content: string): Message {
  return {
    id:
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `user-${Date.now()}`,
    role: "user",
    content,
    createdAt: Date.now(),
  };
}

export function ChatShell() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [pending, setPending] = useState(false);

  const handleSend = useCallback(async (text: string) => {
    const userMsg = newUserMessage(text);
    let threadForRequest: Message[] = [];
    setMessages((prev) => {
      threadForRequest = [...prev, userMsg];
      return threadForRequest;
    });
    setPending(true);
    try {
      const reply = await submitUserMessage(threadForRequest);
      setMessages((prev) => [...prev, reply]);
    } catch (e) {
      const detail = e instanceof Error ? e.message : "Something went wrong.";
      setMessages((prev) => [
        ...prev,
        {
          id:
            typeof crypto !== "undefined" && crypto.randomUUID
              ? crypto.randomUUID()
              : `error-${Date.now()}`,
          role: "assistant",
          content: `Sorry — ${detail}`,
          createdAt: Date.now(),
        },
      ]);
    } finally {
      setPending(false);
    }
  }, []);

  return (
    <div className="flex h-[100dvh] max-h-[100dvh] w-full overflow-hidden font-[family-name:var(--font-geist-sans)]">
      <aside className="hidden h-full max-h-[100dvh] w-56 shrink-0 flex-col overflow-hidden border-r border-zinc-200 bg-zinc-50/80 dark:border-zinc-800 dark:bg-zinc-950/80 md:flex">
        <div className="shrink-0 border-b border-zinc-200 p-4 dark:border-zinc-800">
          <span className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            Bartender
          </span>
        </div>
        <nav className="min-h-0 flex-1 overflow-y-auto p-3">
          <button
            type="button"
            className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-left text-sm text-zinc-700 transition hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
            onClick={() => {
              setMessages([]);
            }}
          >
            New chat
          </button>
        </nav>
      </aside>

      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-[var(--background)]">
        <header className="shrink-0 flex items-center border-b border-zinc-200 px-4 py-3 md:hidden dark:border-zinc-800">
          <span className="text-lg font-bold tracking-tight">Bartender</span>
        </header>

        <main className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <MessageList messages={messages} pending={pending} />
          <Composer disabled={pending} onSend={handleSend} />
        </main>
      </div>
    </div>
  );
}
