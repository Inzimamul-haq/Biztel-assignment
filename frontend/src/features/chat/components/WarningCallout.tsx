interface WarningCalloutProps {
  warnings: string[];
}

export function WarningCallout({ warnings }: WarningCalloutProps) {
  if (!warnings || warnings.length === 0) {
    return null;
  }

  return (
    <div
      role="region"
      aria-label="Critical Safety Warnings"
      className="my-3 rounded-xl border-2 border-amber-400 bg-amber-950/70 p-3.5 text-amber-100 shadow-md"
    >
      <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-amber-300">
        <span aria-hidden="true" className="text-base">
          ⚠️
        </span>
        <span>Safety Warning / Critical Instruction</span>
      </div>
      <ul className="mt-2 space-y-1.5 text-sm font-medium text-amber-50">
        {warnings.map((warning, idx) => (
          <li key={`${idx}-${warning.slice(0, 20)}`} className="leading-snug">
            • {warning}
          </li>
        ))}
      </ul>
    </div>
  );
}
