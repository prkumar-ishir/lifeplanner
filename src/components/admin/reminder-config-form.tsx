"use client";

import { useState } from "react";
import type { ReminderFrequency } from "@/types/admin";

type Props = {
  targetUserId: string;
  email: string;
  initialFrequency?: ReminderFrequency;
  initialDayOfWeek?: number | null;
  initialTimeOfDay?: string;
  initialActive?: boolean;
  onSave: (config: {
    targetUserId: string;
    frequency: ReminderFrequency;
    dayOfWeek: number | null;
    timeOfDay: string;
    active: boolean;
  }) => Promise<void>;
};

const FREQUENCY_OPTIONS: { label: string; value: ReminderFrequency }[] = [
  { label: "None", value: "none" },
  { label: "Daily", value: "daily" },
  { label: "Weekly", value: "weekly" },
  { label: "Bi-weekly", value: "biweekly" },
  { label: "Monthly", value: "monthly" },
];

const DAY_OPTIONS = [
  { label: "Sunday", value: 0 },
  { label: "Monday", value: 1 },
  { label: "Tuesday", value: 2 },
  { label: "Wednesday", value: 3 },
  { label: "Thursday", value: 4 },
  { label: "Friday", value: 5 },
  { label: "Saturday", value: 6 },
];

export default function ReminderConfigForm({
  targetUserId,
  email,
  initialFrequency = "none",
  initialDayOfWeek = null,
  initialTimeOfDay = "09:00",
  initialActive = true,
  onSave,
}: Props) {
  const [frequency, setFrequency] = useState<ReminderFrequency>(initialFrequency);
  const [dayOfWeek, setDayOfWeek] = useState<number | null>(initialDayOfWeek);
  const [timeOfDay, setTimeOfDay] = useState(initialTimeOfDay);
  const [active, setActive] = useState(initialActive);
  const [saving, setSaving] = useState(false);

  const showDayPicker = frequency === "weekly" || frequency === "biweekly";

  async function handleSave() {
    setSaving(true);
    try {
      await onSave({
        targetUserId,
        frequency,
        dayOfWeek: showDayPicker ? dayOfWeek : null,
        timeOfDay,
        active,
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-100 bg-white/70 px-4 py-3">
      <span className="min-w-[140px] text-sm font-medium text-slate-700">
        {email}
      </span>

      <select
        value={frequency}
        onChange={(e) => setFrequency(e.target.value as ReminderFrequency)}
        className="rounded-lg border border-slate-200 px-2 py-1 text-sm"
      >
        {FREQUENCY_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>

      {showDayPicker && (
        <select
          value={dayOfWeek ?? ""}
          onChange={(e) =>
            setDayOfWeek(e.target.value ? Number(e.target.value) : null)
          }
          className="rounded-lg border border-slate-200 px-2 py-1 text-sm"
        >
          <option value="">Day…</option>
          {DAY_OPTIONS.map((d) => (
            <option key={d.value} value={d.value}>
              {d.label}
            </option>
          ))}
        </select>
      )}

      <input
        type="time"
        value={timeOfDay}
        onChange={(e) => setTimeOfDay(e.target.value)}
        className="rounded-lg border border-slate-200 px-2 py-1 text-sm"
      />

      <label className="flex items-center gap-1.5 text-sm text-slate-600">
        <input
          type="checkbox"
          checked={active}
          onChange={(e) => setActive(e.target.checked)}
          className="rounded"
        />
        Active
      </label>

      <button
        onClick={handleSave}
        disabled={saving}
        className="rounded-lg bg-brand px-4 py-1.5 text-sm font-medium text-white transition hover:bg-brand-dark disabled:opacity-50"
      >
        {saving ? "Saving…" : "Save"}
      </button>
    </div>
  );
}
