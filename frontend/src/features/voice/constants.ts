import { SupportedLanguageOption } from "@/features/voice/types";

export const VOICE_LANGUAGE_STORAGE_KEY = "shopfloor_voice_language";

export const SUPPORTED_LANGUAGES: SupportedLanguageOption[] = [
  { code: "en-IN", label: "EN (India)" },
  { code: "ta-IN", label: "தமிழ் (TA)" },
  { code: "hi-IN", label: "हिन्दी (HI)" },
];
