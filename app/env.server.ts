import { z } from "zod";

const schema = z.object({
  NODE_ENV: z.enum(["production", "development", "test"] as const),
  SUPABASE_ANON_KEY: z.string(),
  SESSION_SECRET: z.string(),
  SUPABASE_URL: z.string(),
  SUPABASE_IMAGE_URL: z.string().optional(),
  HASH_SECRET: z.string(),
  IMGPROXY_URL: z.string(),
  IMGPROXY_KEY: z.string(),
  IMGPROXY_SALT: z.string(),
  COMMUNITY_BASE_URL: z.string(),
  DATABASE_URL: z.string(),
  SERVICE_ROLE_KEY: z.string(),
  MATOMO_URL: z.string(),
  MATOMO_SITE_ID: z.string(),
  MAILER_HOST: z.string(),
  MAILER_PORT: z.string(),
  MAILER_USER: z.string(),
  MAILER_PASS: z.string(),
  SYSTEM_MAIL_SENDER: z.string(),
  FEATURE_FLAGS: z.string(),
  SENTRY_DSN: z.string().optional(),
  SENTRY_ORGANIZATION_NAME: z.string().optional(),
  SENTRY_PROJECT_NAME: z.string().optional(),
  SENTRY_AUTH_TOKEN: z.string().optional(),
  TRIGGER_SENTRY_RELEASE: z.enum(["true"] as const).optional(),
  SUPPORT_MAIL: z.string(),
});

declare global {
  // TODO: fix type issues
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace NodeJS {
    // eslint-disable-next-line
    interface ProcessEnv extends z.infer<typeof schema> {}
  }
}

export function init() {
  const parsed = schema.safeParse(process.env);

  if (parsed.success === false) {
    console.error(
      "❌ Invalid environment variables:",
      parsed.error.flatten().fieldErrors
    );

    throw new Error("Invalid environment variables");
  }
}

/**
 * This is used in both `entry.server.ts` and `root.tsx` to ensure that
 * the environment variables are set and globally available before the app is
 * started.
 *
 * NOTE: Do *not* add any environment variables in here that you do not wish to
 * be included in the client.
 * @returns all public ENV variables
 */
export function getEnv() {
  return {
    MODE: process.env.NODE_ENV,
    COMMUNITY_BASE_URL: process.env.COMMUNITY_BASE_URL,
    SENTRY_DSN: process.env.SENTRY_DSN,
  };
}

type ENV = ReturnType<typeof getEnv>;

declare global {
  // TODO: fix type issue
  // eslint-disable-next-line no-var
  var ENV: ENV;
  interface Window {
    ENV: ENV;
  }
}
