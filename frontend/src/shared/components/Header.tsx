"use client";

import { IconSidebar } from "@/shared/components/Icons";

interface HeaderProps {
  title: string;
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
}

export function Header({ title, sidebarOpen, onToggleSidebar }: HeaderProps) {
  return (
    <header className="sticky top-0 z-20 flex h-14 items-center gap-2 border-b border-white/[0.06] bg-ink-950/70 px-3 backdrop-blur-xl sm:px-4">
      <button
        type="button"
        onClick={onToggleSidebar}
        aria-label={sidebarOpen ? "Close sidebar" : "Open sidebar"}
        className="flex h-10 w-10 items-center justify-center rounded-lg text-zinc-400 transition hover:bg-white/[0.06] hover:text-white"
      >
        <IconSidebar />
      </button>
      <h1 className="min-w-0 flex-1 truncate text-sm font-medium text-zinc-300">{title}</h1>
      <span className="hidden items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/[0.07] px-2.5 py-1 text-[11px] font-medium text-emerald-300 sm:inline-flex">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
        Active revisions only
      </span>
    </header>
  );
}
