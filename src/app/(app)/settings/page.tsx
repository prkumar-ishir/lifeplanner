"use client";

import { useTheme } from "@/contexts/theme-provider";
import { themePresets, themeIds } from "@/lib/themes";
import { cn } from "@/lib/utils";

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="glass-panel space-y-8 p-8">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Settings</h1>
        <p className="mt-1 text-sm text-slate-500">
          Personalize your Life Planner workspace.
        </p>
      </div>

      <section>
        <h2 className="text-sm font-semibold text-slate-700">Theme color</h2>
        <p className="mt-1 text-xs text-slate-500">
          Choose a primary color for your workspace.
        </p>

        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {themeIds.map((id) => {
            const preset = themePresets[id];
            const isActive = theme === id;
            return (
              <button
                key={id}
                onClick={() => setTheme(id)}
                className={cn(
                  "flex items-center gap-3 rounded-2xl border px-4 py-3 text-left transition",
                  isActive
                    ? "border-brand bg-brand text-white shadow-lg"
                    : "border-slate-200 bg-white/60 text-slate-700 hover:border-slate-300 hover:bg-white"
                )}
              >
                <span
                  className="h-6 w-6 flex-shrink-0 rounded-full border-2 border-white shadow-sm"
                  style={{ backgroundColor: preset.swatch }}
                />
                <span className="text-sm font-medium">{preset.label}</span>
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
}
