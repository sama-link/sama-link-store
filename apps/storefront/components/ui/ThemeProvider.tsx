"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

export type Theme = "light" | "dark";

export interface ThemeContextValue {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggle: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

const STORAGE_KEY = "theme";

function readStoredTheme(): Theme | null {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    if (v === "light" || v === "dark") return v;
  } catch {
    /* storage unavailable (e.g. private mode) */
  }
  return null;
}

function readSystemTheme(): Theme {
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

let transitionResetTimer: ReturnType<typeof setTimeout> | null = null;

function applyDomTheme(theme: Theme, suppressTransitions = false): void {
  const root = document.documentElement;
  if (suppressTransitions) {
    /* Disable transitions on every element for a single paint so the theme flip
       looks instant instead of cascading element-by-element through the page. */
    root.setAttribute("data-theme-changing", "true");
    if (transitionResetTimer) clearTimeout(transitionResetTimer);
    transitionResetTimer = setTimeout(() => {
      root.removeAttribute("data-theme-changing");
      transitionResetTimer = null;
    }, 120);
  }
  root.classList.toggle("dark", theme === "dark");
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("light");

  useEffect(() => {
    const stored = readStoredTheme();
    const initial = stored ?? readSystemTheme();
    setThemeState(initial);
    applyDomTheme(initial);
    /* Signal the CSS gate (body opacity) that the theme is now applied.
       Runs on the very first paint after hydration — body fades in. */
    document.documentElement.setAttribute("data-theme-ready", "true");
  }, []);

  const setTheme = useCallback((next: Theme) => {
    setThemeState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* ignore */
    }
    applyDomTheme(next, true);
  }, []);

  const toggle = useCallback(() => {
    setThemeState((prev) => {
      const next = prev === "light" ? "dark" : "light";
      try {
        localStorage.setItem(STORAGE_KEY, next);
      } catch {
        /* ignore */
      }
      applyDomTheme(next, true);
      return next;
    });
  }, []);

  const value: ThemeContextValue = {
    theme,
    setTheme,
    toggle,
  };

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return ctx;
}
