import { vitePlugin as remix } from "@remix-run/dev";
import { createRoutesFromFolders } from "@remix-run/v1-route-convention";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

declare module "@remix-run/node" {
  interface Future {
    v3_singleFetch: true;
  }
}

export default defineConfig({
  base:
    process.env.NODE_ENV === "production"
      ? `${process.env.COMMUNITY_BASE_URL}/`
      : "/",
  server: {
    port: 3000,
    allowedHosts: [process.env.COMMUNITY_BASE_URL],
  },
  build: {
    sourcemap: true,
    target: "esnext",
  },
  optimizeDeps: {
    // This fixes an issue with vites optimizeDeps triggering sudden reloads on dev and restarting the server on navigation which lets the app hang
    // for now below fix is mentioned in following discussion see https://github.com/remix-run/remix/discussions/8917
    // currently the remix team works on that with future flag unstable_optimizeDeps -> https://remix.run/docs/en/main/guides/dependency-optimization
    entries: ["./app/entry-client.tsx", "./app/root.tsx", "./app/routes/**/*"],
  },
  plugins: [
    remix({
      future: {
        v3_singleFetch: true,
        v3_fetcherPersist: true,
        v3_relativeSplatPath: true,
        v3_throwAbortReason: true,
        v3_lazyRouteDiscovery: true,
      },
      ignoredRouteFiles: ["**/*"],
      routes(defineRoutes) {
        // uses the v1 convention, works in v1.15+ and v2
        return createRoutesFromFolders(defineRoutes, {
          ignoredFilePatterns: [
            "**/*.css",
            "**/*.func.*",
            "**/*.spec.*",
            "**/*.shared.*",
            "**/*.components.*",
            "**/*.server.*",
          ],
        });
      },
    }),
    tsconfigPaths(),
  ],
  resolve: {
    alias: {
      ".prisma/client/index-browser":
        "./node_modules/.prisma/client/index-browser.js",
    },
  },
});
