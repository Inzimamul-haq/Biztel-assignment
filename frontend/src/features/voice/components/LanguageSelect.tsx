"use client";

import { SUPPORTED_LANGUAGES } from "@/features/voice/constants";
import { VoiceLanguageCode } from "@/features/voice/types";

interface LanguageSelectProps {
  value: VoiceLanguageCode;
  onChange: (lang: VoiceLanguageCode) => void;
  disabled?: boolean;
}

export function LanguageSelect({ value, onChange, disabled }: LanguageSelectProps) {
  return (
    <select
      aria-label="Voice input language"
      value={value}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value as VoiceLanguageCode)}
      className="min-h-[44px] rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-2 text-xs font-semibold text-slate-200 focus:border-amber-400 focus:outline-none disabled:opacity-50"
    >
      {SUPPORTED_LANGUAGES.map((lang) => (
        <option key={lang.code} value={lang.code}>
          {lang.label}
        </option>
      ))}
    </select>
  );
}
