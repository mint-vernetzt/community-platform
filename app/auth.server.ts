import type { Profile } from "@prisma/client";
import { json } from "@remix-run/server-runtime";
import { createServerClient, parse, serialize } from "@supabase/ssr";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { prismaClient } from "./prisma.server";

// TODO: use session names based on environment (e.g. sb2-dev, sb2-prod)
const SESSION_NAME = "sb2";

export const createAuthClient = (request: Request) => {
  if (
    process.env.SUPABASE_URL !== undefined &&
    process.env.SUPABASE_ANON_KEY !== undefined
  ) {
    const cookies = parse(request.headers.get("Cookie") ?? "");
    const headers = new Headers();

    const authClient = createServerClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY,
      {
        cookies: {
          get(key) {
            return cookies[key];
          },
          set(key, value, options) {
            headers.append("Set-Cookie", serialize(key, value, options));
          },
          remove(key, options) {
            headers.append("Set-Cookie", serialize(key, "", options));
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
  } else {
    throw json(
      {
        message:
          "Could not find SUPABASE_URL or SUPABASE_ANON_KEY in the .env file.",
      },
      { status: 500 }
    );
  }
};

export const createAdminAuthClient = () => {
  if (
    process.env.SUPABASE_URL !== undefined &&
    process.env.SERVICE_ROLE_KEY !== undefined
  ) {
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
  }
  throw json(
    {
      message:
        "Could not find SUPABASE_URL or SERVICE_ROLE_KEY in the .env file.",
    },
    { status: 500 }
  );
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

export const setSession = async (
  authClient: SupabaseClient,
  accessToken: string,
  refreshToken: string
) => {
  const {
    data: { session, user },
  } = await authClient.auth.setSession({
    refresh_token: refreshToken,
    access_token: accessToken,
  });
  return { session, user };
};

// Note from the docs:
/*
  Returns the session, refreshing it if necessary.
  This method retrieves the current local session (i.e local storage).
  The session contains a signed JWT and unencoded session data.
  Since the unencoded session data is retrieved from the local storage medium, do not rely on it as a source of trusted data on the server.
  It could be tampered with by the sender. If you need verified, trustworthy user data, call getUser instead.
  If the session has an expired access token, this method will use the refresh token to get a new session.
*/
export const getSession = async (authClient: SupabaseClient) => {
  const {
    data: { session },
  } = await authClient.auth.getSession();
  return session;
};

export const getSessionOrThrow = async (authClient: SupabaseClient) => {
  const session = await getSession(authClient);
  if (session === null) {
    throw json(
      {
        message: "No session found",
      },
      { status: 401 }
    );
  }
  return session;
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
  const {
    data: { user },
  } = await authClient.auth.getUser();
  if (user !== null) {
    return user;
  }
  return null;
};

export const getSessionUserOrThrow = async (authClient: SupabaseClient) => {
  const result = await getSessionUser(authClient);
  if (result === null) {
    throw json(
      {
        message: "No session or session user found",
      },
      { status: 401 }
    );
  }
  return result;
};

export const getSessionUserOrRedirectPathToLogin = async (
  authClient: SupabaseClient,
  request: Request
) => {
  const result = await getSessionUser(authClient);
  const url = new URL(request.url);
  url.searchParams.set("login_redirect", url.pathname);
  if (result === null) {
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

export async function updatePassword(
  authClient: SupabaseClient,
  password: string
) {
  const { data, error } = await authClient.auth.updateUser({
    password,
  });
  return { data, error };
}

export async function sendResetEmailLink(
  authClient: SupabaseClient,
  email: string,
  redirectToAfterResetEmail?: string
) {
  const { data, error } = await authClient.auth.updateUser(
    {
      email,
    },
    {
      emailRedirectTo: redirectToAfterResetEmail,
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
