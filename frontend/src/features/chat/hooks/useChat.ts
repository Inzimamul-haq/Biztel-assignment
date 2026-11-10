"use client";

import { useCallback, useState } from "react";
import { sendChatQuestionApi } from "@/features/chat/api/chatApi";
import { ChatMessageItem } from "@/features/chat/types";
import { ConversationMessage } from "@/features/conversations/types";
import { ApiClientError } from "@/shared/types/api";

export function useChat() {
  const [messages, setMessages] = useState<ChatMessageItem[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastQuestion, setLastQuestion] = useState<string | null>(null);

  const sendQuestion = useCallback(
    async (question: string) => {
      const trimmed = question.trim();
      if (!trimmed) {
        return;
      }

      setLastQuestion(trimmed);
      setError(null);

      const optimisticUserMsg: ChatMessageItem = {
        id: `user-${Date.now()}`,
        role: "USER",
        content: trimmed,
      };

      setMessages((prev) => [...prev, optimisticUserMsg]);
      setIsLoading(true);

      try {
        const response = await sendChatQuestionApi({
          question: trimmed,
          conversation_id: conversationId,
        });

        setConversationId(response.conversation_id);
        const assistantMsg: ChatMessageItem = {
          id: response.message_id,
          role: "ASSISTANT",
          content: response.answer,
          response_status: response.response_status,
          warnings: response.warnings,
          sources: response.sources,
        };
        setMessages((prev) => [...prev, assistantMsg]);
      } catch (err) {
        if (err instanceof ApiClientError) {
          setError(err.message);
        } else {
          setError("Could not get a response from the server. Please retry.");
        }
      } finally {
        setIsLoading(false);
      }
    },
    [conversationId]
  );

  const retryLastQuestion = useCallback(async () => {
    if (!lastQuestion || isLoading) {
      return;
    }
    setError(null);
    setIsLoading(true);
    try {
      const response = await sendChatQuestionApi({
        question: lastQuestion,
        conversation_id: conversationId,
      });
      setConversationId(response.conversation_id);
      const assistantMsg: ChatMessageItem = {
        id: response.message_id,
        role: "ASSISTANT",
        content: response.answer,
        response_status: response.response_status,
        warnings: response.warnings,
        sources: response.sources,
      };
      setMessages((prev) => {
        const filtered = prev.filter(
          (item, index) => !(index === prev.length - 1 && item.response_status === "ERROR")
        );
        return [...filtered, assistantMsg];
      });
    } catch (err) {
      if (err instanceof ApiClientError) {
        setError(err.message);
      } else {
        setError("Retry failed. Please check your connection.");
      }
    } finally {
      setIsLoading(false);
    }
  }, [lastQuestion, isLoading, conversationId]);

  const startNewChat = useCallback(() => {
    setConversationId(null);
    setMessages([]);
    setError(null);
    setLastQuestion(null);
  }, []);

  const hydrateConversation = useCallback(
    (selectedId: string, historyMessages: ConversationMessage[]) => {
      setConversationId(selectedId);
      setError(null);
      setMessages(
        historyMessages.map((msg) => ({
          id: msg.id,
          role: msg.role,
          content: msg.content,
          response_status: msg.response_status ?? undefined,
          warnings: msg.warnings ?? [],
          sources: msg.sources ?? [],
        }))
      );
    },
    []
  );

  return {
    messages,
    conversationId,
    isLoading,
    error,
    sendQuestion,
    retryLastQuestion,
    startNewChat,
    hydrateConversation,
  };
}
