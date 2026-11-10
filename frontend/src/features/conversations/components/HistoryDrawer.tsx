"use client";

import { useState } from "react";
import { Conversation } from "@/features/conversations/types";
import { ConfirmModal } from "@/shared/components/ConfirmModal";
import {
  IconChat,
  IconClose,
  IconLogout,
  IconPlus,
  IconTrash,
} from "@/shared/components/Icons";
import { Loader } from "@/shared/components/Loader";
import { Logo } from "@/shared/components/Logo";
import { formatRelativeDate } from "@/shared/lib/formatters";

interface HistoryDrawerProps {
  isOpen: boolean;
  conversations: Conversation[];
  activeConversationId: string | null;
  isLoading: boolean;
  error: string | null;
  userName?: string | null;
  onClose: () => void;
  onNewChat: () => void;
  onLogout: () => void;
  onSelectConversation: (conversationId: string) => void;
  onDeleteConversation: (conversationId: string) => void;
}

export function HistoryDrawer({
  isOpen,
  conversations,
  activeConversationId,
  isLoading,
  error,
  userName,
  onClose,
  onNewChat,
  onLogout,
  onSelectConversation,
  onDeleteConversation,
}: HistoryDrawerProps) {
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const targetConversation = conversations.find((c) => c.id === deleteTargetId);

  return (
    <>
      {/* Backdrop overlay */}
      <div
        className={`fixed inset-0 z-30 bg-black/60 backdrop-blur-sm transition-opacity duration-300 md:hidden ${
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modern Sidebar with smooth width/slide animation */}
      <aside
        aria-label="Chat sidebar"
        className={`fixed top-0 bottom-0 left-0 z-40 flex w-72 flex-col border-r border-white/[0.06] bg-ink-900/95 shadow-2xl backdrop-blur-xl transition-all duration-300 ease-out md:static md:z-0 md:shadow-none ${
          isOpen
            ? "translate-x-0 md:w-72"
            : "-translate-x-full md:w-0 md:-translate-x-0 md:border-r-0 md:overflow-hidden"
        }`}
      >
        <div className="flex h-14 items-center justify-between border-b border-white/[0.06] px-4">
          <Logo size="sm" />
          <button
            type="button"
            onClick={onClose}
            aria-label="Close sidebar"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 hover:bg-white/[0.06] hover:text-white md:hidden"
          >
            <IconClose width={16} height={16} />
          </button>
        </div>

        <div className="p-3">
          <button
            type="button"
            onClick={() => {
              onNewChat();
              if (window.innerWidth < 768) onClose();
            }}
            className="flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-500/90 to-violet-500/90 text-sm font-semibold text-white shadow-md shadow-brand-500/20 transition hover:brightness-110"
          >
            <IconPlus width={16} height={16} />
            <span>New Chat</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-2 py-1 space-y-1">
          <p className="px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
            Recent Conversations
          </p>

          {isLoading && <Loader label="Loading conversations..." />}

          {error && (
            <p className="rounded-lg border border-red-500/30 bg-red-500/10 p-2.5 text-xs text-red-200">
              {error}
            </p>
          )}

          {!isLoading && !error && conversations.length === 0 && (
            <div className="py-10 text-center">
              <IconChat className="mx-auto text-zinc-600" width={24} height={24} />
              <p className="mt-2 text-xs text-zinc-500">No previous chats</p>
            </div>
          )}

          {conversations.map((item) => {
            const isActive = item.id === activeConversationId;
            return (
              <div
                key={item.id}
                className={`group flex items-center gap-1.5 rounded-xl px-2.5 py-2 text-xs transition ${
                  isActive
                    ? "bg-brand-500/15 text-white"
                    : "text-zinc-400 hover:bg-white/[0.04] hover:text-zinc-200"
                }`}
              >
                <button
                  type="button"
                  onClick={() => {
                    onSelectConversation(item.id);
                    if (window.innerWidth < 768) onClose();
                  }}
                  className="flex min-w-0 flex-1 flex-col text-left"
                >
                  <span className="truncate font-medium">
                    {item.title || "Untitled Conversation"}
                  </span>
                  <span className="text-[10px] text-zinc-500">
                    {formatRelativeDate(item.updated_at)}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setDeleteTargetId(item.id);
                  }}
                  title="Delete chat"
                  aria-label="Delete chat"
                  className="opacity-0 group-hover:opacity-100 flex h-7 w-7 items-center justify-center rounded-md text-zinc-500 hover:bg-red-500/20 hover:text-red-400 transition"
                >
                  <IconTrash width={13} height={13} />
                </button>
              </div>
            );
          })}
        </div>

        {/* User bar at bottom */}
        <div className="border-t border-white/[0.06] p-3">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-zinc-200">
                {userName || "Supervisor"}
              </p>
              <p className="text-[10px] text-zinc-500">Shop-Floor Operations</p>
            </div>
            <button
              type="button"
              onClick={() => setShowLogoutConfirm(true)}
              title="Sign out"
              aria-label="Sign out"
              className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 transition hover:bg-red-500/15 hover:text-red-400"
            >
              <IconLogout width={15} height={15} />
            </button>
          </div>
        </div>
      </aside>

      {/* Confirmation Dialog for Delete Conversation */}
      <ConfirmModal
        isOpen={Boolean(deleteTargetId)}
        title="Delete Conversation?"
        description={`Are you sure you want to delete "${targetConversation?.title || "this conversation"}"? All messages in this chat will be removed.`}
        confirmLabel="Delete"
        variant="danger"
        onConfirm={() => {
          if (deleteTargetId) {
            onDeleteConversation(deleteTargetId);
            setDeleteTargetId(null);
          }
        }}
        onClose={() => setDeleteTargetId(null)}
      />

      {/* Confirmation Dialog for Logout */}
      <ConfirmModal
        isOpen={showLogoutConfirm}
        title="Sign Out?"
        description="Are you sure you want to log out of Shop-Floor Copilot? You will need to sign in again to access your chat history."
        confirmLabel="Sign out"
        variant="danger"
        onConfirm={() => {
          setShowLogoutConfirm(false);
          onLogout();
        }}
        onClose={() => setShowLogoutConfirm(false)}
      />
    </>
  );
}
