"use client";

import { create } from "zustand";
import type { PlannerEntry, WeeklyPlan } from "@/types/planner";

type PlannerState = {
  currentStepIndex: number;
  entries: Record<string, PlannerEntry>;
  weeklyPlans: Record<string, WeeklyPlan>;
  setStepIndex: (index: number) => void;
  saveStepData: (stepId: string, data: PlannerEntry) => void;
  saveWeeklyPlan: (plan: WeeklyPlan) => void;
  setEntries: (entries: Record<string, PlannerEntry>) => void;
  setWeeklyPlans: (plans: Record<string, WeeklyPlan>) => void;
  removeWeeklyPlan: (planId: string) => void;
  resetFlow: () => void;
};

/**
 * usePlannerStore centralizes planner flow + weekly plan data.
 * It powers optimistic UI updates first, while Supabase writes finish in the background.
 */
export const usePlannerStore = create<PlannerState>((set) => ({
  currentStepIndex: 0,
  entries: {},
  weeklyPlans: {},
  setStepIndex: (index) => set({ currentStepIndex: index }),
  saveStepData: (stepId, data) =>
    set((state) => ({
      entries: {
        ...state.entries,
        [stepId]: {
          ...state.entries[stepId],
          ...data,
        },
      },
    })),
  saveWeeklyPlan: (plan) =>
    set((state) => ({
      weeklyPlans: {
        ...state.weeklyPlans,
        [plan.id]: plan,
      },
    })),
  setEntries: (entries) => set({ entries }),
  setWeeklyPlans: (plans) => set({ weeklyPlans: plans }),
  removeWeeklyPlan: (planId) =>
    set((state) => {
      const updated = { ...state.weeklyPlans };
      delete updated[planId];
      return { weeklyPlans: updated };
    }),
  resetFlow: () =>
    set({
      currentStepIndex: 0,
      entries: {},
      weeklyPlans: {},
    }),
}));
