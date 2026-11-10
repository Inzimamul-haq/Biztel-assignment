"use client";

import React, { useCallback, useRef, useState } from "react";
import { LanguageSelect } from "@/features/voice/components/LanguageSelect";
import { MicButton } from "@/features/voice/components/MicButton";
import { useSpeechRecognition } from "@/features/voice/hooks/useSpeechRecognition";
import { IconSend } from "@/shared/components/Icons";

interface ChatInputProps {
  onSend: (question: string) => void;
  disabled?: boolean;
}

export function ChatInput({ onSend, disabled }: ChatInputProps) {
  const [text, setText] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const handleTranscriptChange = useCallback((transcript: string) => {
    setText(transcript);
  }, []);

  const {
    isSupported,
    isListening,
    language,
    setLanguage,
    error: voiceError,
    toggleListening,
  } = useSpeechRecognition({
    onTranscriptChange: handleTranscriptChange,
  });

  const submitQuestion = () => {
    const trimmed = text.trim();
    if (!trimmed || disabled) {
      return;
    }
    onSend(trimmed);
    setText("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      submitQuestion();
    }
  };

  const handleInput = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(event.target.value);
    const el = event.target;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 180)}px`;
  };

  return (
    <div className="sticky bottom-0 z-20 w-full border-t border-white/[0.06] bg-ink-950/80 p-3 backdrop-blur-xl sm:px-6 sm:py-4">
      <div className="mx-auto max-w-3xl space-y-2">
        {(isListening || voiceError) && (
          <div className="animate-fade-in flex items-center justify-between px-1 text-xs">
            {isListening ? (
              <span className="flex items-center gap-1.5 font-medium text-amber-300">
                <span className="h-2 w-2 animate-ping rounded-full bg-red-500" />
                Listening in {language}... Speak clearly, then tap send or press Enter.
              </span>
            ) : (
              <span className="font-medium text-red-300">{voiceError}</span>
            )}
          </div>
        )}

        <div className="relative flex items-end gap-2 rounded-2xl border border-white/[0.08] bg-ink-850 p-1.5 shadow-2xl shadow-black/40 transition-within focus-within:border-brand-500/60 focus-within:ring-4 focus-within:ring-brand-500/10">
          {isSupported && (
            <div className="flex items-center gap-1.5 pl-1 pb-1">
              <LanguageSelect
                value={language}
                onChange={setLanguage}
                disabled={disabled || isListening}
              />
              <MicButton
                isSupported={isSupported}
                isListening={isListening}
                onToggle={toggleListening}
                disabled={disabled}
              />
            </div>
          )}

          <textarea
            ref={textareaRef}
            rows={1}
            maxLength={500}
            value={text}
            disabled={disabled}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            placeholder="Ask anything about plant procedures or machine maintenance..."
            className="min-h-[44px] max-h-44 flex-1 resize-none bg-transparent px-3 py-2.5 text-base text-white placeholder-zinc-500 outline-none disabled:opacity-40"
          />

          <button
            type="button"
            onClick={submitQuestion}
            disabled={disabled || !text.trim()}
            aria-label="Send message"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-violet-500 text-white shadow-md shadow-brand-500/25 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-30 disabled:shadow-none"
          >
            <IconSend width={16} height={16} />
          </button>
        </div>

        <p className="px-1 text-center text-[11px] text-zinc-500">
          Enter to send · Shift+Enter for new line · Strict citation to active SOPs & manuals
        </p>
      </div>
    </div>
  );
}
