"use client";

import { SUGGESTED_QUESTIONS } from "@/features/chat/data/suggestedQuestions";

interface SuggestedQuestionsProps {
  onSelect: (question: string) => void;
  disabled?: boolean;
  userName?: string | null;
}

export function SuggestedQuestions({ onSelect, disabled, userName }: SuggestedQuestionsProps) {
  const firstName = userName ? userName.split(/[\s@]/)[0] : null;

  return (
    <div className="animate-fade-up mx-auto flex min-h-[60vh] max-w-2xl flex-col justify-center py-10">
      <div className="mb-8 text-center">
        <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-400 to-violet-500 text-sm font-bold text-white shadow-xl shadow-brand-500/25">
          SF
        </div>
        <h2 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
          {firstName ? `How can I help, ${firstName}?` : "How can I help today?"}
        </h2>
        <p className="mt-2 text-sm text-zinc-500">
          Answers come only from active plant documents, with page citations.
        </p>
      </div>

      <div className="grid gap-2.5 sm:grid-cols-2">
        {SUGGESTED_QUESTIONS.map((question, idx) => (
          <button
            key={question}
            type="button"
            disabled={disabled}
            onClick={() => onSelect(question)}
            style={{ animationDelay: `${idx * 60}ms` }}
            className="animate-fade-up min-h-[56px] rounded-xl border border-white/[0.07] bg-white/[0.02] px-4 py-3 text-left text-sm leading-snug text-zinc-300 transition hover:-translate-y-0.5 hover:border-brand-500/40 hover:bg-brand-500/[0.06] hover:text-white disabled:opacity-50"
          >
            {question}
          </button>
        ))}
      </div>
    </div>
  );
}
