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
    <div className="relative">
      <select
        aria-label="Speech recognition language"
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value as VoiceLanguageCode)}
        className="h-10 cursor-pointer appearance-none rounded-xl border border-white/[0.08] bg-white/[0.03] pl-2.5 pr-6 text-xs font-medium text-zinc-300 outline-none transition hover:border-white/[0.16] hover:bg-white/[0.06] focus:border-brand-500/60 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {SUPPORTED_LANGUAGES.map((lang) => (
          <option key={lang.code} value={lang.code} className="bg-ink-900 text-zinc-100">
            {lang.label}
          </option>
        ))}
      </select>
      <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-zinc-500">
        ▼
      </span>
    </div>
  );
}
