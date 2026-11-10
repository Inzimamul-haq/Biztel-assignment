"use client";

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
      aria-label={isListening ? "Stop voice input" : "Start voice input"}
      title={isListening ? "Listening... Tap to stop" : "Tap to speak"}
      className={`flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg border px-3 py-2 text-xs font-bold transition ${
        isListening
          ? "animate-pulse border-red-400 bg-red-600 text-white"
          : "border-slate-700 bg-slate-900 text-slate-200 hover:border-amber-400 hover:bg-slate-800"
      } disabled:cursor-not-allowed disabled:opacity-50`}
    >
      {isListening ? "Listening..." : "Mic"}
    </button>
  );
}

