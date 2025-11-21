"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import SidebarNav from "@/components/navigation/sidebar-nav";
import { useAuth } from "@/contexts/auth-provider";
import { usePlannerDataSync } from "@/hooks/usePlannerDataSync";

type Props = {
  children: ReactNode;
};

/**
 * AppShell wraps every authenticated route with global chrome (header + sidebar) and
 * gates access until auth + Supabase hydration complete.
 */
export default function AppShell({ children }: Props) {
  const { user, loading, signOut } = useAuth();
  const { isHydrated } = usePlannerDataSync();

  // `workspace` renders the right glass panel for loading, auth, syncing, or content states.
  const workspace = (() => {
    // Loading, unauthenticated, and syncing states share the same glass panel wrapper
    // so page transitions feel consistent across the app.
    if (loading) {
      return (
        <div className="glass-panel flex h-full w-full items-center justify-center p-12 text-sm text-slate-500">
          Loading workspace…
        </div>
      );
    }

    if (!user) {
      return (
        <div className="glass-panel flex h-full w-full flex-col items-center justify-center gap-4 p-12 text-center">
          <p className="text-lg font-semibold text-slate-900">
            Sign in to access your planner.
          </p>
          <p className="text-sm text-slate-500">
            Your entries stay synced to Supabase once you are authenticated.
          </p>
          <Link
            href="/signin"
            className="rounded-xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            Go to sign in
          </Link>
        </div>
      );
    }

    if (!isHydrated) {
      return (
        <div className="glass-panel flex h-full w-full items-center justify-center p-12 text-sm text-slate-500">
          Syncing your latest entries…
        </div>
      );
    }

    return children;
  })();

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center px-6 py-4">
          <div className="flex flex-1 items-center">
            <Link
              href="/"
              className="text-xs font-semibold uppercase tracking-[0.4em] text-brand-dark"
            >
              Life Planner
            </Link>
          </div>
          <div className="flex flex-shrink-0 items-center gap-3">
            {user ? (
              <button
                onClick={() => signOut()}
                className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:border-slate-300"
              >
                Sign out
              </button>
            ) : (
              <Link
                href="/signin"
                className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
              >
                Sign in
              </Link>
            )}
          </div>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-6 py-10 pb-24 md:flex-row">
        <aside className="md:w-64">
          <SidebarNav />
        </aside>
        <main className="flex-1">{workspace}</main>
      </div>
    </div>
  );
}
