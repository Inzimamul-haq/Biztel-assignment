"use client";

import { useEffect, useState } from "react";

const STEPS = [
  "Understanding your question",
  "Searching active SOPs and manuals",
  "Checking the evidence",
  "Writing a grounded answer",
];

/** Animated "thinking" state that mirrors the real backend pipeline steps. */
export function TypingIndicator() {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setStep((prev) => Math.min(prev + 1, STEPS.length - 1));
    }, 1100);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <div className="animate-fade-up flex gap-3" aria-live="polite">
      <div className="relative mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-brand-400 to-violet-500 text-[11px] font-bold text-white">
        SF
        <span className="absolute -inset-1 animate-ping rounded-xl border border-brand-400/30" />
      </div>
      <div className="flex-1 space-y-2.5 pt-1">
        <p key={step} className="shimmer-text animate-fade-in text-sm font-medium">
          {STEPS[step]}...
        </p>
        <div className="flex gap-1.5">
          {STEPS.map((label, idx) => (
            <span
              key={label}
              className={`h-1 w-8 rounded-full transition-colors duration-500 ${idx <= step ? "bg-brand-500" : "bg-white/[0.08]"}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
