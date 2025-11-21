"use client";

import { useEffect, useMemo, useState } from "react";
import {
  useForm,
  type UseFormRegister,
  type UseFormWatch,
} from "react-hook-form";
import { FlowStepper } from "@/components/planner/flow-stepper";
import { plannerFlow } from "@/data/plannerFlow";
import { persistPlannerEntry } from "@/lib/supabase/repositories";
import { usePlannerStore } from "@/store/plannerStore";
import type { PlannerField, PlannerStep } from "@/types/planner";
import { useAuth } from "@/contexts/auth-provider";

type StepFormValues = Record<string, string>;

/**
 * PlannerFlowPage drives the sequential eight-step life planning journey.
 * It hydrates values from the Zustand store, mirrors submissions to Supabase,
 * and coordinates celebratory effects once the user completes every section.
 */
export default function PlannerFlowPage() {
  const { currentStepIndex, setStepIndex, saveStepData, entries } =
    usePlannerStore();
  const { user } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [toast, setToast] = useState<null | {
    message: string;
    tone: "success" | "error";
  }>(null);

  const step = plannerFlow[currentStepIndex];

  const baseValues = useMemo(() => {
    return step.fields.reduce<StepFormValues>((acc, field) => {
      acc[field.id] = entries[step.id]?.[field.id] ?? field.defaultValue ?? "";
      return acc;
    }, {});
  }, [entries, step]);

  const { register, handleSubmit, reset, watch } = useForm<StepFormValues>({
    defaultValues: baseValues,
  });

  // Re-seed the form any time we switch steps so users always see persisted values.
  useEffect(() => {
    reset(baseValues);
  }, [baseValues, reset]);

  const completedIndices = useMemo(
    () =>
      plannerFlow.reduce<number[]>((acc, currentStep, index) => {
        if (entries[currentStep.id]) {
          acc.push(index);
        }
        return acc;
      }, []),
    [entries]
  );

  // Auto-dismiss success/error toasts after a short delay.
  useEffect(() => {
    if (!toast) return;
    const timeout = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(timeout);
  }, [toast]);

  const highestCompleted = completedIndices.length
    ? Math.max(...completedIndices)
    : -1;
  const unlockedIndex = Math.min(highestCompleted + 1, plannerFlow.length - 1);
  const maxReachableIndex = Math.max(unlockedIndex, currentStepIndex);

  // Every step saves to local storage (Zustand) plus Supabase via persistPlannerEntry.
  const onSubmit = handleSubmit(async (values) => {
    setIsSaving(true);
    try {
      saveStepData(step.id, values);
      await persistPlannerEntry({
        stepId: step.id,
        data: values,
        completedAt: new Date().toISOString(),
        userId: user?.id,
      });
      setToast({ message: "Saved successfully.", tone: "success" });
      if (currentStepIndex < plannerFlow.length - 1) {
        setStepIndex(currentStepIndex + 1);
      } else {
        setShowCelebration(true);
      }
    } catch (error) {
      console.error(error);
      setToast({
        message: "Something went wrong while saving. Please try again.",
        tone: "error",
      });
    } finally {
      setIsSaving(false);
    }
  });

  const handleBack = () => {
    if (currentStepIndex === 0) return;
    setStepIndex(currentStepIndex - 1);
  };

  const handleNavigate = (index: number) => {
    if (index > maxReachableIndex) return;
    setStepIndex(index);
  };

  return (
    <div className="space-y-6">
      {showCelebration && (
        <CelebrationOverlay
          onDismiss={() => setShowCelebration(false)}
          onPlanWeek={() => {
            setShowCelebration(false);
            window.location.href = "/weekly-planner";
          }}
        />
      )}
      {/* Compact horizontal stepper keeps all eight milestones visible at once. */}
      <section className="glass-panel space-y-4 p-6">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">
            Sequential flow
          </p>
        </div>
        <div className="scroll-thin overflow-x-auto pr-1">
          <FlowStepper
            steps={plannerFlow}
            currentIndex={currentStepIndex}
            maxReachableIndex={maxReachableIndex}
            onNavigate={handleNavigate}
          />
        </div>
      </section>

      {/* Dynamic form body renders custom layouts (commitment letter, quadrants, wheel) or default fields. */}
      <section className="glass-panel space-y-6 p-8">
        {step.description && (
          <header>
            <p className="text-sm text-slate-500">{step.description}</p>
          </header>
        )}

        <form className="space-y-6" onSubmit={onSubmit}>
          <StepFields step={step} register={register} watch={watch} />

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleBack}
              disabled={currentStepIndex === 0}
              className="rounded-xl border border-slate-200 px-6 py-3 text-sm font-semibold text-slate-600 transition disabled:cursor-not-allowed disabled:opacity-50"
            >
              Back
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="rounded-xl bg-slate-900 px-8 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-wait"
            >
              {currentStepIndex === plannerFlow.length - 1
                ? "Save flow"
                : "Save & continue"}
            </button>
          </div>
        </form>

      </section>
      {toast && (
        <div
          className={`fixed top-6 right-6 rounded-2xl px-5 py-3 text-sm font-semibold text-white shadow-xl ${
            toast.tone === "success" ? "bg-emerald-600" : "bg-rose-600"
          }`}
        >
          {toast.message}
        </div>
      )}
    </div>
  );
}

type FieldRendererProps = {
  field: PlannerField;
  register: UseFormRegister<StepFormValues>;
};

type StepFieldsProps = {
  step: PlannerStep;
  register: UseFormRegister<StepFormValues>;
  watch: UseFormWatch<StepFormValues>;
};

// StepFields picks the right renderer for each planner step.
function StepFields({ step, register, watch }: StepFieldsProps) {
  if (step.customLayout === "commitmentLetter") {
    return <CommitmentLetterFields register={register} />;
  }

  if (step.customLayout === "visionQuadrants") {
    return <VisionQuadrantsFields register={register} />;
  }

  if (step.customLayout === "wheelOfLife") {
    return <WheelOfLifeFields register={register} watch={watch} />;
  }

  return (
    <>
      {step.fields.map((field) => (
        <FieldRenderer key={field.id} field={field} register={register} />
      ))}
    </>
  );
}

// FieldRenderer handles the default textarea/select inputs used outside custom layouts.
function FieldRenderer({ field, register }: FieldRendererProps) {
  if (field.type === "textarea") {
    return (
      <label className="flex flex-col gap-2">
        <span className="text-sm font-semibold text-slate-700">{field.label}</span>
        <textarea
          {...register(field.id)}
          rows={5}
          placeholder={field.placeholder}
          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
        />
        {field.helperText && (
          <span className="text-xs text-slate-500">{field.helperText}</span>
        )}
      </label>
    );
  }

  if (field.type === "select") {
    return (
      <label className="flex flex-col gap-2">
        <span className="text-sm font-semibold text-slate-700">{field.label}</span>
        <select
          {...register(field.id)}
          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
        >
          <option value="" hidden>
            {field.placeholder ?? "Choose an option"}
          </option>
          {field.options?.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
    );
  }

  return (
    <label className="flex flex-col gap-2">
      <span className="text-sm font-semibold text-slate-700">{field.label}</span>
      <input
        type={field.type === "number" ? "number" : "text"}
        {...register(field.id)}
        placeholder={field.placeholder}
        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
      />
    </label>
  );
}

type CustomFieldBaseProps = {
  register: UseFormRegister<StepFormValues>;
};

/**
 * CommitmentLetterFields renders the opening narrative letter inputs
 * so users can anchor intent before diving into structured prompts.
 */
function CommitmentLetterFields({ register }: CustomFieldBaseProps) {
  return (
    <div className="space-y-4 rounded-3xl border border-slate-100 bg-gradient-to-br from-white to-slate-50 p-6">
      <p className="text-sm text-slate-600">
        Write this like a letter to yourself. Anchor into why this promise matters
        and the energy you want to bring into the next chapter.
      </p>
      <div className="flex flex-wrap items-center gap-2 text-lg font-semibold text-slate-800">
        <span>I</span>
        <input
          {...register("commitment_author")}
          placeholder="your name"
          className="min-w-[120px] border-b-2 border-dashed border-slate-400 bg-transparent px-2 pb-1 text-lg font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none"
        />
        <span>am committed to</span>
      </div>
      <textarea
        {...register("commitment_letter")}
        rows={6}
        placeholder="Describe how you will show up for yourself, the standards you are keeping, and the support you will call in."
        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
      />
      <p className="text-xs text-slate-500">
        Hint: speak in the present tense and write as if you are reading it on a day
        when you need encouragement.
      </p>
    </div>
  );
}

/**
 * VisionQuadrantsFields presents a four-quadrant canvas that captures
 * vivid descriptions for Self, Body, Family, and Professional areas.
 */
function VisionQuadrantsFields({ register }: CustomFieldBaseProps) {
  const quadrants = [
    {
      id: "vision_self",
      title: "Self",
      prompt: "Inner world, learning, spirituality, expression.",
    },
    {
      id: "vision_body",
      title: "Body",
      prompt: "Movement, nourishment, recovery, vitality.",
    },
    {
      id: "vision_family",
      title: "Family",
      prompt: "Relationships, rituals, shared traditions.",
    },
    {
      id: "vision_professional",
      title: "Professional",
      prompt: "Craft, leadership, impact, wealth.",
    },
  ] as const;

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-600">
        Use each quadrant to describe what “vividly alive” looks like in that area.
        Write in the present tense and be specific about how it feels.
      </p>
      <div className="rounded-[32px] border border-slate-100 bg-gradient-to-br from-white to-slate-50 p-1">
        <div className="grid grid-cols-2 gap-px rounded-[28px] bg-slate-200/60">
          {quadrants.map((quadrant) => (
            <label
              key={quadrant.id}
              className="flex min-h-[180px] flex-col gap-2 bg-white p-4"
            >
              <span className="text-sm font-semibold text-slate-800">
                {quadrant.title}
              </span>
              <span className="text-xs text-slate-500">{quadrant.prompt}</span>
              <textarea
                {...register(quadrant.id)}
                rows={4}
                className="mt-auto w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:bg-white"
                placeholder="Paint the picture in detail."
              />
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}

type WheelFieldProps = CustomFieldBaseProps & {
  watch: UseFormWatch<StepFormValues>;
};

/**
 * WheelOfLifeFields couples slider inputs with a live SVG chart so users
 * instantly see balance across four life domains.
 */
function WheelOfLifeFields({ register, watch }: WheelFieldProps) {
  const quadrants = [
    {
      id: "wheel_self",
      label: "Self",
      color: "#a855f7",
      startAngle: Math.PI / 2,
      endAngle: Math.PI,
    },
    {
      id: "wheel_body",
      label: "Body",
      color: "#f97316",
      startAngle: 0,
      endAngle: Math.PI / 2,
    },
    {
      id: "wheel_family",
      label: "Family",
      color: "#0ea5e9",
      startAngle: Math.PI,
      endAngle: (3 * Math.PI) / 2,
    },
    {
      id: "wheel_professional",
      label: "Professional",
      color: "#22c55e",
      startAngle: (3 * Math.PI) / 2,
      endAngle: Math.PI * 2,
    },
  ] as const;

  const ratings = quadrants.map((quadrant) => ({
    ...quadrant,
    value: Number(watch(quadrant.id) ?? 0),
  }));

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
      <div className="space-y-5">
        <p className="text-sm text-slate-600">
          Drag the sliders to rate each quadrant from 1-10. The wheel fills in live so
          you can instantly spot balance or tension.
        </p>
        <div className="space-y-4">
          {quadrants.map((quadrant, index) => {
            const value = ratings[index].value;
            return (
              <label key={quadrant.id} className="flex flex-col gap-2">
                <div className="flex items-center justify-between text-sm font-semibold text-slate-700">
                  <span className="flex items-center gap-2">
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: quadrant.color }}
                    />
                    {quadrant.label}
                  </span>
                  <span className="text-slate-500">{value}/10</span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={10}
                  step={1}
                  {...register(quadrant.id)}
                  className="w-full accent-slate-900"
                />
              </label>
            );
          })}
        </div>
      </div>
      <WheelChart ratings={ratings} />
    </div>
  );
}

type WheelChartProps = {
  ratings: Array<{
    id: string;
    label: string;
    value: number;
    color: string;
    startAngle: number;
    endAngle: number;
  }>;
};

/**
 * WheelChart converts slider ratings into arc segments for the wheel visualization.
 */
function WheelChart({ ratings }: WheelChartProps) {
  const size = 240;
  const center = size / 2;
  const maxRadius = center - 16;

  return (
    <div className="flex flex-col items-center gap-4 rounded-3xl border border-slate-100 bg-white/70 p-6 text-center">
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="text-slate-900"
      >
        <circle
          cx={center}
          cy={center}
          r={maxRadius}
          fill="#f8fafc"
          stroke="#e2e8f0"
          strokeWidth={2}
        />
        <line
          x1={center}
          y1={center - maxRadius}
          x2={center}
          y2={center + maxRadius}
          stroke="#e2e8f0"
          strokeWidth={1.5}
        />
        <line
          x1={center - maxRadius}
          y1={center}
          x2={center + maxRadius}
          y2={center}
          stroke="#e2e8f0"
          strokeWidth={1.5}
        />
        {ratings.map((rating) => {
          const radius = (Math.max(0, Math.min(10, rating.value)) / 10) * maxRadius;
          if (radius <= 0) {
            return null;
          }
          const path = buildSectorPath(
            center,
            center,
            radius,
            rating.startAngle,
            rating.endAngle
          );
          return (
            <path
              key={rating.id}
              d={path}
              fill={rating.color}
              fillOpacity={0.35}
              stroke={rating.color}
              strokeWidth={1.5}
            />
          );
        })}
      </svg>
      <div className="w-full">
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
          Visual score
        </p>
        <ul className="grid grid-cols-2 gap-3 text-left text-xs text-slate-600">
          {ratings.map((rating) => (
            <li key={rating.id} className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-2">
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: rating.color }}
                />
                {rating.label}
              </span>
              <span className="font-semibold text-slate-800">{rating.value}/10</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

/**
 * buildSectorPath generates the SVG path string for a single segment.
 * The geometry math lives here so WheelChart stays focused on rendering.
 */
function buildSectorPath(
  cx: number,
  cy: number,
  radius: number,
  startAngle: number,
  endAngle: number
) {
  const start = polarToCartesian(cx, cy, radius, startAngle);
  const end = polarToCartesian(cx, cy, radius, endAngle);
  const normalizedDelta =
    ((endAngle - startAngle) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2);
  const largeArcFlag = normalizedDelta > Math.PI ? 1 : 0;
  const sweepFlag = 0; // Force counterclockwise sweep so curves stay convex relative to the center.
  return [
    `M ${cx} ${cy}`,
    `L ${start.x} ${start.y}`,
    `A ${radius} ${radius} 0 ${largeArcFlag} ${sweepFlag} ${end.x} ${end.y}`,
    "Z",
  ].join(" ");
}

function polarToCartesian(
  cx: number,
  cy: number,
  radius: number,
  angle: number
) {
  return {
    x: cx + radius * Math.cos(angle),
    y: cy - radius * Math.sin(angle),
  };
}

type CelebrationOverlayProps = {
  onDismiss: () => void;
  onPlanWeek: () => void;
};

type ConfettiPiece = {
  id: number;
  left: string;
  delay: string;
  duration: string;
  color: string;
};

// CelebrationOverlay reinforces completion with confetti + next-step CTA.
function CelebrationOverlay({ onDismiss, onPlanWeek }: CelebrationOverlayProps) {
  const [pieces] = useState<ConfettiPiece[]>(() =>
    Array.from({ length: 40 }, (_, index) => ({
      id: index,
      left: `${Math.random() * 100}%`,
      delay: `${Math.random()}s`,
      duration: `${3 + Math.random() * 2}s`,
      color: ["#f97316", "#0ea5e9", "#a855f7", "#22c55e"][index % 4],
    }))
  );

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-white/80 backdrop-blur-sm" />
      <div className="relative z-10 max-w-3xl rounded-[32px] bg-white/95 p-10 text-center shadow-2xl">
        <p className="text-lg font-semibold uppercase tracking-[0.3em] text-slate-400">
          You just designed a powerful new chapter.
        </p>
        <p className="mt-3 text-base text-slate-600">
          This planning session is already pouring optimism into your life—welcome to the story you chose.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button
            onClick={onPlanWeek}
            className="inline-flex items-center rounded-xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            Start planning your week
          </button>
          <button
            onClick={onDismiss}
            className="inline-flex items-center rounded-xl border border-slate-300 px-6 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-white"
          >
            Stay here
          </button>
        </div>
      </div>
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {pieces.map((piece) => (
          <span
            key={piece.id}
            className="confetti-piece"
            style={{
              left: piece.left,
              animationDelay: piece.delay,
              animationDuration: piece.duration,
              backgroundColor: piece.color,
            }}
          />
        ))}
      </div>
    </div>
  );
}
