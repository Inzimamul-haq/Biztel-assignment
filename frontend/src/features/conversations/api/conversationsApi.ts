import { apiRequest } from "@/shared/lib/apiClient";
import { Conversation, ConversationMessage } from "@/features/conversations/types";

export async function listConversationsApi(): Promise<Conversation[]> {
  return apiRequest<Conversation[]>("/api/conversations", {
    method: "GET",
  });
}

export async function getConversationMessagesApi(
  conversationId: string
): Promise<ConversationMessage[]> {
  return apiRequest<ConversationMessage[]>(
    `/api/conversations/${conversationId}/messages`,
    {
      method: "GET",
    }
  );
}

export async function deleteConversationApi(conversationId: string): Promise<void> {
  return apiRequest<void>(`/api/conversations/${conversationId}`, {
    method: "DELETE",
  });
}

