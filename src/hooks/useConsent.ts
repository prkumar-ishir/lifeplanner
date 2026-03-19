"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/auth-provider";
import {
  fetchUserConsent,
  upsertConsent,
  insertAuditLog,
} from "@/lib/supabase/repositories";
import type { ConsentRecord, ConsentType } from "@/types/admin";

export function useConsent() {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const [consents, setConsents] = useState<ConsentRecord[]>([]);
  const [loadedUserId, setLoadedUserId] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      return;
    }

    let cancelled = false;
    fetchUserConsent(userId)
      .then((records) => {
        if (!cancelled) {
          setConsents(records);
        }
      })
      .catch((error) => {
        console.error("Failed to load consent preferences", error);
        if (!cancelled) {
          setConsents([]);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoadedUserId(userId);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const visibleConsents = userId ? consents : [];
  const isLoading = Boolean(userId) && loadedUserId !== userId;
  const hasConsent = (type: ConsentType) =>
    visibleConsents.some((c) => c.consent_type === type && c.granted);

  async function grantConsent(type: ConsentType) {
    if (!userId) return;
    await upsertConsent(userId, type, true);
    await insertAuditLog({
      actorId: userId,
      action: "consent_granted",
      resource: type,
    });
    setConsents((prev) => {
      const now = new Date().toISOString();
      const existing = prev.find((c) => c.consent_type === type);
      if (existing) {
        return prev.map((c) =>
          c.consent_type === type
            ? { ...c, granted: true, granted_at: now, revoked_at: null }
            : c
        );
      }
      return [
        ...prev,
        {
          id: crypto.randomUUID(),
          user_id: userId,
          consent_type: type,
          granted: true,
          granted_at: now,
          revoked_at: null,
          created_at: now,
          updated_at: now,
        },
      ];
    });
  }

  async function revokeConsent(type: ConsentType) {
    if (!userId) return;
    await upsertConsent(userId, type, false);
    await insertAuditLog({
      actorId: userId,
      action: "consent_revoked",
      resource: type,
    });
    setConsents((prev) =>
      prev.map((c) =>
        c.consent_type === type
          ? { ...c, granted: false, revoked_at: new Date().toISOString() }
          : c
      )
    );
  }

  return {
    consents: visibleConsents,
    hasConsent,
    grantConsent,
    revokeConsent,
    isLoading,
    canCollectData: hasConsent("data_collection"),
    canAcknowledgeRetention: hasConsent("data_retention"),
    canExportData: hasConsent("data_export"),
  };
}
