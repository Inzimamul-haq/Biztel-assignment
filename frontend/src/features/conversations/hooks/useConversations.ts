"use client";

import { useCallback, useState } from "react";
import {
  deleteConversationApi,
  getConversationMessagesApi,
  listConversationsApi,
} from "@/features/conversations/api/conversationsApi";
import { Conversation, ConversationMessage } from "@/features/conversations/types";
import { ApiClientError } from "@/shared/types/api";

export function useConversations() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshConversations = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const items = await listConversationsApi();
      setConversations(items);
    } catch (err) {
      if (err instanceof ApiClientError) {
        setError(err.message);
      } else {
        setError("Could not load conversation history.");
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadMessages = useCallback(
    async (conversationId: string): Promise<ConversationMessage[]> => {
      return getConversationMessagesApi(conversationId);
    },
    []
  );

  const removeConversation = useCallback(async (conversationId: string) => {
    await deleteConversationApi(conversationId);
    setConversations((prev) => prev.filter((item) => item.id !== conversationId));
  }, []);

  return {
    conversations,
    isLoading,
    error,
    refreshConversations,
    loadMessages,
    removeConversation,
  };
}

