"use client";

import { IconMic, IconStop } from "@/shared/components/Icons";

interface MicButtonProps {
  isSupported: boolean;
  isListening: boolean;
  onToggle: () => void;
  disabled?: boolean;
}

export function MicButton({
  isSupported,
  isListening,
  onToggle,
  disabled,
}: MicButtonProps) {
  if (!isSupported) {
    return null;
  }

  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={disabled}
      aria-label={isListening ? "Stop listening" : "Start voice input"}
      title={isListening ? "Listening... click to stop" : "Speak your question"}
      className={`relative flex h-10 w-10 items-center justify-center rounded-xl transition ${
        isListening
          ? "bg-red-500 text-white shadow-lg shadow-red-500/40 animate-pulse-ring"
          : "border border-white/[0.08] bg-white/[0.03] text-zinc-300 hover:border-brand-500/40 hover:bg-brand-500/10 hover:text-white"
      } disabled:cursor-not-allowed disabled:opacity-40`}
    >
      {isListening ? (
        <IconStop width={16} height={16} />
      ) : (
        <IconMic width={16} height={16} />
      )}
    </button>
  );
}
