"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { plannerFlow } from "@/data/plannerFlow";
import { cn, formatMonth } from "@/lib/utils";
import { usePlannerStore } from "@/store/plannerStore";
import { useAuth } from "@/contexts/auth-provider";
import { fetchGoalScores, upsertGoalScore } from "@/lib/supabase/repositories";

/**
 * DashboardPage surfaces progress, the latest weekly plan, and shortcuts
 * back into each planner step using hydrated Zustand data.
 */
export default function DashboardPage() {
  const { user } = useAuth();
  const entries = usePlannerStore((state) => state.entries);
  const weeklyPlans = usePlannerStore((state) => state.weeklyPlans);
  const setStepIndex = usePlannerStore((state) => state.setStepIndex);
  const router = useRouter();
  const [goalScores, setGoalScores] = useState<Record<string, number>>({});

  const completedSteps = Object.keys(entries).length;
  const progress = Math.round((completedSteps / plannerFlow.length) * 100);
  const latestWeeklyPlan = Object.values(weeklyPlans).sort(
    (a, b) => b.createdAt.localeCompare(a.createdAt)
  )[0];

  const isProgressComplete = progress >= 100;
  const goalStep = plannerFlow.find((step) => step.id === "goal-setting");
  const goalEntries = entries["goal-setting"];
  // Translate saved goal step fields into spotlight cards with optional slider control.
  const spotlightGoals = useMemo(() => {
    if (!goalStep || !goalEntries) {
      return [];
    }

    return goalStep.fields
      .map((field) => {
        const rawValue = String(goalEntries[field.id] ?? "").trim();
        if (!rawValue) {
          return null;
        }
        return {
          id: field.id,
          label: field.label.replace(/ goal$/i, ""),
          summary: rawValue,
        };
      })
      .filter((goal): goal is GoalSpotlightGoal => Boolean(goal));
  }, [goalEntries, goalStep]);

  useEffect(() => {
    let isMounted = true;
    if (!user?.id) {
      setGoalScores({});
      return;
    }
    fetchGoalScores(user.id)
      .then((scores) => {
        if (isMounted) setGoalScores(scores);
      })
      .catch((error) => console.error("Failed to fetch goal scores", error));
    return () => {
      isMounted = false;
    };
  }, [user]);

  const handleGoalScoreChange = (goalId: string, score: number) => {
    setGoalScores((prev) => ({
      ...prev,
      [goalId]: score,
    }));
    if (user?.id) {
      upsertGoalScore(user.id, goalId, score).catch((error) => {
        console.error("Failed to persist goal score", error);
      });
    }
  };

  return (
    <div className="space-y-8">
      {/* Top layout: left column stacks rhythm + journey progress, right column shows goals. */}
      <section className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <div className="space-y-6">
          <article className="glass-panel flex flex-col gap-6 p-6">
            <header>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Weekly rhythm
              </p>
            </header>
            {latestWeeklyPlan ? (
              <Link
                href="/weekly-planner"
                className="group flex h-full flex-col rounded-2xl border border-slate-100 bg-white p-4 transition hover:-translate-y-0.5 hover:border-slate-200 hover:shadow-lg"
              >
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400 group-hover:text-slate-500">
                  Current focus
                </p>
                <p className="mt-2 text-lg font-semibold text-slate-900">
                  {latestWeeklyPlan.focus}
                </p>
                <p className="text-sm text-slate-500">
                  Week {latestWeeklyPlan.weekOfMonth}, {formatMonth(latestWeeklyPlan.month)} {latestWeeklyPlan.year}
                </p>
                <ul className="mt-4 list-disc space-y-1 pl-4 text-xs text-slate-500">
                  {latestWeeklyPlan.wins.map((win) => (
                    <li key={win}>{win}</li>
                  ))}
                </ul>
                {latestWeeklyPlan.scheduleNotes && (
                  <p className="mt-3 text-xs text-slate-500">
                    Notes: {latestWeeklyPlan.scheduleNotes}
                  </p>
                )}
                <span className="mt-auto inline-flex items-center text-xs font-semibold text-slate-600 opacity-0 transition group-hover:opacity-100">
                  Go to weekly planner →
                </span>
              </Link>
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500">
                No weekly plan logged yet. Capture one to see it here.
              </div>
            )}
          </article>

        </div>

        <div className="lg:pl-4">
          <GoalSpotlightRow
            goals={spotlightGoals}
            scores={goalScores}
            onScoreChange={handleGoalScoreChange}
          />
        </div>
      </section>

      {/* Flow overview: grid of steps becomes clickable once a step is captured. */}
      <section className="glass-panel flex max-h-[560px] flex-col overflow-hidden p-6">
        <header>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Flow overview
          </p>
        </header>
        <div className="mt-6 flex-1 overflow-hidden">
          <div className="scroll-thin h-full overflow-y-auto pr-1 pt-2">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {plannerFlow.map((step, index) => {
                const data = entries[step.id];
                const isCompleted = Boolean(data);
                const handleSelect = () => {
                  if (!isCompleted) return;
                  setStepIndex(index);
                  router.push("/planner");
                };

                return (
                  <article
                    key={step.id}
                    role={isCompleted ? "button" : undefined}
                    tabIndex={isCompleted ? 0 : -1}
                    onClick={handleSelect}
                    onKeyDown={(event) => {
                      if (!isCompleted) return;
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        handleSelect();
                      }
                    }}
                    className={cn(
                      "rounded-2xl border p-4 text-left transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-400",
                      isCompleted
                        ? "border-emerald-200 bg-emerald-50 hover:-translate-y-0.5 hover:border-emerald-300 hover:bg-white cursor-pointer"
                        : "border-slate-100 bg-white"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-slate-900">
                        {index + 1}. {step.title}
                      </p>
                      <span
                        className={cn(
                          "text-[10px] font-semibold uppercase tracking-wide",
                          isCompleted ? "text-emerald-700" : "text-slate-400"
                        )}
                      >
                        {isCompleted ? "Captured" : "Pending"}
                      </span>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

type GoalSpotlightGoal = {
  id: string;
  label: string;
  summary: string;
};

type GoalSpotlightRowProps = {
  goals: GoalSpotlightGoal[];
  scores: Record<string, number>;
  onScoreChange: (goalId: string, score: number) => void;
};

const goalColorMap: Record<string, string> = {
  goal_self: "#a855f7",
  goal_body: "#f97316",
  goal_family: "#0ea5e9",
  goal_professional: "#22c55e",
};

/**
 * GoalSpotlightRow renders a slider card for each captured goal so the user can
 * rate momentum and keep the dashboard engaging between flow sessions.
 */
function GoalSpotlightRow({ goals, scores, onScoreChange }: GoalSpotlightRowProps) {
  return (
    <section className="glass-panel flex h-full flex-col gap-4 p-6">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        Goal spotlight
      </p>
      <div className="grid flex-1 grid-cols-1 gap-4 md:grid-cols-2">
        {goals.map((goal) => {
          const score = scores[goal.id] ?? 7;
          return (
            <article
              key={goal.id}
              className="flex flex-col rounded-2xl border border-slate-100 bg-white p-4 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: goalColorMap[goal.id] || "#334155" }}
                    />
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      {goal.label}
                    </p>
                  </div>
                  <p className="mt-2 text-sm text-slate-600">
                    {goal.summary.length > 180 ? `${goal.summary.slice(0, 177)}…` : goal.summary}
                  </p>
                </div>
                <span className="text-base font-semibold text-slate-900">{score}/10</span>
              </div>
              <div className="mt-auto">
                <input
                  type="range"
                  min={1}
                  max={10}
                  step={1}
                  value={score}
                  aria-label={`${goal.label} score`}
                  onChange={(event) => onScoreChange(goal.id, Number(event.target.value))}
                  className="mt-4 w-full accent-slate-900"
                />
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
