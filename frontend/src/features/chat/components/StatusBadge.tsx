import { ResponseStatus } from "@/features/chat/types";

interface StatusBadgeProps {
  status: ResponseStatus;
}

const BADGE_STYLES: Record<ResponseStatus, { label: string; className: string }> = {
  ANSWERED: {
    label: "Answered",
    className: "border-emerald-500/40 bg-emerald-950/70 text-emerald-300",
  },
  NOT_FOUND: {
    label: "Not found in documents",
    className: "border-slate-600/60 bg-slate-800/80 text-slate-300",
  },
  INSUFFICIENT_EVIDENCE: {
    label: "Not enough information",
    className: "border-amber-500/50 bg-amber-950/70 text-amber-300",
  },
  ERROR: {
    label: "Error",
    className: "border-red-500/50 bg-red-950/70 text-red-300",
  },
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const config = BADGE_STYLES[status] ?? BADGE_STYLES.ERROR;
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-bold tracking-wide ${config.className}`}
    >
      {config.label}
    </span>
  );
}

