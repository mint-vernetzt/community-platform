import { reactRouter } from "@react-router/dev/vite";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";
import { sentryVitePlugin } from "@sentry/vite-plugin";

export default defineConfig({
  base: "/",
  server: {
    port: 3000,
    allowedHosts: [process.env.COMMUNITY_BASE_URL],
  },
  build: {
    sourcemap:
      process.env.TRIGGER_SENTRY_RELEASE === "true" &&
      typeof process.env.SENTRY_ORGANIZATION_NAME !== "undefined" &&
      typeof process.env.SENTRY_PROJECT_NAME !== "undefined" &&
      typeof process.env.SENTRY_AUTH_TOKEN !== "undefined",
    target: "es2022",
  },
  optimizeDeps: {
    // This fixes an issue with vites optimizeDeps triggering sudden reloads on dev and restarting the server on navigation which lets the app hang
    // for now below fix is mentioned in following discussion see https://github.com/remix-run/remix/discussions/8917
    // currently the remix team works on that with future flag unstable_optimizeDeps -> https://remix.run/docs/en/main/guides/dependency-optimization
    entries: ["./app/entry-client.tsx", "./app/root.tsx", "./app/routes/**/*"],
  },
  plugins: [
    reactRouter(),
    tsconfigPaths(),
    process.env.TRIGGER_SENTRY_RELEASE === "true" &&
    typeof process.env.SENTRY_ORGANIZATION_NAME !== "undefined" &&
    typeof process.env.SENTRY_PROJECT_NAME !== "undefined" &&
    typeof process.env.SENTRY_AUTH_TOKEN !== "undefined"
      ? // Put the Sentry vite plugin after all other plugins
        sentryVitePlugin({
          org: process.env.SENTRY_ORGANIZATION_NAME,
          project: process.env.SENTRY_PROJECT_NAME,
          authToken: process.env.SENTRY_AUTH_TOKEN,
          release: {
            setCommits: {
              auto: true,
              ignoreMissing: true,
            },
            deploy: {
              env: process.env.COMMUNITY_BASE_URL.replace(/https?:\/\//, ""),
            },
          },
          sourcemaps: {
            filesToDeleteAfterUpload: [
              "./build/**/*.map",
              ".server-build/**/*.map",
            ],
          },
        })
      : undefined,
  ],
  resolve: {
    alias: {
      ".prisma/client/index-browser":
        "./node_modules/.prisma/client/index-browser.js",
    },
  },
});
