"use client";

import React, { createContext, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { getMeApi, loginApi, signupApi } from "@/features/auth/api/authApi";
import { LoginRequest, SignupRequest, TokenResponse, User } from "@/features/auth/types";
import { getAuthToken, onUnauthorized, setAuthToken } from "@/shared/lib/apiClient";

export interface AuthContextValue {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (payload: LoginRequest) => Promise<void>;
  signup: (payload: SignupRequest) => Promise<void>;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const clearSession = useCallback(() => {
    setAuthToken(null);
    setToken(null);
    setUser(null);
  }, []);

  const logout = useCallback(() => {
    clearSession();
    router.replace("/login");
  }, [clearSession, router]);

  useEffect(() => {
    onUnauthorized(() => {
      setToken(null);
      setUser(null);
      router.replace("/login");
    });
    return () => onUnauthorized(null);
  }, [router]);

  useEffect(() => {
    const existing = getAuthToken();
    if (!existing) {
      setIsLoading(false);
      return;
    }
    setToken(existing);
    getMeApi()
      .then(setUser)
      .catch(clearSession)
      .finally(() => setIsLoading(false));
  }, [clearSession]);

  const startSession = useCallback(
    (response: TokenResponse) => {
      setAuthToken(response.access_token);
      setToken(response.access_token);
      setUser(response.user);
      router.replace("/chat");
    },
    [router]
  );

  const login = useCallback(
    async (payload: LoginRequest) => startSession(await loginApi(payload)),
    [startSession]
  );

  const signup = useCallback(
    async (payload: SignupRequest) => startSession(await signupApi(payload)),
    [startSession]
  );

  const value = useMemo<AuthContextValue>(
    () => ({ user, token, isLoading, login, signup, logout }),
    [user, token, isLoading, login, signup, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
