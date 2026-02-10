"use client";

import { useState } from "react";
import Link from "next/link";
import type { EngagementMetric } from "@/types/admin";

type SortKey = "email" | "steps_completed" | "weekly_plan_count" | "last_entry_at";

function relativeTime(dateStr: string | null): string {
  if (!dateStr) return "Never";
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 30) return `${days} days ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

type Props = {
  metrics: EngagementMetric[];
  onExport?: (userId: string, email: string) => void;
};

export default function EmployeeTable({ metrics, onExport }: Props) {
  const [sortKey, setSortKey] = useState<SortKey>("email");
  const [sortAsc, setSortAsc] = useState(true);

  const sorted = [...metrics].sort((a, b) => {
    let cmp = 0;
    switch (sortKey) {
      case "email":
        cmp = a.email.localeCompare(b.email);
        break;
      case "steps_completed":
        cmp = a.steps_completed - b.steps_completed;
        break;
      case "weekly_plan_count":
        cmp = a.weekly_plan_count - b.weekly_plan_count;
        break;
      case "last_entry_at":
        cmp =
          new Date(a.last_entry_at ?? 0).getTime() -
          new Date(b.last_entry_at ?? 0).getTime();
        break;
    }
    return sortAsc ? cmp : -cmp;
  });

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortAsc((prev) => !prev);
    } else {
      setSortKey(key);
      setSortAsc(true);
    }
  }

  const headerClass =
    "cursor-pointer text-left text-xs font-semibold uppercase tracking-wider text-slate-500 hover:text-slate-700 transition";

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200">
            <th className={headerClass} onClick={() => toggleSort("email")}>
              Employee {sortKey === "email" ? (sortAsc ? "↑" : "↓") : ""}
            </th>
            <th className={headerClass} onClick={() => toggleSort("steps_completed")}>
              Steps {sortKey === "steps_completed" ? (sortAsc ? "↑" : "↓") : ""}
            </th>
            <th className={headerClass} onClick={() => toggleSort("weekly_plan_count")}>
              Weekly Plans {sortKey === "weekly_plan_count" ? (sortAsc ? "↑" : "↓") : ""}
            </th>
            <th className={headerClass} onClick={() => toggleSort("last_entry_at")}>
              Last Active {sortKey === "last_entry_at" ? (sortAsc ? "↑" : "↓") : ""}
            </th>
            <th className="text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
              Status
            </th>
            <th className="text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((m) => {
            const daysSinceActive = m.last_entry_at
              ? Math.floor(
                  (Date.now() - new Date(m.last_entry_at).getTime()) /
                    (1000 * 60 * 60 * 24)
                )
              : Infinity;
            const isActive = daysSinceActive <= 14;

            return (
              <tr
                key={m.user_id}
                className="border-b border-slate-100 hover:bg-slate-50/50"
              >
                <td className="py-3 pr-4 font-medium text-slate-900">
                  {m.email}
                </td>
                <td className="py-3 pr-4 text-slate-600">
                  {m.steps_completed} / 8
                </td>
                <td className="py-3 pr-4 text-slate-600">
                  {m.weekly_plan_count}
                </td>
                <td className="py-3 pr-4 text-slate-500">
                  {relativeTime(m.last_entry_at)}
                </td>
                <td className="py-3 pr-4">
                  <span
                    className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                      isActive
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {isActive ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="py-3">
                  <div className="flex gap-2">
                    <Link
                      href={`/admin/reminders?user=${m.user_id}`}
                      className="text-xs font-medium text-brand hover:underline"
                    >
                      Reminders
                    </Link>
                    {onExport && (
                      <button
                        onClick={() => onExport(m.user_id, m.email)}
                        className="text-xs font-medium text-brand hover:underline"
                      >
                        Export
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {sorted.length === 0 && (
        <p className="py-8 text-center text-sm text-slate-500">
          No employee data found.
        </p>
      )}
    </div>
  );
}
