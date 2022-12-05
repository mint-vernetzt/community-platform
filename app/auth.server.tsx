import type { Profile } from "@prisma/client";
import type { SupabaseClient } from "@supabase/auth-helpers-remix";
import { unauthorized } from "remix-utils";
import { prismaClient } from "./prisma";

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

export async function updateEmail(
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
