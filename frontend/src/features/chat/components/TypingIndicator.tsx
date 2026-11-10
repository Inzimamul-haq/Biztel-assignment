export function TypingIndicator() {
  return (
    <div className="inline-flex items-center gap-2 rounded-2xl border border-slate-800 bg-slate-900 px-4 py-3 text-sm text-slate-300">
      <span className="h-2.5 w-2.5 animate-bounce rounded-full bg-amber-400" />
      <span className="h-2.5 w-2.5 animate-bounce rounded-full bg-amber-400 [animation-delay:150ms]" />
      <span className="h-2.5 w-2.5 animate-bounce rounded-full bg-amber-400 [animation-delay:300ms]" />
      <span className="ml-1 font-medium">Searching active SOPs & manuals...</span>
    </div>
  );
}

