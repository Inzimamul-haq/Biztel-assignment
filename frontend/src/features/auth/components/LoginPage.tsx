"use client";

import { LoginForm } from "@/features/auth/components/LoginForm";

export function LoginPage() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-slate-950 px-4 py-8">
      <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900/80 p-6 shadow-2xl sm:p-8">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-500 text-lg font-extrabold text-slate-950">
            SF
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Shop-Floor AI Copilot</h1>
            <p className="text-xs text-slate-400">
              Grounded answers from active plant SOPs & manuals
            </p>
          </div>
        </div>

        <LoginForm />
      </div>
    </main>
  );
}

