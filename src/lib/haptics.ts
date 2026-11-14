import { getPlatform } from "@/hooks/use-platform";

/** Light tap feedback — Android only (iOS ignores navigator.vibrate). */
export function hapticTap(): void {
  if (getPlatform() !== "android") return;
  try {
    navigator.vibrate?.(8);
  } catch {
    // Haptics are a progressive enhancement — ignore all failures.
  }
}

/** Medium feedback for confirmations. */
export function hapticMedium(): void {
  if (getPlatform() !== "android") return;
  try {
    navigator.vibrate?.([12, 8, 12]);
  } catch {
    // ignore
  }
}
