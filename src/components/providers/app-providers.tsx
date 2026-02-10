"use client";

import { AuthProvider } from "@/contexts/auth-provider";
import { RoleProvider } from "@/contexts/role-provider";
import { ThemeProvider } from "@/contexts/theme-provider";

/**
 * AppProviders composes all client-side context providers.
 */
export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <RoleProvider>
        <ThemeProvider>{children}</ThemeProvider>
      </RoleProvider>
    </AuthProvider>
  );
}
