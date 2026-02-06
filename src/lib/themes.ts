export type ThemeId = "blue" | "violet" | "emerald" | "rose" | "amber" | "slate";

export type ThemePreset = {
  id: ThemeId;
  label: string;
  swatch: string;
  brand: string;
  brandDark: string;
  brandLight: string;
  brandAccent: string;
  gradientMid: string;
};

export const themePresets: Record<ThemeId, ThemePreset> = {
  blue: {
    id: "blue",
    label: "Ocean Blue",
    swatch: "#2563eb",
    brand: "#2563eb",
    brandDark: "#1e3a8a",
    brandLight: "#93c5fd",
    brandAccent: "#fbbf24",
    gradientMid: "#7c3aed",
  },
  violet: {
    id: "violet",
    label: "Violet",
    swatch: "#7c3aed",
    brand: "#7c3aed",
    brandDark: "#4c1d95",
    brandLight: "#c4b5fd",
    brandAccent: "#f472b6",
    gradientMid: "#a855f7",
  },
  emerald: {
    id: "emerald",
    label: "Emerald",
    swatch: "#059669",
    brand: "#059669",
    brandDark: "#064e3b",
    brandLight: "#6ee7b7",
    brandAccent: "#fbbf24",
    gradientMid: "#14b8a6",
  },
  rose: {
    id: "rose",
    label: "Rose",
    swatch: "#e11d48",
    brand: "#e11d48",
    brandDark: "#881337",
    brandLight: "#fda4af",
    brandAccent: "#fb923c",
    gradientMid: "#f43f5e",
  },
  amber: {
    id: "amber",
    label: "Amber",
    swatch: "#d97706",
    brand: "#d97706",
    brandDark: "#78350f",
    brandLight: "#fcd34d",
    brandAccent: "#ef4444",
    gradientMid: "#f59e0b",
  },
  slate: {
    id: "slate",
    label: "Slate",
    swatch: "#475569",
    brand: "#475569",
    brandDark: "#1e293b",
    brandLight: "#94a3b8",
    brandAccent: "#64748b",
    gradientMid: "#64748b",
  },
};

export const themeIds = Object.keys(themePresets) as ThemeId[];
