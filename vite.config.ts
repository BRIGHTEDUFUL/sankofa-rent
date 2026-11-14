// Direct, dependency-explicit Vite + TanStack Start + Nitro config.
// Standalone configuration: no vendor wrapper, no sandbox-only plugins.
import { defineConfig } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import { nitro } from "nitro/vite";
import tailwindcss from "@tailwindcss/vite";
import tsConfigPaths from "vite-tsconfig-paths";
import react from "@vitejs/plugin-react";

export default defineConfig({
  resolve: {
    alias: { "@": `${process.cwd()}/src` },
    dedupe: [
      "react",
      "react-dom",
      "react/jsx-runtime",
      "react/jsx-dev-runtime",
      "@tanstack/react-query",
      "@tanstack/query-core",
    ],
  },
  css: { transformer: "lightningcss" },
  plugins: [
    tailwindcss(),
    tsConfigPaths({ projects: ["./tsconfig.json"] }),
    // Redirect TanStack Start's bundled server entry to src/server.ts (our
    // SSR error wrapper) — nitro builds from this entry.
    tanstackStart({ server: { entry: "server" } }),
    // Hard-pin the deploy target so every build (local and CI) emits the
    // Workers layout wrangler.jsonc expects: .output/server + .output/public.
    nitro({ preset: "cloudflare-module" }),
    react(),
  ],
});
