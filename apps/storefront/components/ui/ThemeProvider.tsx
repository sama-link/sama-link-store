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

function logThemeApplication(theme: Theme, suppressTransitions: boolean): void {
  const root = document.documentElement;
  const activeSlide = document.querySelector<HTMLElement>(".hero-pro-slide.is-active");
  const ring = activeSlide?.querySelector<HTMLElement>(".hero-pro-rings .ring") ?? null;
  const slideStyle = activeSlide ? window.getComputedStyle(activeSlide) : null;
  const ringStyle = ring ? window.getComputedStyle(ring) : null;

  // #region agent log
  fetch("http://127.0.0.1:7416/ingest/257a44d6-ca25-426f-8206-e2a734edec52", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Debug-Session-Id": "776254",
    },
    body: JSON.stringify({
      sessionId: "776254",
      runId: "initial",
      hypothesisId: "H2,H3,H4,H6",
      location: "apps/storefront/components/ui/ThemeProvider.tsx:applyDomTheme",
      message: "Theme applied to DOM and hero ring sampled",
      data: {
        requestedTheme: theme,
        suppressTransitions,
        htmlClassName: root.className,
        htmlHasDarkClass: root.classList.contains("dark"),
        dataThemeChanging: root.getAttribute("data-theme-changing"),
        activeSlideId: activeSlide?.dataset.slide ?? null,
        hasRing: Boolean(ring),
        slideRingVariable: slideStyle?.getPropertyValue("--slide-ring-color").trim() ?? null,
        ringBorderTopColor: ringStyle?.borderTopColor ?? null,
        ringOpacity: ringStyle?.opacity ?? null,
      },
      timestamp: Date.now(),
    }),
  }).catch(() => {});
  // #endregion
  // #region agent log
  console.info("agent-debug-776254-theme", {
    sessionId: "776254",
    runId: "browser-console-fallback",
    hypothesisId: "H2,H3,H4,H6,H7",
    location: "apps/storefront/components/ui/ThemeProvider.tsx:applyDomTheme",
    message: "Theme applied to DOM and hero ring sampled",
    data: {
      requestedTheme: theme,
      suppressTransitions,
      htmlClassName: root.className,
      htmlHasDarkClass: root.classList.contains("dark"),
      dataThemeChanging: root.getAttribute("data-theme-changing"),
      activeSlideId: activeSlide?.dataset.slide ?? null,
      hasRing: Boolean(ring),
      slideRingVariable: slideStyle?.getPropertyValue("--slide-ring-color").trim() ?? null,
      ringBorderTopColor: ringStyle?.borderTopColor ?? null,
      ringOpacity: ringStyle?.opacity ?? null,
    },
    timestamp: Date.now(),
  });
  // #endregion
}

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
  logThemeApplication(theme, suppressTransitions);
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
