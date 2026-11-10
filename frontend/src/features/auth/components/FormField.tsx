import React from "react";

interface FormFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  id: string;
}

export function FormField({ label, id, ...inputProps }: FormFieldProps) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-zinc-300">
        {label}
      </label>
      <input
        id={id}
        {...inputProps}
        className="h-11 w-full rounded-xl border border-white/[0.08] bg-ink-850 px-3.5 text-base text-white placeholder-zinc-600 outline-none transition focus:border-brand-500/70 focus:ring-4 focus:ring-brand-500/15"
      />
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

