import type { Profile } from "@prisma/client";
import type { SupabaseClient } from "@supabase/auth-helpers-remix";
import { createServerClient } from "@supabase/auth-helpers-remix";
import { unauthorized } from "remix-utils";
import { prismaClient } from "./prisma";

const SESSION_NAME = "sb2";

export const createAuthClient = (request: Request, response: Response) => {
  const supabaseClient = createServerClient(
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
  return supabaseClient;
};

export const signUp = async (
  supabaseClient: SupabaseClient,
  email: string,
  password: string,
  metaData: Pick<
    Profile,
    "username" | "firstName" | "lastName" | "academicTitle" | "termsAccepted"
  >,
  emailRedirectTo?: string
) => {
  const { data, error } = await supabaseClient.auth.signUp({
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
  supabaseClient: SupabaseClient,
  email: string,
  password: string
) => {
  const { data, error } = await supabaseClient.auth.signInWithPassword({
    email: email,
    password: password,
  });
  return { data, error };
};

export const signOut = async (supabaseClient: SupabaseClient) => {
  const { error } = await supabaseClient.auth.signOut();
  return { error };
};

export const setSession = async (
  supabaseClient: SupabaseClient,
  accessToken: string,
  refreshToken: string
) => {
  const {
    data: { session, user },
  } = await supabaseClient.auth.setSession({
    refresh_token: refreshToken,
    access_token: accessToken,
  });
  return { session, user };
};

export const getSession = async (supabaseClient: SupabaseClient) => {
  const {
    data: { session },
  } = await supabaseClient.auth.getSession();
  return session;
};

export const getSessionOrThrow = async (supabaseClient: SupabaseClient) => {
  const session = await getSession(supabaseClient);
  if (session === null) {
    throw unauthorized({
      message: "No session found",
    });
  }
  return session;
};

export const getSessionUser = async (supabaseClient: SupabaseClient) => {
  const session = await getSession(supabaseClient);
  if (session !== null && session.user !== null) {
    return session.user;
  }
  return null;
};

export const getSessionUserOrThrow = async (supabaseClient: SupabaseClient) => {
  const result = await getSessionUser(supabaseClient);
  if (result === null) {
    throw unauthorized({
      message: "No session or session user found",
    });
  }
  return result;
};

export const getUserByAccessToken = async (
  supabaseClient: SupabaseClient,
  accessToken: string
) => {
  const {
    data: { user },
  } = await supabaseClient.auth.getUser(accessToken);
  return { user };
};

export async function sendResetPasswordLink(
  supabaseClient: SupabaseClient,
  email: string,
  redirectToAfterResetPassword?: string
) {
  const { error } = await supabaseClient.auth.resetPasswordForEmail(email, {
    redirectTo: redirectToAfterResetPassword,
  });
  return { error };
}

// TODO: Reset password rework see onAuthStateChanged() and resetPasswordForEmail()
// Maybe use admin function updateUserById() -> https://supabase.com/docs/reference/javascript/auth-admin-updateuserbyid
// https://supabase.com/docs/reference/javascript/auth-onauthstatechange
// https://supabase.com/docs/reference/javascript/auth-resetpasswordforemail
export async function updatePassword(
  supabaseClient: SupabaseClient,
  password: string
) {
  const { data, error } = await supabaseClient.auth.updateUser({
    password,
  });
  return { data, error };
}

export async function sendResetEmailLink(
  supabaseClient: SupabaseClient,
  email: string
) {
  const { data, error } = await supabaseClient.auth.updateUser({
    email,
  });
  return { data, error };
}

export async function deleteUserByUid(
  supabaseClient: SupabaseClient,
  uid: string
) {
  await prismaClient.profile.delete({ where: { id: uid } });
  const { error } = await supabaseClient.auth.admin.deleteUser(uid);
  return { error };
}
