export function Loader({ label = "Loading..." }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-2.5 py-6 text-sm text-zinc-400">
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-brand-400 border-t-transparent" />
      <span>{label}</span>
    </div>
  );
}
