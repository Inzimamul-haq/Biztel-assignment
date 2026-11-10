"use client";

import { useEffect, useState } from "react";

/** Reveal text progressively, like a streamed response. Disabled for history messages. */
export function useTypewriter(text: string, enabled: boolean, charsPerTick = 4, tickMs = 14) {
  const [count, setCount] = useState<number>(enabled ? 0 : text.length);

  useEffect(() => {
    if (!enabled) {
      setCount(text.length);
      return;
    }
    setCount(0);
    const timer = window.setInterval(() => {
      setCount((prev) => {
        const next = Math.min(text.length, prev + charsPerTick);
        if (next >= text.length) {
          window.clearInterval(timer);
        }
        return next;
      });
    }, tickMs);
    return () => window.clearInterval(timer);
  }, [text, enabled, charsPerTick, tickMs]);

  return { visibleText: text.slice(0, count), isDone: count >= text.length };
}

