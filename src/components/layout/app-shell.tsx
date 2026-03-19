"use client";

import { useState } from "react";
import Link from "next/link";
import type { ReactNode } from "react";
import SidebarNav from "@/components/navigation/sidebar-nav";
import PlacementQuote from "@/components/quotes/placement-quote";
import { useAuth } from "@/contexts/auth-provider";
import { useRole } from "@/contexts/role-provider";
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
  const { isAdmin } = useRole();
  const { isHydrated } = usePlannerDataSync();
  const [onboardingStepByUser, setOnboardingStepByUser] = useState<
    Record<string, "welcome" | "intro">
  >({});
  const [dismissedOnboardingByUser, setDismissedOnboardingByUser] = useState<
    Record<string, boolean>
  >({});

  const onboardingStep = user ? onboardingStepByUser[user.id] ?? "welcome" : null;
  const shouldShowOnboarding = (() => {
    if (!user || dismissedOnboardingByUser[user.id] || typeof window === "undefined") {
      return false;
    }
    const pendingEmail = window.localStorage
      .getItem("lifePlannerOnboardingPendingEmail")
      ?.trim()
      .toLowerCase();
    const completedKey = `lifePlannerOnboardingCompleted:${user.id}`;
    const hasCompleted = window.localStorage.getItem(completedKey) === "1";
    const isPendingForUser = Boolean(
      pendingEmail && user.email && pendingEmail === user.email.trim().toLowerCase()
    );
    return !hasCompleted && isPendingForUser;
  })();

  function handleOnboardingClose() {
    if (!user) {
      return;
    }
    window.localStorage.setItem(`lifePlannerOnboardingCompleted:${user.id}`, "1");
    window.localStorage.removeItem("lifePlannerOnboardingPendingEmail");
    setDismissedOnboardingByUser((prev) => ({ ...prev, [user.id]: true }));
  }

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
            className="rounded-xl bg-brand px-6 py-3 text-sm font-semibold text-white transition hover:bg-brand-dark"
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
              <>
                {isAdmin && (
                  <Link
                    href="/admin"
                    className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:border-slate-300"
                  >
                    Admin
                  </Link>
                )}
                <Link
                  href="/settings"
                  className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:border-slate-300"
                >
                  Settings
                </Link>
                <button
                  onClick={() => signOut()}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:border-slate-300"
                >
                  Sign out
                </button>
              </>
            ) : (
              <Link
                href="/signin"
                className="rounded-xl bg-brand px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-dark"
              >
                Sign in
              </Link>
            )}
          </div>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-6 py-10 pb-24 md:items-start md:flex-row">
        <aside className="group/sidebar self-start md:w-20 md:flex-shrink-0 md:transition-all md:duration-300 md:hover:w-64">
          <SidebarNav />
        </aside>
        <main className="flex-1">{workspace}</main>
      </div>

      {shouldShowOnboarding && onboardingStep && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/60 p-4">
          <div className="glass-panel w-full max-w-3xl rounded-2xl bg-white p-6 shadow-2xl md:p-8">
            {onboardingStep === "welcome" ? (
              <>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                  Life Planner
                </p>
                <div className="mt-5 space-y-4 text-base leading-relaxed text-slate-700">
                  <PlacementQuote placement="onboarding" eyebrow="Starting point" compact />
                  <p>
                    I hope this Life Planner will be your tool to create
                    intentionality in your life based on the future you desire
                    for yourself.
                  </p>
                  <p>
                    Use this Life Planner to create a compelling vision for
                    yourself with boundaries and guard rails established by your
                    Unique Purpose, Passion, and Dreams.
                  </p>
                  <p>
                    Reflect on your past year, define your year ahead, plan your
                    annual goals, and break them down into quarterly goals while
                    you work out the steps you will need to achieve them while
                    overcoming obstacles.
                  </p>
                  <p>
                    Finally, take daily action and enjoy the journey while you
                    make your dreams into reality.
                  </p>
                  <p className="pt-2 font-semibold text-slate-900">
                    Rishi Khanna
                    <br />
                    <span className="font-medium text-slate-700">Life Coach</span>
                  </p>
                </div>
                <div className="mt-8 flex justify-end">
                  <button
                    onClick={() => {
                      if (!user) return;
                      setOnboardingStepByUser((prev) => ({ ...prev, [user.id]: "intro" }));
                    }}
                    className="rounded-xl bg-brand px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-dark"
                  >
                    Continue
                  </button>
                </div>
              </>
            ) : (
              <>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                  Introduction To Life Planner
                </p>
                <div className="mt-5 max-h-[55vh] space-y-4 overflow-y-auto pr-1 text-sm leading-relaxed text-slate-700">
                  <PlacementQuote placement="onboarding" eyebrow="Keep this in mind" compact />
                  <p>
                    To succeed in getting where you want to go, you will need to create a
                    Life Plan. A road map to guide you towards your ultimate goal and help
                    you build a lasting legacy.
                  </p>
                  <p>This journal will help you:</p>
                  <ul className="list-disc space-y-2 pl-5">
                    <li>
                      Put guard rails to things that are important to you. You will be able
                      to eliminate distractions that will come in your way to achieving your
                      goals.
                    </li>
                    <li>Make better life decisions.</li>
                    <li>
                      Reduce any personal (self), health (body), family, professional (work)
                      related stress and frustrations you may have in your life.
                    </li>
                    <li>
                      Create focus, clarity and deliberate actions that will get you to your
                      life goals.
                    </li>
                    <li>
                      Experience freedom and achieve independence in your desired time-frame.
                    </li>
                    <li>
                      Lastly, help you define the legacy by design (not circumstance) you wish
                      to leave behind.
                    </li>
                  </ul>
                  <p>
                    Your Life Planner will serve as a starting point of your life action
                    plan fulfilling your vision for yourself (road map), ultimately
                    achieving your goals. Each year this journal will help you create a
                    reference point, reflect on the events of the year and defining new
                    actions to be achieved in subsequent year. Making your life more
                    fulfilling and happy.
                  </p>
                  <p>
                    Just remember, this journal is only the impetus to asking the right
                    questions about life and what is important for you. It is meant to help
                    you self-discover, become a guide and make you self aware of things that
                    are important for you. It will help you make decisions and weed out the
                    distractions. It will make you become more intentional and get you to stay
                    away from following the herd.
                  </p>
                  <p>
                    Being part of BordelessMind and having others go through the same journey,
                    we hope you will have a support group to open up and ask questions and
                    learn from others experiences. There is no life coach who can make
                    decisions for your life. Life Plan will be your plan with your life goals
                    and ultimately help you live a more fullfilling life with happiness.
                  </p>
                  <p>
                    Also remember the questions in the Life Planner will ask you deeper
                    questions that may make you reflect in your past. It is not our intention
                    to have you feel any regrets or embarrass you about your past decisions or
                    actions. It is only meant to help you make better actions moving forward
                    that are aligned to your Life Goals.
                  </p>
                  <p>
                    We hope you will appreciate and inspire others to live an intentional life
                    full of happiness and leave behind a legacy by design and not circumstance.
                  </p>
                </div>
                <div className="mt-8 flex justify-end">
                  <button
                    onClick={handleOnboardingClose}
                    className="rounded-xl bg-brand px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-dark"
                  >
                    Start Planning
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
