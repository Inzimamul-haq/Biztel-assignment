export type VoiceLanguageCode = "en-IN" | "ta-IN" | "hi-IN";

export interface SupportedLanguageOption {
  code: VoiceLanguageCode;
  label: string;
}

export interface SpeechRecognitionEventItem {
  transcript: string;
}

export interface SpeechRecognitionResultItem {
  isFinal: boolean;
  0: SpeechRecognitionEventItem;
  length: number;
}

export interface SpeechRecognitionEventLike extends Event {
  resultIndex: number;
  results: {
    length: number;
    [index: number]: SpeechRecognitionResultItem;
  };
}

export interface SpeechRecognitionErrorEventLike extends Event {
  error: string;
}

export interface SpeechRecognitionInstance {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
}

export type SpeechRecognitionConstructor = new () => SpeechRecognitionInstance;

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  }
}
