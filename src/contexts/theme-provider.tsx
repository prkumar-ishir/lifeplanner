"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useAuth } from "@/contexts/auth-provider";
import { themePresets, type ThemeId } from "@/lib/themes";
import { fetchUserTheme, upsertUserTheme } from "@/lib/supabase/repositories";

type ThemeContextValue = {
  theme: ThemeId;
  setTheme: (id: ThemeId) => void;
  loading: boolean;
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

const SELECTION_STYLE_ID = "theme-selection-style";

function applyThemeToDOM(id: ThemeId) {
  const preset = themePresets[id];
  if (!preset) return;
  const root = document.documentElement;
  root.style.setProperty("--brand", preset.brand);
  root.style.setProperty("--brand-dark", preset.brandDark);
  root.style.setProperty("--brand-light", preset.brandLight);
  root.style.setProperty("--brand-accent", preset.brandAccent);
  root.style.setProperty("--gradient-mid", preset.gradientMid);

  // Inject a real <style> for ::selection — CSS vars inside ::selection are
  // unreliable in some browsers so we write the resolved hex values directly.
  let style = document.getElementById(SELECTION_STYLE_ID) as HTMLStyleElement | null;
  if (!style) {
    style = document.createElement("style");
    style.id = SELECTION_STYLE_ID;
    document.head.appendChild(style);
  }
  style.textContent = `*::selection { background-color: ${preset.brand}; color: #fff; }`;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [theme, setThemeState] = useState<ThemeId>("blue");
  const [loading, setLoading] = useState(true);

  // Load saved theme when user changes
  useEffect(() => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    fetchUserTheme(user.id).then((saved) => {
      if (cancelled) return;
      const id = (saved && saved in themePresets ? saved : "blue") as ThemeId;
      setThemeState(id);
      applyThemeToDOM(id);
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  const setTheme = useCallback(
    (id: ThemeId) => {
      setThemeState(id);
      applyThemeToDOM(id);
      // Persist in background
      if (user?.id) {
        upsertUserTheme(user.id, id).catch(console.error);
      }
    },
    [user?.id]
  );

  const value = useMemo<ThemeContextValue>(
    () => ({ theme, setTheme, loading }),
    [theme, setTheme, loading]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
}
