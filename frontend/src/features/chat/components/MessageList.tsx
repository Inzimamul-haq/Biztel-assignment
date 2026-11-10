"use client";

import { useEffect, useRef } from "react";
import { AnswerCard } from "@/features/chat/components/AnswerCard";
import { SuggestedQuestions } from "@/features/chat/components/SuggestedQuestions";
import { TypingIndicator } from "@/features/chat/components/TypingIndicator";
import { UserMessage } from "@/features/chat/components/UserMessage";
import { ChatMessageItem } from "@/features/chat/types";

interface MessageListProps {
  messages: ChatMessageItem[];
  isLoading: boolean;
  onSelectSuggestion: (question: string) => void;
  onRetryLastQuestion?: () => void;
}

export function MessageList({
  messages,
  isLoading,
  onSelectSuggestion,
  onRetryLastQuestion,
}: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  if (messages.length === 0 && !isLoading) {
    return <SuggestedQuestions onSelect={onSelectSuggestion} disabled={isLoading} />;
  }

  return (
    <div className="space-y-4 py-4">
      {messages.map((msg) =>
        msg.role === "USER" ? (
          <UserMessage key={msg.id} content={msg.content} />
        ) : (
          <AnswerCard
            key={msg.id}
            status={msg.response_status ?? "ANSWERED"}
            answer={msg.content}
            warnings={msg.warnings ?? []}
            sources={msg.sources ?? []}
            onRetry={msg.response_status === "ERROR" ? onRetryLastQuestion : undefined}
          />
        )
      )}

      {isLoading && <TypingIndicator />}
      <div ref={bottomRef} />
    </div>
  );
}

