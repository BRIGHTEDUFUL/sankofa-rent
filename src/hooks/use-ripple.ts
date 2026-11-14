import { useCallback } from "react";
import { getPlatform } from "./use-platform";

export function useRipple() {
  return useCallback((e: React.MouseEvent<HTMLElement> | React.TouchEvent<HTMLElement>) => {
    if (getPlatform() !== "android") return;
    const el = e.currentTarget;
    const rect = el.getBoundingClientRect();
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    const size = Math.max(rect.width, rect.height) * 2;
    const wave = document.createElement("span");
    wave.className = "ripple-wave";
    wave.style.cssText = `width:${size}px;height:${size}px;left:${x - size / 2}px;top:${y - size / 2}px`;
    el.appendChild(wave);
    wave.addEventListener("animationend", () => wave.remove(), { once: true });
  }, []);
}
