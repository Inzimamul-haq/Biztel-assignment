"use client";

interface ErrorCardProps {
  message: string;
  onRetry?: () => void;
}

export function ErrorCard({ message, onRetry }: ErrorCardProps) {
  return (
    <div
      role="alert"
      className="rounded-xl border border-red-500/50 bg-red-950/50 p-4 text-red-100"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-bold text-red-300">Connection or Service Error</p>
          <p className="mt-1 text-sm text-red-100">{message}</p>
        </div>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="min-h-[44px] shrink-0 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-500"
          >
            Retry
          </button>
        )}
      </div>
    </div>
  );
}

