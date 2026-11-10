"use client";

import { useEffect } from "react";
import { IconWarning } from "@/shared/components/Icons";

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "primary";
  onConfirm: () => void;
  onClose: () => void;
}

export function ConfirmModal({
  isOpen,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "danger",
  onConfirm,
  onClose,
}: ConfirmModalProps) {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-modal-title"
        className="animate-fade-up relative z-10 w-full max-w-sm rounded-2xl border border-white/[0.08] bg-ink-900 p-5 shadow-2xl"
      >
        <div className="flex items-start gap-3.5">
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
              variant === "danger"
                ? "border border-red-500/30 bg-red-500/15 text-red-400"
                : "border border-brand-500/30 bg-brand-500/15 text-brand-400"
            }`}
          >
            <IconWarning width={20} height={20} />
          </div>
          <div>
            <h3 id="confirm-modal-title" className="text-base font-semibold text-white">
              {title}
            </h3>
            <p className="mt-1 text-sm text-zinc-400 leading-relaxed">
              {description}
            </p>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="h-10 rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 text-sm font-medium text-zinc-300 hover:bg-white/[0.08] transition"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`h-10 rounded-xl px-4 text-sm font-semibold text-white shadow-md transition ${
              variant === "danger"
                ? "bg-red-500 hover:bg-red-600 shadow-red-500/20"
                : "bg-brand-500 hover:bg-brand-600 shadow-brand-500/20"
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
