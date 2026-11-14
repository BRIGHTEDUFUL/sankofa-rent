import { createContext, useContext, useEffect, useRef, type ReactNode } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

// Mirror of convex/branding.ts defaults — used as the fallback while the
// first query is in flight and on any error, so the UI never renders blank.
// (The server copy is authoritative for validation.)
export const DEFAULT_BRANDING = {
  appName: "Sankofa Rent",
  tagline: "Your property. Your peace of mind.",
  accentColor: "#4E735A",
} as const;

export type Branding = {
  appName: string;
  tagline: string;
  accentColor: string;
  logoUrl: string | null;
  logoContentType: string | null;
};

const FALLBACK: Branding = { ...DEFAULT_BRANDING, logoUrl: null, logoContentType: null };

const BrandingContext = createContext<Branding>(FALLBACK);

// Reads the public branding singleton and exposes it app-wide (auth pages
// included — they render inside <BrandingProvider> too).
export function BrandingProvider({ children }: { children: ReactNode }) {
  const data = useQuery(api.branding.get, {});
  const value = data
    ? {
        appName: data.appName,
        tagline: data.tagline,
        accentColor: data.accentColor,
        logoUrl: data.logoUrl,
        logoContentType: data.logoContentType,
      }
    : FALLBACK;
  return <BrandingContext.Provider value={value}>{children}</BrandingContext.Provider>;
}

export function useBranding(): Branding {
  return useContext(BrandingContext);
}

// --- color helpers (mirror of the server's checks, for live UI feedback) ---

export function isHexColor(s: string): boolean {
  return /^#[0-9a-fA-F]{6}$/.test(s);
}

function luminance(hex: string): number {
  const channels = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  const r = channels[0] ?? 0;
  const g = channels[1] ?? 0;
  const b = channels[2] ?? 0;
  const f = (c: number) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}

export function contrastVsWhite(hex: string): number {
  return 1.05 / (luminance(hex) + 0.05);
}

// White text stays readable on the accent (buttons) and dark text stays
// readable on the page background (text-primary).
export function isUsableAccent(hex: string): boolean {
  return isHexColor(hex) && contrastVsWhite(hex) >= 4.5;
}

// --- effects: tab title, favicon, accent color ---

function applyAccentColor(hex: string) {
  const root = document.documentElement;
  if (!isUsableAccent(hex)) return;
  // Only override non-defaults: the default stays exactly as authored in
  // styles.css (oklch), so there is zero drift for untouched deployments.
  if (hex.toLowerCase() === DEFAULT_BRANDING.accentColor.toLowerCase()) {
    for (const name of ACCENT_VARS) root.style.removeProperty(name);
    return;
  }
  const softMix = `color-mix(in oklch, ${hex} 12%, white)`;
  root.style.setProperty("--primary", hex);
  root.style.setProperty("--ring", hex);
  root.style.setProperty("--accent", softMix);
  root.style.setProperty("--primary-soft", softMix);
  root.style.setProperty("--primary-foreground", "#ffffff");
  root.style.setProperty(
    "--gradient-primary",
    `linear-gradient(135deg, color-mix(in oklch, ${hex} 85%, white), color-mix(in oklch, ${hex} 82%, black))`,
  );
  // Derived token the theme reads through var(--primary); keep it in sync.
  root.style.setProperty("--color-primary", "var(--primary)");
}

const ACCENT_VARS = [
  "--primary",
  "--ring",
  "--accent",
  "--primary-soft",
  "--primary-foreground",
  "--gradient-primary",
  "--color-primary",
];

function applyFavicon(url: string | null, contentType: string | null) {
  let link = document.querySelector<HTMLLinkElement>('link[rel~="icon"]');
  if (!link) {
    link = document.createElement("link");
    link.rel = "icon";
    document.head.appendChild(link);
  }
  if (url) {
    link.href = url;
    if (contentType) link.type = contentType;
    else link.removeAttribute("type");
  } else {
    link.href = "/favicon.svg";
    link.type = "image/svg+xml";
  }
}

// Mounted once inside <BrandingProvider>: keeps the browser chrome (tab
// title, favicon) and the theme color in sync with the stored branding.
// Route head() meta stays static (SSR/build-time) — see docs note.
export function BrandingEffects() {
  const { appName, accentColor, logoUrl, logoContentType } = useBranding();
  // Tracks the previous brand name so a reset-to-defaults can revert titles
  // that were already rewritten to the old custom name.
  const prevBrandNameRef = useRef<string>(DEFAULT_BRANDING.appName);

  useEffect(() => {
    applyAccentColor(accentColor);
  }, [accentColor]);

  useEffect(() => {
    applyFavicon(logoUrl, logoContentType);
  }, [logoUrl, logoContentType]);

  useEffect(() => {
    // Route titles are "Page — Sankofa Rent" from static head(); swap them for
    // the custom name. The router rewrites document.title from head() on
    // every navigation, so watch for that too.
    //
    // Termination guarantees (a MutationObserver that writes the title it
    // observes can easily spin forever):
    //  1. if nothing about the title matches the default or the previous
    //     custom name, leave it alone (no write, no mutation);
    //  2. remember our own write and never re-enter on it.
    // The `previous` ref handles the reset-to-defaults transition: titles
    // still holding the old custom name revert to the default.
    const suffixDefault = ` — ${DEFAULT_BRANDING.appName}`;
    const prefixDefault = `${DEFAULT_BRANDING.appName} `;
    let lastApplied: string | null = null;
    const previous = prevBrandNameRef.current;
    prevBrandNameRef.current = appName;
    const rewrite = () => {
      const current = document.title;
      if (current === lastApplied) return;
      let next = current;
      if (appName !== DEFAULT_BRANDING.appName) {
        if (next.endsWith(suffixDefault))
          next = next.slice(0, -suffixDefault.length) + ` — ${appName}`;
        else if (next.startsWith(prefixDefault))
          next = appName + next.slice(DEFAULT_BRANDING.appName.length);
      } else if (previous !== DEFAULT_BRANDING.appName) {
        const suffixPrev = ` — ${previous}`;
        const prefixPrev = `${previous} `;
        if (next.endsWith(suffixPrev)) next = next.slice(0, -suffixPrev.length) + suffixDefault;
        else if (next.startsWith(prefixPrev))
          next = DEFAULT_BRANDING.appName + next.slice(previous.length);
      }
      if (next === current) return;
      lastApplied = next;
      document.title = next;
    };
    rewrite();
    const observer = new MutationObserver(rewrite);
    observer.observe(document.head, { childList: true, subtree: true, characterData: true });
    return () => observer.disconnect();
  }, [appName]);

  return null;
}
