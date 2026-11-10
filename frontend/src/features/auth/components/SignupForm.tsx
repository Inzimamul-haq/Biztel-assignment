"use client";

import Link from "next/link";
import React, { useState } from "react";
import { FormError, FormField, SubmitButton } from "@/features/auth/components/FormField";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { ApiClientError } from "@/shared/types/api";

function validatePassword(password: string): string | null {
  if (password.length < 8) {
    return "Password must be at least 8 characters.";
  }
  if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) {
    return "Password must contain at least one letter and one number.";
  }
  return null;
}

export function SignupForm() {
  const { signup } = useAuth();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const passwordError = validatePassword(password);
    if (passwordError) {
      setError(passwordError);
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await signup({ email: email.trim(), password, full_name: fullName.trim() || undefined });
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Could not create your account.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <FormError message={error} />
      <FormField
        id="fullName"
        label="Full name"
        autoComplete="name"
        maxLength={120}
        value={fullName}
        onChange={(e) => setFullName(e.target.value)}
        placeholder="Ravi Kumar"
      />
      <FormField
        id="email"
        label="Work email"
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
        minLength={8}
        maxLength={72}
        autoComplete="new-password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="At least 8 characters, letters and numbers"
      />
      <FormField
        id="confirm"
        label="Confirm password"
        type="password"
        required
        autoComplete="new-password"
        value={confirm}
        onChange={(e) => setConfirm(e.target.value)}
        placeholder="Re-enter password"
      />
      <SubmitButton busy={submitting} label="Create account" busyLabel="Creating account..." />
      <p className="pt-2 text-center text-sm text-zinc-500">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-brand-400 hover:text-brand-400/80">
          Sign in
        </Link>
      </p>
    </form>
  );
}

