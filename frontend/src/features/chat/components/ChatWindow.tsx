"use client";

import { ChatInput } from "@/features/chat/components/ChatInput";
import { MessageList } from "@/features/chat/components/MessageList";
import { ChatMessageItem } from "@/features/chat/types";
import { ErrorCard } from "@/shared/components/ErrorCard";

interface ChatWindowProps {
  messages: ChatMessageItem[];
  isLoading: boolean;
  error: string | null;
  onSend: (question: string) => void;
  onRetry: () => void;
}

export function ChatWindow({
  messages,
  isLoading,
  error,
  onSend,
  onRetry,
}: ChatWindowProps) {
  return (
    <div className="flex flex-1 flex-col">
      <main className="mx-auto w-full max-w-3xl flex-1 px-3 sm:px-5">
        <MessageList
          messages={messages}
          isLoading={isLoading}
          onSelectSuggestion={onSend}
          onRetryLastQuestion={onRetry}
        />
        {error && (
          <div className="my-3">
            <ErrorCard message={error} onRetry={onRetry} />
          </div>
        )}
      </main>

      <ChatInput onSend={onSend} disabled={isLoading} />
    </div>
  );
}

