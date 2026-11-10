export interface Conversation {
  id: string;
  title: string | null;
  created_at: string;
  updated_at: string;
}

export interface ConversationMessage {
  id: string;
  conversation_id: string;
  role: "USER" | "ASSISTANT";
  content: string;
  response_status: "ANSWERED" | "NOT_FOUND" | "INSUFFICIENT_EVIDENCE" | "ERROR" | "GENERAL" | null;
  warnings: string[];
  sources: Array<{
    document_number: string;
    title: string;
    revision: string;
    page_number: number;
    section_title: string | null;
  }>;
  created_at: string;
}

