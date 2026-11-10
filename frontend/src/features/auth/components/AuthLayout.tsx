"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { IconCheck, IconDoc, IconShield, IconWarning } from "@/shared/components/Icons";
import { Logo } from "@/shared/components/Logo";

const FEATURES = [
  { icon: IconDoc, text: "Answers only from active SOPs and machine manuals" },
  { icon: IconCheck, text: "Every answer cites document, revision and page" },
  { icon: IconWarning, text: "Safety warnings are preserved and highlighted" },
  { icon: IconShield, text: "Superseded revisions are never used" },
];

interface AuthLayoutProps {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}

export function AuthLayout({ title, subtitle, children }: AuthLayoutProps) {
  const { token, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && token) {
      router.replace("/chat");
    }
  }, [isLoading, token, router]);

  return (
    <main className="grid min-h-dvh lg:grid-cols-[1.1fr_1fr]">
      <section className="relative hidden overflow-hidden border-r border-white/[0.06] bg-ink-900 p-12 lg:flex lg:flex-col lg:justify-between">
        <div className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-brand-500/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-40 right-0 h-96 w-96 rounded-full bg-violet-500/10 blur-3xl" />
        <Logo />
        <div className="relative max-w-md">
          <h2 className="text-3xl font-semibold leading-tight tracking-tight text-white">
            Reliable answers for the shop floor, in seconds.
          </h2>
          <p className="mt-3 text-zinc-400">
            Ask by typing or voice. Get short, grounded procedures straight from your plant documents.
          </p>
          <ul className="mt-8 space-y-3.5">
            {FEATURES.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3 text-sm text-zinc-300">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.03] text-brand-400">
                  <Icon width={16} height={16} />
                </span>
                {text}
              </li>
            ))}
          </ul>
        </div>
        <p className="relative text-xs text-zinc-600">SAF-SOP-003 · QC-SOP-014 · MNT-MAN-CNC-02</p>
      </section>

      <section className="flex items-center justify-center px-5 py-10">
        <div className="animate-fade-up w-full max-w-sm">
          <div className="mb-8 lg:hidden">
            <Logo />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-white">{title}</h1>
          <p className="mt-1.5 text-sm text-zinc-400">{subtitle}</p>
          <div className="mt-8">{children}</div>
        </div>
      </section>
    </main>
  );
}

