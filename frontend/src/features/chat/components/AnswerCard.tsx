"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import { SourceCard } from "@/features/chat/components/SourceCard";
import { StatusBadge } from "@/features/chat/components/StatusBadge";
import { WarningCallout } from "@/features/chat/components/WarningCallout";
import { ResponseStatus, SourceRef } from "@/features/chat/types";
import { ReadAloudButton } from "@/features/voice/components/ReadAloudButton";

interface AnswerCardProps {
  status: ResponseStatus;
  answer: string;
  warnings: string[];
  sources: SourceRef[];
  onRetry?: () => void;
}

export function AnswerCard({
  status,
  answer,
  warnings,
  sources,
  onRetry,
}: AnswerCardProps) {
  const [showAllSources, setShowAllSources] = useState(false);
  const visibleSources = showAllSources ? sources : sources.slice(0, 2);
  const hiddenCount = Math.max(0, sources.length - 2);

  return (
    <article className="rounded-2xl border border-slate-800 bg-slate-900/90 p-4 shadow-lg sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <StatusBadge status={status} />
        <ReadAloudButton answer={answer} warnings={warnings} />
      </div>

      <WarningCallout warnings={warnings} />

      <div className="mt-3 space-y-2 text-base leading-relaxed text-slate-100 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:space-y-1.5 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1.5 [&_strong]:font-bold [&_strong]:text-white">
        <ReactMarkdown>{answer}</ReactMarkdown>
      </div>

      {status === "ERROR" && onRetry && (
        <div className="mt-3">
          <button
            type="button"
            onClick={onRetry}
            className="min-h-[44px] rounded-lg bg-red-600 px-4 py-2 text-sm font-bold text-white hover:bg-red-500"
          >
            Retry Question
          </button>
        </div>
      )}

      {sources.length > 0 && status === "ANSWERED" && (
        <div className="mt-4 border-t border-slate-800 pt-3">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Verified Sources ({sources.length})
            </span>
            {sources.length > 2 && (
              <button
                type="button"
                onClick={() => setShowAllSources((prev) => !prev)}
                className="min-h-[36px] text-xs font-semibold text-amber-400 hover:underline"
              >
                {showAllSources ? "Show fewer" : `Show ${hiddenCount} more`}
              </button>
            )}
          </div>
          <div className="space-y-2">
            {visibleSources.map((src, idx) => (
              <SourceCard
                key={`${src.document_number}-${src.revision}-${src.page_number}-${idx}`}
                source={src}
              />
            ))}
          </div>
        </div>
      )}
    </article>
  );
}
