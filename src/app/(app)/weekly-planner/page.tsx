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

type WeeklyPlannerForm = Record<string, string | number>;

const todayIso = new Date().toISOString().slice(0, 10);

const dayConfigs = [
  { key: "mon", label: "MON" },
  { key: "tue", label: "TUE" },
  { key: "wed", label: "WED" },
] as const;

const actionStepConfigs = [
  { key: "self", label: "SELF", rows: 4 },
  { key: "body", label: "BODY", rows: 7 },
  { key: "family", label: "FAMILY", rows: 5 },
  { key: "professional", label: "PROFESSIONAL", rows: 6 },
] as const;

const focusItemsPerDay = 3;
const taskItemsPerDay = 8;
const appointmentItemsPerDay = 3;
const tinyChecksPerSection = 2;

function createEmptyWeeklyForm(
  startDate = todayIso
): WeeklyPlannerForm {
  const values: WeeklyPlannerForm = {
    startDate,
  };

  for (const action of actionStepConfigs) {
    values[`action_${action.key}`] = "";
  }

  for (const day of dayConfigs) {
    values[`${day.key}_date`] = "";
    values[`${day.key}_grateful_for`] = "";
    values[`${day.key}_wins`] = "";
    values[`${day.key}_productivity_score`] = "";
    values[`${day.key}_happiness_score`] = "";

    for (let index = 1; index <= focusItemsPerDay; index += 1) {
      values[`${day.key}_focus_${index}_text`] = "";
      values[`${day.key}_focus_${index}_done`] = "false";
    }

    for (let index = 1; index <= taskItemsPerDay; index += 1) {
      values[`${day.key}_task_${index}_text`] = "";
      values[`${day.key}_task_${index}_done`] = "false";
    }

    for (let index = 1; index <= appointmentItemsPerDay; index += 1) {
      values[`${day.key}_appointment_${index}_text`] = "";
      values[`${day.key}_appointment_${index}_done`] = "false";
    }

    for (let index = 1; index <= tinyChecksPerSection; index += 1) {
      values[`${day.key}_daily_routine_${index}`] = "false";
      values[`${day.key}_habit_${index}`] = "false";
    }
  }

  return values;
}

function buildWeeklyPlanData(values: WeeklyPlannerForm) {
  return Object.entries(values).reduce<Record<string, string>>((acc, [key, value]) => {
    if (key === "startDate") {
      return acc;
    }
    acc[key] = String(value ?? "");
    return acc;
  }, {});
}

function addDays(dateString: string, days: number) {
  const date = new Date(`${dateString}T00:00:00`);
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

function getWeekOfMonth(dateString: string) {
  const date = new Date(`${dateString}T00:00:00`);
  return Math.ceil(date.getDate() / 7);
}

function buildWeeklyFocus(data: Record<string, string>) {
  return actionStepConfigs
    .map((action) => data[`action_${action.key}`]?.trim())
    .filter(Boolean)
    .join(" | ");
}

function buildWeeklyWins(data: Record<string, string>) {
  return dayConfigs
    .map((day) => data[`${day.key}_wins`]?.trim())
    .filter(Boolean)
    .map((value, index) => `${dayConfigs[index].label}: ${value}`);
}

function buildWeeklyScheduleNotes(data: Record<string, string>) {
  const notes = dayConfigs.flatMap((day) => {
    const appointments = Array.from({ length: appointmentItemsPerDay }, (_, index) =>
      data[`${day.key}_appointment_${index + 1}_text`]?.trim()
    ).filter(Boolean);

    if (appointments.length === 0) {
      return [];
    }

    return [`${day.label}: ${appointments.join(", ")}`];
  });

  return notes.join(" | ");
}

function createFormValuesFromPlan(plan: {
  year: number;
  month: number;
  weekOfMonth: number;
  startDate: string;
  focus: string;
  wins: string[];
  scheduleNotes: string;
  data: Record<string, string>;
}) {
  const inferredStartDate = plan.startDate || plan.data?.start_date || plan.data?.mon_date || todayIso;
  const base = createEmptyWeeklyForm(inferredStartDate);

  for (const [key, value] of Object.entries(plan.data ?? {})) {
    base[key] = value;
  }

  base.startDate = inferredStartDate;

  if (!plan.data || Object.keys(plan.data).length === 0) {
    base.action_professional = plan.focus ?? "";
    base.mon_wins = plan.wins.join("\n");
    base.mon_appointment_1_text = plan.scheduleNotes ?? "";
  }

  return base;
}

/**
 * WeeklyPlannerPage captures a structured weekly board and persists it as both
 * a detailed JSON payload and lightweight summaries for downstream surfaces.
 */
export default function WeeklyPlannerPage() {
  const saveWeeklyPlan = usePlannerStore((state) => state.saveWeeklyPlan);
  const removeWeeklyPlan = usePlannerStore((state) => state.removeWeeklyPlan);
  const weeklyPlans = usePlannerStore((state) => state.weeklyPlans);
  const { user } = useAuth();
  const [status, setStatus] = useState<"idle" | "saving">("idle");
  const [toast, setToast] = useState<null | {
    message: string;
    tone: "success" | "error";
  }>(null);
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);

  const form = useForm<WeeklyPlannerForm>({
    defaultValues: createEmptyWeeklyForm(),
  });
  const isEditing = Boolean(editingPlanId);
  const startDate = String(form.watch("startDate") || todayIso);
  const visibleDates = useMemo(
    () => dayConfigs.map((_, index) => addDays(startDate, index)),
    [startDate]
  );

  useEffect(() => {
    dayConfigs.forEach((day, index) => {
      form.setValue(`${day.key}_date`, visibleDates[index], {
        shouldDirty: false,
        shouldTouch: false,
      });
    });
  }, [form, visibleDates]);

  const sortedPlans = useMemo(
    () =>
      Object.values(weeklyPlans).sort((a, b) =>
        b.createdAt.localeCompare(a.createdAt)
      ),
    [weeklyPlans]
  );

  useEffect(() => {
    if (!toast) return;
    const timeout = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(timeout);
  }, [toast]);

  const onSubmit = form.handleSubmit(async (values) => {
    setStatus("saving");
    const startDateValue = String(values.startDate || todayIso);
    const data = buildWeeklyPlanData(values);
    data.start_date = startDateValue;
    const start = new Date(`${startDateValue}T00:00:00`);
    const year = start.getFullYear();
    const month = start.getMonth() + 1;
    const weekOfMonth = getWeekOfMonth(startDateValue);
    const existingPlan = editingPlanId ? weeklyPlans[editingPlanId] : null;

    const payload = {
      id: startDateValue,
      year,
      month,
      weekOfMonth,
      startDate: startDateValue,
      focus: buildWeeklyFocus(data),
      wins: buildWeeklyWins(data),
      scheduleNotes: buildWeeklyScheduleNotes(data),
      data,
      createdAt: existingPlan?.createdAt ?? new Date().toISOString(),
      userId: user?.id,
    };

    try {
      saveWeeklyPlan(payload);
      await persistWeeklyPlan(payload);
      setToast({
        message: isEditing ? "Weekly planner updated." : "Weekly planner saved.",
        tone: "success",
      });
      setEditingPlanId(null);
      form.reset(createEmptyWeeklyForm());
    } catch (error) {
      console.error("Failed to save weekly planner", error);
      setToast({
        message: "Could not save the weekly planner. Please try again.",
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
    form.reset(createFormValuesFromPlan(plan));
  };

  const handleCancelEdit = () => {
    setEditingPlanId(null);
    form.reset(createEmptyWeeklyForm());
  };

  const handleDeletePlan = (planId: string) => {
    if (!user?.id) {
      setToast({
        message: "Sign in to delete saved weekly plans.",
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
      setToast({ message: "Weekly planner deleted.", tone: "success" });
    } catch (error) {
      console.error("Failed to delete weekly planner", error);
      setToast({
        message: "Could not delete the weekly planner. Please try again.",
        tone: "error",
      });
    } finally {
      setPendingDelete(null);
    }
  };

  return (
    <div className="space-y-8 pb-12">
      <section className="glass-panel space-y-6 p-5 md:p-6">
        <header className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Weekly planner
          </p>
          <h1 className="text-3xl font-semibold text-slate-900">WEEKLY PLANNER</h1>
          <p className="text-sm text-slate-500">
            Capture your action steps and your Monday to Wednesday execution board.
          </p>
        </header>

        <form className="space-y-6" onSubmit={onSubmit}>
          <div className="grid gap-4 md:grid-cols-1">
            <label className="flex flex-col gap-2">
              <span className="text-sm font-semibold text-slate-700">Start date</span>
              <input
                type="date"
                {...form.register("startDate")}
                className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm"
              />
            </label>
          </div>

          <div className="scroll-thin overflow-x-auto pr-2 pb-1">
            <div className="min-w-[1080px] overflow-hidden rounded-3xl border border-slate-200 bg-white">
              <div className="grid grid-cols-[220px_repeat(3,minmax(0,1fr))]">
                <div className="border-r border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700">
                  LIST ACTION STEPS
                </div>
                {dayConfigs.map((day) => (
                  <div
                    key={day.key}
                    className="border-r border-slate-200 bg-slate-50 px-4 py-3 last:border-r-0"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-sm font-semibold text-slate-700">{day.label}</span>
                      <span className="rounded-lg border border-slate-200 bg-white px-3 py-1 text-xs text-slate-700">
                        {new Date(`${visibleDates[dayConfigs.findIndex((config) => config.key === day.key)]}T00:00:00`).toLocaleDateString(
                          undefined,
                          { day: "2-digit", month: "short", year: "numeric" }
                        )}
                      </span>
                    </div>
                  </div>
                ))}

                <div className="border-r border-t border-slate-200 p-4">
                  {actionStepConfigs.map((action) => (
                    <label key={action.key} className="mb-4 block last:mb-0">
                      <span className="mb-2 block bg-slate-700 px-3 py-2 text-xs font-semibold text-white">
                        {action.label}
                      </span>
                      <textarea
                        {...form.register(`action_${action.key}`)}
                        rows={action.rows}
                        className="w-full resize-none border-b border-slate-200 px-1 py-2 text-sm text-slate-900 outline-none"
                      />
                    </label>
                  ))}
                </div>

                {dayConfigs.map((day) => (
                  <WeeklyDayColumn
                    key={day.key}
                    dayKey={day.key}
                    form={form}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="submit"
              disabled={status === "saving"}
              className="rounded-xl bg-brand px-8 py-3 text-sm font-semibold text-white transition hover:bg-brand-dark disabled:cursor-wait"
            >
              {isEditing ? "Update weekly planner" : "Save weekly planner"}
            </button>
            {isEditing && (
              <button
                type="button"
                onClick={handleCancelEdit}
                className="rounded-xl border border-slate-200 px-6 py-3 text-sm font-semibold text-slate-600 transition hover:border-slate-300"
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
                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-slate-900">
                      Week {plan.weekOfMonth}, {formatMonth(plan.month)} {plan.year}
                    </p>
                    <p className="text-sm text-slate-600">
                      {plan.focus || "No action-step summary yet."}
                    </p>
                  </div>
                  <div className="flex gap-2 text-xs font-semibold text-slate-500">
                    <button
                      type="button"
                      onClick={() => handleEditPlan(plan.id)}
                      className="rounded-full border border-slate-200 px-2 py-1 transition hover:border-slate-300"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeletePlan(plan.id)}
                      className="rounded-full border border-rose-200 px-2 py-1 text-rose-600 transition hover:border-rose-300"
                    >
                      Delete
                    </button>
                  </div>
                </div>
                {plan.wins.length > 0 && (
                  <ul className="mt-3 list-disc space-y-1 pl-4 text-xs text-slate-500">
                    {plan.wins.map((win) => (
                      <li key={win}>{win}</li>
                    ))}
                  </ul>
                )}
                {plan.scheduleNotes && (
                  <p className="mt-3 text-xs text-slate-500">
                    Appointments: {plan.scheduleNotes}
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      {toast && (
        <div
          className={`fixed right-6 top-6 rounded-2xl px-5 py-3 text-sm font-semibold text-white shadow-xl ${
            toast.tone === "success" ? "bg-emerald-600" : "bg-rose-600"
          }`}
        >
          {toast.message}
        </div>
      )}

      {pendingDelete && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setPendingDelete(null)}
          />
          <div className="relative z-[210] max-w-sm rounded-2xl bg-white p-6 text-center shadow-xl">
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

type WeeklyDayColumnProps = {
  dayKey: (typeof dayConfigs)[number]["key"];
  form: ReturnType<typeof useForm<WeeklyPlannerForm>>;
};

function WeeklyDayColumn({ dayKey, form }: WeeklyDayColumnProps) {
  return (
    <div className="border-r border-t border-slate-200 p-4 last:border-r-0">
      <div className="space-y-4">
        <label className="block">
          <span className="mb-2 block bg-slate-700 px-3 py-2 text-xs font-semibold text-white">
            Grateful For
          </span>
          <textarea
            {...form.register(`${dayKey}_grateful_for`)}
            rows={4}
            className="w-full resize-none border-b border-slate-200 px-1 py-2 text-sm text-slate-900 outline-none"
          />
        </label>

        <WeeklyChecklistSection
          form={form}
          dayKey={dayKey}
          sectionKey="focus"
          title="Today's Focus"
          itemCount={focusItemsPerDay}
        />

        <WeeklyChecklistSection
          form={form}
          dayKey={dayKey}
          sectionKey="task"
          title="Tasks"
          itemCount={taskItemsPerDay}
        />

        <WeeklyChecklistSection
          form={form}
          dayKey={dayKey}
          sectionKey="appointment"
          title="Appointments"
          itemCount={appointmentItemsPerDay}
        />

        <label className="block">
          <span className="mb-2 block bg-slate-700 px-3 py-2 text-xs font-semibold text-white">
            Today&apos;s Wins/Learnings
          </span>
          <textarea
            {...form.register(`${dayKey}_wins`)}
            rows={4}
            className="w-full resize-none border-b border-slate-200 px-1 py-2 text-sm text-slate-900 outline-none"
          />
        </label>

        <div className="space-y-2 border-t border-slate-200 pt-3 text-sm">
          <ScoreField form={form} field={`${dayKey}_productivity_score`} label="Productivity Score" />
          <ScoreField form={form} field={`${dayKey}_happiness_score`} label="Happiness Score" />
          <TinyChecksRow
            form={form}
            dayKey={dayKey}
            prefix="daily_routine"
            label="Daily Routines"
          />
          <TinyChecksRow
            form={form}
            dayKey={dayKey}
            prefix="habit"
            label="Habits"
          />
        </div>
      </div>
    </div>
  );
}

type WeeklyChecklistSectionProps = {
  form: ReturnType<typeof useForm<WeeklyPlannerForm>>;
  dayKey: string;
  sectionKey: string;
  title: string;
  itemCount: number;
};

function WeeklyChecklistSection({
  form,
  dayKey,
  sectionKey,
  title,
  itemCount,
}: WeeklyChecklistSectionProps) {
  return (
    <div>
      <span className="mb-2 block bg-slate-700 px-3 py-2 text-xs font-semibold text-white">
        {title}
      </span>
      <div className="space-y-2">
        {Array.from({ length: itemCount }, (_, index) => {
          const itemNumber = index + 1;
          const textField = `${dayKey}_${sectionKey}_${itemNumber}_text`;
          const doneField = `${dayKey}_${sectionKey}_${itemNumber}_done`;

          return (
            <label key={textField} className="flex items-center gap-2">
              <input type="hidden" {...form.register(doneField)} />
              <input
                type="checkbox"
                checked={form.watch(doneField) === "true"}
                onChange={(event) =>
                  form.setValue(doneField, event.target.checked ? "true" : "false")
                }
                className="h-4 w-4 rounded border-slate-300"
              />
              <input
                {...form.register(textField)}
                className="w-full border-b border-slate-200 px-1 py-1 text-sm text-slate-900 outline-none"
              />
            </label>
          );
        })}
      </div>
    </div>
  );
}

type TinyChecksRowProps = {
  form: ReturnType<typeof useForm<WeeklyPlannerForm>>;
  dayKey: string;
  prefix: string;
  label: string;
};

function TinyChecksRow({ form, dayKey, prefix, label }: TinyChecksRowProps) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-xs font-medium text-slate-600">{label}</span>
      <div className="flex gap-2">
        {Array.from({ length: tinyChecksPerSection }, (_, index) => {
          const field = `${dayKey}_${prefix}_${index + 1}`;
          return (
            <label key={field}>
              <input type="hidden" {...form.register(field)} />
              <input
                type="checkbox"
                checked={form.watch(field) === "true"}
                onChange={(event) =>
                  form.setValue(field, event.target.checked ? "true" : "false")
                }
                className="h-4 w-4 rounded border-slate-300"
              />
            </label>
          );
        })}
      </div>
    </div>
  );
}

type ScoreFieldProps = {
  form: ReturnType<typeof useForm<WeeklyPlannerForm>>;
  field: string;
  label: string;
};

function ScoreField({ form, field, label }: ScoreFieldProps) {
  return (
    <label className="flex items-center justify-between gap-3">
      <span className="text-xs font-medium text-slate-600">{label}</span>
      <div className="flex items-center gap-2">
        <input
          {...form.register(field)}
          className="w-12 border-b border-slate-200 px-1 py-1 text-center text-sm text-slate-900 outline-none"
        />
        <span className="text-xs text-slate-500">/10</span>
      </div>
    </label>
  );
}
