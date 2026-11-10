import { apiRequest } from "@/shared/lib/apiClient";
import { LoginRequest, SignupRequest, TokenResponse, User } from "@/features/auth/types";

export async function loginApi(payload: LoginRequest): Promise<TokenResponse> {
  return apiRequest<TokenResponse>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function signupApi(payload: SignupRequest): Promise<TokenResponse> {
  return apiRequest<TokenResponse>("/api/auth/signup", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function getMeApi(): Promise<User> {
  return apiRequest<User>("/api/auth/me", {
    method: "GET",
  });
}

