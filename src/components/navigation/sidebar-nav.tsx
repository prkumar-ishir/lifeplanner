"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { plannerFlow } from "@/data/plannerFlow";
import { cn } from "@/lib/utils";
import { usePlannerStore } from "@/store/plannerStore";

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

/**
 * SidebarNav shows journey progress + links to the key authenticated routes.
 * It reads completion data from the planner store so links stay contextual.
 */
export default function SidebarNav() {
  const pathname = usePathname();
  const entries = usePlannerStore((state) => state.entries);

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
            className="h-2 rounded-full bg-gradient-to-r from-brand to-violet-500 transition-all"
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
                  ? "border-slate-900 bg-slate-900 text-white shadow-lg"
                  : "border-transparent bg-white/60 text-slate-700 hover:border-slate-200 hover:bg-white"
              )}
            >
              <span className="text-sm font-medium">
                {item.icon} {item.label}
              </span>
              <p className="text-xs text-slate-500">{item.description}</p>
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
            className="h-2 rounded-full bg-gradient-to-r from-brand to-purple-500 transition-all"
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
