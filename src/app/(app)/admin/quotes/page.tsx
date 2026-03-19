"use client";

import { useEffect, useState } from "react";
import QuoteManager from "@/components/admin/quote-manager";
import { useAuth } from "@/contexts/auth-provider";
import {
  deleteMotivationalQuote,
  fetchMotivationalQuotes,
  insertAuditLog,
  insertMotivationalQuote,
  updateMotivationalQuote,
} from "@/lib/supabase/repositories";
import type { MotivationalQuote, QuotePlacement } from "@/types/admin";

type QuoteDraft = {
  quoteText: string;
  author: string;
  placements: QuotePlacement[];
  active: boolean;
};

export default function AdminQuotesPage() {
  const { user } = useAuth();
  const [quotes, setQuotes] = useState<MotivationalQuote[] | null>(null);

  async function loadQuotes() {
    const rows = await fetchMotivationalQuotes({ includeInactive: true });
    setQuotes(rows);
  }

  useEffect(() => {
    if (!user?.id) {
      return;
    }

    let isMounted = true;

    insertAuditLog({ actorId: user.id, action: "admin_view_quotes" });

    fetchMotivationalQuotes({ includeInactive: true })
      .then((rows) => {
        if (isMounted) {
          setQuotes(rows);
        }
      })
      .catch((error) => {
        console.error("Failed to load motivational quotes", error);
      });

    return () => {
      isMounted = false;
    };
  }, [user]);

  async function handleCreate(draft: QuoteDraft) {
    if (!user?.id) return;

    await insertMotivationalQuote({
      quoteText: draft.quoteText,
      author: draft.author,
      placements: draft.placements,
      active: draft.active,
      createdBy: user.id,
    });
    await insertAuditLog({
      actorId: user.id,
      action: "create_quote",
      resource: "motivational_quotes",
      metadata: { placements: draft.placements, author: draft.author || null },
    });
    await loadQuotes();
  }

  async function handleUpdate(quoteId: string, draft: QuoteDraft) {
    if (!user?.id) return;

    await updateMotivationalQuote({
      quoteId,
      quoteText: draft.quoteText,
      author: draft.author,
      placements: draft.placements,
      active: draft.active,
    });
    await insertAuditLog({
      actorId: user.id,
      action: "update_quote",
      resource: "motivational_quotes",
      metadata: { quoteId, placements: draft.placements, active: draft.active },
    });
    await loadQuotes();
  }

  async function handleDelete(quoteId: string) {
    if (!user?.id) return;

    await deleteMotivationalQuote(quoteId);
    await insertAuditLog({
      actorId: user.id,
      action: "delete_quote",
      resource: "motivational_quotes",
      metadata: { quoteId },
    });
    await loadQuotes();
  }

  if (!quotes) {
    return (
      <div className="glass-panel flex h-64 items-center justify-center text-sm text-slate-500">
        Loading quotes...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Motivational Quotes</h1>
        <p className="mt-1 text-sm text-slate-500">
          Add exact quote text, optional author, and choose where each quote should appear.
        </p>
      </div>

      <QuoteManager
        quotes={quotes}
        onCreate={handleCreate}
        onUpdate={handleUpdate}
        onDelete={handleDelete}
      />
    </div>
  );
}
