/**
 * Types for RBAC, audit logging, consent, reminders, and admin engagement metrics.
 */

export type UserRole = "employee" | "admin";

export type UserRoleRow = {
  id: string;
  user_id: string;
  role: UserRole;
  assigned_by: string | null;
  created_at: string;
};

export type AuditAction =
  | "login"
  | "export_pdf"
  | "admin_export_pdf"
  | "admin_view_metrics"
  | "admin_view_audit"
  | "update_reminder_config"
  | "consent_granted"
  | "consent_revoked"
  | "soft_delete_initiated"
  | "data_restored";

export type AuditLogRow = {
  id: string;
  actor_id: string;
  target_user_id: string | null;
  action: string;
  resource: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
};

export type ConsentType = "data_collection" | "data_retention" | "data_export";

export type ConsentRecord = {
  id: string;
  user_id: string;
  consent_type: ConsentType;
  granted: boolean;
  granted_at: string | null;
  revoked_at: string | null;
  created_at: string;
  updated_at: string;
};

export type ReminderFrequency =
  | "daily"
  | "weekly"
  | "biweekly"
  | "monthly"
  | "none";

export type ReminderConfig = {
  id: string;
  target_user_id: string;
  configured_by: string;
  frequency: ReminderFrequency;
  day_of_week: number | null;
  time_of_day: string;
  active: boolean;
  created_at: string;
  updated_at: string;
};

export type EngagementMetric = {
  user_id: string;
  email: string;
  steps_completed: number;
  weekly_plan_count: number;
  goal_score_count: number;
  last_entry_at: string | null;
  last_weekly_plan_at: string | null;
};

export type DataExportRow = {
  id: string;
  user_id: string;
  requested_by: string;
  status: "pending" | "processing" | "completed" | "failed";
  export_type: string;
  created_at: string;
  completed_at: string | null;
};
