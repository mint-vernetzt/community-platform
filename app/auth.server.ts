import type { Profile } from "@prisma/client";
import type { SupabaseClient } from "@supabase/auth-helpers-remix";
import { prismaClient } from "./prisma.server";
import { createClient } from "@supabase/supabase-js";
import { createServerClient, parse, serialize } from "@supabase/ssr";
import { json } from "@remix-run/server-runtime";

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
          // secrets: [process.env.SESSION_SECRET], -> Does not exist on type CookieOptions
          sameSite: "lax",
          path: "/",
          maxAge: 60 * 60 * 24 * 30,
        },
      }
    );

    // Normally i would only return the headers and add them to the response on the caller side
    // To avoid refactoring i return an empty response with only the updated headers,
    // so the current code base can persist (adding additional headers via response.headers)
    const response = new Response(null, {
      headers,
    });

    return { authClient, response };
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
  authClient: SupabaseClient,
  email: string,
  password: string
) => {
  const { data, error } = await authClient.auth.signInWithPassword({
    email: email,
    password: password,
  });
  return { data, error };
};

export const signOut = async (authClient: SupabaseClient) => {
  const { error } = await authClient.auth.signOut();
  return { error };
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

export const getSessionUser = async (authClient: SupabaseClient) => {
  const session = await getSession(authClient);
  if (session !== null && session.user !== null) {
    return session.user;
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

export const getUserByAccessToken = async (
  authClient: SupabaseClient,
  accessToken: string
) => {
  const {
    data: { user },
  } = await authClient.auth.getUser(accessToken);
  return { user };
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

// TODO: Reset password rework see onAuthStateChanged() and resetPasswordForEmail()
// Maybe use admin function updateUserById() -> https://supabase.com/docs/reference/javascript/auth-admin-updateuserbyid
// https://supabase.com/docs/reference/javascript/auth-onauthstatechange
// https://supabase.com/docs/reference/javascript/auth-resetpasswordforemail
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
  redirectToAfterResetEmail: string
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
