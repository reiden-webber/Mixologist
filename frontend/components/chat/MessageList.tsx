"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import type { Message } from "@/lib/chat/types";
import { StreamedText } from "./StreamedText";

type Props = {
  messages: Message[];
  pending?: boolean;
};

function ThinkingRow() {
  return (
    <li className="flex w-full justify-start" aria-live="polite">
      <div className="flex max-w-[min(85%,36rem)] items-center gap-3 rounded-2xl rounded-bl-md border border-zinc-200 bg-zinc-50 px-4 py-3 dark:border-zinc-700 dark:bg-zinc-900/60">
        <span
          className="inline-block h-5 w-5 shrink-0 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-800 dark:border-zinc-600 dark:border-t-zinc-100"
          aria-hidden
        />
        <span className="text-sm text-zinc-600 dark:text-zinc-300">
          Mixologist is thinking…
        </span>
      </div>
    </li>
  );
}

export function MessageList({ messages, pending }: Props) {
  const endRef = useRef<HTMLDivElement>(null);

  const scrollToEnd = useCallback(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToEnd();
  }, [messages, pending, scrollToEnd]);

  const lastAssistantId = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === "assistant") {
        return messages[i].id;
      }
    }
    return undefined;
  }, [messages]);

  if (messages.length === 0 && !pending) {
    return (
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-2 overflow-y-auto scroll-smooth px-4 py-12 text-center text-sm text-zinc-500 dark:text-zinc-400">
        <p className="text-base font-medium text-zinc-700 dark:text-zinc-300">
          What can we pour tonight?
        </p>
        <p className="max-w-md">
          Ask about ingredients or classic drinks — for example: &ldquo;Tell me about
          a cocktail that uses lime.&rdquo;
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-0 flex-1 overflow-y-auto scroll-smooth">
      <ul className="flex flex-col gap-4 px-3 py-4 md:px-6">
        {messages.map((m) => (
          <li
            key={m.id}
            className={`flex w-full ${m.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={
                m.role === "user"
                  ? "max-w-[min(85%,36rem)] rounded-2xl rounded-br-md bg-zinc-900 px-4 py-2.5 text-sm text-white dark:bg-zinc-100 dark:text-zinc-900"
                  : "max-w-[min(85%,36rem)] rounded-2xl rounded-bl-md border border-zinc-200 bg-zinc-50 px-4 py-2.5 text-sm text-zinc-800 dark:border-zinc-700 dark:bg-zinc-900/60 dark:text-zinc-100"
              }
            >
              {m.role === "user" ? (
                <p className="whitespace-pre-wrap break-words">{m.content}</p>
              ) : (
                <StreamedText
                  fullText={m.content}
                  play={m.id === lastAssistantId}
                  onProgress={scrollToEnd}
                  onComplete={scrollToEnd}
                />
              )}
            </div>
          </li>
        ))}
        {pending ? <ThinkingRow /> : null}
        <li className="h-px shrink-0" aria-hidden>
          <div ref={endRef} />
        </li>
      </ul>
    </div>
  );
}
