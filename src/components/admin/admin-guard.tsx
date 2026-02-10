"use client";

import Link from "next/link";
import { useRole } from "@/contexts/role-provider";

/**
 * AdminGuard gates child content behind an admin role check.
 * Shows a loading state while the role is being fetched, then
 * an access-denied message for non-admins.
 */
export default function AdminGuard({ children }: { children: React.ReactNode }) {
  const { isAdmin, isLoading } = useRole();

  if (isLoading) {
    return (
      <div className="glass-panel flex h-64 items-center justify-center text-sm text-slate-500">
        Checking access…
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="glass-panel flex h-64 flex-col items-center justify-center gap-4 text-center">
        <p className="text-lg font-semibold text-slate-900">Access Denied</p>
        <p className="text-sm text-slate-500">
          You do not have admin permissions to view this page.
        </p>
        <Link
          href="/dashboard"
          className="rounded-xl bg-brand px-6 py-3 text-sm font-semibold text-white transition hover:bg-brand-dark"
        >
          Go to Dashboard
        </Link>
      </div>
    );
  }

  return <>{children}</>;
}
