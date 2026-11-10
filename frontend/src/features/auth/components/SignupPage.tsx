"use client";

import { AuthLayout } from "@/features/auth/components/AuthLayout";
import { SignupForm } from "@/features/auth/components/SignupForm";

export function SignupPage() {
  return (
    <AuthLayout title="Create your account" subtitle="Get grounded answers from your plant documents.">
      <SignupForm />
    </AuthLayout>
  );
}

