"use client";

import type { Message } from "@/lib/chat/types";

type Props = {
  messages: Message[];
};

export function MessageList({ messages }: Props) {
  if (messages.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-2 px-4 py-12 text-center text-sm text-zinc-500 dark:text-zinc-400">
        <p className="text-base font-medium text-zinc-700 dark:text-zinc-300">
          What can we pour tonight?
        </p>
        <p className="max-w-md">
          Ask about classics, trending cocktails, or NA options. Replies will
          appear here once the agent is connected.
        </p>
      </div>
    );
  }

  return (
    <ul className="flex flex-1 flex-col gap-4 overflow-y-auto px-3 py-4 md:px-6">
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
            <p className="whitespace-pre-wrap break-words">{m.content}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}
