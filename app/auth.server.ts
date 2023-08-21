import type { Profile } from "@prisma/client";
import type { SupabaseClient } from "@supabase/auth-helpers-remix";
import { createServerClient } from "@supabase/auth-helpers-remix";
import { serverError, unauthorized } from "remix-utils";
import { prismaClient } from "./prisma.server";
import { createClient } from "@supabase/supabase-js";

// TODO: use session names based on environment (e.g. sb2-dev, sb2-prod)
const SESSION_NAME = "sb2";

export const createAuthClient = (request: Request, response: Response) => {
  if (
    process.env.SUPABASE_URL !== undefined &&
    process.env.SUPABASE_ANON_KEY !== undefined
  ) {
    const authClient = createServerClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY,
      {
        request,
        response,
        cookieOptions: {
          name: SESSION_NAME,
          // normally you want this to be `secure: true`
          // but that doesn't work on localhost for Safari
          // https://web.dev/when-to-use-local-https/
          secure: process.env.NODE_ENV === "production",
          // secrets: [process.env.SESSION_SECRET], -> Does not exist on type CookieOptions
          sameSite: "lax", // TODO: check this setting
          path: "/",
          maxAge: 60 * 60 * 24 * 30,
          // httpOnly: true, // TODO: check this setting -> Does not exist on type CookieOptions
        },
      }
    );
    return authClient;
  } else {
    throw serverError({
      message:
        "Could not find SUPABASE_URL or SUPABASE_ANON_KEY in the .env file.",
    });
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
  throw serverError({
    message:
      "Could not find SUPABASE_URL or SERVICE_ROLE_KEY in the .env file.",
  });
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
    throw unauthorized({
      message: "No session found",
    });
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
    throw unauthorized({
      message: "No session or session user found",
    });
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
