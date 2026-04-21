// vite.config.ts
import { defineConfig } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { cloudflare } from "@cloudflare/vite-plugin";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig(({ command }) => {
  // "serve" = `vite dev`   →  use TanStack Start's Node.js dev server
  // "build" = `vite build` →  use Cloudflare Workers runtime
  //
  // Node.js v25 changed internal stream APIs that miniflare/workerd rely on
  // for their inter-process socket communication, causing an immediate EPIPE
  // before any user code runs.  Skipping the Cloudflare plugin in dev avoids
  // the issue completely — your code (process.env, fetch, neon HTTP driver,
  // better-auth, etc.) works identically in both runtimes.
  const isProduction = command === "build";

  return {
    server: {
      port: 3000,
    },
    resolve: {
      tsconfigPaths: true,
    },
    plugins: [
      // Only load the Cloudflare Vite plugin for production builds.
      // During development TanStack Start uses its own Node.js SSR server.
      ...(isProduction
        ? [cloudflare({ viteEnvironment: { name: "ssr" } })]
        : []),
      tanstackStart(),
      // React plugin must come AFTER TanStack Start's plugin
      viteReact(),
      tailwindcss(),
    ],
  };
});
