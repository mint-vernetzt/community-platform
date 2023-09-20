import { type AlertLevel } from "@mint-vernetzt/components";
import { createCookieSessionStorage, redirect } from "@remix-run/node";
import { combineHeaders } from "./utils.server";

export type Alert = {
  level?: AlertLevel;
  message: string;
};

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
      await createAlertHeaders(alert.message, alert.level)
    ),
  });
}

export async function createAlertHeaders(message: string, level?: AlertLevel) {
  const session = await alertSessionStorage.getSession();
  const alert = { message, level: level ?? "positive" };
  session.flash(AlertKey, alert);
  const cookie = await alertSessionStorage.commitSession(session);
  return new Headers({ "set-cookie": cookie });
}

export async function getAlert(request: Request) {
  const session = await alertSessionStorage.getSession(
    request.headers.get("cookie")
  );
  // TODO: use schema validation
  const alert = session.get(AlertKey) as Alert | undefined;
  return {
    alert,
    headers:
      alert !== undefined
        ? new Headers({
            "set-cookie": await alertSessionStorage.destroySession(session),
          })
        : null,
  };
}
