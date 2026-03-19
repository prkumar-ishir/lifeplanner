import type {
  PlannerEntry,
  PlannerEntryPayload,
  WeeklyPlan,
  WeeklyPlanData,
  WeeklyPlanPayload,
} from "@/types/planner";
import type {
  AuditAction,
  AuditLogRow,
  ConsentRecord,
  ConsentType,
  DataExportRow,
  EngagementMetric,
  MotivationalQuote,
  QuotePlacement,
  ReminderConfig,
  UserRole,
} from "@/types/admin";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseBrowserClient } from "./client";

const WEEKLY_PLAN_DATA_MARKER = "\n\n[[LP_WEEKLY_DATA]]";

function encodeWeeklyScheduleNotes(
  scheduleNotes: string,
  data: WeeklyPlanData
) {
  return `${scheduleNotes}${WEEKLY_PLAN_DATA_MARKER}${encodeURIComponent(
    JSON.stringify(data)
  )}`;
}

function decodeWeeklyScheduleNotes(scheduleNotes: string | null) {
  const raw = scheduleNotes ?? "";
  const markerIndex = raw.indexOf(WEEKLY_PLAN_DATA_MARKER);
  if (markerIndex === -1) {
    return {
      scheduleNotes: raw,
      data: {} as WeeklyPlanData,
    };
  }

  const visible = raw.slice(0, markerIndex).trimEnd();
  const encoded = raw.slice(markerIndex + WEEKLY_PLAN_DATA_MARKER.length);

  try {
    return {
      scheduleNotes: visible,
      data: JSON.parse(decodeURIComponent(encoded)) as WeeklyPlanData,
    };
  } catch {
    return {
      scheduleNotes: visible,
      data: {} as WeeklyPlanData,
    };
  }
}

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
    const baseRow = {
      id: payload.id,
      user_id: payload.userId,
      year: payload.year,
      month: payload.month,
      week_of_month: payload.weekOfMonth,
      focus: payload.focus,
      wins: payload.wins,
      schedule_notes: encodeWeeklyScheduleNotes(payload.scheduleNotes, payload.data),
      created_at: payload.createdAt,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await client
      .from("weekly_plans")
      .upsert(
        {
          ...baseRow,
          data: payload.data,
        },
        { onConflict: "user_id,id" }
      )
      .select()
      .single();

    if (error && error.message?.includes("data")) {
      const fallback = await client
        .from("weekly_plans")
        .upsert(baseRow, { onConflict: "user_id,id" })
        .select()
        .single();
      if (fallback.error) {
        throw fallback.error;
      }
      return fallback.data;
    }

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
  data: WeeklyPlanData | null;
  created_at: string;
  updated_at: string;
};

type MotivationalQuoteRow = {
  id: string;
  quote_text: string;
  author: string | null;
  placements: string[] | null;
  active: boolean;
  created_by: string | null;
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
      const query = client
        .from("planner_entries")
        .select("step_id,data")
        .eq("user_id", userId);
      // Try soft-delete filter; fall back gracefully if column doesn't exist yet
      const { data, error } = await query.is("deleted_at", null);
      if (error && error.message?.includes("deleted_at")) {
        const fallback = await client
          .from("planner_entries")
          .select("step_id,data")
          .eq("user_id", userId);
        if (fallback.error) throw fallback.error;
        return fallback.data as PlannerEntryRow[];
      }
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
        .eq("user_id", userId)
        .is("deleted_at", null);
      if (error && error.message?.includes("deleted_at")) {
        const fallback = await client
          .from("weekly_plans")
          .select("*")
          .eq("user_id", userId);
        if (fallback.error) throw fallback.error;
        return fallback.data as WeeklyPlanRow[];
      }
      if (error) throw error;
      return data as WeeklyPlanRow[];
    })) ?? [];

  return rows.reduce<Record<string, WeeklyPlan>>((acc, row) => {
    const decoded = decodeWeeklyScheduleNotes(row.schedule_notes);
    acc[row.id] = {
      id: row.id,
      year: row.year,
      month: row.month,
      weekOfMonth: row.week_of_month,
      startDate: (row.data ?? decoded.data).start_date ?? "",
      focus: row.focus,
      wins: row.wins,
      scheduleNotes: decoded.scheduleNotes,
      data: row.data ?? decoded.data,
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
        .eq("user_id", userId)
        .is("deleted_at", null);
      if (error && error.message?.includes("deleted_at")) {
        const fallback = await client
          .from("goal_scores")
          .select("goal_id,score")
          .eq("user_id", userId);
        if (fallback.error) throw fallback.error;
        return fallback.data as { goal_id: string; score: number }[];
      }
      if (error) throw error;
      return data as { goal_id: string; score: number }[];
    })) ?? [];

  return rows.reduce<Record<string, number>>((acc, row) => {
    acc[row.goal_id] = row.score;
    return acc;
  }, {});
}

export async function fetchUserTheme(userId: string): Promise<string | null> {
  if (!userId) return null;
  return withClient(async (client) => {
    const { data, error } = await client
      .from("user_preferences")
      .select("theme")
      .eq("user_id", userId)
      .single();
    if (error) {
      // No row yet — not an error, just no preference saved
      if (error.code === "PGRST116") return null;
      throw error;
    }
    return (data?.theme as string) ?? null;
  });
}

export async function upsertUserTheme(userId: string, theme: string) {
  if (!userId) return null;
  return withClient(async (client) => {
    const { error } = await client
      .from("user_preferences")
      .upsert(
        { user_id: userId, theme, updated_at: new Date().toISOString() },
        { onConflict: "user_id" }
      );
    if (error) throw error;
    return true;
  });
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

// ─── RBAC ────────────────────────────────────────────────────

export async function fetchUserRole(userId: string): Promise<UserRole | null> {
  if (!userId) return null;
  return withClient(async (client) => {
    const { data, error } = await client
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .single();
    if (error) {
      if (error.code === "PGRST116") return null;
      throw error;
    }
    return (data?.role as UserRole) ?? null;
  });
}

export async function upsertUserRole(
  userId: string,
  role: UserRole,
  assignedBy: string
) {
  if (!userId) return null;
  return withClient(async (client) => {
    const { error } = await client
      .from("user_roles")
      .upsert(
        { user_id: userId, role, assigned_by: assignedBy },
        { onConflict: "user_id" }
      );
    if (error) throw error;
    return true;
  });
}

// ─── Audit Logs ──────────────────────────────────────────────

export async function insertAuditLog(entry: {
  actorId: string;
  targetUserId?: string;
  action: AuditAction;
  resource?: string;
  metadata?: Record<string, unknown>;
}) {
  if (!entry.actorId) return null;
  return withClient(async (client) => {
    const { error } = await client.from("audit_logs").insert({
      actor_id: entry.actorId,
      target_user_id: entry.targetUserId ?? null,
      action: entry.action,
      resource: entry.resource ?? null,
      metadata: entry.metadata ?? {},
    });
    if (error) throw error;
    return true;
  });
}

export async function fetchAuditLogs(filters?: {
  actorId?: string;
  targetUserId?: string;
  action?: string;
  limit?: number;
  offset?: number;
}): Promise<AuditLogRow[]> {
  return (
    (await withClient(async (client) => {
      let query = client
        .from("audit_logs")
        .select("*")
        .order("created_at", { ascending: false });

      if (filters?.actorId) query = query.eq("actor_id", filters.actorId);
      if (filters?.targetUserId)
        query = query.eq("target_user_id", filters.targetUserId);
      if (filters?.action) query = query.eq("action", filters.action);
      if (filters?.limit) query = query.limit(filters.limit);
      if (filters?.offset) query = query.range(filters.offset, filters.offset + (filters.limit ?? 50) - 1);

      const { data, error } = await query;
      if (error) throw error;
      return data as AuditLogRow[];
    })) ?? []
  );
}

// ─── Consent Records ─────────────────────────────────────────

export async function fetchUserConsent(userId: string): Promise<ConsentRecord[]> {
  if (!userId) return [];
  return (
    (await withClient(async (client) => {
      const { data, error } = await client
        .from("consent_records")
        .select("*")
        .eq("user_id", userId);
      if (error) throw error;
      return data as ConsentRecord[];
    })) ?? []
  );
}

export async function fetchAllConsentRecords(): Promise<ConsentRecord[]> {
  return (
    (await withClient(async (client) => {
      const { data, error } = await client
        .from("consent_records")
        .select("*");
      if (error) throw error;
      return data as ConsentRecord[];
    })) ?? []
  );
}

export async function upsertConsent(
  userId: string,
  consentType: ConsentType,
  granted: boolean
) {
  if (!userId) return null;
  return withClient(async (client) => {
    const now = new Date().toISOString();
    const { error } = await client.from("consent_records").upsert(
      {
        user_id: userId,
        consent_type: consentType,
        granted,
        granted_at: granted ? now : null,
        revoked_at: granted ? null : now,
        updated_at: now,
      },
      { onConflict: "user_id,consent_type" }
    );
    if (error) throw error;
    return true;
  });
}

// ─── Reminder Configs ────────────────────────────────────────

export async function fetchReminderConfig(
  targetUserId: string
): Promise<ReminderConfig | null> {
  if (!targetUserId) return null;
  return withClient(async (client) => {
    const { data, error } = await client
      .from("reminder_configs")
      .select("*")
      .eq("target_user_id", targetUserId)
      .single();
    if (error) {
      if (error.code === "PGRST116") return null;
      throw error;
    }
    return data as ReminderConfig;
  });
}

export async function upsertReminderConfig(config: {
  targetUserId: string;
  configuredBy: string;
  frequency: string;
  dayOfWeek?: number | null;
  timeOfDay?: string;
  active?: boolean;
}) {
  if (!config.targetUserId) return null;
  return withClient(async (client) => {
    const { error } = await client.from("reminder_configs").upsert(
      {
        target_user_id: config.targetUserId,
        configured_by: config.configuredBy,
        frequency: config.frequency,
        day_of_week: config.dayOfWeek ?? null,
        time_of_day: config.timeOfDay ?? "09:00",
        active: config.active ?? true,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "target_user_id" }
    );
    if (error) throw error;
    return true;
  });
}

export async function fetchAllReminderConfigs(): Promise<ReminderConfig[]> {
  return (
    (await withClient(async (client) => {
      const { data, error } = await client
        .from("reminder_configs")
        .select("*");
      if (error) throw error;
      return data as ReminderConfig[];
    })) ?? []
  );
}

// ─── Motivational Quotes ─────────────────────────────────────

export async function fetchMotivationalQuotes(filters?: {
  placement?: QuotePlacement;
  includeInactive?: boolean;
}): Promise<MotivationalQuote[]> {
  return (
    (await withClient(async (client) => {
      let query = client
        .from("motivational_quotes")
        .select("*")
        .order("created_at", { ascending: true });

      if (!filters?.includeInactive) {
        query = query.eq("active", true);
      }

      if (filters?.placement) {
        query = query.contains("placements", [filters.placement]);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data as MotivationalQuoteRow[]).map((row) => ({
        ...row,
        placements: (row.placements ?? []) as QuotePlacement[],
      }));
    })) ?? []
  );
}

export async function insertMotivationalQuote(params: {
  quoteText: string;
  author?: string | null;
  placements: QuotePlacement[];
  active?: boolean;
  createdBy?: string | null;
}) {
  return withClient(async (client) => {
    const { data, error } = await client
      .from("motivational_quotes")
      .insert({
        quote_text: params.quoteText,
        author: params.author?.trim() || null,
        placements: params.placements,
        active: params.active ?? true,
        created_by: params.createdBy ?? null,
      })
      .select()
      .single();
    if (error) throw error;
    return data as MotivationalQuoteRow;
  });
}

export async function updateMotivationalQuote(params: {
  quoteId: string;
  quoteText: string;
  author?: string | null;
  placements: QuotePlacement[];
  active: boolean;
}) {
  return withClient(async (client) => {
    const { data, error } = await client
      .from("motivational_quotes")
      .update({
        quote_text: params.quoteText,
        author: params.author?.trim() || null,
        placements: params.placements,
        active: params.active,
        updated_at: new Date().toISOString(),
      })
      .eq("id", params.quoteId)
      .select()
      .single();
    if (error) throw error;
    return data as MotivationalQuoteRow;
  });
}

export async function deleteMotivationalQuote(quoteId: string) {
  return withClient(async (client) => {
    const { error } = await client
      .from("motivational_quotes")
      .delete()
      .eq("id", quoteId);
    if (error) throw error;
    return true;
  });
}

// ─── Engagement Metrics (Admin) ──────────────────────────────

export async function fetchEngagementMetrics(): Promise<EngagementMetric[]> {
  return (
    (await withClient(async (client) => {
      const { data, error } = await client.rpc("get_engagement_metrics");
      if (error) throw error;
      return data as EngagementMetric[];
    })) ?? []
  );
}

// ─── Data Exports ────────────────────────────────────────────

export async function insertDataExport(params: {
  userId: string;
  requestedBy: string;
  exportType?: string;
}): Promise<DataExportRow | null> {
  if (!params.userId) return null;
  return withClient(async (client) => {
    const { data, error } = await client
      .from("data_exports")
      .insert({
        user_id: params.userId,
        requested_by: params.requestedBy,
        export_type: params.exportType ?? "pdf",
        status: "completed",
        completed_at: new Date().toISOString(),
      })
      .select()
      .single();
    if (error) throw error;
    return data as DataExportRow;
  });
}

export async function fetchDataExports(userId: string): Promise<DataExportRow[]> {
  if (!userId) return [];
  return (
    (await withClient(async (client) => {
      const { data, error } = await client
        .from("data_exports")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as DataExportRow[];
    })) ?? []
  );
}

// ─── Soft-Delete & Restore ───────────────────────────────────

export async function softDeleteUserData(userId: string) {
  if (!userId) return null;
  const now = new Date().toISOString();
  return withClient(async (client) => {
    const results = await Promise.all([
      client
        .from("planner_entries")
        .update({ deleted_at: now })
        .eq("user_id", userId)
        .is("deleted_at", null),
      client
        .from("weekly_plans")
        .update({ deleted_at: now })
        .eq("user_id", userId)
        .is("deleted_at", null),
      client
        .from("goal_scores")
        .update({ deleted_at: now })
        .eq("user_id", userId)
        .is("deleted_at", null),
    ]);
    for (const { error } of results) {
      if (error) throw error;
    }
    return true;
  });
}

export async function hardDeleteUserData(userId: string) {
  if (!userId) return null;
  return withClient(async (client) => {
    const results = await Promise.all([
      client.from("planner_entries").delete().eq("user_id", userId),
      client.from("weekly_plans").delete().eq("user_id", userId),
      client.from("goal_scores").delete().eq("user_id", userId),
      client.from("consent_records").delete().eq("user_id", userId),
    ]);
    for (const { error } of results) {
      if (error) throw error;
    }
    return true;
  });
}

export async function restoreUserData(userId: string) {
  if (!userId) return null;
  return withClient(async (client) => {
    const results = await Promise.all([
      client
        .from("planner_entries")
        .update({ deleted_at: null })
        .eq("user_id", userId)
        .not("deleted_at", "is", null),
      client
        .from("weekly_plans")
        .update({ deleted_at: null })
        .eq("user_id", userId)
        .not("deleted_at", "is", null),
      client
        .from("goal_scores")
        .update({ deleted_at: null })
        .eq("user_id", userId)
        .not("deleted_at", "is", null),
    ]);
    for (const { error } of results) {
      if (error) throw error;
    }
    return true;
  });
}

// ─── Full User Data Export ───────────────────────────────────

export async function fetchAllUserDataForExport(userId: string) {
  if (!userId)
    return { entries: {}, weeklyPlans: {}, goalScores: {} };

  const [entries, weeklyPlans, goalScores] = await Promise.all([
    fetchPlannerEntries(userId),
    fetchWeeklyPlans(userId),
    fetchGoalScores(userId),
  ]);

  return { entries, weeklyPlans, goalScores };
}
