import * as Sentry from "@sentry/node";
import { nodeProfilingIntegration } from "@sentry/profiling-node";

// TODO: Implement server side sentry when sentry supports rr7
// Currently this is only possible with a complicated custom integration
// -> https://docs.sentry.io/platforms/javascript/guides/react-router/
// -> https://github.dev/epicweb-dev/epic-stack/blob/main/package.json
// For now we just use the sentry client integration and also capture Response errors in the error boundary with sentry
// The only errors we wont catch are the ones that get explicitly reported from the server via Sentry.captureException inside action or loader
// But they are also logged in pm2 logs so we can still track them
export function initSentry() {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.COMMUNITY_BASE_URL.replace(/https?:\/\//, ""),
    integrations: [nodeProfilingIntegration()],
    tracesSampleRate: 0.5,
    profilesSampleRate: 0.5,
  });
}
