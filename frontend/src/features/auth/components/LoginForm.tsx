"use client";

import React, { useState } from "react";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { ApiClientError } from "@/shared/types/api";

export function LoginForm() {
  const { login } = useAuth();
  const [email, setEmail] = useState("supervisor@shopfloor.local");
  const [password, setPassword] = useState("Shopfloor123");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login({ email: email.trim(), password });
    } catch (err) {
      if (err instanceof ApiClientError) {
        setError(err.message);
      } else {
        setError("Login failed. Please check your credentials and try again.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div
          role="alert"
          className="rounded-lg border border-red-500/60 bg-red-950/60 px-3.5 py-2.5 text-sm font-medium text-red-200"
        >
          {error}
        </div>
      )}

      <div>
        <label
          htmlFor="email"
          className="block text-sm font-semibold text-slate-200"
        >
          Supervisor Email
        </label>
        <input
          id="email"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-1.5 w-full min-h-[44px] rounded-lg border border-slate-700 bg-slate-900 px-3.5 py-2.5 text-base text-white placeholder-slate-500 focus:border-amber-400 focus:outline-none"
          placeholder="supervisor@shopfloor.local"
        />
      </div>

      <div>
        <label
          htmlFor="password"
          className="block text-sm font-semibold text-slate-200"
        >
          Password
        </label>
        <input
          id="password"
          type="password"
          required
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mt-1.5 w-full min-h-[44px] rounded-lg border border-slate-700 bg-slate-900 px-3.5 py-2.5 text-base text-white placeholder-slate-500 focus:border-amber-400 focus:outline-none"
          placeholder="••••••••"
        />
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="w-full min-h-[48px] rounded-lg bg-amber-500 px-4 py-3 text-base font-bold text-slate-950 transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {submitting ? "Signing in..." : "Sign In to Shop-Floor Copilot"}
      </button>

      <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-3 text-xs text-slate-400">
        <span className="font-semibold text-slate-300">Demo Supervisor Account:</span>{" "}
        supervisor@shopfloor.local / Shopfloor123
      </div>
    </form>
  );
}
