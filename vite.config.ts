import { vitePlugin as remix } from "@remix-run/dev";
import { createRoutesFromFolders } from "@remix-run/v1-route-convention";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";
import { envOnlyMacros } from "vite-env-only";
import { installGlobals } from "@remix-run/node";

installGlobals();

export default defineConfig({
  server: {
    port: 3000,
  },
  plugins: [
    envOnlyMacros(),
    remix({
      future: {
        // TODO: Add future flags
      },
      ignoredRouteFiles: ["**/*"],
      routes(defineRoutes) {
        // uses the v1 convention, works in v1.15+ and v2
        return createRoutesFromFolders(defineRoutes, {
          ignoredFilePatterns: ["**/*.func.*", "**/*.spec.*"],
        });
      },
    }),
    tsconfigPaths(),
  ],
});
