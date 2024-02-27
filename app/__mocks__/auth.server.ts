import {
  type User,
  type SupabaseClient,
  type Session,
  type AuthError,
  type WeakPassword,
} from "@supabase/supabase-js";
import { beforeEach, vi } from "vitest";
import { mockReset } from "vitest-mock-extended";

beforeEach(() => {
  mockReset(createAuthClient);
  mockReset(createAdminAuthClient);
  mockReset(signUp);
  mockReset(signIn);
  mockReset(signOut);
  mockReset(setSession);
  mockReset(getSession);
  mockReset(getSessionOrThrow);
  mockReset(getSessionUser);
  mockReset(getSessionUserOrThrow);
  mockReset(sendResetPasswordLink);
  mockReset(updatePassword);
  mockReset(sendResetEmailLink);
  mockReset(deleteUserByUid);
});

export const createAuthClient = vi.fn<
  [],
  {
    authClient: SupabaseClient<any, "public", any>;
    response: Response;
    headers: Headers;
  }
>();

export const createAdminAuthClient = vi.fn<
  [],
  SupabaseClient<any, "public", any>
>();

export const signUp = vi.fn<
  [],
  {
    data: {
      user: User | null;
      session: Session | null;
    };
    error: AuthError | null;
  }
>();

export const signIn = vi.fn<
  [],
  {
    data:
      | {
          user: User;
          session: Session;
          weakPassword?: WeakPassword | undefined;
        }
      | {
          user: null;
          session: null;
          weakPassword?: null | undefined;
        };
    error: AuthError | null;
    headers: Headers;
  }
>();

export const signOut = vi.fn<
  [],
  {
    error: AuthError | null;
    headers: Headers;
  }
>();

export const setSession = vi.fn<
  [],
  {
    session: Session | null;
    user: User | null;
  }
>();

export const getSession = vi.fn<[], Session | null>();

export const getSessionOrThrow = vi.fn<[], Session>();

export const getSessionUser = vi.fn<[], User | null>();

export const getSessionUserOrThrow = vi.fn<[], User>();

export const sendResetPasswordLink = vi.fn<[], { error: AuthError | null }>();

export const updatePassword = vi.fn<
  [],
  {
    data: {
      user: User | null;
    };
    error: AuthError | null;
  }
>();

export const sendResetEmailLink = vi.fn<
  [],
  {
    data: {
      user: User | null;
    };
    error: AuthError | null;
  }
>();

export const deleteUserByUid = vi.fn<
  [],
  {
    error: AuthError | null;
  }
>();
