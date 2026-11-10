"use client";

import { Conversation } from "@/features/conversations/types";
import { Loader } from "@/shared/components/Loader";
import { formatRelativeDate } from "@/shared/lib/formatters";

interface HistoryDrawerProps {
  isOpen: boolean;
  conversations: Conversation[];
  activeConversationId: string | null;
  isLoading: boolean;
  error: string | null;
  onClose: () => void;
  onSelectConversation: (conversationId: string) => void;
  onDeleteConversation: (conversationId: string) => void;
}

export function HistoryDrawer({
  isOpen,
  conversations,
  activeConversationId,
  isLoading,
  error,
  onClose,
  onSelectConversation,
  onDeleteConversation,
}: HistoryDrawerProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-40 flex">
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-xs"
        onClick={onClose}
        aria-hidden="true"
      />
      <aside className="relative z-50 flex h-full w-80 max-w-[85vw] flex-col border-r border-slate-800 bg-slate-950 p-4 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h2 className="text-base font-bold text-white">Conversation History</h2>
          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] min-w-[44px] rounded-lg border border-slate-700 bg-slate-900 px-3 text-xs font-semibold text-slate-200 hover:bg-slate-800"
          >
            Close
          </button>
        </div>

        <div className="mt-3 flex-1 overflow-y-auto space-y-2">
          {isLoading && <Loader label="Loading history..." />}
          {error && (
            <p className="rounded-lg border border-red-500/40 bg-red-950/40 p-3 text-xs text-red-200">
              {error}
            </p>
          )}
          {!isLoading && !error && conversations.length === 0 && (
            <p className="py-8 text-center text-sm text-slate-400">
              No previous questions yet.
            </p>
          )}

          {conversations.map((item) => {
            const isActive = item.id === activeConversationId;
            return (
              <div
                key={item.id}
                className={`flex items-center justify-between gap-2 rounded-xl border p-2.5 transition ${
                  isActive
                    ? "border-amber-400 bg-amber-500/10"
                    : "border-slate-800 bg-slate-900/70 hover:border-slate-700"
                }`}
              >
                <button
                  type="button"
                  onClick={() => onSelectConversation(item.id)}
                  className="min-h-[44px] flex-1 text-left"
                >
                  <p className="line-clamp-2 text-sm font-semibold text-slate-100">
                    {item.title || "Untitled conversation"}
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    {formatRelativeDate(item.updated_at)}
                  </p>
                </button>
                <button
                  type="button"
                  onClick={() => onDeleteConversation(item.id)}
                  aria-label="Delete conversation"
                  className="min-h-[44px] min-w-[44px] shrink-0 rounded-lg border border-slate-800 px-2.5 text-xs text-slate-400 hover:border-red-500/50 hover:text-red-300"
                >
                  Del
                </button>
              </div>
            );
          })}
        </div>
      </aside>
    </div>
  );
}

