import { env } from "@/shared/config/env";
import { ApiClientError, ApiErrorPayload } from "@/shared/types/api";

const TOKEN_STORAGE_KEY = "shopfloor_access_token";

let memoryToken: string | null = null;
let unauthorizedHandler: (() => void) | null = null;

export function setAuthToken(token: string | null): void {
  memoryToken = token;
  if (typeof window === "undefined") {
    return;
  }
  if (token) {
    window.localStorage.setItem(TOKEN_STORAGE_KEY, token);
  } else {
    window.localStorage.removeItem(TOKEN_STORAGE_KEY);
  }
}

export function getAuthToken(): string | null {
  if (memoryToken) {
    return memoryToken;
  }
  if (typeof window !== "undefined") {
    const stored = window.localStorage.getItem(TOKEN_STORAGE_KEY);
    if (stored) {
      memoryToken = stored;
      return stored;
    }
  }
  return null;
}

export function onUnauthorized(handler: (() => void) | null): void {
  unauthorizedHandler = handler;
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getAuthToken();
  const headers = new Headers(options.headers);
  if (!headers.has("Content-Type") && options.body) {
    headers.set("Content-Type", "application/json");
  }
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  let response: Response;
  try {
    response = await fetch(`${env.apiBaseUrl}${path}`, {
      ...options,
      headers,
    });
  } catch {
    throw new ApiClientError(
      "Cannot reach the shop-floor server. Check your network connection.",
      "NETWORK_ERROR",
      0
    );
  }

  if (response.status === 401) {
    setAuthToken(null);
    if (unauthorizedHandler) {
      unauthorizedHandler();
    }
  }

  if (response.status === 204) {
    return undefined as T;
  }

  let data: unknown = null;
  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    const payload = data as Partial<ApiErrorPayload> | null;
    const detail =
      payload && typeof payload.detail === "string"
        ? payload.detail
        : `Request failed with status ${response.status}.`;
    const code =
      payload && typeof payload.code === "string" ? payload.code : "HTTP_ERROR";
    throw new ApiClientError(detail, code, response.status);
  }

  return data as T;
}
