/**
 * Shared planner + weekly plan types keep UI, store, and Supabase payloads aligned.
 */
export type FieldType = "text" | "textarea" | "number" | "select";

export type PlannerFieldOption = {
  label: string;
  value: string;
};

export type PlannerField = {
  id: string;
  label: string;
  type: FieldType;
  placeholder?: string;
  helperText?: string;
  options?: PlannerFieldOption[];
  defaultValue?: string;
};

export type CustomStepLayout =
  | "commitmentLetter"
  | "visionQuadrants"
  | "wheelOfLife";

export type PlannerStep = {
  id: string;
  title: string;
  description: string;
  icon: string;
  accentColor: string;
  fields: PlannerField[];
  customLayout?: CustomStepLayout;
};

export type PlannerEntry = Record<string, string>;

export type WeeklyPlan = {
  id: string;
  year: number;
  month: number;
  weekOfMonth: number;
  focus: string;
  wins: string[];
  scheduleNotes: string;
  createdAt: string;
};

export type PlannerEntryPayload = {
  userId?: string;
  stepId: string;
  data: PlannerEntry;
  completedAt: string;
};

export type WeeklyPlanPayload = WeeklyPlan & {
  userId?: string;
};

export type GoalScore = {
  goalId: string;
  score: number;
};
