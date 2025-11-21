import type {
  PlannerEntry,
  PlannerEntryPayload,
  WeeklyPlan,
  WeeklyPlanPayload,
  GoalScore,
} from "@/types/planner";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseBrowserClient } from "./client";

// Helper that lazily resolves a Supabase client and skips work when credentials are missing.
async function withClient<T>(callback: (client: SupabaseClient) => Promise<T>) {
  const client = getSupabaseBrowserClient();
  if (!client) {
    return null;
  }

  return callback(client);
}

/**
 * persistPlannerEntry upserts a single step record keyed by user + step id.
 * It returns the Supabase row so callers can inspect generated columns if desired.
 */
export async function persistPlannerEntry(payload: PlannerEntryPayload) {
  if (!payload.userId) {
    console.warn("Missing userId. Planner entry will stay local-only.");
    return null;
  }

  return withClient(async (client) => {
    const { data, error } = await client
      .from("planner_entries")
      .upsert(
        {
          user_id: payload.userId,
          step_id: payload.stepId,
          data: payload.data,
          completed_at: payload.completedAt,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id,step_id" }
      )
      .select()
      .single();

    if (error) {
      throw error;
    }
    return data;
  });
}

/**
 * persistWeeklyPlan stores a weekly rhythm entry by user + plan id (year-month-week).
 */
export async function persistWeeklyPlan(payload: WeeklyPlanPayload) {
  if (!payload.userId) {
    console.warn("Missing userId. Weekly plan will stay local-only.");
    return null;
  }

  return withClient(async (client) => {
    const { data, error } = await client
      .from("weekly_plans")
      .upsert(
        {
          id: payload.id,
          user_id: payload.userId,
          year: payload.year,
          month: payload.month,
          week_of_month: payload.weekOfMonth,
          focus: payload.focus,
          wins: payload.wins,
          schedule_notes: payload.scheduleNotes,
          created_at: payload.createdAt,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id,id" }
      )
      .select()
      .single();

    if (error) {
      throw error;
    }
    return data;
  });
}

type PlannerEntryRow = {
  step_id: string;
  data: PlannerEntry;
};

type WeeklyPlanRow = {
  id: string;
  user_id: string;
  year: number;
  month: number;
  week_of_month: number;
  focus: string;
  wins: string[];
  schedule_notes: string | null;
  created_at: string;
  updated_at: string;
};

/**
 * fetchPlannerEntries returns all planner_entries rows for a user and normalizes them
 * into the in-memory shape used throughout the UI.
 */
export async function fetchPlannerEntries(userId: string) {
  if (!userId) return {};
  const rows =
    (await withClient(async (client) => {
      const { data, error } = await client
        .from("planner_entries")
        .select("step_id,data")
        .eq("user_id", userId);
      if (error) throw error;
      return data as PlannerEntryRow[];
    })) ?? [];

  return rows.reduce<Record<string, PlannerEntry>>((acc, row) => {
    acc[row.step_id] = row.data;
    return acc;
  }, {});
}

/**
 * fetchWeeklyPlans reads every weekly plan row for the user and reshapes column names
 * to the camelCase structure expected by the Zustand store.
 */
export async function fetchWeeklyPlans(userId: string) {
  if (!userId) return {};
  const rows =
    (await withClient(async (client) => {
      const { data, error } = await client
        .from("weekly_plans")
        .select("*")
        .eq("user_id", userId);
      if (error) throw error;
      return data as WeeklyPlanRow[];
    })) ?? [];

  return rows.reduce<Record<string, WeeklyPlan>>((acc, row) => {
    acc[row.id] = {
      id: row.id,
      year: row.year,
      month: row.month,
      weekOfMonth: row.week_of_month,
      focus: row.focus,
      wins: row.wins,
      scheduleNotes: row.schedule_notes ?? "",
      createdAt: row.created_at,
    };
    return acc;
  }, {});
}

export async function deleteWeeklyPlan(userId: string, planId: string) {
  if (!userId) {
    console.warn("Missing userId. Weekly plan delete skipped.");
    return null;
  }
  return withClient(async (client) => {
    const { error } = await client
      .from("weekly_plans")
      .delete()
      .eq("user_id", userId)
      .eq("id", planId);
    if (error) {
      throw error;
    }
    return true;
  });
}
export async function fetchGoalScores(userId: string) {
  if (!userId) return {};
  const rows =
    (await withClient(async (client) => {
      const { data, error } = await client
        .from("goal_scores")
        .select("goal_id,score")
        .eq("user_id", userId);
      if (error) throw error;
      return data as { goal_id: string; score: number }[];
    })) ?? [];

  return rows.reduce<Record<string, number>>((acc, row) => {
    acc[row.goal_id] = row.score;
    return acc;
  }, {});
}

export async function upsertGoalScore(userId: string, goalId: string, score: number) {
  if (!userId) {
    console.warn("Missing userId. Goal score not persisted.");
    return null;
  }
  return withClient(async (client) => {
    const { error } = await client
      .from("goal_scores")
      .upsert(
        { user_id: userId, goal_id: goalId, score },
        { onConflict: "user_id,goal_id" }
      );
    if (error) throw error;
    return true;
  });
}
