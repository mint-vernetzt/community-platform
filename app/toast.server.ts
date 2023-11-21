import { createCookieSessionStorage, redirect } from "@remix-run/node";
import { combineHeaders } from "./utils.server";
import { type ToastLevel } from "@mint-vernetzt/components";
import { ZodError, z } from "zod";

type Toast = {
  message: string;
  id?: string;
  key?: string;
  level?: ToastLevel;
};

const toastSchema = z.object({
  message: z.string(),
  id: z.string().optional(),
  key: z.string().optional(),
  level: z.string().optional(),
});

const TOAST_KEY = "toast";

const TOAST_SESSION_STORAGE = createCookieSessionStorage({
  cookie: {
    name: "toast",
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
export async function redirectWithToast(
  url: string,
  toast: Toast,
  redirectOptions?: {
    init?: ResponseInit;
    scrollToToast?: boolean;
  }
) {
  const urlObject = new URL(url);
  urlObject.searchParams.set("toast-trigger", "");
  if (redirectOptions !== undefined) {
    const { scrollToToast = false } = redirectOptions;
    if (scrollToToast && toast.id === undefined) {
      console.warn(
        "You selected the option scrollToToast without providing a toast id. Scrolling won't work."
      );
    }
    if (scrollToToast && toast.id !== undefined) {
      urlObject.hash = toast.id;
    }
  }

  return redirect(urlObject.toString(), {
    ...redirectOptions?.init,
    headers: combineHeaders(
      redirectOptions?.init?.headers,
      await createToastHeaders(toast.message, toast.id, toast.key, toast.level)
    ),
  });
}

async function createToastHeaders(
  message: string,
  id?: string,
  key?: string,
  level?: ToastLevel
) {
  const session = await TOAST_SESSION_STORAGE.getSession();
  const toast = { message, id, key, level: level ?? "positive" };
  session.flash(TOAST_KEY, toast);
  const cookie = await TOAST_SESSION_STORAGE.commitSession(session);
  return new Headers({ "set-cookie": cookie });
}

export async function getToast(request: Request) {
  const session = await TOAST_SESSION_STORAGE.getSession(
    request.headers.get("cookie")
  );
  const toast = session.get(TOAST_KEY);
  // Early return when cookie session is not set
  if (toast === undefined) {
    return {
      toast: null,
      headers: null,
    };
  }
  // Parse data against the schema
  try {
    toastSchema.parse(toast);
  } catch (error) {
    if (error instanceof ZodError) {
      console.error(
        "Validation errors while parsing the toast cookie session:",
        error.errors
      );
    } else {
      console.error(
        "Unexpected error during parsing the toast cookie session:",
        error
      );
    }
    console.error("The toast data was not returned.");
    return {
      toast: null,
      headers: null,
    };
  }

  return {
    toast: toast as Toast,
    headers:
      toast !== undefined
        ? new Headers({
            "set-cookie": await TOAST_SESSION_STORAGE.destroySession(session),
          })
        : null,
  };
}
