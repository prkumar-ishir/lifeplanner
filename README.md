# Life Planner — Next.js + Supabase starter

A modern React (App Router) workspace that walks users through a sequential life-planning journey, visualizes completed sections on a dashboard, and provides a dedicated weekly planner that can be revisited daily. Supabase client helpers and repository stubs are set up so you can wire persistence as soon as your project is ready.

## Tech stack

- **Next.js 15 / App Router** with TypeScript and src directory structure
- **Tailwind CSS + @tailwindcss/typography** for styling and utility-first layout
- **Zustand** for lightweight client-side state of planner/weekly data
- **React Hook Form + Zod-ready structure** for the sequential planner forms
- **Supabase JS client** with helper utilities for planner + weekly plan persistence

## Getting started

```bash
npm install          # already run, repeat if dependencies change
npm run dev          # start the dev server at http://localhost:3000
npm run lint         # optional: run eslint
```

### Environment variables

Copy `.env.example` to `.env.local` and fill in your Supabase credentials once the backend is provisioned:

```bash
cp .env.example .env.local
```

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=public-anon-key
```

If these values are missing the UI still works with local state, but the Supabase repository helpers will simply no-op (and log a warning) until credentials are provided.

## Folder structure highlights

```
src/
  app/
    (app)/layout.tsx           # shared authenticated workspace shell
    (app)/dashboard/page.tsx   # dashboard with cards + summaries
    (app)/planner/page.tsx     # sequential multi-step planner flow
    (app)/weekly-planner/...   # daily-use weekly planner
    page.tsx                   # marketing / welcome screen
  components/
    layout/app-shell.tsx
    navigation/sidebar-nav.tsx
    planner/flow-stepper.tsx
  data/plannerFlow.ts          # source of truth for flow steps + fields
  lib/
    supabase/client.ts         # lazy client factory
    supabase/repositories.ts   # planner + weekly plan persistence helpers
    utils.ts                   # Tailwind-friendly helpers
  store/plannerStore.ts        # Zustand store for flow + weekly state
  types/planner.ts             # shared types across UI + data layer
```

The planner flow and weekly planner use the same store so the dashboard can generate cards immediately. Once Supabase tables (`planner_entries`, `weekly_plans`) exist, the repository helpers will upsert the captured data.

## Supabase auth & syncing

- Visit `/signin` to create an account or log in (email + password via Supabase Auth). App routes under `(app)` require an authenticated session and will redirect you back to sign-in otherwise.
- The `AuthProvider` (see `src/contexts/auth-provider.tsx`) shares the logged-in user across the UI. `persistPlannerEntry` / `persistWeeklyPlan` automatically attach `user_id` so RLS policies allow writes.
- `usePlannerDataSync` fetches `planner_entries` + `weekly_plans` after sign-in and hydrates the local store, so the dashboard and forms immediately reflect your saved data.

## Suggested next steps

1. **Create Supabase tables** that align with the payloads defined in `src/types/planner.ts`, then add RLS policies.
2. **Customize authentication**—update the `/signin` experience or replace it with your preferred provider.
3. **Extend data access patterns** if you prefer server components or want SSR/ISR dashboards powered directly from Supabase.
4. **Extend the UI** with analytics, reminders, or shareable PDFs once the data is flowing.

The current setup gives you a clean baseline with professional styling, navigation, and state management so you can focus on the experience rather than boilerplate. Happy building!
