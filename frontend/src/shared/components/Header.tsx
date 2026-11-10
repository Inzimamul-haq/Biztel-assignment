"use client";

interface HeaderProps {
  onNewChat: () => void;
  onOpenHistory: () => void;
  onLogout: () => void;
  userName?: string | null;
}

export function Header({
  onNewChat,
  onOpenHistory,
  onLogout,
  userName,
}: HeaderProps) {
  return (
    <header className="sticky top-0 z-20 flex items-center justify-between border-b border-slate-800 bg-slate-950/95 px-3 py-2.5 backdrop-blur sm:px-5">
      <div className="flex items-center gap-2.5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500 font-bold text-slate-950">
          SF
        </div>
        <div>
          <h1 className="text-sm font-bold tracking-tight text-white sm:text-base">
            Shop-Floor Copilot
          </h1>
          <p className="text-xs text-slate-400">
            {userName ? `Supervisor: ${userName}` : "Verified SOP & Manual Assistant"}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1.5 sm:gap-2">
        <button
          type="button"
          onClick={onNewChat}
          className="min-h-[44px] rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-semibold text-slate-100 transition hover:border-amber-400 hover:bg-slate-800 sm:text-sm"
        >
          + New chat
        </button>
        <button
          type="button"
          onClick={onOpenHistory}
          className="min-h-[44px] rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-semibold text-slate-100 transition hover:border-slate-500 hover:bg-slate-800 sm:text-sm"
        >
          History
        </button>
        <button
          type="button"
          onClick={onLogout}
          className="min-h-[44px] rounded-lg border border-red-900/60 bg-red-950/40 px-3 py-2 text-xs font-semibold text-red-200 transition hover:bg-red-900/50 sm:text-sm"
        >
          Logout
        </button>
      </div>
    </header>
  );
}

