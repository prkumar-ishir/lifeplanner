"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/auth-provider";
import { fetchUserRole } from "@/lib/supabase/repositories";
import type { UserRole } from "@/types/admin";

/**
 * useUserRole fetches and caches the current user's role from Supabase.
 * Returns isAdmin for quick conditional checks throughout the UI.
 */
export function useUserRole() {
  const { user } = useAuth();
  const [role, setRole] = useState<UserRole | null>(null);
  const [loadedUserId, setLoadedUserId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    if (!user?.id) {
      return;
    }

    fetchUserRole(user.id).then((r) => {
      if (!cancelled) {
        setRole(r ?? "employee");
        setLoadedUserId(user.id);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [user]);

  const resolvedRole = user?.id && loadedUserId === user.id ? role : null;
  const isLoading = Boolean(user?.id) && loadedUserId !== user.id;

  return {
    role: resolvedRole,
    isAdmin: resolvedRole === "admin",
    isLoading,
  };
}
