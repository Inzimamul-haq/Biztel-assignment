"use client";

import { IconRetry, IconWarning } from "@/shared/components/Icons";

interface ErrorCardProps {
  message: string;
  onRetry?: () => void;
}

export function ErrorCard({ message, onRetry }: ErrorCardProps) {
  return (
    <div
      role="alert"
      className="animate-fade-up flex items-start gap-3 rounded-2xl border border-red-500/25 bg-red-500/[0.06] p-4"
    >
      <IconWarning className="mt-0.5 shrink-0 text-red-400" />
      <div className="flex-1">
        <p className="text-sm font-medium text-red-200">Something went wrong</p>
        <p className="mt-0.5 text-sm text-red-200/70">{message}</p>
      </div>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex min-h-[40px] shrink-0 items-center gap-1.5 rounded-lg bg-red-500/90 px-3.5 text-sm font-medium text-white transition hover:bg-red-500"
        >
          <IconRetry width={15} height={15} />
          Retry
        </button>
      )}
    </div>
  );
}
