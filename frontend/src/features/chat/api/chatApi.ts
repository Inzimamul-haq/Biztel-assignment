import { apiRequest } from "@/shared/lib/apiClient";
import { ChatRequest, ChatResponse } from "@/features/chat/types";

export async function sendChatQuestionApi(payload: ChatRequest): Promise<ChatResponse> {
  return apiRequest<ChatResponse>("/api/chat", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

