"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Bell,
  CalendarDays,
  Compass,
  Download,
  Gauge,
  LayoutDashboard,
  ScrollText,
} from "lucide-react";
import { plannerFlow } from "@/data/plannerFlow";
import { cn } from "@/lib/utils";
import { usePlannerStore } from "@/store/plannerStore";
import { useRole } from "@/contexts/role-provider";

const navItems = [
  {
    href: "/dashboard",
    label: "Dashboard",
    description: "See the big picture at a glance.",
    icon: LayoutDashboard,
  },
  {
    href: "/planner",
    label: "Planner Flow",
    description: "Work through the life planning sequence.",
    icon: Compass,
  },
  {
    href: "/weekly-planner",
    label: "Weekly Planner",
    description: "Anchor your goals to the current week.",
    icon: CalendarDays,
  },
];

const adminNavItems = [
  {
    href: "/admin",
    label: "Admin Dashboard",
    description: "Usage & engagement metrics.",
    icon: BarChart3,
  },
  {
    href: "/admin/audit",
    label: "Audit Logs",
    description: "Access and change history.",
    icon: ScrollText,
  },
  {
    href: "/admin/reminders",
    label: "Reminders",
    description: "Configure reminder frequencies.",
    icon: Bell,
  },
  {
    href: "/admin/exports",
    label: "Data Exports",
    description: "Employee data export management.",
    icon: Download,
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
    <div className="glass-panel overflow-hidden p-3 md:p-2 md:group-hover/sidebar:p-5">
      {isAdmin && (
        <section className="space-y-1 md:space-y-2">
          <p className="hidden text-xs font-semibold uppercase tracking-wider text-slate-400 md:block md:opacity-0 md:transition md:group-hover/sidebar:opacity-100">
            Admin
          </p>
          {adminNavItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "block rounded-xl border transition md:h-14 md:w-14 md:overflow-hidden md:group-hover/sidebar:h-auto md:group-hover/sidebar:w-full",
                  isActive
                    ? "border-brand bg-brand text-white shadow-lg"
                    : "border-transparent bg-white text-slate-700 hover:border-slate-200 hover:bg-white"
                )}
              >
                <div className="flex items-center justify-center md:h-14 md:w-14 md:group-hover/sidebar:hidden">
                  <Icon
                    className={cn(
                      "h-6 w-6 shrink-0",
                      isActive ? "text-white" : "text-slate-600"
                    )}
                    strokeWidth={2.5}
                  />
                </div>
                <div className="hidden items-center px-4 py-3 md:group-hover/sidebar:flex">
                  <Icon
                    className={cn(
                      "h-5 w-5 shrink-0",
                      isActive ? "text-white" : "text-slate-600"
                    )}
                    strokeWidth={2.25}
                  />
                  <span className="hidden pl-3 text-sm font-medium md:block md:whitespace-nowrap md:opacity-0 md:transition md:group-hover/sidebar:opacity-100">
                    {item.label}
                  </span>
                </div>
                <p
                  className={cn(
                    "hidden px-4 pb-3 text-xs md:block md:opacity-0 md:transition md:group-hover/sidebar:opacity-100",
                    isActive ? "text-white/70" : "text-slate-500"
                  )}
                >
                  {item.description}
                </p>
              </Link>
            );
          })}
        </section>
      )}

      <div className="hidden space-y-5 md:block md:pb-3 md:group-hover/sidebar:pb-5">
        <div className="hidden items-center justify-center md:flex">
          <div className="text-center">
            <p className="hidden text-sm font-semibold text-slate-600 md:block md:opacity-0 md:transition md:group-hover/sidebar:opacity-100">
              Journey progress
            </p>
            <div className="hidden items-center gap-2 md:group-hover/sidebar:flex">
              <Gauge className="h-4 w-4 text-slate-500" strokeWidth={2} />
              <p className="text-lg font-semibold text-slate-900">{progress}%</p>
            </div>
          </div>
        </div>
        <div className="mt-5 hidden h-2 rounded-full bg-slate-100 md:block md:opacity-0 md:transition md:group-hover/sidebar:opacity-100">
          <div
            className="h-2 rounded-full bg-gradient-to-r from-[var(--brand)] to-[var(--gradient-mid)] transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <nav className="space-y-1 md:space-y-2 md:pb-4 md:group-hover/sidebar:pb-6">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "block rounded-xl border transition md:h-14 md:w-14 md:overflow-hidden md:group-hover/sidebar:h-auto md:group-hover/sidebar:w-full",
                isActive
                  ? "border-brand bg-brand text-white shadow-lg"
                  : "border-transparent bg-white text-slate-700 hover:border-slate-200 hover:bg-white"
              )}
              >
              <div className="flex items-center justify-center md:h-14 md:w-14 md:group-hover/sidebar:hidden">
                <Icon
                  className={cn(
                    "h-6 w-6 shrink-0",
                    isActive ? "text-white" : "text-slate-600"
                  )}
                  strokeWidth={2.5}
                />
              </div>
              <div className="hidden items-center px-4 py-3 md:group-hover/sidebar:flex">
                <Icon
                  className={cn(
                    "h-5 w-5 shrink-0",
                    isActive ? "text-white" : "text-slate-600"
                  )}
                  strokeWidth={2.25}
                />
                <span className="hidden pl-3 text-sm font-medium md:block md:whitespace-nowrap md:opacity-0 md:transition md:group-hover/sidebar:opacity-100">
                  {item.label}
                </span>
              </div>
              <p
                className={cn(
                  "hidden px-4 pb-3 text-xs md:block md:opacity-0 md:transition md:group-hover/sidebar:opacity-100",
                  isActive ? "text-white/70" : "text-slate-500"
                )}
              >
                {item.description}
              </p>
            </Link>
          );
        })}
      </nav>

      <section className="hidden rounded-2xl border border-slate-200 bg-white/70 p-4 md:block md:mt-2 md:opacity-0 md:transition md:group-hover/sidebar:mt-4 md:group-hover/sidebar:opacity-100">
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

    </div>
  );
}
