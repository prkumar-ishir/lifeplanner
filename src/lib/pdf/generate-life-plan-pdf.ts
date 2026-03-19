import { jsPDF } from "jspdf";
import type { PlannerEntry, PlannerStep, WeeklyPlan } from "@/types/planner";

type PdfParams = {
  userName: string;
  userEmail: string;
  entries: Record<string, PlannerEntry>;
  weeklyPlans: Record<string, WeeklyPlan>;
  goalScores: Record<string, number>;
  plannerFlow: PlannerStep[];
  generatedAt: string;
};

const MARGIN = 20;
const PAGE_WIDTH = 210;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;
const LINE_HEIGHT = 7;

/** Strip emojis and other non-ASCII symbols that jsPDF cannot render. */
function stripEmoji(text: string): string {
  return text
    .replace(/[\u{1F000}-\u{1FFFF}]/gu, "")
    .replace(/[\u{2600}-\u{27BF}]/gu, "")
    .replace(/[\u{FE00}-\u{FEFF}]/gu, "")
    .replace(/[\u{200D}\u{20E3}\u{FE0F}]/gu, "")
    .trim();
}

function addHeader(doc: jsPDF, title: string) {
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(30, 41, 59); // slate-800
  doc.text(title, MARGIN, 30);
  doc.setDrawColor(203, 213, 225); // slate-300
  doc.line(MARGIN, 34, PAGE_WIDTH - MARGIN, 34);
}

function wrapText(doc: jsPDF, text: string, maxWidth: number): string[] {
  return doc.splitTextToSize(text, maxWidth);
}

function ensureSpace(doc: jsPDF, y: number, needed: number): number {
  if (y + needed > 270) {
    doc.addPage();
    return 20;
  }
  return y;
}

/**
 * Generates a branded PDF report of a user's full Life Plan data.
 * Returns a Blob suitable for browser download.
 */
export async function generateLifePlanPdf(params: PdfParams): Promise<Blob> {
  const { userName, userEmail, entries, weeklyPlans, goalScores, plannerFlow, generatedAt } =
    params;

  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  // ─── Cover Page ──────────────────────────────────────────
  doc.setFillColor(248, 250, 252); // slate-50
  doc.rect(0, 0, PAGE_WIDTH, 297, "F");

  doc.setFontSize(28);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(15, 23, 42); // slate-900
  doc.text("Life Plan Report", PAGE_WIDTH / 2, 100, { align: "center" });

  doc.setFontSize(14);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(71, 85, 105); // slate-600
  doc.text(userName, PAGE_WIDTH / 2, 120, { align: "center" });

  doc.setFontSize(11);
  doc.text(userEmail, PAGE_WIDTH / 2, 130, { align: "center" });

  doc.setFontSize(10);
  doc.setTextColor(148, 163, 184); // slate-400
  doc.text(
    `Generated on ${new Date(generatedAt).toLocaleDateString(undefined, { dateStyle: "long" })}`,
    PAGE_WIDTH / 2,
    145,
    { align: "center" }
  );

  // ─── Summary Page ────────────────────────────────────────
  doc.addPage();
  addHeader(doc, "Summary");

  const completedSteps = Object.keys(entries).length;
  const totalSteps = plannerFlow.length;
  const weeklyPlanCount = Object.keys(weeklyPlans).length;
  const goalCount = Object.keys(goalScores).length;

  let y = 45;
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(51, 65, 85); // slate-700

  const summaryLines = [
    `Progress: ${completedSteps} of ${totalSteps} steps completed`,
    `Weekly Plans Created: ${weeklyPlanCount}`,
    `Goals Tracked: ${goalCount}`,
  ];
  for (const line of summaryLines) {
    doc.text(line, MARGIN, y);
    y += LINE_HEIGHT;
  }

  // Goal scores
  if (goalCount > 0) {
    y += 5;
    doc.setFont("helvetica", "bold");
    doc.text("Goal Momentum Scores", MARGIN, y);
    y += LINE_HEIGHT;
    doc.setFont("helvetica", "normal");

    for (const [goalId, score] of Object.entries(goalScores)) {
      y = ensureSpace(doc, y, LINE_HEIGHT + 5);

      doc.text(`${goalId}: ${score}/10`, MARGIN + 2, y);

      // Draw bar
      const barWidth = (score / 10) * 80;
      doc.setFillColor(99, 102, 241); // indigo-500
      doc.roundedRect(MARGIN + 50, y - 3, barWidth, 4, 1, 1, "F");
      doc.setDrawColor(226, 232, 240); // slate-200
      doc.roundedRect(MARGIN + 50, y - 3, 80, 4, 1, 1, "S");

      y += LINE_HEIGHT;
    }
  }

  // ─── Step Pages ──────────────────────────────────────────
  for (const step of plannerFlow) {
    const entry = entries[step.id];
    if (!entry) continue;

    doc.addPage();
    addHeader(doc, stripEmoji(step.title));

    y = 45;
    doc.setFontSize(9);
    doc.setTextColor(148, 163, 184);
    doc.text(`Step ${plannerFlow.indexOf(step) + 1} of ${totalSteps}`, MARGIN, y);
    y += 10;

    for (const field of step.fields) {
      const value = entry[field.id];
      if (!value) continue;

      y = ensureSpace(doc, y, 20);

      // Field label
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(51, 65, 85);
      doc.text(field.label, MARGIN, y);
      y += LINE_HEIGHT;

      // Field value
      doc.setFont("helvetica", "normal");
      doc.setTextColor(71, 85, 105);
      const lines = wrapText(doc, value, CONTENT_WIDTH);
      for (const line of lines) {
        y = ensureSpace(doc, y, LINE_HEIGHT);
        doc.text(line, MARGIN, y);
        y += LINE_HEIGHT;
      }

      y += 3; // spacing between fields
    }
  }

  // ─── Weekly Plans Pages ──────────────────────────────────
  const plans = Object.values(weeklyPlans).sort((a, b) => {
    const aKey = a.year * 100 + a.month * 10 + a.weekOfMonth;
    const bKey = b.year * 100 + b.month * 10 + b.weekOfMonth;
    return aKey - bKey;
  });

  if (plans.length > 0) {
    doc.addPage();
    addHeader(doc, "Weekly Plans");
    y = 45;

    for (const plan of plans) {
      y = ensureSpace(doc, y, 35);

      // Week header
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(30, 41, 59);
      doc.text(
        `${plan.year} - Month ${plan.month}, Week ${plan.weekOfMonth}`,
        MARGIN,
        y
      );
      y += LINE_HEIGHT;

      doc.setFont("helvetica", "normal");
      doc.setTextColor(71, 85, 105);

      // Focus
      if (plan.focus) {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(9);
        doc.text("Focus:", MARGIN + 2, y);
        doc.setFont("helvetica", "normal");
        const focusLines = wrapText(doc, plan.focus, CONTENT_WIDTH - 5);
        for (const line of focusLines) {
          y = ensureSpace(doc, y, LINE_HEIGHT);
          doc.text(line, MARGIN + 20, y);
          y += LINE_HEIGHT - 1;
        }
      }

      // Wins
      if (plan.wins.length > 0) {
        y = ensureSpace(doc, y, LINE_HEIGHT);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(9);
        doc.text("Wins:", MARGIN + 2, y);
        doc.setFont("helvetica", "normal");
        y += LINE_HEIGHT - 1;
        for (const win of plan.wins) {
          y = ensureSpace(doc, y, LINE_HEIGHT);
          doc.text(`- ${win}`, MARGIN + 4, y);
          y += LINE_HEIGHT - 1;
        }
      }

      // Notes
      if (plan.scheduleNotes) {
        y = ensureSpace(doc, y, LINE_HEIGHT);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(9);
        doc.text("Notes:", MARGIN + 2, y);
        doc.setFont("helvetica", "normal");
        const noteLines = wrapText(doc, plan.scheduleNotes, CONTENT_WIDTH - 5);
        for (const line of noteLines) {
          y = ensureSpace(doc, y, LINE_HEIGHT);
          doc.text(line, MARGIN + 20, y);
          y += LINE_HEIGHT - 1;
        }
      }

      y += 5; // spacing between plans

      // Divider
      doc.setDrawColor(226, 232, 240);
      doc.line(MARGIN, y, PAGE_WIDTH - MARGIN, y);
      y += 5;
    }
  }

  // ─── Generate blob ───────────────────────────────────────
  return doc.output("blob");
}
