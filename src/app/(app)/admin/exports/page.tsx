"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/contexts/auth-provider";
import {
  fetchEngagementMetrics,
  fetchAllUserDataForExport,
  insertAuditLog,
  insertDataExport,
} from "@/lib/supabase/repositories";
import { generateLifePlanPdf } from "@/lib/pdf/generate-life-plan-pdf";
import { plannerFlow } from "@/data/plannerFlow";
import type { EngagementMetric } from "@/types/admin";

export default function AdminExportsPage() {
  const { user } = useAuth();
  const [employees, setEmployees] = useState<EngagementMetric[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.id) return;
    fetchEngagementMetrics()
      .then(setEmployees)
      .finally(() => setLoading(false));
  }, [user?.id]);

  const handleExport = useCallback(
    async (targetUserId: string, email: string) => {
      if (!user?.id) return;
      setExporting(targetUserId);
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
      } finally {
        setExporting(null);
      }
    },
    [user?.id]
  );

  if (loading) {
    return (
      <div className="glass-panel flex h-64 items-center justify-center text-sm text-slate-500">
        Loading employees…
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">
          Data Export Management
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Export employee Life Plan data as PDF reports on their behalf.
        </p>
      </div>

      <div className="glass-panel overflow-x-auto p-6">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200">
              <th className="py-2 pr-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                Employee
              </th>
              <th className="py-2 pr-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                Steps
              </th>
              <th className="py-2 pr-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                Weekly Plans
              </th>
              <th className="py-2 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {employees.map((emp) => (
              <tr
                key={emp.user_id}
                className="border-b border-slate-100 hover:bg-slate-50/50"
              >
                <td className="py-3 pr-4 font-medium text-slate-900">
                  {emp.email}
                </td>
                <td className="py-3 pr-4 text-slate-600">
                  {emp.steps_completed} / 8
                </td>
                <td className="py-3 pr-4 text-slate-600">
                  {emp.weekly_plan_count}
                </td>
                <td className="py-3">
                  <button
                    onClick={() => handleExport(emp.user_id, emp.email)}
                    disabled={exporting === emp.user_id}
                    className="rounded-lg bg-brand px-4 py-1.5 text-xs font-medium text-white transition hover:bg-brand-dark disabled:opacity-50"
                  >
                    {exporting === emp.user_id
                      ? "Exporting…"
                      : "Export PDF"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {employees.length === 0 && (
          <p className="py-8 text-center text-sm text-slate-500">
            No employees found.
          </p>
        )}
      </div>
    </div>
  );
}
