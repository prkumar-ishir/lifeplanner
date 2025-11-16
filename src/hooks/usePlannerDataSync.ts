"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/auth-provider";
import {
  fetchPlannerEntries,
  fetchWeeklyPlans,
} from "@/lib/supabase/repositories";
import { usePlannerStore } from "@/store/plannerStore";

export function usePlannerDataSync() {
  const { user } = useAuth();
  const setEntries = usePlannerStore((state) => state.setEntries);
  const setWeeklyPlans = usePlannerStore((state) => state.setWeeklyPlans);
  const [hasSynced, setHasSynced] = useState(false);

  useEffect(() => {
    if (!user) {
      setEntries({});
      setWeeklyPlans({});
      setHasSynced(false);
      return;
    }

    let isMounted = true;

    async function load() {
      try {
        const [entries, weeklyPlans] = await Promise.all([
          fetchPlannerEntries(user.id),
          fetchWeeklyPlans(user.id),
        ]);
        if (!isMounted) return;
        setEntries(entries);
        setWeeklyPlans(weeklyPlans);
      } catch (error) {
        console.error("Failed to hydrate planner data", error);
      } finally {
        if (isMounted) {
          setHasSynced(true);
        }
      }
    }

    load();

    return () => {
      isMounted = false;
    };
  }, [setEntries, setWeeklyPlans, user]);

  return { isHydrated: hasSynced || !user };
}
