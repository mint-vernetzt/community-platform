import { type AlertLevel } from "@mint-vernetzt/components";
import { createCookieSessionStorage, redirect } from "@remix-run/node";
import { combineHeaders } from "./utils.server";
import { ZodError, z } from "zod";

type Alert = {
  message: string;
  id: string;
  key?: string;
  level?: AlertLevel;
};

const alertSchema = z.object({
  message: z.string(),
  id: z.string(),
  key: z.string().optional(),
  level: z.string().optional(),
});

const ALERT_KEY = "alert";

const ALERT_SESSION_STORAGE = createCookieSessionStorage({
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

// Beware! This redirect cuts all existing hash parameters if using the scrollToId option
export async function redirectWithAlert(
  url: string,
  alert: Alert,
  init?: ResponseInit,
  redirectOptions?: {
    scrollToId?: string;
  }
) {
  let redirectUrl = url;
  if (
    redirectOptions !== undefined &&
    redirectOptions.scrollToId !== undefined
  ) {
    const urlWithoutHashParam = url.split("#", 2)[0];
    redirectUrl = `${urlWithoutHashParam}${
      !urlWithoutHashParam.includes("?") ? "?" : "&"
    }alert-trigger#${redirectOptions.scrollToId}`;
  }
  return redirect(redirectUrl, {
    ...init,
    headers: combineHeaders(
      init?.headers,
      await createAlertHeaders(alert.message, alert.id, alert.key, alert.level)
    ),
  });
}

async function createAlertHeaders(
  message: string,
  id: string,
  key?: string,
  level?: AlertLevel
) {
  const session = await ALERT_SESSION_STORAGE.getSession();
  const alert = { message, id, key, level: level ?? "positive" };
  session.flash(ALERT_KEY, alert);
  const cookie = await ALERT_SESSION_STORAGE.commitSession(session);
  return new Headers({ "set-cookie": cookie });
}

export async function getAlert(request: Request) {
  const session = await ALERT_SESSION_STORAGE.getSession(
    request.headers.get("cookie")
  );
  const alert = session.get(ALERT_KEY);
  // Early return when cookie session is not set
  if (alert === undefined) {
    return {
      alert: null,
      headers: null,
    };
  }
  // Parse data against the schema
  try {
    alertSchema.parse(alert);
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
    alert: alert as Alert,
    headers:
      alert !== undefined
        ? new Headers({
            "set-cookie": await ALERT_SESSION_STORAGE.destroySession(session),
          })
        : null,
  };
}
