import type {
  PlannerEntry,
  PlannerEntryPayload,
  WeeklyPlan,
  WeeklyPlanPayload,
} from "@/types/planner";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseBrowserClient } from "./client";

async function withClient<T>(callback: (client: SupabaseClient) => Promise<T>) {
  const client = getSupabaseBrowserClient();
  if (!client) {
    return null;
  }

  return callback(client);
}

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
