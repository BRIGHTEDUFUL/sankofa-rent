import { useEffect, useState } from "react";

export type Platform = "ios" | "android" | "other";

function detectPlatform(): Platform {
  if (typeof navigator === "undefined") return "other";
  const ua = navigator.userAgent;
  const platform = (navigator as { platform?: string }).platform ?? "";
  if (/iPad|iPhone|iPod/.test(ua) || (platform === "MacIntel" && navigator.maxTouchPoints > 1)) {
    return "ios";
  }
  if (/Android/.test(ua)) return "android";
  return "other";
}

let cachedPlatform: Platform | null = null;

export function usePlatform(): Platform {
  const [platform, setPlatform] = useState<Platform>(() => {
    if (typeof window !== "undefined") {
      cachedPlatform = cachedPlatform ?? detectPlatform();
      return cachedPlatform;
    }
    return "other";
  });

  useEffect(() => {
    const p = detectPlatform();
    cachedPlatform = p;
    setPlatform(p);
    document.documentElement.dataset["platform"] = p;
  }, []);

  return platform;
}

export function getPlatform(): Platform {
  if (typeof window === "undefined") return "other";
  cachedPlatform = cachedPlatform ?? detectPlatform();
  return cachedPlatform;
}
