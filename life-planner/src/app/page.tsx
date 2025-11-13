import Image from "next/image";
import Link from "next/link";
import ishirLogo from "./ishir-logo.png";

const journeySections = [
  {
    title: "Foundations",
    instruction:
      "Set the tone by promising yourself what comes next and picturing the life you want to step into.",
    items: [
      {
        title: "My Commitment",
        summary:
          "Write a self-affirming letter that opens with “I ____ am committed to…” and seals your intention.",
      },
      {
        title: "My Vision",
        summary:
          "Map what Self, Body, Family, and Professional success look like across four quadrants.",
      },
      {
        title: "Wheel of Life",
        summary:
          "Score each life quadrant and spot imbalance through a visual wheel.",
      },
      {
        title: "Purpose of Life",
        summary:
          "Answer five reflection prompts to find the intersection of purpose, passion, skills, and value.",
      },
    ],
  },
  {
    title: "Reflection",
    instruction:
      "Look backward and forward to extract lessons, gratitude, and clarity for the next 12 months.",
    items: [
      {
        title: "The Past Year",
        summary:
          "Capture best moments freely, then respond to five prompts about what shaped you.",
      },
      {
        title: "The Year Ahead",
        summary:
          "Describe the themes, priorities, and questions that will define the coming year.",
      },
    ],
  },
  {
    title: "Execution",
    instruction:
      "Translate insight into tangible plans that cascade from annual goals down to weekly focus.",
    items: [
      {
        title: "Goal Setting",
        summary:
          "Define goals for Self, Body, Family, and Professional arenas with clear outcomes.",
      },
      {
        title: "Quarterly Planning",
        summary:
          "Break the year into sprints with measurable targets and checkpoints.",
      },
      {
        title: "Weekly Planner",
        summary:
          "Keep the cadence you already have—capture focus, wins, and schedule rituals weekly.",
      },
    ],
  },
];

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col gap-16 px-6 py-20 lg:px-12">
      {/* Hero: introduces Life Planner brand promise and primary CTA. */}
      <section className="glass-panel relative overflow-hidden p-12 text-center">
        <div className="absolute inset-0 opacity-10 blur-3xl accent-gradient" />
        <div className="relative flex flex-col items-center gap-6 text-center">
          <div className="flex flex-col items-center gap-3">
            <a href="https://www.ishir.com" target="_blank" rel="noreferrer">
              <Image
                src={ishirLogo}
                alt="ISHIR logo"
                className="h-10 w-auto"
                priority
              />
            </a>
            <p className="text-xs font-semibold uppercase tracking-[0.5em] text-brand-dark">
              Life Planner
            </p>
          </div>
          <h1 className="mx-auto max-w-3xl text-4xl font-semibold leading-tight text-slate-900 md:text-5xl">
            Roadmap to guide your life with clarity, energy, and follow-through.
          </h1>
          <p className="mx-auto max-w-3xl text-lg text-slate-600">
            Start with your story, capture your commitments, map the year ahead,
            and turn goals into weekly action.
          </p>
          <p className="mx-auto max-w-3xl text-lg text-slate-900">
            Spend 15min of your time to turn around your 2026!
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-6 py-3 text-white transition hover:bg-slate-800"
            >
              Go to workspace
            </Link>
            <Link
              href="/planner"
              className="inline-flex items-center justify-center rounded-xl border border-slate-300 px-6 py-3 text-slate-900 transition hover:border-slate-400"
            >
              Start the flow
            </Link>
          </div>
        </div>
      </section>

      {/* Journey overview: groups all steps into three easy-to-scan sections. */}
      <section className="grid gap-6 md:grid-cols-3">
        {journeySections.map((section) => (
          <article
            key={section.title}
            className="glass-panel flex h-full flex-col gap-4 p-6"
          >
            <header className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-dark">
                {section.title}
              </p>
              <p className="text-sm text-slate-600">{section.instruction}</p>
            </header>
            <div className="space-y-4">
              {section.items.map((item) => (
                <div key={item.title} className="rounded-2xl border border-slate-100 bg-white/60 p-3">
                  <p className="text-sm font-semibold text-slate-800">
                    {item.title}
                  </p>
                  <p className="text-sm text-slate-500">{item.summary}</p>
                </div>
              ))}
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}
