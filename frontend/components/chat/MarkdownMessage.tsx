"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type MarkdownMessageProps = {
  content: string;
  className?: string;
};

const proseBubble =
  "prose prose-sm max-w-none text-inherit dark:prose-invert " +
  "prose-headings:mb-2 prose-headings:mt-3 prose-headings:font-semibold first:prose-headings:mt-0 " +
  "prose-p:my-1.5 prose-p:leading-relaxed " +
  "prose-ul:my-1.5 prose-ol:my-1.5 prose-li:my-0.5 " +
  "prose-code:rounded prose-code:bg-zinc-200/90 prose-code:px-1 prose-code:py-0.5 prose-code:text-[0.9em] " +
  "dark:prose-code:bg-zinc-800 " +
  "prose-pre:my-2 prose-pre:bg-zinc-900 prose-pre:text-zinc-100 dark:prose-pre:bg-zinc-950 " +
  "prose-a:text-zinc-700 prose-a:underline dark:prose-a:text-zinc-300 " +
  "prose-strong:text-inherit prose-blockquote:border-zinc-300 prose-blockquote:text-zinc-600 " +
  "dark:prose-blockquote:border-zinc-600 dark:prose-blockquote:text-zinc-400";

export function MarkdownMessage({ content, className = "" }: MarkdownMessageProps) {
  return (
    <div className={`${proseBubble} ${className}`.trim()}>
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
    </div>
  );
}
