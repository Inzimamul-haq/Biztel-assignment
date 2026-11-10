import { SourceRef } from "@/features/chat/types";

interface SourceCardProps {
  source: SourceRef;
}

export function SourceCard({ source }: SourceCardProps) {
  return (
    <div className="rounded-lg border border-slate-800 bg-slate-950/90 px-3 py-2.5 text-xs text-slate-300">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="font-bold text-amber-300">
          {source.document_number} — {source.title}
        </span>
        <span className="rounded bg-slate-800 px-2 py-0.5 font-mono text-[11px] font-semibold text-slate-200">
          Rev {source.revision} • Page {source.page_number}
        </span>
      </div>
      {source.section_title && (
        <p className="mt-1 text-slate-400">Section: {source.section_title}</p>
      )}
    </div>
  );
}

