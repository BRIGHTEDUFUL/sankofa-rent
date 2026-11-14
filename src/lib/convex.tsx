import { useState, type ReactNode } from "react";
import { ConvexReactClient } from "convex/react";
import { ConvexAuthProvider } from "@convex-dev/auth/react";

const rawUrl = import.meta.env["VITE_CONVEX_URL"];
if (!rawUrl) {
  // Fail loudly rather than silently talking to a wrong deployment.
  throw new Error(
    "VITE_CONVEX_URL is missing. Set it in .env.local (dev) or the hosting environment (prod).",
  );
}
const url: string = rawUrl;

/**
 * Wraps the app in Convex Auth. This subtree is only rendered after hydration
 * (see ClientOnly in __root), so the client and provider never run during SSR.
 */
export function ConvexProviders({ children }: { children: ReactNode }) {
  const [client] = useState(() => new ConvexReactClient(url));
  return <ConvexAuthProvider client={client}>{children}</ConvexAuthProvider>;
}
