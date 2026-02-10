"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { plannerFlow } from "@/data/plannerFlow";
import { cn } from "@/lib/utils";
import { usePlannerStore } from "@/store/plannerStore";
import { useRole } from "@/contexts/role-provider";

const navItems = [
  {
    href: "/dashboard",
    label: "Dashboard",
    description: "See the big picture at a glance.",
    icon: "🏠",
  },
  {
    href: "/planner",
    label: "Planner Flow",
    description: "Work through the life planning sequence.",
    icon: "🧭",
  },
  {
    href: "/weekly-planner",
    label: "Weekly Planner",
    description: "Anchor your goals to the current week.",
    icon: "📆",
  },
];

const adminNavItems = [
  {
    href: "/admin",
    label: "Admin Dashboard",
    description: "Usage & engagement metrics.",
    icon: "📊",
  },
  {
    href: "/admin/audit",
    label: "Audit Logs",
    description: "Access and change history.",
    icon: "📋",
  },
  {
    href: "/admin/reminders",
    label: "Reminders",
    description: "Configure reminder frequencies.",
    icon: "🔔",
  },
  {
    href: "/admin/exports",
    label: "Data Exports",
    description: "Employee data export management.",
    icon: "📥",
  },
];

/**
 * SidebarNav shows journey progress + links to the key authenticated routes.
 * It reads completion data from the planner store so links stay contextual.
 */
export default function SidebarNav() {
  const pathname = usePathname();
  const entries = usePlannerStore((state) => state.entries);
  const { isAdmin } = useRole();

  const completedSteps = Object.keys(entries).length;
  const totalSteps = plannerFlow.length;
  const progress = Math.round((completedSteps / totalSteps) * 100);
  const bucketDefinitions = [
    {
      title: "Foundations",
      stepIds: ["commitment", "vision", "wheel-of-life", "purpose"],
    },
    {
      title: "Reflection",
      stepIds: ["past-year", "year-ahead"],
    },
    {
      title: "Execution",
      stepIds: ["goal-setting", "quarterly-planning"],
    },
  ] as const;
  const bucketProgress = bucketDefinitions.map((bucket) => {
    const completed = bucket.stepIds.filter((id) => Boolean(entries[id])).length;
    return { title: bucket.title, status: `${completed}/${bucket.stepIds.length}` };
  });

  return (
    <div className="glass-panel space-y-6 p-6">
      <div>
        <p className="text-sm font-semibold text-slate-600">Journey progress</p>
        <p className="mt-1 text-2xl font-semibold text-slate-900">
          {completedSteps}/{totalSteps}
        </p>
        <div className="mt-4 h-2 rounded-full bg-slate-100">
          <div
            className="h-2 rounded-full bg-gradient-to-r from-[var(--brand)] to-[var(--gradient-mid)] transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <nav className="space-y-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "block rounded-2xl border px-4 py-3 transition",
                isActive
                  ? "border-brand bg-brand text-white shadow-lg"
                  : "border-transparent bg-white/60 text-slate-700 hover:border-slate-200 hover:bg-white"
              )}
            >
              <span className="text-sm font-medium">
                {item.icon} {item.label}
              </span>
              <p className={cn("text-xs", isActive ? "text-white/70" : "text-slate-500")}>{item.description}</p>
            </Link>
          );
        })}
      </nav>

      <section className="rounded-2xl border border-slate-200 bg-white/70 p-4">
        <div className="mb-3">
          <p className="text-sm font-semibold text-slate-900">{progress}% complete</p>
          <p className="text-xs text-slate-500">
            {completedSteps} of {totalSteps} steps captured.
          </p>
        </div>
        <div className="h-2 rounded-full bg-slate-100">
          <div
            className="h-2 rounded-full bg-gradient-to-r from-[var(--brand)] to-[var(--gradient-mid)] transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="mt-4 space-y-2">
          {bucketProgress.map((bucket) => (
            <div
              key={bucket.title}
              className="rounded-xl border border-slate-100 bg-white px-3 py-2 text-center"
            >
              <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-slate-400">
                {bucket.title}
              </p>
              <p className="text-sm font-semibold text-slate-900">{bucket.status}</p>
            </div>
          ))}
        </div>
      </section>

      {isAdmin && (
        <section className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Admin
          </p>
          {adminNavItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "block rounded-2xl border px-4 py-3 transition",
                  isActive
                    ? "border-brand bg-brand text-white shadow-lg"
                    : "border-transparent bg-white/60 text-slate-700 hover:border-slate-200 hover:bg-white"
                )}
              >
                <span className="text-sm font-medium">
                  {item.icon} {item.label}
                </span>
                <p className={cn("text-xs", isActive ? "text-white/70" : "text-slate-500")}>
                  {item.description}
                </p>
              </Link>
            );
          })}
        </section>
      )}
    </div>
  );
}
