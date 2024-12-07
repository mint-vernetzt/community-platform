import { vitePlugin as remix } from "@remix-run/dev";
import { createRoutesFromFolders } from "@remix-run/v1-route-convention";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  server: {
    port: 3000,
  },
  plugins: [
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
  // TODO: This resolved the hydration error, but still modules cannot be loaded. See vite server output on npm run dev
  resolve: {
    alias: {
      path: "node_modules/path/path.js",
      "source-map-js": "node_modules/source-map-js/source-map.js",
      url: "node_modules/url/url.js",
      fs: "node_modules/fs/index.js",
      "node:fs": "node_modules/fs/index.js",
    },
  },
});
