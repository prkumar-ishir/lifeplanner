"use client";

import { useEffect, useMemo, useState } from "react";
import {
  useForm,
  type UseFormRegister,
  type UseFormSetValue,
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
  const [showGoalSettingGuide, setShowGoalSettingGuide] = useState(false);
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

  const { register, handleSubmit, reset, watch, setValue } = useForm<StepFormValues>({
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

  useEffect(() => {
    setShowGoalSettingGuide(step.id === "goal-setting");
  }, [step.id]);

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
      {showGoalSettingGuide && (
        <GoalSettingGuideOverlay onDismiss={() => setShowGoalSettingGuide(false)} />
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
          <StepFields
            step={step}
            register={register}
            setValue={setValue}
            watch={watch}
            onOpenGoalSettingGuide={() => setShowGoalSettingGuide(true)}
          />

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
              className="rounded-xl bg-brand px-8 py-3 text-sm font-semibold text-white transition hover:bg-brand-dark disabled:cursor-wait"
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
  setValue: UseFormSetValue<StepFormValues>;
  watch: UseFormWatch<StepFormValues>;
  onOpenGoalSettingGuide: () => void;
};

// StepFields picks the right renderer for each planner step.
function StepFields({
  step,
  register,
  setValue,
  watch,
  onOpenGoalSettingGuide,
}: StepFieldsProps) {
  if (step.customLayout === "commitmentLetter") {
    return <CommitmentLetterFields register={register} />;
  }

  if (step.customLayout === "purposeInLife") {
    return <PurposeInLifeFields register={register} />;
  }

  if (step.customLayout === "pastYearReview") {
    return <PastYearFields register={register} />;
  }

  if (step.customLayout === "yearAheadReview") {
    return <YearAheadFields register={register} />;
  }

  if (step.customLayout === "goalSettingMatrix") {
    return (
      <GoalSettingFields
        register={register}
        onOpenGuide={onOpenGoalSettingGuide}
      />
    );
  }

  if (step.customLayout === "quarterlyPlanner") {
    return (
      <QuarterlyPlannerFields
        register={register}
        setValue={setValue}
        watch={watch}
      />
    );
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
    <div className="space-y-6 rounded-3xl border border-slate-100 bg-gradient-to-br from-white to-slate-50 p-6">
      <p className="text-lg font-normal leading-relaxed text-slate-800">
        I,{" "}
        <input
          {...register("commitment_author")}
          placeholder=""
          className="inline-block w-80 max-w-full border-b-2 border-dashed border-slate-400 bg-transparent px-2 pb-1 align-baseline text-lg font-normal text-slate-900 placeholder:text-slate-400 focus:outline-none"
        />
        , am committed to using this Life Planner to turn my dreams into reality and
        taking action on the things that matter to me the most and will help me become
        the better version of myself. I am committed to not wasting this one life I
        have. I will make sure I give my 100% in fulfilling my potential and making
        the best of this life.
      </p>
      <input type="hidden" {...register("commitment_letter")} defaultValue="" />

      <div className="flex">
        <label className="flex w-full max-w-xs items-center gap-3 text-sm font-semibold text-slate-700">
          <span>Date</span>
          <input
            type="date"
            {...register("commitment_date")}
            placeholder=""
            className="w-full border-b-2 border-dashed border-slate-400 bg-transparent px-1 pb-1 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none"
          />
        </label>
      </div>

      <label className="flex flex-col gap-2">
        <span className="text-sm font-semibold text-slate-700">
          Working with the Life Planner is really important to me because...
        </span>
        <textarea
          {...register("commitment_why")}
          rows={4}
          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
        />
      </label>

      <label className="flex flex-col gap-2">
        <span className="text-sm font-semibold text-slate-700">
          If I finish 5 days of working with this planner. I will reward myself with...
        </span>
        <textarea
          {...register("commitment_reward")}
          rows={3}
          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
        />
      </label>

      <label className="flex flex-col gap-2">
        <span className="text-sm font-semibold text-slate-700">
          If I don&apos;t finish 5 days of writing this journal, I will promise to...
        </span>
        <textarea
          {...register("commitment_promise")}
          rows={3}
          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
        />
      </label>

      <label className="flex flex-col gap-2">
        <span className="text-sm font-semibold text-slate-700">
          I will do the following things to ensure I become intentional everyday...
        </span>
        <textarea
          {...register("commitment_daily_actions")}
          rows={5}
          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
        />
      </label>
    </div>
  );
}

function PurposeInLifeFields({ register }: CustomFieldBaseProps) {
  const questions = [
    { id: "purpose_q_happiest", label: "When have you been happiest in life?" },
    {
      id: "purpose_q_proud",
      label: "What has made you truly proud of yourself?",
    },
    {
      id: "purpose_q_admire",
      label: "What qualities do you most admire in other people?",
    },
    {
      id: "purpose_q_alive",
      label: "What makes you feel alive and energized?",
    },
    {
      id: "purpose_q_happy_daily",
      label: "How happy do you feel on an everyday basis?",
    },
    { id: "purpose_q_thankful", label: "What am I thankful for?" },
    {
      id: "purpose_q_turning_points",
      label: "What are the turning points in my life?",
    },
    {
      id: "purpose_q_change",
      label: "What one change can make your life happier?",
    },
    {
      id: "purpose_q_activities",
      label:
        "What activities do you love doing, even when it may be not fun for others?",
    },
    {
      id: "purpose_q_learning",
      label: "What things do you love learning about?",
    },
    {
      id: "purpose_q_easy",
      label: "What do you find easy that other people struggle with?",
    },
    {
      id: "purpose_q_motivates",
      label: "What motivates you and gets you off the bed every morning?",
    },
  ] as const;

  const valueRows = Array.from({ length: 10 }, (_, rowIndex) => [
    `purpose_value_${rowIndex * 3 + 1}`,
    `purpose_value_${rowIndex * 3 + 2}`,
    `purpose_value_${rowIndex * 3 + 3}`,
  ]);

  return (
    <div className="space-y-6">
      <div className="space-y-3 text-sm leading-relaxed text-slate-700">
        <h3 className="text-2xl font-bold uppercase tracking-wide text-slate-900">
          PURPOSE IN LIFE
        </h3>
        <p>
          Finding your purpose means finding a way to use your unique gifts,
          skills, and passions you have to live a fulfilled and happy life. For
          most of us it takes a lifelong experience of discovering, experimenting,
          reflecting and trying.
        </p>
        <p>
          Purpose can guide in - life decisions, influence behavior, shape goals,
          offer a sense of direction, create meaning and eliminate distractions to
          create ultimate focus.
        </p>
        <p>
          The questions below will help you find the intersection between your
          purpose, passions, unique skills and what you find of most value to you.
        </p>
      </div>

      <div className="space-y-4">
        {questions.map((question) => (
          <label key={question.id} className="flex flex-col gap-2">
            <span className="text-sm font-semibold text-slate-700">{question.label}</span>
            <textarea
              {...register(question.id)}
              rows={5}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
            />
          </label>
        ))}
      </div>

      <div className="space-y-3 text-sm leading-relaxed text-slate-700">
        <h3 className="text-2xl font-bold uppercase tracking-wide text-slate-900">
          MY VALUES
        </h3>
        <p>
          Your Values are the things that you believe are important in the way you
          live and work. Important and lasting beliefs or ideals shared by the
          members of a culture/ family about what is good or bad and desirable or
          undesirable.
        </p>
        <p>
          List down your values that relate to you, then eliminate the ones that
          naturally combine and aim for top 4-5 values that most represent you.
        </p>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200">
        <div className="grid grid-cols-3 border-b border-slate-200 bg-slate-50">
          <div className="border-r border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700">
            Your Values
          </div>
          <div className="border-r border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700">
            Your Values
          </div>
          <div className="px-3 py-2 text-sm font-semibold text-slate-700">Your Values</div>
        </div>
        <div className="space-y-0">
          {valueRows.map((row, index) => (
            <div key={index} className="grid grid-cols-3 border-t border-slate-200">
              {row.map((fieldId, fieldIndex) => (
                <input
                  key={fieldId}
                  {...register(fieldId)}
                  className={`bg-white px-3 py-2 text-sm text-slate-900 outline-none ${
                    fieldIndex < 2 ? "border-r border-slate-200" : ""
                  }`}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function PastYearFields({ register }: CustomFieldBaseProps) {
  const sectionTwoAccomplishments = [
    "past_biggest_accomplishments",
    "past_achieve_how",
    "past_helped_success",
  ] as const;

  const sectionTwoChallenges = [
    "past_biggest_challenges",
    "past_overcome_help",
    "past_learned_overcoming",
  ] as const;

  const sectionThree = [
    "past_wisest_decision",
    "past_biggest_lesson",
    "past_biggest_risk",
    "past_biggest_surprise",
    "past_selfless_thing",
    "past_biggest_accomplishment",
  ] as const;

  const sectionFour = [
    "past_most_proud",
    "past_people_influenced_you",
    "past_people_you_influenced",
    "past_not_accomplish",
    "past_best_discovered",
    "past_most_grateful",
  ] as const;

  const sectionFive = [
    "past_not_procrastinate",
    "past_draw_energy",
    "past_mistakes_learned",
    "past_most_important_lesson",
    "past_new_things_discovered",
    "past_leave_world_better",
  ] as const;

  const labels: Record<string, string> = {
    past_best_moments: "The best moments",
    past_forgiveness: "Forgiveness",
    past_letting_go: "Letting go",
    past_biggest_accomplishments: "List your greatest accomplishments from last year here.",
    past_achieve_how: "What have you done to achieve these?",
    past_helped_success: "Who helped you achieved these successes? How?",
    past_biggest_challenges: "List your three biggest challenges from last year here.",
    past_overcome_help: "Who or what helped you overcome these challenges?",
    past_learned_overcoming:
      "What have you learned about yourself while overcoming these challenges?",
    past_wisest_decision: "The wisest decision I made.",
    past_biggest_lesson: "The biggest lesson I learned.",
    past_biggest_risk: "The biggest risk I took.",
    past_biggest_surprise: "The biggest surprise by product of the year.",
    past_selfless_thing: "The most important thing I selflessly did for others.",
    past_biggest_accomplishment: "The biggest accomplishment.",
    past_most_proud: "What are you the most proud of?",
    past_people_influenced_you: "Who are the three people who influenced you the most?",
    past_people_you_influenced: "Who are the three people you influenced the most?",
    past_not_accomplish: "What were you not able to accomplish?",
    past_best_discovered: "What is the best thing you have discovered about yourself?",
    past_most_grateful: "What are you the most grateful for?",
    past_not_procrastinate: "This year I will not procrastinate any more on.",
    past_draw_energy: "This year I will draw the most energy from.",
    past_mistakes_learned: "What mistakes I made this year? What did I learn from them?",
    past_most_important_lesson: "The most important lesson I learnt in past year.",
    past_new_things_discovered: "What new things did I discover about myself?",
    past_leave_world_better:
      "What did you do this year to leave the world in a better shape than you found it?",
  };

  const renderField = (id: string) => (
    <label key={id} className="flex flex-col gap-2">
      <span className="text-sm font-semibold text-slate-700">{labels[id]}</span>
      <textarea
        {...register(id)}
        rows={5}
        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
      />
    </label>
  );

  return (
    <div className="space-y-6">
      <div className="space-y-3 text-sm leading-relaxed text-slate-700">
        <h3 className="text-2xl font-bold uppercase tracking-wide text-slate-900">
          THE PAST YEAR
        </h3>
        <div className="space-y-1">
          <p className="text-base font-semibold">The best moments</p>
          <p>
            Describe the greatest and most memorable, joyful moments from last year.
            Draw them on this sheet. How did you feel? Who was there with you? What
            were you doing? What kind of smells, sounds or tastes do you remember?
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {renderField("past_best_moments")}
        {renderField("past_forgiveness")}
        {renderField("past_letting_go")}
      </div>

      <div className="space-y-2">
        <p className="text-base font-semibold text-slate-800">
          Three of my biggest accomplishments
        </p>
        {sectionTwoAccomplishments.map((id) => renderField(id))}
        <p className="pt-2 text-base font-semibold text-slate-800">
          Three of my biggest challenges
        </p>
        {sectionTwoChallenges.map((id) => renderField(id))}
      </div>

      <div className="space-y-2">
        <p className="text-base font-semibold text-slate-800">
          Three sentences about my past year
        </p>
        {sectionThree.map((id) => renderField(id))}
        {sectionFour.map((id) => renderField(id))}
        {sectionFive.map((id) => renderField(id))}
      </div>
    </div>
  );
}

function YearAheadFields({ register }: CustomFieldBaseProps) {
  const yearOverviewFields = [
    "year_ahead_personal_family",
    "year_ahead_work_studies_profession",
    "year_ahead_belongings",
    "year_ahead_relaxation_hobbies_creativity",
    "year_ahead_friends_community",
    "year_ahead_health_fitness",
    "year_ahead_intellectual",
    "year_ahead_emotional_spiritual",
    "year_ahead_finances",
    "year_ahead_bucket_list",
  ] as const;

  const commitGroupOne = [
    "year_ahead_love_about_myself",
    "year_ahead_let_go",
    "year_ahead_achieve_most",
    "year_ahead_pillars",
    "year_ahead_dare_discover",
    "year_ahead_power_to_say_no",
  ] as const;

  const commitGroupTwo = [
    "year_ahead_cozy_surroundings",
    "year_ahead_every_morning",
    "year_ahead_pamper_regularly",
    "year_ahead_places_visit",
    "year_ahead_connect_loved_ones",
    "year_ahead_reward_success",
  ] as const;

  const commitGroupThree = [
    "year_ahead_not_procrastinate",
    "year_ahead_draw_energy",
    "year_ahead_bravest_when",
    "year_ahead_say_no_to",
    "year_ahead_advise_myself",
    "year_ahead_special_because",
  ] as const;

  const labels: Record<string, string> = {
    year_ahead_dream_big: "Dare to dream big",
    year_ahead_personal_family: "Personal Life and Family",
    year_ahead_work_studies_profession: "Work, Studies, Profession",
    year_ahead_belongings: "Belongings (Home, Objects)",
    year_ahead_relaxation_hobbies_creativity: "Relaxation, Hobbies, Creativity",
    year_ahead_friends_community: "Friends, Community",
    year_ahead_health_fitness: "Health, Fitness",
    year_ahead_intellectual: "Intellectual",
    year_ahead_emotional_spiritual: "Emotional, Spiritual",
    year_ahead_finances: "Finances",
    year_ahead_bucket_list: "3 Things in your Bucket List",
    year_ahead_love_about_myself: "These two things I will love about myself.",
    year_ahead_let_go: "I am ready to let go of these two things.",
    year_ahead_achieve_most: "These two things I want to achieve the most.",
    year_ahead_pillars: "These two people will be my pillars during rough times.",
    year_ahead_dare_discover: "These two things I will dare to discover.",
    year_ahead_power_to_say_no:
      "These two things I will have the power to say no to.",
    year_ahead_cozy_surroundings:
      "These two things I will make my surroundings cozy with.",
    year_ahead_every_morning: "These two things I will do every morning.",
    year_ahead_pamper_regularly:
      "These two things I will pamper myself with regularly.",
    year_ahead_places_visit: "These two places I will visit.",
    year_ahead_connect_loved_ones:
      "I will connect with my loved ones in these two ways.",
    year_ahead_reward_success:
      "With these two presents will I reward my success.",
    year_ahead_not_procrastinate:
      "This year I will not procrastinate any more on...",
    year_ahead_draw_energy: "This year I will draw the most energy from...",
    year_ahead_bravest_when: "This year, I will be the bravest when...",
    year_ahead_say_no_to: "This year I will say no to...",
    year_ahead_advise_myself: "This year I advise myself to...",
    year_ahead_special_because: "This year will be special for me because...",
    year_ahead_word: "My word for the year ahead",
    year_ahead_secret_wish: "Secret wish",
  };

  const renderField = (id: string, rows = 4) => (
    <label key={id} className="flex flex-col gap-2">
      <span className="text-sm font-semibold text-slate-700">{labels[id]}</span>
      <textarea
        {...register(id)}
        rows={rows}
        className="w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
      />
    </label>
  );

  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <h3 className="text-2xl font-bold uppercase tracking-wide text-slate-900">
          THE YEAR AHEAD
        </h3>
        <div className="space-y-1 text-slate-700">
          <p className="text-base font-semibold">Dare to dream big</p>
          <p className="text-sm leading-relaxed">
            What does the year ahead of you look like? What will happen in an Ideal
            case? Why will it be great? Write, draw, let go of your expectations and
            dare to dream.
          </p>
        </div>
        <textarea
          {...register("year_ahead_dream_big")}
          rows={8}
          className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-4 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
        />
      </div>

      <div className="space-y-4">
        <div className="space-y-1 text-slate-700">
          <p className="text-base font-semibold">This is what my next year will be about</p>
          <p className="text-sm">
            Define the most important aspects of the next year in the following
            areas. Which events will be the most important? Summarize briefly.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {yearOverviewFields.map((id) => renderField(id, 5))}
        </div>
      </div>

      <div className="space-y-4">
        <div className="space-y-1 text-slate-700">
          <p className="text-base font-semibold">Two commits for the year ahead</p>
        </div>
        <div className="space-y-4">
          {commitGroupOne.map((id) => renderField(id, 4))}
        </div>
      </div>

      <div className="space-y-4">
        <div className="space-y-1 text-slate-700">
          <p className="text-base font-semibold">Two commits for the year ahead</p>
        </div>
        <div className="space-y-4">
          {commitGroupTwo.map((id) => renderField(id, 4))}
        </div>
      </div>

      <div className="space-y-4">
        <div className="space-y-1 text-slate-700">
          <p className="text-base font-semibold">Two commits for the year ahead</p>
        </div>
        <div className="space-y-4">
          {commitGroupThree.map((id) => renderField(id, 4))}
        </div>
      </div>

      <div className="space-y-4">
        <div className="space-y-4">
          <div className="space-y-1">
            <p className="text-base font-semibold text-slate-800">
              My word for the year ahead
            </p>
            <p className="text-sm text-slate-600">
              Pick a word to symbolize and define the year ahead.
            </p>
            <textarea
              {...register("year_ahead_word")}
              rows={4}
              className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-4 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
            />
          </div>
          <div className="space-y-1">
            <p className="text-base font-semibold text-slate-800">Secret wish</p>
            <p className="text-sm text-slate-600">
              Unleash your mind. What is your secret wish for the next year?
            </p>
            <textarea
              {...register("year_ahead_secret_wish")}
              rows={8}
              className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-4 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
            />
          </div>
          <p className="text-center text-xl font-bold text-slate-900">
            You are now done with planning your year.
          </p>
        </div>
      </div>
    </div>
  );
}

type GoalSettingFieldsProps = CustomFieldBaseProps & {
  onOpenGuide: () => void;
};

function GoalSettingFields({ register, onOpenGuide }: GoalSettingFieldsProps) {
  const goalRows = [
    {
      key: "self",
      title: "SELF",
      fields: [
        { id: "goal_self_goal", label: "1-Year Goal", rows: 3 },
        { id: "goal_self_why", label: "Why is this Goal important?", rows: 3 },
        { id: "goal_self_current", label: "Current situation?", rows: 3 },
        { id: "goal_self_resources", label: "Available resources.", rows: 3 },
      ],
    },
    {
      key: "body",
      title: "BODY",
      fields: [
        { id: "goal_body_goal", label: "1-Year Goal", rows: 3 },
        { id: "goal_body_why", label: "Why is this Goal important?", rows: 3 },
        { id: "goal_body_current", label: "Current situation?", rows: 3 },
        { id: "goal_body_resources", label: "Available resources.", rows: 3 },
      ],
    },
    {
      key: "family",
      title: "FAMILY",
      fields: [
        { id: "goal_family_goal", label: "1-Year Goal", rows: 3 },
        { id: "goal_family_why", label: "Why is this Goal important?", rows: 3 },
        { id: "goal_family_current", label: "Current situation?", rows: 3 },
        { id: "goal_family_resources", label: "Available resources.", rows: 3 },
      ],
    },
    {
      key: "professional",
      title: "PROFESSIONAL",
      fields: [
        { id: "goal_professional_goal", label: "1-Year Goal", rows: 3 },
        { id: "goal_professional_why", label: "Why is this Goal important?", rows: 3 },
        { id: "goal_professional_current", label: "Current situation?", rows: 3 },
        { id: "goal_professional_resources", label: "Available resources.", rows: 3 },
      ],
    },
  ] as const;

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2 text-slate-700">
            <h3 className="text-2xl font-bold uppercase tracking-wide text-slate-900">
              GOAL SETTING
            </h3>
            <p className="text-sm leading-relaxed">
              “The future depends on what you do today.” <span className="font-semibold">~Mahatma Gandhi</span>
            </p>
            <p className="text-sm text-slate-600">
              Fill one category at a time. Each section follows the same order from
              the planner page: goal, why it matters, current situation, and
              available resources.
            </p>
          </div>
          <button
            type="button"
            onClick={onOpenGuide}
            className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400"
          >
            View goal-setting guide
          </button>
        </div>

        <div className="space-y-5">
          {goalRows.map((row) => (
            <section
              key={row.key}
              className="rounded-3xl border border-slate-200 bg-white p-5"
            >
              <div className="mb-4 inline-flex rounded-full border border-slate-300 px-3 py-1 text-xs font-bold tracking-[0.15em] text-slate-700">
                {row.title}
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                {row.fields.map((field) => (
                  <label key={field.id} className="flex flex-col gap-2">
                    <span className="text-sm font-semibold text-slate-700">
                      {field.label}
                    </span>
                    <textarea
                      {...register(field.id)}
                      rows={5}
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                    />
                  </label>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </>
  );
}

type GoalSettingGuideOverlayProps = {
  onDismiss: () => void;
};

function GoalSettingGuideOverlay({ onDismiss }: GoalSettingGuideOverlayProps) {
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto p-4 sm:p-6">
      <div
        className="fixed inset-0 bg-white/80 backdrop-blur-sm"
        onClick={onDismiss}
      />
      <div className="relative mx-auto mt-4 w-full max-w-5xl rounded-[32px] bg-white p-8 shadow-2xl sm:mt-8">
        <div className="space-y-5 text-slate-700">
          <div className="flex items-start justify-between gap-4">
            <h3 className="text-2xl font-bold uppercase tracking-wide text-slate-900">
              VALUE OF GOAL SETTING
            </h3>
            <button
              type="button"
              onClick={onDismiss}
              className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400"
            >
              Close
            </button>
          </div>

          <p>
            When you look at all the people around you, something becomes obvious:
            Certain individuals are always more successful than others. And not only
            are they more successful, they&apos;re more focused, energetic,
            enthusiastic, and confident.
          </p>
          <p>
            The more you invest in visualizing, committing to, and working toward a
            bigger future, the bigger that future automatically becomes. Life itself
            operates according to investment and returns. Those who invest in their
            personal future get big rewards. Those who do not invest get little or
            nothing.
          </p>
          <p>
            Those who continually set goals and track them over the course of their
            life are more likely to achieve them. Goal setting and goal tracking
            work, but it involves commitment. It requires that you take yourself and
            your dreams seriously. It also involves concentration and effort over the
            course of your life. But once you get into the habit, it becomes easier
            and easier. Here&apos;s how:
          </p>

          <div className="space-y-3 text-sm leading-relaxed">
            <p>
              <span className="font-semibold text-slate-900">Visualize your future:</span>{" "}
              All goal setting starts by being willing to tell yourself what you want
              in all of the different situations in your life. Be willing to
              visualize everything: your health, appearance, abilities, relations,
              wealth, contributions, impact, and reputation. Anyone can do this, but
              it does require that you tell the truth.
            </p>
            <p>
              <span className="font-semibold text-slate-900">Write your future:</span>{" "}
              Your writing hand is connected to your brain. Whatever you write on
              paper, positive or negative, your brain takes seriously. Therefore,
              always write down positive things that will increasingly make your
              future bigger than your past. Be very specific.
            </p>
            <p>
              <span className="font-semibold text-slate-900">Time yourself:</span>{" "}
              Tell your brain when you want the achievements to happen. With
              deadlines, your brain responds by giving you a sense of focus and
              motivation.
            </p>
            <p>
              <span className="font-semibold text-slate-900">Measure yourself:</span>{" "}
              With each goal, provide a measurement. Specify the actual achievement
              that will prove to you and others that the goal has been achieved. The
              clearer and more specific the measurement, the more motivating the
              goal.
            </p>
            <p>
              <span className="font-semibold text-slate-900">Check your progress:</span>{" "}
              Check your goals on a daily, weekly, monthly, and quarterly basis. By
              doing this, you not only visualize your future, you actually live it.
            </p>
            <p>
              <span className="font-semibold text-slate-900">Report your progress:</span>{" "}
              Surround yourself with an accountability community of other goal
              achievers where you continually report your progress to one another on
              a scheduled basis.
            </p>
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={onDismiss}
              className="rounded-xl bg-brand px-6 py-3 text-sm font-semibold text-white transition hover:bg-brand-dark"
            >
              Start filling goals
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

type QuarterlyPlannerFieldsProps = CustomFieldBaseProps & {
  setValue: UseFormSetValue<StepFormValues>;
  watch: UseFormWatch<StepFormValues>;
};

function QuarterlyPlannerFields({
  register,
  setValue,
  watch,
}: QuarterlyPlannerFieldsProps) {
  const habits = [
    "quarter_habit_1",
    "quarter_habit_2",
    "quarter_habit_3",
    "quarter_habit_4",
  ] as const;

  const priorities = [
    ["quarter_priority_do_1", "quarter_priority_why_1", "quarter_priority_impact_1"],
    ["quarter_priority_do_2", "quarter_priority_why_2", "quarter_priority_impact_2"],
    ["quarter_priority_do_3", "quarter_priority_why_3", "quarter_priority_impact_3"],
    ["quarter_priority_do_4", "quarter_priority_why_4", "quarter_priority_impact_4"],
    ["quarter_priority_do_5", "quarter_priority_why_5", "quarter_priority_impact_5"],
  ] as const;

  const books = [
    ["quarter_book_1", "quarter_takeaway_1", "quarter_first_action_1"],
    ["quarter_book_2", "quarter_takeaway_2", "quarter_first_action_2"],
    ["quarter_book_3", "quarter_takeaway_3", "quarter_first_action_3"],
  ] as const;

  const bucketList = [
    ["quarter_bucket_1", "quarter_bucket_done_1", "quarter_bucket_when_1"],
    ["quarter_bucket_2", "quarter_bucket_done_2", "quarter_bucket_when_2"],
    ["quarter_bucket_3", "quarter_bucket_done_3", "quarter_bucket_when_3"],
    ["quarter_bucket_4", "quarter_bucket_done_4", "quarter_bucket_when_4"],
    ["quarter_bucket_5", "quarter_bucket_done_5", "quarter_bucket_when_5"],
  ] as const;

  return (
    <div className="space-y-8">
      <div className="space-y-3 text-slate-700">
        <h3 className="text-2xl font-bold uppercase tracking-wide text-slate-900">
          QUARTERLY PLANNER
        </h3>
      </div>

      <div className="space-y-4">
        <div className="space-y-1">
          <p className="text-base font-semibold text-slate-800">Habits for the Quarter</p>
          <p className="text-sm text-slate-600">
            It takes 21 Days to create a Habit, pick one habit at a time
          </p>
        </div>
        <div className="space-y-3">
          {habits.map((id, index) => (
            <label key={id} className="flex items-start gap-3">
              <span className="pt-3 text-sm font-semibold text-slate-700">
                {index + 1}.
              </span>
              <textarea
                {...register(id)}
                rows={2}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
              />
            </label>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <p className="text-base font-semibold text-slate-800">Think Time Priorities</p>
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <div className="grid grid-cols-3 border-b border-slate-200 bg-slate-50">
            <div className="border-r border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700">
              What Will You Do?
            </div>
            <div className="border-r border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700">
              Why Will You Do It?
            </div>
            <div className="px-3 py-2 text-sm font-semibold text-slate-700">
              What Impact Do You Expect?
            </div>
          </div>
          <div>
            {priorities.map((row, index) => (
              <div key={index} className="grid grid-cols-3 border-t border-slate-200">
                {row.map((fieldId, fieldIndex) => (
                  <textarea
                    key={fieldId}
                    {...register(fieldId)}
                    rows={3}
                    className={`min-h-[96px] resize-none bg-white px-3 py-2 text-sm text-slate-900 outline-none ${
                      fieldIndex < 2 ? "border-r border-slate-200" : ""
                    }`}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
        <label className="flex flex-col gap-2">
          <span className="text-sm font-semibold text-slate-700">
            Number One Commitment Of High Value:
          </span>
          <textarea
            {...register("quarter_commitment")}
            rows={3}
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
          />
        </label>
      </div>

      <div className="space-y-4">
        <div className="space-y-1">
          <p className="text-base font-semibold text-slate-800">
            Book Reading List For The Quarter
          </p>
          <p className="text-sm text-slate-600">
            Read at least 1 book this quarter. Remember readers make leaders.
          </p>
        </div>
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <div className="grid grid-cols-3 border-b border-slate-200 bg-slate-50">
            <div className="border-r border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700">
              Book
            </div>
            <div className="border-r border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700">
              Biggest Takeaways
            </div>
            <div className="px-3 py-2 text-sm font-semibold text-slate-700">
              First Action
            </div>
          </div>
          <div>
            {books.map((row, index) => (
              <div key={index} className="grid grid-cols-3 border-t border-slate-200">
                {row.map((fieldId, fieldIndex) => (
                  <textarea
                    key={fieldId}
                    {...register(fieldId)}
                    rows={3}
                    className={`min-h-[88px] resize-none bg-white px-3 py-2 text-sm text-slate-900 outline-none ${
                      fieldIndex < 2 ? "border-r border-slate-200" : ""
                    }`}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="space-y-1">
          <p className="text-2xl font-bold uppercase tracking-wide text-slate-900">
            BUCKET LIST
          </p>
          <p className="text-sm text-slate-600">
            Create your bucket list to start executing and seeing amazing results:
          </p>
        </div>
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <div className="grid grid-cols-[minmax(0,1fr)_220px] border-b border-slate-200 bg-slate-50">
            <div className="border-r border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700">
              Bucket List
            </div>
            <div className="px-3 py-2 text-sm font-semibold text-slate-700">By When?</div>
          </div>
          <div>
            {bucketList.map((row, index) => (
              <div
                key={index}
                className="grid grid-cols-[minmax(0,1fr)_220px] border-t border-slate-200"
              >
                <div className="flex items-start gap-3 border-r border-slate-200 px-3 py-2">
                  <input
                    type="hidden"
                    {...register(row[1])}
                  />
                  <input
                    type="checkbox"
                    checked={watch(row[1]) === "true"}
                    onChange={(event) =>
                      setValue(row[1], event.target.checked ? "true" : "false")
                    }
                    className="mt-1 h-4 w-4 rounded border-slate-300"
                  />
                  <textarea
                    {...register(row[0])}
                    rows={2}
                    className="min-h-[64px] w-full resize-none bg-white text-sm text-slate-900 outline-none"
                  />
                </div>
                <textarea
                  {...register(row[2])}
                  rows={2}
                  className="min-h-[64px] resize-none bg-white px-3 py-2 text-sm text-slate-900 outline-none"
                />
              </div>
            ))}
          </div>
        </div>
      </div>
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
      title: "SELF",
    },
    {
      id: "vision_body",
      title: "BODY",
    },
    {
      id: "vision_family",
      title: "FAMILY",
    },
    {
      id: "vision_professional",
      title: "PROFESSIONAL",
    },
  ] as const;

  return (
    <div className="space-y-4">
      <div className="space-y-3 text-sm leading-relaxed text-slate-700">
        <p>
          <span className="font-semibold">
            VISION BOARD - A visualization tool which represents your dreams,
            aspirations
          </span>
          {" "}
          Creating a <span className="font-semibold">Vision Board</span> is like{" "}
          <span className="font-semibold">planting a seed. The ideas and intentions</span>{" "}
          are in your mind, and <span className="font-semibold">your vision board</span>{" "}
          is a <span className="font-semibold">tool to nurture them.</span>
        </p>

        <div className="space-y-1">
          <p className="font-semibold">How to create your Vision Board</p>
          <p>1. Work out the things you want to include, for example.</p>
          <p className="pl-5">a. Places you want to visit</p>
          <p className="pl-5">b. People and quotes that inspire you</p>
          <p className="pl-5">c. Your health and wellness aspirations</p>
          <p className="pl-5">d. Profession, career and business goals</p>
          <p>2. Find pictures and words that portray your vision.</p>
          <p>
            3. Draw them and stick the images on your vision board or chart paper.
          </p>
          <p>
            4. Place your vision board at a place where you will see it every day
            and manifest your future.
          </p>
        </div>

        <div className="space-y-1">
          <p className="font-semibold">Tips to Create an Empowering Vision Board</p>
          <p>
            • Use this table to depict your dreams and goals, your ideas of life
          </p>
          <p>• Hand write your goals, it would have a much better impact</p>
          <p>
            • Find pictures that represent or symbolize your experiences, feelings,
            and possessions you want to attract into your life
          </p>
          <p>
            • Avoid clutter - Keep your board neat by being selective on what you put
            on your board
          </p>
          <p>• Add the date on which you make your Vision Board</p>
          <p>
            • Last, but not the least...{" "}
            <span className="font-semibold">Be yourself... Be Realistic... Be honest!!</span>
          </p>
        </div>
      </div>
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
        <div className="space-y-3 text-sm leading-relaxed text-slate-700">
          <p>
            <span className="font-semibold">INSTRUCTIONS:</span> Reflect &amp;
            self-evaluate... How satisfied are you in each quadrant?
          </p>
          <ul className="list-disc space-y-2 pl-5">
            <li>
              If the center is 0 and the outer circle 10, put a number beside each
              label, and color in your <span className="font-semibold">satisfaction</span>{" "}
              with each slice.
            </li>
            <li>
              The filled in circle represents{" "}
              <span className="font-semibold">your current view</span> of your
              {" "}‘Wheel of Life’.
            </li>
            <li>
              How evenly is it spinning? Where do you need to shift your energy /
              focus to <span className="font-semibold">or</span> from?
            </li>
          </ul>
        </div>
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
                  className="w-full accent-brand"
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
      <div className="relative z-10 max-w-4xl rounded-[36px] bg-white/95 p-12 text-center shadow-2xl">
        <p className="text-lg font-light uppercase tracking-[0.2em] text-slate-400">
          You just designed a powerful new chapter.
        </p>
        <p className="mt-3 text-base text-slate-600">
          This planning session is already pouring optimism into your life—welcome to the story you chose.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button
            onClick={onPlanWeek}
            className="inline-flex items-center rounded-xl bg-brand px-6 py-3 text-sm font-semibold text-white transition hover:bg-brand-dark"
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
