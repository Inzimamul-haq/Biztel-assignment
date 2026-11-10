export type ResponseStatus =
  | "ANSWERED"
  | "NOT_FOUND"
  | "INSUFFICIENT_EVIDENCE"
  | "ERROR";

export interface SourceRef {
  document_number: string;
  title: string;
  revision: string;
  page_number: number;
  section_title: string | null;
}

export interface ChatRequest {
  question: string;
  conversation_id?: string | null;
}

export interface ChatResponse {
  conversation_id: string;
  message_id: string;
  response_status: ResponseStatus;
  answer: string;
  warnings: string[];
  sources: SourceRef[];
}

export interface ChatMessageItem {
  id: string;
  role: "USER" | "ASSISTANT";
  content: string;
  response_status?: ResponseStatus;
  warnings?: string[];
  sources?: SourceRef[];
}
