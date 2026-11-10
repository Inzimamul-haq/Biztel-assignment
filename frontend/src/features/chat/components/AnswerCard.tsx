"use client";

import ReactMarkdown from "react-markdown";
import { SourcesPanel } from "@/features/chat/components/SourcesPanel";
import { StatusBadge } from "@/features/chat/components/StatusBadge";
import { WarningCallout } from "@/features/chat/components/WarningCallout";
import { useTypewriter } from "@/features/chat/hooks/useTypewriter";
import { ResponseStatus, SourceRef } from "@/features/chat/types";
import { ReadAloudButton } from "@/features/voice/components/ReadAloudButton";
import { IconRetry } from "@/shared/components/Icons";

interface AnswerCardProps {
  status: ResponseStatus;
  answer: string;
  warnings: string[];
  sources: SourceRef[];
  animate?: boolean;
  onRetry?: () => void;
}

export function AnswerCard({ status, answer, warnings, sources, animate = false, onRetry }: AnswerCardProps) {
  const { visibleText, isDone } = useTypewriter(answer, animate);
  const muted = status === "NOT_FOUND" || status === "INSUFFICIENT_EVIDENCE";

  return (
    <article className="animate-fade-up flex gap-3">
      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-brand-400 to-violet-500 text-[11px] font-bold text-white">
        SF
      </div>

      <div className="min-w-0 flex-1 space-y-3">
        <StatusBadge status={status} />

        {/* Safety warnings come first so they are never missed. */}
        {isDone && <WarningCallout warnings={warnings} />}

        <div className={`prose-answer text-[15px] leading-7 ${muted ? "text-zinc-400" : "text-zinc-200"}`}>
          <ReactMarkdown>{visibleText}</ReactMarkdown>
          {!isDone && <span className="ml-0.5 inline-block h-4 w-[2px] translate-y-0.5 animate-blink bg-brand-400" />}
        </div>

        {isDone && status === "ANSWERED" && <SourcesPanel sources={sources} />}

        {isDone && (
          <div className="animate-fade-in flex items-center gap-1">
            <ReadAloudButton answer={answer} warnings={warnings} />
            {status === "ERROR" && onRetry && (
              <button
                type="button"
                onClick={onRetry}
                className="inline-flex h-9 items-center gap-1.5 rounded-lg px-2.5 text-xs font-medium text-red-300 transition hover:bg-red-500/10"
              >
                <IconRetry width={15} height={15} />
                Retry
              </button>
            )}
          </div>
        )}
      </div>
    </article>
  );
}
