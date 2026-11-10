import { ResponseStatus } from "@/features/chat/types";

const BADGES: Record<Exclude<ResponseStatus, "GENERAL">, { label: string; dot: string; text: string }> = {
  ANSWERED: { label: "Answered from documents", dot: "bg-emerald-400", text: "text-emerald-300" },
  NOT_FOUND: { label: "Not found in documents", dot: "bg-zinc-400", text: "text-zinc-400" },
  INSUFFICIENT_EVIDENCE: { label: "Not enough information", dot: "bg-amber-400", text: "text-amber-300" },
  ERROR: { label: "Error", dot: "bg-red-400", text: "text-red-300" },
};

export function StatusBadge({ status }: { status: ResponseStatus }) {
  if (status === "GENERAL") {
    return null;
  }
  const badge = BADGES[status] ?? BADGES.ERROR;
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${badge.text}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${badge.dot}`} />
      {badge.label}
    </span>
  );
}
