import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

/**
 * Customer app — Vite configuration.
 *
 * The alias map below is the heart of the monorepo split: generic UI/contexts/hooks
 * resolve to `packages/shared/src` (single source of truth), while everything
 * role-specific resolves inside this app's `src/`. Longest prefixes must come first
 * so `@/shared/ui/ui/*` wins over `@/shared/*`.
 */
const sharedSrc = path.resolve(__dirname, "../../packages/shared/src");
const appSrc = (p: string) => path.resolve(__dirname, p);

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: [
      { find: "@/shared/ui/ui", replacement: path.join(sharedSrc, "ui/ui") },
      { find: "@/shared/contexts", replacement: path.join(sharedSrc, "contexts") },
      { find: "@/shared/hooks", replacement: path.join(sharedSrc, "hooks") },
      { find: "@/shared/lib", replacement: path.join(sharedSrc, "lib") },
      { find: "@/shared/ui/AppHeader", replacement: path.join(sharedSrc, "ui/AppHeader") },
      { find: "@/shared/ui/NavLink", replacement: path.join(sharedSrc, "ui/NavLink") },
      { find: "@/shared/ui/OrderBadge", replacement: path.join(sharedSrc, "ui/OrderBadge") },
      { find: "@/shared/ui/Pagination", replacement: path.join(sharedSrc, "ui/Pagination") },
      { find: "@/shared/ui/ScrollToTopButton", replacement: path.join(sharedSrc, "ui/ScrollToTopButton") },
      { find: "@/shared/ui/ProofOfDeliveryModal", replacement: path.join(sharedSrc, "ui/ProofOfDeliveryModal") },
      { find: "@/shared", replacement: appSrc("src/shared") },
      { find: "~/entities", replacement: appSrc("src/entities") },
      { find: "@/features", replacement: appSrc("src/features") },
      { find: "@/pages", replacement: appSrc("src/pages") },
      { find: "~/processes", replacement: appSrc("src/processes") },
      { find: "~/app", replacement: appSrc("src/app") },
      { find: "@", replacement: appSrc("src") },
    ],
    dedupe: ["react", "react-dom", "react/jsx-runtime", "react/jsx-dev-runtime", "@tanstack/react-query", "@tanstack/query-core"],
  },
  server: {
    host: "::",
    port: 8081,
    hmr: { overlay: false },
  },
  build: {
    chunkSizeWarningLimit: 1500,
  },
});
