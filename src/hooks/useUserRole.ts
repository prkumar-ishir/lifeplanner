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
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) {
      setRole(null);
      setIsLoading(false);
      return;
    }

    let cancelled = false;

    fetchUserRole(user.id).then((r) => {
      if (!cancelled) {
        setRole(r ?? "employee");
        setIsLoading(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  return {
    role,
    isAdmin: role === "admin",
    isLoading,
  };
}
