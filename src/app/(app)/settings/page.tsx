"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/auth-provider";
import { useTheme } from "@/contexts/theme-provider";
import { useConsent } from "@/hooks/useConsent";
import { themePresets, themeIds } from "@/lib/themes";
import { cn } from "@/lib/utils";
import {
  hardDeleteUserData,
  insertAuditLog,
  softDeleteUserData,
} from "@/lib/supabase/repositories";
import ExportButton from "@/components/export/export-button";
import ConsentBanner from "@/components/export/consent-banner";

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const { user, signOut } = useAuth();
  const { canAcknowledgeRetention } = useConsent();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleDeleteAccount() {
    if (!user?.id) return;
    setDeleting(true);
    try {
      if (canAcknowledgeRetention) {
        await softDeleteUserData(user.id);
      } else {
        await hardDeleteUserData(user.id);
      }
      await insertAuditLog({
        actorId: user.id,
        action: "soft_delete_initiated",
        resource: "all_data",
        metadata: {
          retentionConsentGranted: canAcknowledgeRetention,
          deletionMode: canAcknowledgeRetention ? "soft_delete" : "hard_delete",
        },
      });
      await signOut();
    } catch (err) {
      console.error("Account deletion failed:", err);
      setDeleting(false);
    }
  }

  return (
    <div className="glass-panel space-y-8 p-8">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Settings</h1>
        <p className="mt-1 text-sm text-slate-500">
          Personalize your Life Planner workspace.
        </p>
      </div>

      <section>
        <h2 className="text-sm font-semibold text-slate-700">Theme color</h2>
        <p className="mt-1 text-xs text-slate-500">
          Choose a primary color for your workspace.
        </p>

        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {themeIds.map((id) => {
            const preset = themePresets[id];
            const isActive = theme === id;
            return (
              <button
                key={id}
                onClick={() => setTheme(id)}
                className={cn(
                  "flex items-center gap-3 rounded-2xl border px-4 py-3 text-left transition",
                  isActive
                    ? "border-brand bg-brand text-white shadow-lg"
                    : "border-slate-200 bg-white/60 text-slate-700 hover:border-slate-300 hover:bg-white"
                )}
              >
                <span
                  className="h-6 w-6 flex-shrink-0 rounded-full border-2 border-white shadow-sm"
                  style={{ backgroundColor: preset.swatch }}
                />
                <span className="text-sm font-medium">{preset.label}</span>
              </button>
            );
          })}
        </div>
      </section>

      <section>
        <h2 className="text-sm font-semibold text-slate-700">
          Data & Privacy
        </h2>
        <p className="mt-1 text-xs text-slate-500">
          Define how admins may handle your data and export your own records.
        </p>

        <div className="mt-4 space-y-6">
          <div>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
              Consent Preferences
            </h3>
            <ConsentBanner />
          </div>

          <div>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
              Export Data
            </h3>
            <p className="mb-3 text-xs text-slate-500">
              Download a PDF report of your complete Life Plan data.
            </p>
            <ExportButton />
          </div>

          <div>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
              Account Deletion
            </h3>
            <p className="mb-3 text-xs text-slate-500">
              Request deletion of your Life Plan data. If you allow retention,
              your data will be soft-deleted and can be restored by an admin
              within the retention period. If retention is not allowed, your
              plan data will be permanently deleted.
            </p>
            <button
              onClick={() => setShowDeleteModal(true)}
              className="rounded-xl border border-red-200 px-6 py-3 text-sm font-semibold text-red-600 transition hover:border-red-300 hover:bg-red-50"
            >
              Request Data Deletion
            </button>
          </div>
        </div>
      </section>

      {showDeleteModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50">
          <div className="mx-4 w-full max-w-md rounded-2xl bg-white p-8 shadow-xl">
            <h3 className="text-lg font-semibold text-slate-900">
              Confirm Data Deletion
            </h3>
            <p className="mt-2 text-sm text-slate-600">
              {canAcknowledgeRetention
                ? "This will soft-delete all your Life Plan data (planner entries, weekly plans, and goal scores). You will be signed out. An admin can restore your data within the retention period."
                : "This will permanently delete all your Life Plan data (planner entries, weekly plans, goal scores, and consent records). You will be signed out and the deleted plan data cannot be restored by an admin."}
            </p>
            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:border-slate-300"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleting}
                className="flex-1 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-50"
              >
                {deleting ? "Deleting…" : "Delete My Data"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
