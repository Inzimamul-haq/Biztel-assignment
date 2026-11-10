"use client";

import Link from "next/link";
import React, { useState } from "react";
import { FormError, FormField, SubmitButton } from "@/features/auth/components/FormField";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { ApiClientError } from "@/shared/types/api";

const DEMO_EMAIL = "supervisor@shopfloor.local";
const DEMO_PASSWORD = "Shopfloor123";

export function LoginForm() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login({ email: email.trim(), password });
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Sign in failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <FormError message={error} />
      <FormField
        id="email"
        label="Email"
        type="email"
        required
        autoComplete="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@company.com"
      />
      <FormField
        id="password"
        label="Password"
        type="password"
        required
        autoComplete="current-password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Enter your password"
      />
      <SubmitButton busy={submitting} label="Sign in" busyLabel="Signing in..." />

      <button
        type="button"
        onClick={() => {
          setEmail(DEMO_EMAIL);
          setPassword(DEMO_PASSWORD);
        }}
        className="h-10 w-full rounded-xl border border-white/[0.08] text-sm text-zinc-300 transition hover:bg-white/[0.04]"
      >
        Use demo supervisor account
      </button>

      <p className="pt-2 text-center text-sm text-zinc-500">
        New here?{" "}
        <Link href="/signup" className="font-medium text-brand-400 hover:text-brand-400/80">
          Create an account
        </Link>
      </p>
    </form>
  );
}
