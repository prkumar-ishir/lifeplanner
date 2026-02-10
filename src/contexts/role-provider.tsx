"use client";

import { createContext, useContext, useMemo } from "react";
import { useUserRole } from "@/hooks/useUserRole";
import type { UserRole } from "@/types/admin";

type RoleContextValue = {
  role: UserRole | null;
  isAdmin: boolean;
  isLoading: boolean;
};

const RoleContext = createContext<RoleContextValue | undefined>(undefined);

/**
 * RoleProvider makes the current user's role available throughout the React tree
 * so components like AppShell and SidebarNav can conditionally render admin features.
 */
export function RoleProvider({ children }: { children: React.ReactNode }) {
  const { role, isAdmin, isLoading } = useUserRole();

  const value = useMemo<RoleContextValue>(
    () => ({ role, isAdmin, isLoading }),
    [role, isAdmin, isLoading]
  );

  return <RoleContext.Provider value={value}>{children}</RoleContext.Provider>;
}

export function useRole() {
  const context = useContext(RoleContext);
  if (!context) {
    throw new Error("useRole must be used within RoleProvider");
  }
  return context;
}
