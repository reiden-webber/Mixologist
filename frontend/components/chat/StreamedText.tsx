"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { MarkdownMessage } from "./MarkdownMessage";

export type StreamedTextProps = {
  fullText: string;
  /** When true, reveal tokens over time; when false, show full text immediately. */
  play: boolean;
  onComplete?: () => void;
  onProgress?: () => void;
};

/** Split into words and whitespace chunks so the visible string grows naturally. */
function tokenizeForStream(text: string): string[] {
  const parts = text.match(/[^\s]+|\s+/g);
  return parts ?? (text ? [text] : []);
}

/**
 * Reduces broken emphasis/code while a markdown prefix is still growing.
 * Half-open fenced blocks may still look odd until the stream completes.
 */
export function sanitizePartialMarkdown(input: string): string {
  if (!input) return input;
  let s = input;

  const graveCount = (s.match(/`/g) ?? []).length;
  if (graveCount % 2 === 1) {
    const i = s.lastIndexOf("`");
    if (i !== -1) {
      s = s.slice(0, i) + s.slice(i + 1);
    }
  }

  if (s.endsWith("*")) {
    const double = /\*\*[^*]*$/.test(s);
    if (double) {
      const pairs = (s.match(/\*\*/g) ?? []).length;
      if (pairs % 2 === 1) {
        s = s.slice(0, -2);
      }
    } else {
      const stars = (s.match(/\*/g) ?? []).length;
      if (stars % 2 === 1) {
        s = s.slice(0, -1);
      }
    }
  }

  return s;
}

export function StreamedText({
  fullText,
  play,
  onComplete,
  onProgress,
}: StreamedTextProps) {
  const tokens = useMemo(() => tokenizeForStream(fullText), [fullText]);
  const tokensRef = useRef(tokens);
  tokensRef.current = tokens;

  const [count, setCount] = useState(0);
  const doneRef = useRef(false);

  const onCompleteRef = useRef(onComplete);
  const onProgressRef = useRef(onProgress);
  onCompleteRef.current = onComplete;
  onProgressRef.current = onProgress;

  useEffect(() => {
    doneRef.current = false;
    if (!play) {
      setCount(tokens.length);
      return;
    }
    setCount(0);
  }, [play, fullText, tokens.length]);

  useEffect(() => {
    if (!play) return;

    const tok = tokensRef.current;
    if (tok.length === 0) {
      if (!doneRef.current) {
        doneRef.current = true;
        onCompleteRef.current?.();
      }
      return;
    }

    if (count >= tok.length) {
      if (!doneRef.current) {
        doneRef.current = true;
        onCompleteRef.current?.();
      }
      return;
    }

    const msPer = Math.max(
      14,
      Math.min(42, Math.floor(55_000 / Math.max(tok.length, 1))),
    );

    const handle = window.setTimeout(() => {
      setCount((c) => c + 1);
      onProgressRef.current?.();
    }, msPer);

    return () => window.clearTimeout(handle);
  }, [play, count, fullText]);

  const visibleRaw = play
    ? tokens.slice(0, count).join("")
    : fullText;

  const mdSource =
    play && count < tokens.length
      ? sanitizePartialMarkdown(visibleRaw)
      : visibleRaw;

  return <MarkdownMessage content={mdSource} />;
}
