"use client";

import { useState } from "react";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { ChatWindow } from "@/features/chat/components/ChatWindow";
import { useChat } from "@/features/chat/hooks/useChat";
import { HistoryDrawer } from "@/features/conversations/components/HistoryDrawer";
import { useConversations } from "@/features/conversations/hooks/useConversations";
import { Header } from "@/shared/components/Header";

export function ChatPage() {
  const { user, logout } = useAuth();
  const {
    messages,
    conversationId,
    isLoading,
    error,
    sendQuestion,
    retryLastQuestion,
    startNewChat,
    hydrateConversation,
  } = useChat();

  const {
    conversations,
    isLoading: historyLoading,
    error: historyError,
    refreshConversations,
    loadMessages,
    removeConversation,
  } = useConversations();

  const [drawerOpen, setDrawerOpen] = useState(false);

  const handleOpenHistory = () => {
    setDrawerOpen(true);
    void refreshConversations();
  };

  const handleSelectConversation = async (selectedId: string) => {
    try {
      const items = await loadMessages(selectedId);
      hydrateConversation(selectedId, items);
      setDrawerOpen(false);
    } catch {
      // Handled by apiClient / error state
    }
  };

  const handleDeleteConversation = async (targetId: string) => {
    try {
      await removeConversation(targetId);
      if (conversationId === targetId) {
        startNewChat();
      }
    } catch {
      // Ignore delete error
    }
  };

  return (
    <div className="flex min-h-dvh flex-col bg-slate-950 text-slate-100">
      <Header
        onNewChat={startNewChat}
        onOpenHistory={handleOpenHistory}
        onLogout={logout}
        userName={user?.full_name || user?.email}
      />

      <ChatWindow
        messages={messages}
        isLoading={isLoading}
        error={error}
        onSend={sendQuestion}
        onRetry={retryLastQuestion}
      />

      <HistoryDrawer
        isOpen={drawerOpen}
        conversations={conversations}
        activeConversationId={conversationId}
        isLoading={historyLoading}
        error={historyError}
        onClose={() => setDrawerOpen(false)}
        onSelectConversation={handleSelectConversation}
        onDeleteConversation={handleDeleteConversation}
      />
    </div>
  );
}
