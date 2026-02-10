"use client";

import { useState } from "react";
import type { AuditLogRow } from "@/types/admin";

type Props = {
  logs: AuditLogRow[];
  onLoadMore?: () => void;
  hasMore?: boolean;
};

const ACTION_OPTIONS = [
  "",
  "login",
  "export_pdf",
  "admin_export_pdf",
  "admin_view_metrics",
  "admin_view_audit",
  "update_reminder_config",
  "consent_granted",
  "consent_revoked",
  "soft_delete_initiated",
  "data_restored",
];

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default function AuditLogTable({ logs, onLoadMore, hasMore }: Props) {
  const [actionFilter, setActionFilter] = useState("");

  const filtered = actionFilter
    ? logs.filter((l) => l.action === actionFilter)
    : logs;

  return (
    <div>
      <div className="mb-4 flex items-center gap-3">
        <label className="text-xs font-semibold text-slate-500">
          Filter by action:
        </label>
        <select
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
          className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-700"
        >
          <option value="">All actions</option>
          {ACTION_OPTIONS.filter(Boolean).map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
        </select>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200">
              <th className="py-2 pr-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                Date
              </th>
              <th className="py-2 pr-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                Actor
              </th>
              <th className="py-2 pr-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                Action
              </th>
              <th className="py-2 pr-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                Target
              </th>
              <th className="py-2 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                Resource
              </th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((log) => (
              <tr
                key={log.id}
                className="border-b border-slate-100 hover:bg-slate-50/50"
              >
                <td className="py-2.5 pr-4 text-slate-500">
                  {formatDate(log.created_at)}
                </td>
                <td className="py-2.5 pr-4 font-medium text-slate-700">
                  {log.actor_id.slice(0, 8)}…
                </td>
                <td className="py-2.5 pr-4">
                  <span className="inline-block rounded-md bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">
                    {log.action}
                  </span>
                </td>
                <td className="py-2.5 pr-4 text-slate-500">
                  {log.target_user_id
                    ? `${log.target_user_id.slice(0, 8)}…`
                    : "—"}
                </td>
                <td className="py-2.5 text-slate-500">
                  {log.resource ?? "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filtered.length === 0 && (
        <p className="py-8 text-center text-sm text-slate-500">
          No audit logs found.
        </p>
      )}

      {hasMore && onLoadMore && (
        <div className="mt-4 text-center">
          <button
            onClick={onLoadMore}
            className="rounded-xl border border-slate-200 px-6 py-2 text-sm font-medium text-slate-600 transition hover:border-slate-300"
          >
            Load more
          </button>
        </div>
      )}
    </div>
  );
}
