import { useEffect, useState, type ReactNode } from "react";

/**
 * Renders children only after hydration. Use it around browser-only providers
 * (Convex auth reads local storage) so SSR never touches them.
 */
export function ClientOnly({
  children,
  fallback = null,
}: {
  children: ReactNode;
  fallback?: ReactNode;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return <>{fallback}</>;
  return <>{children}</>;
}
