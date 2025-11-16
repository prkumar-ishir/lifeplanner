"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { plannerFlow } from "@/data/plannerFlow";
import { cn, formatMonth } from "@/lib/utils";
import { usePlannerStore } from "@/store/plannerStore";

// Dashboard surfaces progress, recent weekly plan, and quick links back into the flow.
export default function DashboardPage() {
  const entries = usePlannerStore((state) => state.entries);
  const weeklyPlans = usePlannerStore((state) => state.weeklyPlans);
  const setStepIndex = usePlannerStore((state) => state.setStepIndex);
  const router = useRouter();
  const [goalScores, setGoalScores] = useGoalScores();

  const completedSteps = Object.keys(entries).length;
  const progress = Math.round((completedSteps / plannerFlow.length) * 100);
  const latestWeeklyPlan = Object.values(weeklyPlans).sort(
    (a, b) => b.createdAt.localeCompare(a.createdAt)
  )[0];

  const isProgressComplete = progress >= 100;
  const goalStep = plannerFlow.find((step) => step.id === "goal-setting");
  const goalEntries = entries["goal-setting"];

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

  const handleGoalScoreChange = (goalId: string, score: number) => {
    setGoalScores((prev) => ({
      ...prev,
      [goalId]: score,
    }));
  };

  return (
    <div className="space-y-8">
      {/* Top row: weekly rhythm card + progress tracker. */}
      <section className="grid gap-6 lg:grid-cols-2">
        <article className="glass-panel flex flex-col gap-6 p-6">
          <header>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Weekly rhythm
            </p>
            <h3 className="text-xl font-semibold text-slate-900">
              Anchor execution with the weekly planner
            </h3>
          </header>
          {latestWeeklyPlan ? (
            <Link
              href="/weekly-planner"
              className="group rounded-2xl border border-slate-100 bg-white p-4 transition hover:-translate-y-0.5 hover:border-slate-200 hover:shadow-lg"
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
              <span className="mt-4 inline-flex items-center text-xs font-semibold text-slate-600">
                Go to weekly planner →
              </span>
            </Link>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500">
              No weekly plan logged yet. Capture one to see it here.
            </div>
          )}
        </article>

        <article className="glass-panel flex flex-col gap-6 p-8">
          <div className="flex items-center justify-between gap-4">
            <div>
              {!isProgressComplete && (
                <p className="text-sm font-semibold uppercase tracking-wider text-slate-500">
                  Current progress
                </p>
              )}
              <h2 className="mt-2 text-3xl font-semibold text-slate-900">
                {progress}% complete
              </h2>
              <p className="text-sm text-slate-500">
                {completedSteps} of {plannerFlow.length} steps captured.
              </p>
            </div>
            {!isProgressComplete && (
              <Link
                href="/planner"
                className="inline-flex items-center rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-white"
              >
                Manage flow
              </Link>
            )}
          </div>
          <div className="h-3 rounded-full bg-slate-100">
            <div
              className="h-3 rounded-full bg-gradient-to-r from-brand to-purple-500 transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {[
              {
                title: "Clarify",
                status: `${Math.min(completedSteps, 4)}/4`,
              },
              {
                title: "Plan",
                status: `${Math.min(Math.max(completedSteps - 4, 0), 4)}/4`,
              },
              {
                title: "Execute",
                status: `${Math.max(completedSteps - 8, 0)}/4`,
              },
            ].map((item) => (
              <article key={item.title} className="rounded-2xl border border-slate-100 bg-white p-4">
                <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">
                  {item.title}
                </p>
                <p className="mt-4 text-sm font-semibold text-slate-900">{item.status}</p>
              </article>
            ))}
          </div>
        </article>
      </section>

      {spotlightGoals.length > 0 && (
        <GoalSpotlightRow
          goals={spotlightGoals}
          scores={goalScores}
          onScoreChange={handleGoalScoreChange}
        />
      )}

      {/* Flow overview: grid of steps becomes clickable once a step is captured. */}
      <section className="glass-panel flex max-h-[560px] flex-col overflow-hidden p-6">
        <header>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Flow overview
          </p>
          <h3 className="text-xl font-semibold text-slate-900">
            Each card becomes editable after completion
          </h3>
        </header>
        <div className="mt-6 flex-1 overflow-hidden">
          <div className="scroll-thin h-full overflow-y-auto pr-1">
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

function GoalSpotlightRow({ goals, scores, onScoreChange }: GoalSpotlightRowProps) {
  return (
    <section className="glass-panel p-6">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        Goal spotlight
      </p>
      <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {goals.map((goal) => {
          const score = scores[goal.id] ?? 7;
          return (
            <article
              key={goal.id}
              className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm"
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
            </article>
          );
        })}
      </div>
    </section>
  );
}

function useGoalScores() {
  const [scores, setScores] = useState<Record<string, number>>({});

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const stored = window.localStorage.getItem("goalScores");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (typeof parsed === "object" && parsed !== null) {
          setScores(parsed);
        }
      }
    } catch (error) {
      console.warn("Failed to read goal scores", error);
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem("goalScores", JSON.stringify(scores));
    } catch (error) {
      console.warn("Failed to persist goal scores", error);
    }
  }, [scores]);

  return [scores, setScores] as const;
}
