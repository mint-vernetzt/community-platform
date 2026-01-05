import { reactRouter } from "@react-router/dev/vite";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";
import { sentryVitePlugin } from "@sentry/vite-plugin";
import tailwindcss from "@tailwindcss/vite";

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
  plugins: [
    tailwindcss(),
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
