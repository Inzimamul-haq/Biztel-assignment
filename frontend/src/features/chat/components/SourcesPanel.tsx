"use client";

import { useState } from "react";
import { SourceCard } from "@/features/chat/components/SourceCard";
import { SourceRef } from "@/features/chat/types";
import { IconChevron } from "@/shared/components/Icons";

/** Compact numbered source chips (ChatGPT / Perplexity style) that expand into details. */
export function SourcesPanel({ sources }: { sources: SourceRef[] }) {
  const [open, setOpen] = useState(false);

  if (sources.length === 0) {
    return null;
  }

  return (
    <div className="animate-fade-up">
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="mr-1 text-xs font-medium text-zinc-500">Sources</span>
        {sources.map((src, idx) => (
          <button
            key={`${src.document_number}-${src.page_number}-${idx}`}
            type="button"
            onClick={() => setOpen(true)}
            title={`${src.title} · Rev ${src.revision} · Page ${src.page_number}`}
            className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.08] bg-white/[0.03] py-1 pl-1 pr-2.5 text-xs text-zinc-300 transition hover:border-brand-500/40 hover:bg-brand-500/10"
          >
            <span className="flex h-4.5 w-4.5 min-w-[18px] items-center justify-center rounded-full bg-brand-500/20 text-[10px] font-semibold text-brand-400">
              {idx + 1}
            </span>
            <span className="font-mono">{src.document_number}</span>
            <span className="text-zinc-500">p.{src.page_number}</span>
          </button>
        ))}
        <button
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          aria-expanded={open}
          className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs text-zinc-500 transition hover:text-zinc-300"
        >
          {open ? "Hide" : "Details"}
          <IconChevron width={14} height={14} className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
        </button>
      </div>

      <div
        className={`grid transition-all duration-300 ease-out ${open ? "mt-2.5 grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}
      >
        <div className="overflow-hidden">
          <div className="grid gap-2 sm:grid-cols-2">
            {sources.map((src, idx) => (
              <SourceCard key={`${src.document_number}-${src.page_number}-${idx}-card`} source={src} index={idx + 1} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

