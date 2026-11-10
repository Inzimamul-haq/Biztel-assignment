import { IconWarning } from "@/shared/components/Icons";

export function WarningCallout({ warnings }: { warnings: string[] }) {
  if (!warnings || warnings.length === 0) {
    return null;
  }

  return (
    <div
      role="note"
      aria-label="Safety warnings"
      className="animate-fade-up overflow-hidden rounded-xl border border-amber-500/30 bg-amber-500/[0.07]"
    >
      <div className="flex items-center gap-2 border-b border-amber-500/20 bg-amber-500/[0.08] px-3.5 py-2 text-xs font-semibold uppercase tracking-wider text-amber-300">
        <IconWarning width={15} height={15} />
        Safety warning
      </div>
      <ul className="space-y-1.5 px-3.5 py-3 text-[15px] leading-relaxed text-amber-50">
        {warnings.map((warning, idx) => (
          <li key={`${idx}-${warning.slice(0, 24)}`} className="flex gap-2">
            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400" />
            <span>{warning}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
