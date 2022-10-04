import type { ApiError, User } from "@supabase/supabase-js";
import { createCookieSessionStorage } from "remix";
import { Authenticator, AuthorizationError } from "remix-auth";
import { SupabaseStrategy } from "remix-auth-supabase";
import { unauthorized } from "remix-utils";
// important for testing nested calls (https://stackoverflow.com/a/55193363)
// maybe move helper functions like getUserByRequest to other module
// then we can just mock external modules
import * as self from "./auth.server";
import { prismaClient } from "./prisma";
import type { Session } from "./supabase";
import { supabaseAdmin, supabaseClient } from "./supabase";

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
  redirectTo: string | undefined,
  metaData: {
    firstName: string;
    lastName: string;
    username: string;
    academicTitle: string | undefined;
    termsAccepted: boolean;
  }
): Promise<{
  user: User | null;
  session: Session | null;
  error: ApiError | null;
}> {
  const { user, session, error } = await supabaseClient.auth.signUp(
    { email, password },
    { data: metaData, redirectTo: redirectTo }
  );
  return { user, session, error };
}

export const getSession = async (request: Request) => {
  const session = await sessionStorage.getSession(
    request.headers.get("Cookie")
  );
  return session;
};

export const getUserByRequest = async (
  request: Request
): Promise<User | null> => {
  const session = await supabaseStrategy.checkSession(request);
  if (session !== null && session.user !== null) {
    return session.user;
  }
  return null;
};

export const getUserByRequestOrThrow = async (request: Request) => {
  const result = await self.getUserByRequest(request);
  if (result === null) {
    throw unauthorized({
      message: "No session or session user found",
    });
  }
  return result;
};

export const getUserByAccessToken = async (
  accessToken: string
): Promise<{
  user: User | null;
  data: User | null;
  error: ApiError | null;
}> => {
  const { user, data, error } = await supabaseClient.auth.api.getUser(
    accessToken
  );
  return { user, data, error };
};

export async function resetPassword(
  email: string,
  redirectToAfterResetPassword?: string
): Promise<{ error: ApiError | null }> {
  const { error } = await supabaseClient.auth.api.resetPasswordForEmail(email, {
    redirectTo: redirectToAfterResetPassword,
  });
  return { error };
}

export async function updatePasswordByAccessToken(
  password: string,
  accessToken: string
): Promise<{ user: User | null; data: User | null; error: ApiError | null }> {
  const { user, data, error } = await supabaseClient.auth.api.updateUser(
    accessToken,
    {
      password,
    }
  );
  return { user, data, error };
}

export async function updatePasswordOfLoggedInUser(
  password: string
): Promise<{ user: User | null; data: User | null; error: ApiError | null }> {
  const { user, data, error } = await supabaseClient.auth.update({
    password,
  });
  return { user, data, error };
}

export async function updateEmailOfLoggedInUser(
  email: string
): Promise<{ user: User | null; data: User | null; error: ApiError | null }> {
  const { user, data, error } = await supabaseClient.auth.update({
    email,
  });
  return { user, data, error };
}

export async function deleteUserByUid(uid: string) {
  await prismaClient.profile.delete({ where: { id: uid } });
  const { error } = await supabaseAdmin.auth.api.deleteUser(uid);
  return { error };
}
