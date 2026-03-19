"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/auth-provider";
import {
  fetchEngagementMetrics,
  fetchAllReminderConfigs,
  upsertReminderConfig,
  insertAuditLog,
} from "@/lib/supabase/repositories";
import type { EngagementMetric, ReminderConfig, ReminderFrequency } from "@/types/admin";
import ReminderConfigForm from "@/components/admin/reminder-config-form";

export default function RemindersPage() {
  const { user } = useAuth();
  const [employees, setEmployees] = useState<EngagementMetric[]>([]);
  const [configs, setConfigs] = useState<Record<string, ReminderConfig>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;

    Promise.all([fetchEngagementMetrics(), fetchAllReminderConfigs()]).then(
      ([metrics, reminderList]) => {
        setEmployees(metrics);
        const map: Record<string, ReminderConfig> = {};
        for (const c of reminderList) {
          map[c.target_user_id] = c;
        }
        setConfigs(map);
        setLoading(false);
      }
    );
  }, [user?.id]);

  async function handleSave(config: {
    targetUserId: string;
    frequency: ReminderFrequency;
    dayOfWeek: number | null;
    timeOfDay: string;
    active: boolean;
  }) {
    if (!user?.id) return;

    await upsertReminderConfig({
      targetUserId: config.targetUserId,
      configuredBy: user.id,
      frequency: config.frequency,
      dayOfWeek: config.dayOfWeek,
      timeOfDay: config.timeOfDay,
      active: config.active,
    });

    await insertAuditLog({
      actorId: user.id,
      targetUserId: config.targetUserId,
      action: "update_reminder_config",
      resource: "reminder_configs",
      metadata: { frequency: config.frequency },
    });
  }

  if (loading) {
    return (
      <div className="glass-panel flex h-64 items-center justify-center text-sm text-slate-500">
        Loading reminder configurations…
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">
          Reminder Configuration
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Set reminder frequencies for each employee.
        </p>
      </div>

      <div className="space-y-3">
        {employees.map((emp) => {
          const existing = configs[emp.user_id];
          return (
            <ReminderConfigForm
              key={emp.user_id}
              targetUserId={emp.user_id}
              email={emp.email}
              initialFrequency={existing?.frequency}
              initialDayOfWeek={existing?.day_of_week}
              initialTimeOfDay={existing?.time_of_day}
              initialActive={existing?.active}
              onSave={handleSave}
            />
          );
        })}
        {employees.length === 0 && (
          <div className="glass-panel p-8 text-center text-sm text-slate-500">
            No employees found.
          </div>
        )}
      </div>
    </div>
  );
}
