"use client";

import { useCallback, useEffect, useState } from "react";
import { stripMarkdownForSpeech } from "@/shared/lib/formatters";

export function useSpeechSynthesis() {
  const [isSupported, setIsSupported] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      setIsSupported(true);
    }
    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const toggleSpeak = useCallback((answerMarkdown: string, warnings: string[] = []) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      return;
    }

    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    const plainText = stripMarkdownForSpeech(answerMarkdown, warnings);
    if (!plainText) {
      return;
    }

    const utterance = new SpeechSynthesisUtterance(plainText);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  }, []);

  return {
    isSupported,
    isSpeaking,
    toggleSpeak,
  };
}
