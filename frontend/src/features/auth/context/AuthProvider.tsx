"use client";

import React, { createContext, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { getMeApi, loginApi } from "@/features/auth/api/authApi";
import { LoginRequest, User } from "@/features/auth/types";
import { getAuthToken, onUnauthorized, setAuthToken } from "@/shared/lib/apiClient";

export interface AuthContextValue {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (payload: LoginRequest) => Promise<void>;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const logout = useCallback(() => {
    setAuthToken(null);
    setToken(null);
    setUser(null);
    router.replace("/login");
  }, [router]);

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
      .then((profile) => {
        setUser(profile);
      })
      .catch(() => {
        setAuthToken(null);
        setToken(null);
        setUser(null);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  const login = useCallback(
    async (payload: LoginRequest) => {
      const response = await loginApi(payload);
      setAuthToken(response.access_token);
      setToken(response.access_token);
      setUser(response.user);
      router.replace("/chat");
    },
    [router]
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      isLoading,
      login,
      logout,
    }),
    [user, token, isLoading, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
