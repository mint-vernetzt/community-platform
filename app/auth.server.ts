import type { Profile } from "@prisma/client";
import { captureException } from "@sentry/node";
import {
  createServerClient,
  parseCookieHeader,
  serializeCookieHeader,
} from "@supabase/ssr";
import {
  createClient,
  type User,
  type SupabaseClient,
} from "@supabase/supabase-js";
import { invariantResponse } from "./lib/utils/response";
import { prismaClient } from "./prisma.server";

// TODO: use session names based on environment (e.g. sb2-dev, sb2-prod)
const SESSION_NAME = "sb2";

export const createAuthClient = (request: Request) => {
  const headers = new Headers();
  const authClient = createServerClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          const parsedCookieHeader = parseCookieHeader(
            request.headers.get("Cookie") || ""
          );
          const filteredCookies = parsedCookieHeader.filter(
            (cookie) =>
              typeof cookie.value !== "undefined" && cookie.value !== undefined
          ) as {
            name: string;
            value: string;
          }[];
          return filteredCookies;
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            headers.append(
              "Set-Cookie",
              serializeCookieHeader(name, value, options)
            )
          );
        },
      },
      cookieOptions: {
        name: SESSION_NAME,
        // normally you want this to be `secure: true`
        // but that doesn't work on localhost for Safari
        // https://web.dev/when-to-use-local-https/
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
      },
      auth: {
        flowType: "pkce",
      },
    }
  );
  // Normally i would only return the headers and add them to the response on the caller side
  // To avoid refactoring i return an empty response with only the updated headers,
  // so the current code base can persist (adding additional headers via response.headers)
  const response = new Response(null, {
    headers,
  });
  return { authClient, response, headers };
};

export const createAdminAuthClient = () => {
  const adminAuthClient = createClient(
    process.env.SUPABASE_URL,
    process.env.SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        flowType: "pkce",
      },
    }
  );
  return adminAuthClient;
};

export const signUp = async (
  authClient: SupabaseClient,
  email: string,
  password: string,
  metaData: Pick<
    Profile,
    "username" | "firstName" | "lastName" | "academicTitle" | "termsAccepted"
  >,
  emailRedirectTo?: string
) => {
  const { data, error } = await authClient.auth.signUp({
    email: email,
    password: password,
    options: {
      data: metaData,
      emailRedirectTo: emailRedirectTo,
    },
  });
  return { data, error };
};

export const signIn = async (
  request: Request,
  email: string,
  password: string
) => {
  const { authClient, headers } = createAuthClient(request);
  const { data, error } = await authClient.auth.signInWithPassword({
    email: email,
    password: password,
  });
  return { data, error, headers };
};

export const signOut = async (request: Request) => {
  const { authClient, headers } = createAuthClient(request);
  const { error } = await authClient.auth.signOut();
  return { error, headers };
};

// Note from the docs:
/*
  Gets the current user details if there is an existing session. This method performs a network request to the Supabase Auth server,
  so the returned value is authentic and can be used to base authorization rules on.
  This method fetches the user object from the database instead of local session.
  This method is useful for checking if the user is authorized because it validates the user's access token JWT on the server.
  Should always be used when checking for user authorization on the server. On the client, you can instead use getSession().session.user for faster results.
  getSession is insecure on the server.
*/
export const getSessionUser = async (authClient: SupabaseClient) => {
  let user;
  try {
    const { data } = await authClient.auth.getUser();
    user = data.user;
  } catch (error) {
    console.error(error);
    captureException(error);
  }
  if (user !== undefined && user !== null) {
    return user;
  }
  return null;
};

export const getSessionUserOrThrow = async (authClient: SupabaseClient) => {
  const result = await getSessionUser(authClient);
  if (result === null) {
    console.error("No session or session user found");
    invariantResponse(false, "No session or session user found", {
      status: 401,
    });
  }
  return result;
};

export const getSessionUserOrRedirectPathToLogin = async (
  authClient: SupabaseClient,
  request: Request
) => {
  let result;
  try {
    result = await getSessionUser(authClient);
  } catch (error) {
    console.error(error);
    captureException(error);
  }
  const url = new URL(request.url);
  url.searchParams.set("login_redirect", url.pathname);
  if (result === null || result === undefined) {
    return {
      redirectPath: `/login?${url.searchParams.toString()}`,
      sessionUser: null,
    };
  }
  return {
    redirectPath: null,
    sessionUser: result,
  };
};

export async function sendResetPasswordLink(
  authClient: SupabaseClient,
  email: string,
  redirectToAfterResetPassword?: string
) {
  const { error } = await authClient.auth.resetPasswordForEmail(email, {
    redirectTo: redirectToAfterResetPassword,
  });
  return { error };
}

export async function updatePassword(sessionUser: User, password: string) {
  const adminAuthClient = createAdminAuthClient();
  const { data, error } = await adminAuthClient.auth.admin.updateUserById(
    sessionUser.id,
    {
      password,
    }
  );
  return { data, error };
}

export async function updateEmail(sessionUser: User, email: string) {
  const adminAuthClient = createAdminAuthClient();
  const { data, error } = await adminAuthClient.auth.admin.updateUserById(
    sessionUser.id,
    {
      email,
    }
  );
  return { data, error };
}

export async function deleteUserByUid(authClient: SupabaseClient, uid: string) {
  await prismaClient.profile.delete({
    where: {
      id: uid,
    },
  });
  const { error } = await authClient.auth.admin.deleteUser(uid);
  return { error };
}
