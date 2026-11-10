"use client";

import { AuthLayout } from "@/features/auth/components/AuthLayout";
import { LoginForm } from "@/features/auth/components/LoginForm";

export function LoginPage() {
  return (
    <AuthLayout title="Welcome back" subtitle="Sign in to continue to Shop-Floor Copilot.">
      <LoginForm />
    </AuthLayout>
  );
}
