"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/auth-provider";
import {
  fetchAllUserDataForExport,
  insertAuditLog,
  insertDataExport,
} from "@/lib/supabase/repositories";
import { generateLifePlanPdf } from "@/lib/pdf/generate-life-plan-pdf";
import { plannerFlow } from "@/data/plannerFlow";

export default function ExportButton() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  async function handleExport() {
    if (!user?.id) return;
    setLoading(true);
    try {
      const data = await fetchAllUserDataForExport(user.id);
      const blob = await generateLifePlanPdf({
        userName: user.email?.split("@")[0] ?? "User",
        userEmail: user.email ?? "",
        entries: data.entries,
        weeklyPlans: data.weeklyPlans,
        goalScores: data.goalScores,
        plannerFlow,
        generatedAt: new Date().toISOString(),
      });

      // Trigger download immediately before any tracking calls
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `life-plan-${user.email?.split("@")[0] ?? "export"}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      // Non-blocking tracking — don't let failures prevent download
      insertDataExport({
        userId: user.id,
        requestedBy: user.id,
        exportType: "pdf",
      }).catch(() => {});
      insertAuditLog({
        actorId: user.id,
        action: "export_pdf",
        resource: "all_data",
      }).catch(() => {});
    } catch (err) {
      console.error("PDF export failed:", err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleExport}
      disabled={loading}
      className="rounded-xl bg-brand px-6 py-3 text-sm font-semibold text-white transition hover:bg-brand-dark disabled:opacity-50"
    >
      {loading ? "Generating PDF…" : "Download My Life Plan (PDF)"}
    </button>
  );
}
