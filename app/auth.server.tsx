import type { ApiError, User } from "@supabase/supabase-js";
import { createCookieSessionStorage } from "remix";
import { Authenticator, AuthorizationError } from "remix-auth";
import { SupabaseStrategy } from "remix-auth-supabase";
import { supabaseAdmin, supabaseClient } from "./supabase";
import type { Session } from "./supabase";
import { prismaClient } from "./prisma";

export const SESSION_NAME = "sb";

export const sessionStorage = createCookieSessionStorage({
  cookie: {
    name: SESSION_NAME,
    // normally you want this to be `secure: true`
    // but that doesn't work on localhost for Safari
    // https://web.dev/when-to-use-local-https/
    secure: process.env.NODE_ENV === "production",
    secrets: [process.env.SESSION_SECRET],
    sameSite: "lax", // TODO: check this setting
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
    httpOnly: true, // TODO: check this setting
  },
});

export const supabaseStrategy = new SupabaseStrategy(
  {
    supabaseClient,
    sessionStorage,
    sessionKey: "sb:session",
    sessionErrorKey: "sb:error",
  },
  async ({ req, supabaseClient }) => {
    const formData = await req.formData();
    const email = formData.get("email");
    const password = formData.get("password");

    if (email === null) {
      throw new AuthorizationError("Email is required");
    }
    if (typeof email !== "string")
      throw new AuthorizationError("Email must be a string");

    if (password === null) {
      throw new AuthorizationError("Password is required");
    }
    if (typeof password !== "string") {
      throw new AuthorizationError("Password must be a string");
    }

    return supabaseClient.auth.api
      .signInWithEmail(email, password)
      .then(({ data, error }): Session => {
        if (error || data === null) {
          let message = "No user session found";
          if (error !== null && error.message) {
            message = error.message;
          }
          throw new AuthorizationError(message);
        }
        return data;
      });
  }
);

export const authenticator = new Authenticator<Session>(sessionStorage, {
  sessionKey: supabaseStrategy.sessionKey,
  sessionErrorKey: supabaseStrategy.sessionErrorKey,
});

authenticator.use(supabaseStrategy);

export async function signUp(
  email: string,
  password: string,
  metaData: {
    firstName: string;
    lastName: string;
    username: string;
    academicTitle: String;
    termsAccepted: "on" | "off";
  }
): Promise<{
  user: User | null;
  session: Session | null;
  error: ApiError | null;
}> {
  const { user, session, error } = await supabaseClient.auth.signUp(
    { email, password },
    { data: metaData }
  );
  return { user, session, error };
}

export const getUser = async (request: Request): Promise<User | null> => {
  const session = await supabaseStrategy.checkSession(request);
  if (session !== null && session.user !== null) {
    return session.user;
  }
  return null;
};

export async function resetPassword(
  email: string
): Promise<{ error: ApiError | null }> {
  const { error } = await supabaseClient.auth.api.resetPasswordForEmail(email);
  return { error };
}

export async function updatePassword(
  accessToken: string,
  password: string
): Promise<{ error: ApiError | null }> {
  const { error } = await supabaseClient.auth.api.updateUser(accessToken, {
    password,
  });
  return { error };
}

export async function deleteUserByUid(uid: string) {
  await prismaClient.profile.delete({ where: { id: uid } });
  const { error } = await supabaseAdmin.auth.api.deleteUser(uid);
  return { error };
}
