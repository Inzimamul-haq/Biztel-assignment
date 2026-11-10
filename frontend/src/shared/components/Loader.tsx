export function Loader({ label = "Loading..." }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-2.5 py-6 text-sm text-slate-300">
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-amber-400 border-t-transparent" />
      <span>{label}</span>
    </div>
  );
}
