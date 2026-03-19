"use client";

import { useMemo, useState } from "react";
import type { MotivationalQuote, QuotePlacement } from "@/types/admin";

type QuoteDraft = {
  quoteText: string;
  author: string;
  placements: QuotePlacement[];
  active: boolean;
};

type Props = {
  quotes: MotivationalQuote[];
  onCreate: (draft: QuoteDraft) => Promise<void>;
  onUpdate: (quoteId: string, draft: QuoteDraft) => Promise<void>;
  onDelete: (quoteId: string) => Promise<void>;
};

const placementOptions: { value: QuotePlacement; label: string }[] = [
  { value: "onboarding", label: "Onboarding" },
  { value: "dashboard", label: "Dashboard" },
  { value: "planner", label: "Planner Flow" },
  { value: "weekly_planner", label: "Weekly Planner" },
];

const emptyDraft: QuoteDraft = {
  quoteText: "",
  author: "",
  placements: ["dashboard"],
  active: true,
};

function placementLabel(placements: QuotePlacement[]) {
  return placementOptions
    .filter((option) => placements.includes(option.value))
    .map((option) => option.label)
    .join(", ");
}

function QuoteForm({
  title,
  actionLabel,
  initialValue,
  onSubmit,
  onCancel,
}: {
  title: string;
  actionLabel: string;
  initialValue: QuoteDraft;
  onSubmit: (draft: QuoteDraft) => Promise<void>;
  onCancel?: () => void;
}) {
  const [draft, setDraft] = useState<QuoteDraft>(initialValue);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    try {
      await onSubmit({
        ...draft,
        quoteText: draft.quoteText,
        author: draft.author,
      });
      if (!onCancel) {
        setDraft(emptyDraft);
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5" onSubmit={handleSubmit}>
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
          <p className="mt-1 text-xs text-slate-500">
            Quotes are stored exactly as entered. No automatic text changes are applied.
          </p>
        </div>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-600"
          >
            Cancel
          </button>
        )}
      </div>

      <label className="flex flex-col gap-2">
        <span className="text-sm font-medium text-slate-700">Quote</span>
        <textarea
          required
          rows={5}
          value={draft.quoteText}
          onChange={(event) => setDraft((prev) => ({ ...prev, quoteText: event.target.value }))}
          className="rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900"
        />
      </label>

      <label className="flex flex-col gap-2">
        <span className="text-sm font-medium text-slate-700">Author</span>
        <input
          value={draft.author}
          onChange={(event) => setDraft((prev) => ({ ...prev, author: event.target.value }))}
          className="rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900"
          placeholder="Optional"
        />
      </label>

      <div className="space-y-2">
        <span className="text-sm font-medium text-slate-700">Show on</span>
        <div className="grid gap-2 sm:grid-cols-2">
          {placementOptions.map((option) => {
            const checked = draft.placements.includes(option.value);
            return (
              <label
                key={option.value}
                className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700"
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={(event) => {
                    setDraft((prev) => ({
                      ...prev,
                      placements: event.target.checked
                        ? Array.from(new Set([...prev.placements, option.value]))
                        : prev.placements.filter((placement) => placement !== option.value),
                    }));
                  }}
                />
                {option.label}
              </label>
            );
          })}
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm text-slate-700">
        <input
          type="checkbox"
          checked={draft.active}
          onChange={(event) => setDraft((prev) => ({ ...prev, active: event.target.checked }))}
        />
        Active
      </label>

      <button
        type="submit"
        disabled={saving || draft.placements.length === 0 || !draft.quoteText.trim()}
        className="rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-dark disabled:opacity-50"
      >
        {saving ? "Saving..." : actionLabel}
      </button>
    </form>
  );
}

export default function QuoteManager({ quotes, onCreate, onUpdate, onDelete }: Props) {
  const [editingQuoteId, setEditingQuoteId] = useState<string | null>(null);
  const editingQuote = useMemo(
    () => quotes.find((quote) => quote.id === editingQuoteId) ?? null,
    [editingQuoteId, quotes]
  );

  return (
    <div className="space-y-6">
      <QuoteForm
        key="create-quote"
        title="Add motivational quote"
        actionLabel="Add quote"
        initialValue={emptyDraft}
        onSubmit={onCreate}
      />

      <div className="space-y-4">
        {editingQuote && (
          <QuoteForm
            key={editingQuote.id}
            title="Edit quote"
            actionLabel="Save changes"
            initialValue={{
              quoteText: editingQuote.quote_text,
              author: editingQuote.author ?? "",
              placements: editingQuote.placements,
              active: editingQuote.active,
            }}
            onSubmit={(draft) => onUpdate(editingQuote.id, draft).then(() => setEditingQuoteId(null))}
            onCancel={() => setEditingQuoteId(null)}
          />
        )}

        {quotes.map((quote) => (
          <article
            key={quote.id}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="max-w-4xl">
                <p className="text-base font-medium leading-7 text-slate-900">
                  {quote.quote_text}
                </p>
                {quote.author && (
                  <p className="mt-3 text-sm font-semibold text-slate-600">~ {quote.author} ~</p>
                )}
                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                    {placementLabel(quote.placements)}
                  </span>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      quote.active
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {quote.active ? "Active" : "Inactive"}
                  </span>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setEditingQuoteId(quote.id)}
                  className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-600"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(quote.id)}
                  className="rounded-lg border border-rose-200 px-3 py-2 text-sm text-rose-600"
                >
                  Delete
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
