export interface ApiErrorPayload {
  detail: string;
  code: string;
}

export class ApiClientError extends Error {
  public readonly status: number;
  public readonly code: string;

  constructor(detail: string, code: string, status: number) {
    super(detail);
    this.name = "ApiClientError";
    this.code = code;
    this.status = status;
  }
}

