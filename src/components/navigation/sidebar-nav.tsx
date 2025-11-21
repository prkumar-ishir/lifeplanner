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
    </div>
  );
}
