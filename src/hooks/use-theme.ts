/**
 * use-theme — light / dark / system theme preference.
 *
 * Reads and writes localStorage("theme"). Applies the class to <html>
 * immediately so there is no flash between hydration and first render.
 */
import { useCallback, useEffect, useState } from "react";

export type Theme = "light" | "dark" | "system";

const KEY = "theme";

function getStored(): Theme {
  if (typeof localStorage === "undefined") return "system";
  const v = localStorage.getItem(KEY);
  if (v === "light" || v === "dark" || v === "system") return v;
  return "system";
}

function getEffective(theme: Theme): "light" | "dark" {
  if (theme === "system") {
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  return theme;
}

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  const effective = getEffective(theme);
  root.classList.toggle("dark", effective === "dark");
  root.classList.toggle("light", effective === "light");
}

/** Call once at the top of <head> (or in a script tag) to prevent flash. */
export function applyStoredTheme() {
  applyTheme(getStored());
}

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>(getStored);

  // Keep DOM in sync whenever theme changes.
  useEffect(() => {
    applyTheme(theme);
    if (theme === "system") {
      localStorage.removeItem(KEY);
    } else {
      localStorage.setItem(KEY, theme);
    }
  }, [theme]);

  // Track OS changes when in "system" mode.
  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => {
      if (getStored() === "system") applyTheme("system");
    };
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const setTheme = useCallback((next: Theme) => {
    setThemeState(next);
  }, []);

  const toggle = useCallback(() => {
    setThemeState((prev) => {
      const effective = getEffective(prev);
      return effective === "dark" ? "light" : "dark";
    });
  }, []);

  const effective = getEffective(theme);

  return { theme, setTheme, toggle, effective } as const;
}
