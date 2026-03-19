"use client";

import {
  createContext,
  useContext,
  useEffect,
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
  const [loadedUserId, setLoadedUserId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    if (!user?.id) {
      return;
    }

    fetchUserTheme(user.id).then((saved) => {
      if (cancelled) return;
      const id = (saved && saved in themePresets ? saved : "blue") as ThemeId;
      setThemeState(id);
      setLoadedUserId(user.id);
    });

    return () => {
      cancelled = true;
    };
  }, [user]);

  const effectiveTheme = user?.id ? theme : "blue";

  useEffect(() => {
    applyThemeToDOM(effectiveTheme);
  }, [effectiveTheme]);

  function setTheme(id: ThemeId) {
    setThemeState(id);
    if (user?.id) {
      upsertUserTheme(user.id, id).catch(console.error);
    }
  }

  const loading = Boolean(user?.id) && loadedUserId !== user.id;

  const value: ThemeContextValue = { theme: effectiveTheme, setTheme, loading };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
}
