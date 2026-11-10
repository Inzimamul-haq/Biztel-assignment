"use client";

import React, { useCallback, useRef, useState } from "react";
import { LanguageSelect } from "@/features/voice/components/LanguageSelect";
import { MicButton } from "@/features/voice/components/MicButton";
import { useSpeechRecognition } from "@/features/voice/hooks/useSpeechRecognition";

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
    el.style.height = `${Math.min(el.scrollHeight, 140)}px`;
  };

  return (
    <div className="sticky bottom-0 z-20 border-t border-slate-800 bg-slate-950/95 px-3 py-3 backdrop-blur sm:px-5">
      <div className="mx-auto max-w-3xl space-y-2">
        {(isListening || voiceError) && (
          <div className="flex items-center justify-between text-xs">
            {isListening ? (
              <span className="font-semibold text-amber-400">
                ● Listening ({language})... Speak clearly, then tap Send.
              </span>
            ) : (
              <span className="font-medium text-red-300">{voiceError}</span>
            )}
          </div>
        )}

        <div className="flex items-end gap-2">
          {isSupported && (
            <div className="flex items-center gap-1.5">
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
            placeholder="Ask a shop-floor question (or tap Mic)..."
            className="min-h-[44px] max-h-36 flex-1 resize-none rounded-xl border border-slate-700 bg-slate-900 px-3.5 py-2.5 text-base text-white placeholder-slate-400 focus:border-amber-400 focus:outline-none disabled:opacity-50"
          />

          <button
            type="button"
            onClick={submitQuestion}
            disabled={disabled || !text.trim()}
            className="min-h-[44px] min-w-[68px] rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-bold text-slate-950 transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}

