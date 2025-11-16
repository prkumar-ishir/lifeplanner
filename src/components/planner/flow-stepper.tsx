import { cn } from "@/lib/utils";
import type { PlannerStep } from "@/types/planner";

type Props = {
  steps: PlannerStep[];
  currentIndex: number;
  maxReachableIndex: number;
  onNavigate?: (index: number) => void;
};

// Horizontal stepper keeps all eight planner milestones within reach.
export function FlowStepper({
  steps,
  currentIndex,
  maxReachableIndex,
  onNavigate,
}: Props) {
  return (
    <div>
      <div className="scroll-thin overflow-x-auto pb-1">
        <ol className="flex min-w-max items-center gap-2">
          {steps.map((step, index) => {
            const isCurrent = index === currentIndex;
            const isLocked = index > maxReachableIndex;
            const isCompleted = index <= maxReachableIndex && index < currentIndex;

            return (
              <li key={step.id}>
                <button
                  type="button"
                  disabled={isLocked}
                  onClick={() => onNavigate?.(index)}
                  className={cn(
                    "flex items-center gap-3 rounded-2xl border px-3 py-2 text-sm transition",
                    "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-400",
                    isCurrent && "border-slate-900 bg-slate-900 text-white shadow",
                    isCompleted && !isCurrent &&
                      "border-emerald-200 bg-emerald-50 text-emerald-900",
                    !isCurrent &&
                      !isCompleted &&
                      !isLocked &&
                      "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50",
                    isLocked &&
                      "cursor-not-allowed border-dashed border-slate-200 bg-slate-50 text-slate-400"
                  )}
                >
                  <span
                    className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold",
                      isCurrent
                        ? "bg-white/20 text-white"
                        : isCompleted
                          ? "bg-emerald-500/20 text-emerald-800"
                          : isLocked
                            ? "bg-slate-200 text-slate-500"
                            : "bg-slate-100 text-slate-700"
                    )}
                  >
                    {index + 1}
                  </span>
                  {isCurrent && (
                    <span className="text-xs font-semibold uppercase tracking-wide text-white">
                      {step.title}
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}
