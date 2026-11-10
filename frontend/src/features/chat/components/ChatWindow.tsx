"use client";

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
  return (
    <div className="flex flex-1 flex-col overflow-y-auto">
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 sm:px-6">
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

      <ChatInput onSend={onSend} disabled={isLoading} />
    </div>
  );
}
