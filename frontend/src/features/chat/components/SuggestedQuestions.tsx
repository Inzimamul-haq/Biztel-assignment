"use client";

import { SUGGESTED_QUESTIONS } from "@/features/chat/data/suggestedQuestions";

interface SuggestedQuestionsProps {
  onSelect: (question: string) => void;
  disabled?: boolean;
}

export function SuggestedQuestions({ onSelect, disabled }: SuggestedQuestionsProps) {
  return (
    <div className="mx-auto my-6 max-w-2xl space-y-4">
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 text-center">
        <h2 className="text-lg font-bold text-white sm:text-xl">
          Ask a Shop-Floor Procedure or Machine Question
        </h2>
        <p className="mt-1 text-sm text-slate-400">
          Answers are strictly grounded in active SOPs and maintenance manuals with page citations.
        </p>
      </div>

      <div className="space-y-2">
        <p className="px-1 text-xs font-bold uppercase tracking-wider text-slate-400">
          Suggested Supervisor Questions
        </p>
        <div className="grid grid-cols-1 gap-2.5">
          {SUGGESTED_QUESTIONS.map((question) => (
            <button
              key={question}
              type="button"
              disabled={disabled}
              onClick={() => onSelect(question)}
              className="min-h-[48px] w-full rounded-xl border border-slate-800 bg-slate-900/90 px-4 py-3 text-left text-sm font-medium text-slate-100 transition hover:border-amber-400 hover:bg-slate-800 disabled:opacity-50 sm:text-base"
            >
              {question}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

