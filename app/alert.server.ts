import { createCookieSessionStorage, redirect } from "react-router";
import { combineHeaders, sanitizeUserHtml } from "./utils.server";
import { z, ZodError } from "zod";
import { type AlertLevel } from "@mint-vernetzt/components/src/molecules/Alert";

export type Alert = {
  level?: AlertLevel;
  message: string;
  isRichtext?: boolean;
};

const alertLevels: AlertLevel[] = ["positive", "attention", "negative"];

const alertSchema = z.object({
  message: z.string(),
  level: z
    .string()
    .refine((level) => alertLevels.includes(level as AlertLevel), {
      message: "Invalid alert level",
    })
    .optional(),
  isRichtext: z.boolean().optional(),
});

export const AlertKey = "alert";

export const alertSessionStorage = createCookieSessionStorage({
  cookie: {
    name: "alert",
    sameSite: "lax",
    path: "/",
    httpOnly: true,
    secrets:
      process.env.NODE_ENV !== "test"
        ? process.env.SESSION_SECRET.split(",")
        : ["secret"],
    secure: process.env.NODE_ENV === "production",
  },
});

export async function redirectWithAlert(
  url: string,
  alert: Alert,
  init?: ResponseInit
) {
  return redirect(url, {
    ...init,
    headers: combineHeaders(
      init?.headers,
      await createAlertHeaders(alert.message, alert.level, alert.isRichtext)
    ),
  });
}

export async function createAlertHeaders(
  message: string,
  level?: AlertLevel,
  isRichtext?: boolean
) {
  const session = await alertSessionStorage.getSession();
  const alert = {
    message,
    level: level ?? "positive",
    isRichtext: isRichtext ?? false,
  };
  session.flash(AlertKey, alert);
  const cookie = await alertSessionStorage.commitSession(session);
  return new Headers({ "set-cookie": cookie });
}

export async function getAlert(request: Request) {
  const session = await alertSessionStorage.getSession(
    request.headers.get("cookie")
  );
  const alert = session.get(AlertKey);
  // Early return when cookie session is not set
  if (alert === undefined) {
    return {
      alert: null,
      headers: null,
    };
  }
  const sanitizedAlert = {
    ...alert,
    message: sanitizeUserHtml(alert.message),
  };
  // Parse data against the schema
  try {
    alertSchema.parse(sanitizedAlert);
  } catch (error) {
    if (error instanceof ZodError) {
      console.error(
        "Validation errors while parsing the alert cookie session:",
        error.errors
      );
    } else {
      console.error(
        "Unexpected error during parsing the alert cookie session:",
        error
      );
    }
    console.error("The alert data was not returned.");
    return {
      alert: null,
      headers: null,
    };
  }
  return {
    alert: sanitizedAlert as Alert,
    headers: new Headers({
      "set-cookie": await alertSessionStorage.destroySession(session),
    }),
  };
}
