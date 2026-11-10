import React from "react";
import { AuthGuard } from "@/features/auth/components/AuthGuard";

export default function ChatLayout({ children }: { children: React.ReactNode }) {
  return <AuthGuard>{children}</AuthGuard>;
}

