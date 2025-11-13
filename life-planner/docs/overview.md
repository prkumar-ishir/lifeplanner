# Life Planner Overview

## What is this?
Life Planner is a guided personal planning workspace that walks a user from commitment and vision through goal setting and weekly execution. It ships with:
- A marketing homepage that frames the journey in three sections (Foundations, Reflection, Execution).
- An authenticated dashboard showing current progress, latest weekly plan, and a click-through grid of flow steps.
- An eight-step planner flow featuring custom layouts for commitment letters, quadrant-based visioning, and a live wheel-of-life chart.
- A weekly planner for logging the focus, wins, and schedule notes for each week of the year.

## How to use it
1. **Explore the journey** – Land on `/` to scan the three-section overview and jump into either the dashboard or planner flow.
2. **Authenticate** – Sign in via the provided auth route so Supabase persistence can be used (the UI still works locally if unauthenticated).
3. **Complete the flow** – Navigate through the eight planner steps. The horizontal stepper at the top keeps all milestones reachable while the form section renders the appropriate layout for each step.
4. **Celebrate completion** – Once all steps are saved the app shows a one-time confetti overlay encouraging the user to begin weekly planning.
5. **Check the dashboard** – `/dashboard` surfaces overall progress, the latest weekly plan, and lets you click captured steps to revisit them.
6. **Log weekly plans** – `/weekly-planner` collects year/month/week, focus, wins, and notes. Successful saves show a toast and redirect back to the dashboard.

## Technical explanation
- **Framework & styling** – Built with Next.js App Router, React Server Components + Client Components, and Tailwind CSS for styling. Shared glass-panel styling and scroll utilities live in `globals.css`.
- **Data layer** – `usePlannerStore` (Zustand) keeps step entries and weekly plans in memory/local storage. `usePlannerDataSync` hydrates initial data from Supabase via repository helpers.
- **Planner flow** – Metadata for each step lives in `src/data/plannerFlow.ts`. The flow page reads the current step from the store, renders the matching fields/custom layout, and persists entries through `persistPlannerEntry`. Custom layouts include:
  - Commitment letter editor with inline name field.
  - Vision quadrant grid (Self, Body, Family, Professional).
  - Wheel of Life sliders driving a live SVG chart (`buildSectorPath`).
- **Celebration logic** – When the store reports all eight steps captured, `PlannerFlowPage` shows `CelebrationOverlay`. A localStorage flag (`plannerFlowCelebrated`) prevents future popups after the first completion.
- **Dashboard** – Combines progress meter, weekly rhythm card, and a flow overview grid. Completed flow cards are keyboard-accessible buttons that set the step index in the store and navigate to `/planner`.
- **Weekly planner** – Uses react-hook-form for inputs, splits multiline wins into arrays, saves via `persistWeeklyPlan`, displays a toast, and routes back to the dashboard with a short delay.
- **Navigation shell** – `AppShell` handles auth-aware layouts (loading, signed out, syncing) and centrally aligns the Life Planner wordmark while keeping the ISHIR logo linked externally.

