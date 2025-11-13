"use client";

import { AuthProvider } from "@/contexts/auth-provider";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}
