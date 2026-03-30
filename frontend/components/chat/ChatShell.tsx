"use client";

import { useCallback, useMemo, useState } from "react";
import { submitUserMessage } from "@/lib/chat/sendMessage";
import type { Menu, Message } from "@/lib/chat/types";
import { Composer } from "./Composer";
import { MessageList } from "./MessageList";
import { MenuCanvas } from "../menu/MenuCanvas";

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
  const [progressSteps, setProgressSteps] = useState<string[]>([]);
  const [canvasOpen, setCanvasOpen] = useState(false);

  const latestMenu: Menu | null = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].menu) return messages[i].menu!;
    }
    return null;
  }, [messages]);

  const handleSend = useCallback(async (text: string) => {
    const userMsg = newUserMessage(text);
    let threadForRequest: Message[] = [];
    setMessages((prev) => {
      threadForRequest = [...prev, userMsg];
      return threadForRequest;
    });
    setProgressSteps([]);
    setPending(true);
    try {
      const reply = await submitUserMessage(threadForRequest, (steps) => {
        setProgressSteps(steps);
      });
      setMessages((prev) => [...prev, reply]);
      if (reply.menu) setCanvasOpen(true);
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
      setProgressSteps([]);
    }
  }, []);

  return (
    <div className="flex h-[100dvh] max-h-[100dvh] w-full overflow-hidden font-[family-name:var(--font-geist-sans)]">
      {/* Sidebar */}
      <aside className="hidden h-full max-h-[100dvh] w-56 shrink-0 flex-col overflow-hidden border-r border-zinc-200 bg-zinc-50/80 dark:border-zinc-800 dark:bg-zinc-950/80 md:flex">
        <div className="shrink-0 border-b border-zinc-200 p-4 dark:border-zinc-800">
          <span className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            Mixologist
          </span>
        </div>
        <nav className="min-h-0 flex-1 overflow-y-auto p-3 space-y-2">
          <button
            type="button"
            className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-left text-sm text-zinc-700 transition hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
            onClick={() => {
              setMessages([]);
              setCanvasOpen(false);
            }}
          >
            New consultation
          </button>
          {latestMenu && (
            <button
              type="button"
              className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-left text-sm text-zinc-700 transition hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
              onClick={() => setCanvasOpen((o) => !o)}
            >
              {canvasOpen ? "Hide menu" : "Show menu"}
            </button>
          )}
        </nav>
      </aside>

      {/* Main content area: Chat + Canvas */}
      <div className="flex min-h-0 min-w-0 flex-1 overflow-hidden bg-[var(--background)]">
        {/* Chat panel */}
        <div
          className={`flex min-h-0 min-w-0 flex-col overflow-hidden transition-all ${
            canvasOpen ? "w-1/2 lg:w-3/5" : "flex-1"
          }`}
        >
          <header className="shrink-0 flex items-center justify-between border-b border-zinc-200 px-4 py-3 md:hidden dark:border-zinc-800">
            <span className="text-lg font-bold tracking-tight">Mixologist</span>
            {latestMenu && (
              <button
                type="button"
                className="rounded-md border border-zinc-200 px-2 py-1 text-xs text-zinc-600 dark:border-zinc-700 dark:text-zinc-300"
                onClick={() => setCanvasOpen((o) => !o)}
              >
                {canvasOpen ? "Chat" : "Menu"}
              </button>
            )}
          </header>

          <main className="flex min-h-0 flex-1 flex-col overflow-hidden">
            <MessageList
              messages={messages}
              pending={pending}
              progressSteps={progressSteps}
            />
            <Composer disabled={pending} onSend={handleSend} />
          </main>
        </div>

        {/* Menu Canvas panel */}
        {canvasOpen && (
          <div className="hidden w-1/2 min-w-0 border-l border-zinc-200 bg-zinc-50/50 dark:border-zinc-800 dark:bg-zinc-950/50 md:block lg:w-2/5">
            <MenuCanvas menu={latestMenu} />
          </div>
        )}
      </div>
    </div>
  );
}
