"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/contexts/auth-provider";
import { fetchAuditLogs, insertAuditLog } from "@/lib/supabase/repositories";
import type { AuditLogRow } from "@/types/admin";
import AuditLogTable from "@/components/admin/audit-log-table";

const PAGE_SIZE = 50;

export default function AuditPage() {
  const { user } = useAuth();
  const [logs, setLogs] = useState<AuditLogRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);

  useEffect(() => {
    if (!user?.id) return;

    insertAuditLog({ actorId: user.id, action: "admin_view_audit" });

    fetchAuditLogs({ limit: PAGE_SIZE }).then((data) => {
      setLogs(data);
      setHasMore(data.length >= PAGE_SIZE);
      setLoading(false);
    });
  }, [user?.id]);

  const loadMore = useCallback(() => {
    fetchAuditLogs({ limit: PAGE_SIZE, offset: logs.length }).then((data) => {
      setLogs((prev) => [...prev, ...data]);
      setHasMore(data.length >= PAGE_SIZE);
    });
  }, [logs.length]);

  if (loading) {
    return (
      <div className="glass-panel flex h-64 items-center justify-center text-sm text-slate-500">
        Loading audit logs…
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Audit Logs</h1>
        <p className="mt-1 text-sm text-slate-500">
          Track all access and changes across the platform.
        </p>
      </div>

      <div className="glass-panel p-6">
        <AuditLogTable logs={logs} onLoadMore={loadMore} hasMore={hasMore} />
      </div>
    </div>
  );
}
