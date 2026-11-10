"use client";

import { useEffect, useRef } from "react";
import { ChatInput } from "@/features/chat/components/ChatInput";
import { MessageList } from "@/features/chat/components/MessageList";
import { ChatMessageItem } from "@/features/chat/types";
import { ErrorCard } from "@/shared/components/ErrorCard";

interface ChatWindowProps {
  messages: ChatMessageItem[];
  isLoading: boolean;
  error: string | null;
  userName?: string | null;
  onSend: (question: string) => void;
  onRetry: () => void;
}

export function ChatWindow({
  messages,
  isLoading,
  error,
  userName,
  onSend,
  onRetry,
}: ChatWindowProps) {
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const contentWrapperRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    // Smooth scroll down when a message is added or loading starts
    container.scrollTo({
      top: container.scrollHeight,
      behavior: "smooth",
    });

    const content = contentWrapperRef.current;
    if (!content) return;

    // Follow the text downwards as it generates/expands in height
    const observer = new ResizeObserver(() => {
      const distanceToBottom =
        container.scrollHeight - container.scrollTop - container.clientHeight;
      if (distanceToBottom < 300 || isLoading) {
        container.scrollTop = container.scrollHeight;
      }
    });

    observer.observe(content);
    return () => observer.disconnect();
  }, [messages, isLoading]);

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden">
      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto">
        <main ref={contentWrapperRef} className="mx-auto w-full max-w-3xl px-4 sm:px-6">
          <MessageList
            messages={messages}
            isLoading={isLoading}
            userName={userName}
            onSelectSuggestion={onSend}
            onRetryLastQuestion={onRetry}
          />
          {error && (
            <div className="my-4">
              <ErrorCard message={error} onRetry={onRetry} />
            </div>
          )}
        </main>
      </div>

      <div className="shrink-0">
        <ChatInput onSend={onSend} disabled={isLoading} />
      </div>
    </div>
  );
}
