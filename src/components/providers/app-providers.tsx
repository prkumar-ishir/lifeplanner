"use client";

import { AuthProvider } from "@/contexts/auth-provider";

/**
 * AppProviders composes all client-side context providers.
 * Currently it only wraps Supabase auth but this keeps the tree extensible.
 */
export function AppProviders({ children }: { children: React.ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}
