"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/contexts/auth-provider";
import {
  fetchEngagementMetrics,
  insertAuditLog,
  fetchAllUserDataForExport,
  insertDataExport,
  fetchAllConsentRecords,
} from "@/lib/supabase/repositories";
import { generateLifePlanPdf } from "@/lib/pdf/generate-life-plan-pdf";
import { plannerFlow } from "@/data/plannerFlow";
import type { ConsentType, EngagementMetric } from "@/types/admin";
import MetricCard from "@/components/admin/metric-card";
import EmployeeTable from "@/components/admin/employee-table";

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState<EngagementMetric[]>([]);
  const [consentMap, setConsentMap] = useState<
    Record<string, Partial<Record<ConsentType, boolean>>>
  >({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;

    insertAuditLog({ actorId: user.id, action: "admin_view_metrics" });

    Promise.all([fetchEngagementMetrics(), fetchAllConsentRecords()])
      .then(([metricRows, consentRows]) => {
        setMetrics(metricRows);
        const nextConsentMap: Record<
          string,
          Partial<Record<ConsentType, boolean>>
        > = {};
        for (const record of consentRows) {
          nextConsentMap[record.user_id] ??= {};
          nextConsentMap[record.user_id][record.consent_type] = record.granted;
        }
        setConsentMap(nextConsentMap);
      })
      .finally(() => setLoading(false));
  }, [user?.id]);

  const handleExport = useCallback(
    async (targetUserId: string, email: string) => {
      if (!user?.id) return;
      const consent = consentMap[targetUserId];
      if (consent?.data_collection !== true || consent?.data_export !== true) {
        return;
      }
      try {
        const data = await fetchAllUserDataForExport(targetUserId);
        const blob = await generateLifePlanPdf({
          userName: email.split("@")[0],
          userEmail: email,
          entries: data.entries,
          weeklyPlans: data.weeklyPlans,
          goalScores: data.goalScores,
          plannerFlow,
          generatedAt: new Date().toISOString(),
        });

        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `life-plan-${email.split("@")[0]}.pdf`;
        a.click();
        URL.revokeObjectURL(url);

        await insertDataExport({
          userId: targetUserId,
          requestedBy: user.id,
          exportType: "pdf",
        });
        await insertAuditLog({
          actorId: user.id,
          targetUserId,
          action: "admin_export_pdf",
          resource: "all_data",
        });
      } catch (err) {
        console.error("Export failed:", err);
      }
    },
    [consentMap, user?.id]
  );

  if (loading) {
    return (
      <div className="glass-panel flex h-64 items-center justify-center text-sm text-slate-500">
        Loading metrics…
      </div>
    );
  }

  const totalEmployees = metrics.length;
  const activeThisWeek = metrics.filter((m) => {
    if (!m.last_entry_at) return false;
    const days = (Date.now() - new Date(m.last_entry_at).getTime()) / (1000 * 60 * 60 * 24);
    return days <= 7;
  }).length;
  const avgSteps =
    totalEmployees > 0
      ? (metrics.reduce((s, m) => s + m.steps_completed, 0) / totalEmployees).toFixed(1)
      : "0";
  const totalWeeklyPlans = metrics.reduce((s, m) => s + m.weekly_plan_count, 0);
  const completedAll = metrics.filter((m) => m.steps_completed >= 8).length;
  const completionRate =
    totalEmployees > 0 ? Math.round((completedAll / totalEmployees) * 100) : 0;
  const activeLast30 = metrics.filter((m) => {
    if (!m.last_entry_at) return false;
    const days = (Date.now() - new Date(m.last_entry_at).getTime()) / (1000 * 60 * 60 * 24);
    return days <= 30;
  }).length;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Admin Dashboard</h1>
        <p className="mt-1 text-sm text-slate-500">
          Employee engagement overview (non-content metrics only).
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <MetricCard
          title="Total Employees"
          value={totalEmployees}
        />
        <MetricCard
          title="Active This Week"
          value={activeThisWeek}
          subtitle={`${totalEmployees > 0 ? Math.round((activeThisWeek / totalEmployees) * 100) : 0}% of total`}
        />
        <MetricCard
          title="Avg Steps Completed"
          value={`${avgSteps} / 8`}
        />
        <MetricCard
          title="Weekly Plans Created"
          value={totalWeeklyPlans}
        />
        <MetricCard
          title="Completion Rate"
          value={`${completionRate}%`}
          subtitle={`${completedAll} of ${totalEmployees} completed all 8 steps`}
        />
        <MetricCard
          title="Active (30 days)"
          value={activeLast30}
          subtitle={`${totalEmployees > 0 ? Math.round((activeLast30 / totalEmployees) * 100) : 0}% of total`}
        />
      </div>

      <div className="glass-panel p-6">
        <h2 className="mb-4 text-sm font-semibold text-slate-700">
          Employee Engagement
        </h2>
        <EmployeeTable
          metrics={metrics}
          consentMap={consentMap}
          onExport={handleExport}
        />
      </div>
    </div>
  );
}
