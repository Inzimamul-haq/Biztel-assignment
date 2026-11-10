import { SourceRef } from "@/features/chat/types";
import { IconDoc } from "@/shared/components/Icons";

interface SourceCardProps {
  source: SourceRef;
  index: number;
}

/** Detailed source row shown when the sources panel is expanded. */
export function SourceCard({ source, index }: SourceCardProps) {
  return (
    <div className="flex gap-3 rounded-xl border border-white/[0.06] bg-ink-850 p-3 transition hover:border-white/[0.12]">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-500/15 text-xs font-semibold text-brand-400">
        {index}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5 text-sm font-medium text-white">
          <IconDoc width={14} height={14} className="shrink-0 text-zinc-500" />
          <span className="truncate">{source.title}</span>
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-zinc-400">
          <span className="font-mono text-zinc-300">{source.document_number}</span>
          <span className="text-zinc-600">·</span>
          <span>Rev {source.revision}</span>
          <span className="text-zinc-600">·</span>
          <span className="rounded-md bg-white/[0.06] px-1.5 py-0.5 font-medium text-zinc-200">
            Page {source.page_number}
          </span>
        </div>
        {source.section_title && (
          <p className="mt-1.5 truncate text-xs text-zinc-500">§ {source.section_title}</p>
        )}
      </div>
    </div>
  );
}
