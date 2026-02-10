"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/contexts/auth-provider";
import {
  fetchUserConsent,
  upsertConsent,
  insertAuditLog,
} from "@/lib/supabase/repositories";
import type { ConsentRecord, ConsentType } from "@/types/admin";

export function useConsent() {
  const { user } = useAuth();
  const [consents, setConsents] = useState<ConsentRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) {
      setConsents([]);
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    fetchUserConsent(user.id).then((records) => {
      if (!cancelled) {
        setConsents(records);
        setIsLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  const hasConsent = useCallback(
    (type: ConsentType) =>
      consents.some((c) => c.consent_type === type && c.granted),
    [consents]
  );

  const grantConsent = useCallback(
    async (type: ConsentType) => {
      if (!user?.id) return;
      await upsertConsent(user.id, type, true);
      await insertAuditLog({
        actorId: user.id,
        action: "consent_granted",
        resource: type,
      });
      setConsents((prev) => {
        const existing = prev.find((c) => c.consent_type === type);
        if (existing) {
          return prev.map((c) =>
            c.consent_type === type
              ? { ...c, granted: true, granted_at: new Date().toISOString(), revoked_at: null }
              : c
          );
        }
        return [
          ...prev,
          {
            id: crypto.randomUUID(),
            user_id: user.id,
            consent_type: type,
            granted: true,
            granted_at: new Date().toISOString(),
            revoked_at: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ];
      });
    },
    [user?.id]
  );

  const revokeConsent = useCallback(
    async (type: ConsentType) => {
      if (!user?.id) return;
      await upsertConsent(user.id, type, false);
      await insertAuditLog({
        actorId: user.id,
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
    },
    [user?.id]
  );

  return { consents, hasConsent, grantConsent, revokeConsent, isLoading };
}
