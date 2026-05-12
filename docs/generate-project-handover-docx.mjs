import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";

const outputPath = path.resolve("docs/Life-Planner-Project-Handover.docx");

const blocks = [
  { style: "Title", text: "Life Planner Project Handover" },
  { text: "Project Name: Life Planner" },
  { text: "Project Type: Guided planning and employee engagement web application" },
  { text: "Prepared For: Project handover submission" },
  { text: "Prepared On: 12 May 2026" },

  { style: "Heading1", text: "1. Project Overview" },
  {
    text:
      "Life Planner is a web application designed to help users move through a structured personal planning journey. The product combines reflection, goal setting, and weekly execution into a single workspace. It also includes an admin layer for monitoring usage, managing motivational content, configuring reminders, handling user data exports, and maintaining consent and deletion workflows.",
  },
  {
    text:
      "The application is built with Next.js and Supabase. Users can still interact with the UI locally even if backend credentials are missing, while persistence becomes available once Supabase is configured.",
  },

  { style: "Heading1", text: "2. Main Objective" },
  {
    text:
      "The main objective of the project is to provide a guided digital planning system that helps users define long-term goals, reflect on important life areas, and convert those goals into weekly action plans.",
  },
  { bullet: "Guide users through a structured self-reflection journey." },
  { bullet: "Capture personal vision, goals, and execution plans." },
  { bullet: "Provide a dashboard for reviewing progress and momentum." },
  { bullet: "Support admin oversight for engagement and compliance." },

  { style: "Heading1", text: "3. Technology Stack" },
  { text: "Frontend: Next.js 16, React 19, TypeScript" },
  { text: "Styling: Tailwind CSS" },
  { text: "State Management: Zustand" },
  { text: "Forms: React Hook Form" },
  { text: "Backend and Authentication: Supabase" },
  { text: "Document Export: jsPDF" },

  { style: "Heading1", text: "4. Core User Features" },
  { style: "Heading2", text: "4.1 Authentication" },
  { bullet: "Supabase-based sign-in flow for authenticated access." },
  { bullet: "Protected app routes under the authenticated workspace." },
  { bullet: "Shared user state through an auth provider." },

  { style: "Heading2", text: "4.2 Guided Planner Flow" },
  { text: "The planner contains eight guided steps:" },
  { bullet: "My Commitment" },
  { bullet: "My Vision" },
  { bullet: "Wheel of Life" },
  { bullet: "Purpose of Life" },
  { bullet: "The Past Year" },
  { bullet: "The Year Ahead" },
  { bullet: "Goal Setting" },
  { bullet: "Quarterly Planning" },
  {
    text:
      "Each step saves locally and also persists to Supabase for authenticated users. A horizontal stepper controls navigation through the sequence.",
  },

  { style: "Heading2", text: "4.3 Custom Planning Experiences" },
  { bullet: "Commitment letter editor for intentional written commitment." },
  { bullet: "Vision quadrants for Self, Body, Family, and Professional areas." },
  { bullet: "Wheel of Life scoring for balance reflection." },
  { bullet: "Purpose of Life questionnaire with values capture." },
  { bullet: "Goal setting linked to dashboard momentum scoring." },
  { bullet: "Quarterly planning for execution breakdown." },

  { style: "Heading2", text: "4.4 Dashboard" },
  { bullet: "Displays planner completion progress." },
  { bullet: "Shows the latest weekly plan summary." },
  { bullet: "Provides shortcuts back to completed planner steps." },
  { bullet: "Shows goal spotlight cards with editable 1 to 10 momentum scores." },
  { bullet: "Displays placement-based motivational quotes." },

  { style: "Heading2", text: "4.5 Weekly Planner" },
  {
    text:
      "The weekly planner converts long-term plans into short-term execution. The current implementation supports a structured board starting from a selected date and currently models Monday to Wednesday in detail.",
  },
  { bullet: "Captures action areas for Self, Body, Family, and Professional categories." },
  { bullet: "Stores focus items, tasks, appointments, habits, and routine checks." },
  { bullet: "Stores gratitude, wins, productivity score, and happiness score." },
  { bullet: "Supports save, edit, and delete flows." },
  { bullet: "Builds summarized focus, wins, and notes for reuse in the dashboard and PDF export." },

  { style: "Heading2", text: "4.6 PDF Export" },
  { bullet: "Users can export their own complete Life Plan report from Settings." },
  { bullet: "Admins can export user data as PDF when consent permits." },
  { bullet: "PDF output includes a cover page, summary, planner responses, weekly plans, and goal scores." },

  { style: "Heading2", text: "4.7 Personalization and Settings" },
  { bullet: "Theme color selection for the user workspace." },
  { bullet: "Consent management for data collection, retention, and export." },
  { bullet: "Account deletion request flow with soft-delete or hard-delete behavior." },

  { style: "Heading1", text: "5. Admin Features" },
  { style: "Heading2", text: "5.1 Admin Dashboard" },
  { bullet: "Total employees" },
  { bullet: "Active users this week" },
  { bullet: "Average planner steps completed" },
  { bullet: "Total weekly plans created" },
  { bullet: "Completion rate" },
  { bullet: "Users active in the last 30 days" },

  { style: "Heading2", text: "5.2 Employee Engagement Table" },
  { bullet: "Lists employees and their engagement metrics." },
  { bullet: "Displays consent status indicators." },
  { bullet: "Enables admin export only when required consent exists." },

  { style: "Heading2", text: "5.3 Audit Logs" },
  { bullet: "Tracks admin access, exports, reminder updates, quote changes, consent changes, and deletion events." },
  { bullet: "Supports paginated loading of audit history." },

  { style: "Heading2", text: "5.4 Reminder Configuration" },
  { bullet: "Admins can store reminder frequency for each employee." },
  { bullet: "Supported values include daily, weekly, biweekly, monthly, and none." },
  { bullet: "Reminder configuration exists, but actual reminder delivery is not implemented in this repository." },

  { style: "Heading2", text: "5.5 Motivational Quote Management" },
  { bullet: "Admins can create, update, and delete quotes." },
  { bullet: "Quotes can be assigned to onboarding, dashboard, planner, and weekly planner placements." },
  { bullet: "Quotes can be marked active or inactive." },

  { style: "Heading2", text: "5.6 Role-Based Access Control" },
  { bullet: "Supports employee and admin roles." },
  { bullet: "Role data is stored in Supabase." },
  { bullet: "Admin routes are separated from employee-facing pages." },

  { style: "Heading1", text: "6. Data Privacy and Compliance Features" },
  { bullet: "Consent records are maintained for data collection, data retention, and data export." },
  { bullet: "User and admin exports are consent-aware." },
  { bullet: "Sensitive actions are recorded in audit logs." },
  { bullet: "Soft delete is used when retention consent exists." },
  { bullet: "Hard delete is used when retention consent does not exist." },
  { bullet: "Repository support exists for restoring soft-deleted data." },

  { style: "Heading1", text: "7. Main Data Areas" },
  { bullet: "planner_entries for planner step responses" },
  { bullet: "weekly_plans for weekly planning records" },
  { bullet: "goal_scores for dashboard momentum tracking" },
  { bullet: "user_roles for role assignment" },
  { bullet: "audit_logs for activity and compliance tracking" },
  { bullet: "consent_records for privacy preferences" },
  { bullet: "reminder_configs for reminder settings" },
  { bullet: "motivational_quotes for reusable quote content" },
  { bullet: "data_exports for export history" },
  { bullet: "user_preferences for theme settings" },

  { style: "Heading1", text: "8. Application Structure" },
  { text: "src/app: Route files for landing page, planner, dashboard, weekly planner, settings, and admin pages." },
  { text: "src/components: Reusable UI components for planner, admin, export, navigation, and quotes." },
  { text: "src/data/plannerFlow.ts: Source of truth for the eight planner steps and fields." },
  { text: "src/store/plannerStore.ts: Zustand store for planner and weekly-plan state." },
  { text: "src/lib/supabase: Client setup, repositories, and audit helpers." },
  { text: "src/lib/pdf: PDF generation logic." },
  { text: "supabase/migrations: SQL migrations for roles, compliance, reminders, and quotes." },

  { style: "Heading1", text: "9. Important Implementation Notes" },
  { bullet: "The existing README is partially outdated and should not be treated as the only source of truth." },
  { bullet: "The planner currently contains eight steps." },
  { bullet: "The weekly planner is currently a three-day detailed board, not a full seven-day planner." },
  { bullet: "Reminder sending is not implemented, only reminder configuration storage." },
  { bullet: "A field-encryption helper exists but is not wired into the main persistence flow." },
  { bullet: "Supabase credentials are required for persistence, admin features, and reporting." },

  { style: "Heading1", text: "10. Setup and Run Instructions" },
  { bullet: "Install dependencies with npm install." },
  { bullet: "Run the app locally with npm run dev." },
  { bullet: "Configure Supabase values in .env.local." },
  { bullet: "Apply the SQL migration files in supabase/migrations." },

  { style: "Heading1", text: "11. Recommended Next Steps" },
  { bullet: "Update README and technical documentation to match the current implementation." },
  { bullet: "Decide whether the weekly planner should remain three-day or expand to seven-day coverage." },
  { bullet: "Implement actual reminder delivery using a scheduler or external service." },
  { bullet: "Decide whether field encryption should be activated for sensitive responses." },
  { bullet: "Increase automated testing around planner save flows, admin permissions, exports, and deletions." },
  { bullet: "Review Supabase Row Level Security policies before production use." },

  { style: "Heading1", text: "12. Conclusion" },
  {
    text:
      "Life Planner is a structured planning platform that combines guided reflection, long-term goal setting, weekly execution, and admin visibility in one application. Its strongest areas are the planner flow, dashboard, weekly planning workflow, consent-aware exports, audit logging, and engagement reporting. The project is a solid functional base and can be extended further by completing operational features such as reminder delivery, documentation cleanup, and deeper security integration.",
  },
];

function escapeXml(value) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function paragraphXml(text, style = "Normal") {
  return `<w:p><w:pPr><w:pStyle w:val="${style}"/></w:pPr><w:r><w:t xml:space="preserve">${escapeXml(text)}</w:t></w:r></w:p>`;
}

const documentParagraphs = blocks
  .map((block) => {
    if (block.bullet) {
      return paragraphXml(`• ${block.bullet}`);
    }
    return paragraphXml(block.text, block.style);
  })
  .join("");

const documentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:wpc="http://schemas.microsoft.com/office/word/2010/wordprocessingCanvas"
 xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"
 xmlns:m="http://schemas.openxmlformats.org/officeDocument/2006/math"
 xmlns:v="urn:schemas-microsoft-com:vml"
 xmlns:wp14="http://schemas.microsoft.com/office/word/2010/wordprocessingDrawing"
 xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing"
 xmlns:w10="urn:schemas-microsoft-com:office:word"
 xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"
 xmlns:w14="http://schemas.microsoft.com/office/word/2010/wordml"
 xmlns:wpg="http://schemas.microsoft.com/office/word/2010/wordprocessingGroup"
 xmlns:wpi="http://schemas.microsoft.com/office/word/2010/wordprocessingInk"
 xmlns:wne="http://schemas.microsoft.com/office/2006/wordml"
 xmlns:wps="http://schemas.microsoft.com/office/word/2010/wordprocessingShape"
 mc:Ignorable="w14 wp14">
  <w:body>
    ${documentParagraphs}
    <w:sectPr>
      <w:pgSz w:w="12240" w:h="15840"/>
      <w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440" w:header="708" w:footer="708" w:gutter="0"/>
    </w:sectPr>
  </w:body>
</w:document>`;

const stylesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:style w:type="paragraph" w:default="1" w:styleId="Normal">
    <w:name w:val="Normal"/>
    <w:qFormat/>
    <w:rPr>
      <w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/>
      <w:sz w:val="22"/>
    </w:rPr>
  </w:style>
  <w:style w:type="paragraph" w:styleId="Title">
    <w:name w:val="Title"/>
    <w:basedOn w:val="Normal"/>
    <w:qFormat/>
    <w:pPr>
      <w:spacing w:after="160"/>
    </w:pPr>
    <w:rPr>
      <w:b/>
      <w:sz w:val="34"/>
      <w:color w:val="1E293B"/>
    </w:rPr>
  </w:style>
  <w:style w:type="paragraph" w:styleId="Heading1">
    <w:name w:val="heading 1"/>
    <w:basedOn w:val="Normal"/>
    <w:qFormat/>
    <w:pPr>
      <w:spacing w:before="240" w:after="120"/>
    </w:pPr>
    <w:rPr>
      <w:b/>
      <w:sz w:val="28"/>
      <w:color w:val="0F172A"/>
    </w:rPr>
  </w:style>
  <w:style w:type="paragraph" w:styleId="Heading2">
    <w:name w:val="heading 2"/>
    <w:basedOn w:val="Normal"/>
    <w:qFormat/>
    <w:pPr>
      <w:spacing w:before="180" w:after="80"/>
    </w:pPr>
    <w:rPr>
      <w:b/>
      <w:sz w:val="24"/>
      <w:color w:val="334155"/>
    </w:rPr>
  </w:style>
</w:styles>`;

const contentTypesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
  <Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>
  <Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>
  <Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/>
</Types>`;

const rootRelsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>
  <Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/>
</Relationships>`;

const documentRelsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`;

const coreXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:dcmitype="http://purl.org/dc/dcmitype/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <dc:title>Life Planner Project Handover</dc:title>
  <dc:creator>OpenAI Codex</dc:creator>
  <cp:lastModifiedBy>OpenAI Codex</cp:lastModifiedBy>
  <dcterms:created xsi:type="dcterms:W3CDTF">2026-05-12T00:00:00Z</dcterms:created>
  <dcterms:modified xsi:type="dcterms:W3CDTF">2026-05-12T00:00:00Z</dcterms:modified>
</cp:coreProperties>`;

const appXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties" xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes">
  <Application>Microsoft Office Word</Application>
</Properties>`;

const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "life-planner-docx-"));

for (const dir of ["_rels", "docProps", "word", "word/_rels"]) {
  fs.mkdirSync(path.join(tempDir, dir), { recursive: true });
}

fs.writeFileSync(path.join(tempDir, "[Content_Types].xml"), contentTypesXml);
fs.writeFileSync(path.join(tempDir, "_rels", ".rels"), rootRelsXml);
fs.writeFileSync(path.join(tempDir, "docProps", "core.xml"), coreXml);
fs.writeFileSync(path.join(tempDir, "docProps", "app.xml"), appXml);
fs.writeFileSync(path.join(tempDir, "word", "document.xml"), documentXml);
fs.writeFileSync(path.join(tempDir, "word", "styles.xml"), stylesXml);
fs.writeFileSync(path.join(tempDir, "word", "_rels", "document.xml.rels"), documentRelsXml);

if (fs.existsSync(outputPath)) {
  fs.unlinkSync(outputPath);
}

execFileSync("zip", ["-qr", outputPath, "."], { cwd: tempDir });

fs.rmSync(tempDir, { recursive: true, force: true });

console.log(`Created ${outputPath}`);
