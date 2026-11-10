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
  userName?: string | null;
  onSelectSuggestion: (question: string) => void;
  onRetryLastQuestion?: () => void;
}

export function MessageList({ messages, isLoading, userName, onSelectSuggestion, onRetryLastQuestion }: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, isLoading]);

  if (messages.length === 0 && !isLoading) {
    return <SuggestedQuestions onSelect={onSelectSuggestion} disabled={isLoading} userName={userName} />;
  }

  return (
    <div className="space-y-7 py-8">
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
            animate={Boolean(msg.isNew)}
            onRetry={msg.response_status === "ERROR" ? onRetryLastQuestion : undefined}
          />
        )
      )}
      {isLoading && <TypingIndicator />}
      <div ref={bottomRef} className="h-2" />
    </div>
  );
}
