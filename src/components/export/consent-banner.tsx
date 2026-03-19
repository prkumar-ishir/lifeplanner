"use client";

import { useConsent } from "@/hooks/useConsent";
import type { ConsentType } from "@/types/admin";

const CONSENT_TYPES: { type: ConsentType; label: string; description: string }[] = [
  {
    type: "data_collection",
    label: "Data Collection",
    description: "Allow admins to handle your Life Plan content for supported administrative workflows.",
  },
  {
    type: "data_retention",
    label: "Data Retention",
    description: "Allow deleted data to remain restorable during the retention period instead of being purged immediately.",
  },
  {
    type: "data_export",
    label: "Data Export",
    description: "Allow admins to export your data as downloadable reports on your behalf.",
  },
];

export default function ConsentBanner() {
  const { hasConsent, grantConsent, revokeConsent, isLoading } = useConsent();

  if (isLoading) {
    return (
      <div className="text-sm text-slate-500">Loading consent preferences…</div>
    );
  }

  return (
    <div className="space-y-3">
      {CONSENT_TYPES.map(({ type, label, description }) => {
        const granted = hasConsent(type);
        return (
          <label
            key={type}
            className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white/70 px-4 py-3 transition hover:border-slate-300"
          >
            <input
              type="checkbox"
              checked={granted}
              onChange={() =>
                granted ? revokeConsent(type) : grantConsent(type)
              }
              className="mt-0.5 rounded"
            />
            <div>
              <p className="text-sm font-medium text-slate-700">{label}</p>
              <p className="text-xs text-slate-500">{description}</p>
            </div>
          </label>
        );
      })}
    </div>
  );
}
