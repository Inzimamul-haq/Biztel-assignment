"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { ChatWindow } from "@/features/chat/components/ChatWindow";
import { useChat } from "@/features/chat/hooks/useChat";
import { HistoryDrawer } from "@/features/conversations/components/HistoryDrawer";
import { useConversations } from "@/features/conversations/hooks/useConversations";
import { Header } from "@/shared/components/Header";

export function ChatPage() {
  const { user, logout } = useAuth();

  const {
    conversations,
    isLoading: historyLoading,
    error: historyError,
    refreshConversations,
    loadMessages,
    removeConversation,
  } = useConversations();

  // Immediately refresh conversation history when a question succeeds so new chat id reflects in sidebar
  const handleQuestionSuccess = useCallback(() => {
    void refreshConversations();
  }, [refreshConversations]);

  const {
    messages,
    conversationId,
    isLoading,
    error,
    sendQuestion,
    retryLastQuestion,
    startNewChat,
    hydrateConversation,
  } = useChat({ onQuestionSuccess: handleQuestionSuccess });

  // Desktop defaults open, mobile defaults closed
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    void refreshConversations();
  }, [refreshConversations]);

  useEffect(() => {
    if (typeof window !== "undefined" && window.innerWidth < 768) {
      setSidebarOpen(false);
    }
  }, []);

  const handleSelectConversation = async (selectedId: string) => {
    try {
      const items = await loadMessages(selectedId);
      hydrateConversation(selectedId, items);
    } catch {
      // Error handled by apiClient
    }
  };

  const handleDeleteConversation = async (targetId: string) => {
    try {
      await removeConversation(targetId);
      if (conversationId === targetId) {
        startNewChat();
      }
    } catch {
      // Ignore delete failure
    }
  };

  const activeTitle =
    conversations.find((c) => c.id === conversationId)?.title ||
    "Shop-Floor Copilot";

  return (
    <div className="flex h-dvh overflow-hidden bg-ink-950 text-zinc-100">
      <HistoryDrawer
        isOpen={sidebarOpen}
        conversations={conversations}
        activeConversationId={conversationId}
        isLoading={historyLoading}
        error={historyError}
        userName={user?.full_name || user?.email}
        onClose={() => setSidebarOpen(false)}
        onNewChat={startNewChat}
        onLogout={logout}
        onSelectConversation={handleSelectConversation}
        onDeleteConversation={handleDeleteConversation}
      />

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <Header
          title={activeTitle}
          sidebarOpen={sidebarOpen}
          onToggleSidebar={() => setSidebarOpen((prev) => !prev)}
        />

        <ChatWindow
          messages={messages}
          isLoading={isLoading}
          error={error}
          userName={user?.full_name || user?.email}
          onSend={sendQuestion}
          onRetry={retryLastQuestion}
        />
      </div>
    </div>
  );
}
