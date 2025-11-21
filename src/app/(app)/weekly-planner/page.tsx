"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import {
  deleteWeeklyPlan,
  persistWeeklyPlan,
} from "@/lib/supabase/repositories";
import { formatMonth } from "@/lib/utils";
import { usePlannerStore } from "@/store/plannerStore";
import { useAuth } from "@/contexts/auth-provider";
import { useRouter } from "next/navigation";

type WeeklyPlannerForm = {
  year: number;
  month: number;
  weekOfMonth: number;
  focus: string;
  wins: string;
  scheduleNotes: string;
};

const currentYear = new Date().getFullYear();
const years = [currentYear - 1, currentYear, currentYear + 1];
const months = Array.from({ length: 12 }, (_, index) => index + 1);

/**
 * WeeklyPlannerPage lets users log focus, wins, and schedule notes per week.
 * It mirrors every submission into Supabase and mirrors success via toasts + redirect.
 */
export default function WeeklyPlannerPage() {
  const saveWeeklyPlan = usePlannerStore((state) => state.saveWeeklyPlan);
  const removeWeeklyPlan = usePlannerStore((state) => state.removeWeeklyPlan);
  const weeklyPlans = usePlannerStore((state) => state.weeklyPlans);
  const { user } = useAuth();
  const router = useRouter();
  const [status, setStatus] = useState<"idle" | "saving">("idle");
  const [toast, setToast] = useState<null | {
    message: string;
    tone: "success" | "error";
  }>(null);
  const [shouldRedirect, setShouldRedirect] = useState(false);
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null);

  const form = useForm<WeeklyPlannerForm>({
    defaultValues: {
      year: currentYear,
      month: new Date().getMonth() + 1,
      weekOfMonth: 1,
      focus: "",
      wins: "",
      scheduleNotes: "",
    },
  });
  const isEditing = Boolean(editingPlanId);

  // Keep recent plans sorted so the list doubles as a mini history log.
  const sortedPlans = useMemo(
    () =>
      Object.values(weeklyPlans).sort((a, b) =>
        b.createdAt.localeCompare(a.createdAt)
      ),
    [weeklyPlans]
  );

  // Dismiss toast messages automatically so the viewport stays tidy.
  useEffect(() => {
    if (!toast) return;
    const timeout = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(timeout);
  }, [toast]);

  // After a successful save redirect to the dashboard to reinforce the loop.
  useEffect(() => {
    if (!shouldRedirect) return;
    const timeout = setTimeout(() => {
      router.push("/dashboard");
    }, 1800);
    return () => clearTimeout(timeout);
  }, [router, shouldRedirect]);

  // Persist weekly plan locally + Supabase, then toast and redirect to dashboard.
  const onSubmit = form.handleSubmit(async (values) => {
    setStatus("saving");
    const wins = values.wins
      ? values.wins
          .split("\n")
          .map((line) => line.trim())
          .filter(Boolean)
      : [];

    const payload = {
      id: `${values.year}-${values.month}-${values.weekOfMonth}`,
      year: Number(values.year),
      month: Number(values.month),
      weekOfMonth: Number(values.weekOfMonth),
      focus: values.focus,
      wins,
      scheduleNotes: values.scheduleNotes,
      createdAt: new Date().toISOString(),
      userId: user?.id,
    };

    try {
      saveWeeklyPlan(payload);
      await persistWeeklyPlan(payload);
      setToast({
        message: isEditing
          ? "Weekly plan updated."
          : "Saved successfully. Redirecting to dashboard…",
        tone: "success",
      });
      form.reset({ ...values, focus: "", wins: "", scheduleNotes: "" });
      setEditingPlanId(null);
      setShouldRedirect(!isEditing);
    } catch (error) {
      console.error("Failed to save weekly plan", error);
      setToast({
        message: "Could not save weekly plan. Please try again.",
        tone: "error",
      });
    } finally {
      setStatus("idle");
    }
  });

  const handleEditPlan = (planId: string) => {
    const plan = weeklyPlans[planId];
    if (!plan) return;
    setEditingPlanId(planId);
    form.reset({
      year: plan.year,
      month: plan.month,
      weekOfMonth: plan.weekOfMonth,
      focus: plan.focus,
      wins: plan.wins.join("\n"),
      scheduleNotes: plan.scheduleNotes ?? "",
    });
    setShouldRedirect(false);
  };

  const handleCancelEdit = () => {
    setEditingPlanId(null);
    form.reset({
      year: currentYear,
      month: new Date().getMonth() + 1,
      weekOfMonth: 1,
      focus: "",
      wins: "",
      scheduleNotes: "",
    });
  };

  const handleDeletePlan = (planId: string) => {
    if (!user?.id) {
      setToast({
        message: "Sign in to delete saved plans.",
        tone: "error",
      });
      return;
    }
    setPendingDelete(planId);
  };

  const confirmDeletePlan = async () => {
    if (!pendingDelete || !user?.id) {
      setPendingDelete(null);
      return;
    }
    try {
      await deleteWeeklyPlan(user.id, pendingDelete);
      removeWeeklyPlan(pendingDelete);
      if (editingPlanId === pendingDelete) {
        handleCancelEdit();
      }
      setToast({ message: "Weekly plan deleted.", tone: "success" });
    } catch (error) {
      console.error("Failed to delete weekly plan", error);
      setToast({
        message: "Could not delete weekly plan. Please try again.",
        tone: "error",
      });
    } finally {
      setPendingDelete(null);
    }
  };

  return (
    <div className="space-y-8">
      <section className="glass-panel p-8">
        <header className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Weekly planner
          </p>
          <h1 className="text-3xl font-semibold text-slate-900">
            Align each week with your yearly plan
          </h1>
          <p className="text-sm text-slate-500">
            Choose a year, month, and week to log the goals, focus, and habits
            you will visit daily.
          </p>
        </header>

        <form
          onSubmit={onSubmit}
          className="grid gap-4 md:grid-cols-2 lg:grid-cols-3"
        >
          <label className="flex flex-col gap-2">
            <span className="text-sm font-semibold text-slate-700">Year</span>
            <select
              {...form.register("year", { valueAsNumber: true })}
              className="rounded-xl border border-slate-200 px-4 py-3 text-sm"
            >
              {years.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-2">
            <span className="text-sm font-semibold text-slate-700">Month</span>
            <select
              {...form.register("month", { valueAsNumber: true })}
              className="rounded-xl border border-slate-200 px-4 py-3 text-sm"
            >
              {months.map((month) => (
                <option key={month} value={month}>
                  {formatMonth(month)}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-2">
            <span className="text-sm font-semibold text-slate-700">
              Week of month
            </span>
            <select
              {...form.register("weekOfMonth", { valueAsNumber: true })}
              className="rounded-xl border border-slate-200 px-4 py-3 text-sm"
            >
              {[1, 2, 3, 4, 5].map((week) => (
                <option key={week} value={week}>
                  {week}
                </option>
              ))}
            </select>
          </label>

          <label className="md:col-span-2 lg:col-span-3">
            <span className="text-sm font-semibold text-slate-700">
              Weekly focus
            </span>
            <input
              {...form.register("focus", { required: true })}
              placeholder="Ship version 1, complete investor outreach…"
              className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm"
            />
          </label>

          <label className="md:col-span-2 lg:col-span-3">
            <span className="text-sm font-semibold text-slate-700">
              Key wins or goals
            </span>
            <textarea
              {...form.register("wins")}
              rows={4}
              placeholder="Use line breaks to list what winning looks like."
              className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm"
            />
          </label>

          <label className="md:col-span-2 lg:col-span-3">
            <span className="text-sm font-semibold text-slate-700">
              Schedule notes
            </span>
            <textarea
              {...form.register("scheduleNotes")}
              rows={4}
              placeholder="Key meetings, rituals, or blockers to remember."
              className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm"
            />
          </label>

          <div className="md:col-span-2 lg:col-span-3 flex flex-wrap items-center gap-3">
            <button
              type="submit"
              disabled={status === "saving"}
              className="rounded-xl bg-slate-900 px-8 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-wait"
            >
              {isEditing ? "Update weekly plan" : "Save weekly plan"}
            </button>
            {isEditing && (
              <button
                type="button"
                onClick={handleCancelEdit}
                className="text-sm font-semibold text-slate-500 underline-offset-4 hover:underline"
              >
                Cancel edit
              </button>
            )}
          </div>
        </form>
      </section>

      <section className="glass-panel p-6">
        <header className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-slate-900">Recent plans</h2>
          <p className="text-sm text-slate-500">
            {sortedPlans.length} saved to your workspace
          </p>
        </header>
        {sortedPlans.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500">
            You have not captured a weekly plan yet.
          </p>
        ) : (
          <ul className="space-y-3">
            {sortedPlans.map((plan) => (
              <li
                key={plan.id}
                className="rounded-2xl border border-slate-100 bg-white p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      Week {plan.weekOfMonth}, {formatMonth(plan.month)} {plan.year}
                    </p>
                    <p className="text-sm text-slate-500">{plan.focus}</p>
                  </div>
                  <div className="flex gap-2 text-xs font-semibold text-slate-500">
                    <button
                      type="button"
                      onClick={() => handleEditPlan(plan.id)}
                      className="rounded-full border border-slate-200 px-2 py-1 text-xs transition hover:border-slate-300"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeletePlan(plan.id)}
                      className="rounded-full border border-rose-200 px-2 py-1 text-xs text-rose-600 transition hover:border-rose-300"
                    >
                      Delete
                    </button>
                  </div>
                </div>
                <ul className="mt-2 list-disc space-y-1 pl-4 text-xs text-slate-500">
                  {plan.wins.map((win) => (
                    <li key={win}>{win}</li>
                  ))}
                </ul>
                {plan.scheduleNotes && (
                  <p className="mt-3 text-xs text-slate-500">
                    Notes: {plan.scheduleNotes}
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
      {toast && (
        <div
          className={`fixed top-6 right-6 rounded-2xl px-5 py-3 text-sm font-semibold text-white shadow-xl ${
            toast.tone === "success" ? "bg-emerald-600" : "bg-rose-600"
          }`}
        >
          {toast.message}
        </div>
      )}
      {pendingDelete && (
        <div className="fixed inset-0 z-40 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/30" onClick={() => setPendingDelete(null)} />
          <div className="relative z-10 max-w-sm rounded-2xl bg-white p-6 text-center shadow-xl">
            <p className="text-lg font-semibold text-slate-900">Delete this plan?</p>
            <p className="mt-2 text-sm text-slate-500">
              This action cannot be undone.
            </p>
            <div className="mt-4 flex justify-center gap-3">
              <button
                onClick={confirmDeletePlan}
                className="rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-500"
              >
                Delete
              </button>
              <button
                onClick={() => setPendingDelete(null)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:border-slate-300"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
