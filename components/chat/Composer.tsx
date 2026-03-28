"use client";

import { useCallback, useState, type FormEvent, type KeyboardEvent } from "react";

type Props = {
  disabled?: boolean;
  onSend: (text: string) => void | Promise<void>;
};

export function Composer({ disabled, onSend }: Props) {
  const [value, setValue] = useState("");

  const submit = useCallback(async () => {
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    setValue("");
    await onSend(trimmed);
  }, [value, disabled, onSend]);

  const onSubmit = useCallback(
    (e: FormEvent) => {
      e.preventDefault();
      void submit();
    },
    [submit],
  );

  const onKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        void submit();
      }
    },
    [submit],
  );

  return (
    <form
      onSubmit={onSubmit}
      className="border-t border-zinc-200 bg-[var(--background)] px-3 py-3 shadow-[0_-4px_12px_rgba(0,0,0,0.04)] dark:border-zinc-800 dark:shadow-[0_-4px_12px_rgba(0,0,0,0.25)] md:px-6"
    >
      <div className="mx-auto flex max-w-3xl gap-2 rounded-2xl border border-zinc-200 bg-white p-2 dark:border-zinc-700 dark:bg-zinc-950">
        <textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Message Bartender…"
          rows={1}
          disabled={disabled}
          className="max-h-40 min-h-[44px] flex-1 resize-none bg-transparent px-3 py-2.5 text-sm outline-none placeholder:text-zinc-400 disabled:opacity-50"
          aria-label="Message input"
        />
        <button
          type="submit"
          disabled={disabled || !value.trim()}
          className="shrink-0 rounded-xl bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          Send
        </button>
      </div>
      <p className="mx-auto mt-2 max-w-3xl text-center text-xs text-zinc-400">
        Enter to send · Shift+Enter for new line
      </p>
    </form>
  );
}
