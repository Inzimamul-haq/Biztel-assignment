"use client";

import { useSpeechSynthesis } from "@/features/voice/hooks/useSpeechSynthesis";
import { IconSpeaker, IconStop } from "@/shared/components/Icons";

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
      aria-label={isSpeaking ? "Stop reading" : "Read answer aloud"}
      title={isSpeaking ? "Stop reading aloud" : "Read answer aloud"}
      className={`inline-flex h-9 items-center gap-1.5 rounded-lg px-2.5 text-xs font-medium transition ${
        isSpeaking
          ? "border border-amber-500/40 bg-amber-500/15 text-amber-300"
          : "text-zinc-400 hover:bg-white/[0.06] hover:text-zinc-200"
      }`}
    >
      {isSpeaking ? (
        <>
          <IconStop width={14} height={14} className="animate-pulse text-amber-400" />
          <span>Stop reading</span>
        </>
      ) : (
        <>
          <IconSpeaker width={14} height={14} />
          <span>Read aloud</span>
        </>
      )}
    </button>
  );
}
