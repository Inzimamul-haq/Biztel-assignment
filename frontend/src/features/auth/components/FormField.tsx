"use client";

import React, { useState } from "react";
import { IconEye, IconEyeOff } from "@/shared/components/Icons";

interface FormFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  id: string;
}

export function FormField({ label, id, type, ...inputProps }: FormFieldProps) {
  const isPassword = type === "password";
  const [showPassword, setShowPassword] = useState(false);

  const effectiveType = isPassword ? (showPassword ? "text" : "password") : type;

  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-zinc-300">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={effectiveType}
          {...inputProps}
          className={`h-11 w-full rounded-xl border border-white/[0.08] bg-ink-850 px-3.5 text-base text-white placeholder-zinc-600 outline-none transition focus:border-brand-500/70 focus:ring-4 focus:ring-brand-500/15 ${
            isPassword ? "pr-11" : ""
          }`}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            aria-label={showPassword ? "Hide password" : "Show password"}
            tabIndex={-1}
            className="absolute right-2 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 hover:text-zinc-200 transition"
          >
            {showPassword ? <IconEyeOff width={17} height={17} /> : <IconEye width={17} height={17} />}
          </button>
        )}
      </div>
    </div>
  );
}

export function SubmitButton({ busy, label, busyLabel }: { busy: boolean; label: string; busyLabel: string }) {
  return (
    <button
      type="submit"
      disabled={busy}
      className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-500 to-violet-500 text-sm font-semibold text-white shadow-lg shadow-brand-500/20 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {busy && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/80 border-t-transparent" />}
      {busy ? busyLabel : label}
    </button>
  );
}

export function FormError({ message }: { message: string | null }) {
  if (!message) {
    return null;
  }
  return (
    <div role="alert" className="animate-fade-up rounded-xl border border-red-500/25 bg-red-500/[0.07] px-3.5 py-2.5 text-sm text-red-200">
      {message}
    </div>
  );
}
