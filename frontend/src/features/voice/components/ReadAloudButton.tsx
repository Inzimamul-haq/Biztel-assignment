"use client";

import { useSpeechSynthesis } from "@/features/voice/hooks/useSpeechSynthesis";

interface ReadAloudButtonProps {
  answer: string;
  warnings: string[];
}

export function ReadAloudButton({ answer, warnings }: ReadAloudButtonProps) {
  const { isSupported, isSpeaking, toggleSpeak } = useSpeechSynthesis();

  if (!isSupported) {
    return null;
  }

  return (
    <button
      type="button"
      onClick={() => toggleSpeak(answer, warnings)}
      className={`inline-flex min-h-[44px] items-center gap-2 rounded-lg border px-3.5 py-2 text-xs font-semibold transition ${
        isSpeaking
          ? "border-amber-400 bg-amber-500/20 text-amber-200"
          : "border-slate-700 bg-slate-900/90 text-slate-200 hover:border-slate-500 hover:bg-slate-800"
      }`}
    >
      <span aria-hidden="true">{isSpeaking ? "⏹" : "🔊"}</span>
      <span>{isSpeaking ? "Stop reading" : "Read aloud"}</span>
    </button>
  );
}

