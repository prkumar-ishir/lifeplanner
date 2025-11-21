import AppShell from "@/components/layout/app-shell";

/**
 * PlannerRoutesLayout ensures every authenticated route inherits the shared AppShell chrome.
 */
export default function PlannerRoutesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppShell>{children}</AppShell>;
}
