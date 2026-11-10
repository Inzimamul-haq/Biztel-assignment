"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { VOICE_LANGUAGE_STORAGE_KEY } from "@/features/voice/constants";
import {
  SpeechRecognitionErrorEventLike,
  SpeechRecognitionEventLike,
  SpeechRecognitionInstance,
  VoiceLanguageCode,
} from "@/features/voice/types";

interface UseSpeechRecognitionOptions {
  onTranscriptChange: (text: string) => void;
}

export function useSpeechRecognition({ onTranscriptChange }: UseSpeechRecognitionOptions) {
  const [isSupported, setIsSupported] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [language, setLanguageState] = useState<VoiceLanguageCode>("en-IN");
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const callbackRef = useRef(onTranscriptChange);

  useEffect(() => {
    callbackRef.current = onTranscriptChange;
  }, [onTranscriptChange]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    const storedLang = window.localStorage.getItem(VOICE_LANGUAGE_STORAGE_KEY);
    if (storedLang === "en-IN" || storedLang === "ta-IN" || storedLang === "hi-IN") {
      setLanguageState(storedLang);
    }
    const Ctor = window.SpeechRecognition || window.webkitSpeechRecognition;
    setIsSupported(Boolean(Ctor));
  }, []);

  const setLanguage = useCallback((nextLang: VoiceLanguageCode) => {
    setLanguageState(nextLang);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(VOICE_LANGUAGE_STORAGE_KEY, nextLang);
    }
  }, []);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // Ignore stop errors if already stopped
      }
    }
    setIsListening(false);
  }, []);

  const toggleListening = useCallback(() => {
    if (typeof window === "undefined") {
      return;
    }
    if (isListening) {
      stopListening();
      return;
    }

    const Ctor = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Ctor) {
      setIsSupported(false);
      return;
    }

    setError(null);
    const recognition = new Ctor();
    recognition.lang = language;
    recognition.continuous = false;
    recognition.interimResults = true;

    recognition.onresult = (event: SpeechRecognitionEventLike) => {
      let transcript = "";
      for (let i = 0; i < event.results.length; i += 1) {
        const item = event.results[i];
        if (item && item[0]) {
          transcript += item[0].transcript;
        }
      }
      if (transcript.trim()) {
        callbackRef.current(transcript.trim());
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEventLike) => {
      if (event.error === "not-allowed" || event.error === "service-not-allowed") {
        setError("Microphone permission denied.");
      } else if (event.error === "no-speech") {
        setError("No speech detected. Try speaking closer to the mic.");
      } else {
        setError("Voice recognition stopped.");
      }
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    try {
      recognition.start();
      setIsListening(true);
    } catch {
      setError("Could not start microphone.");
      setIsListening(false);
    }
  }, [isListening, language, stopListening]);

  return {
    isSupported,
    isListening,
    language,
    setLanguage,
    error,
    toggleListening,
  };
}
