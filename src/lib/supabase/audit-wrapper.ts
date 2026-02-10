import { insertAuditLog } from "./repositories";
import type { AuditAction } from "@/types/admin";

/**
 * Wraps a repository function call with an audit log entry.
 * Applied selectively to sensitive operations (admin access, exports, deletions)
 * rather than every routine query.
 */
export async function withAudit<T>(
  action: AuditAction,
  resource: string,
  fn: () => Promise<T>,
  actorId: string,
  targetUserId?: string
): Promise<T> {
  const result = await fn();

  await insertAuditLog({
    actorId,
    targetUserId,
    action,
    resource,
  }).catch((err) => {
    console.warn("Audit log insertion failed:", err);
  });

  return result;
}
