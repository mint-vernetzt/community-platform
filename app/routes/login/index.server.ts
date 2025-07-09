import { parseWithZod } from "@conform-to/zod-v1";
import { type SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import { signIn } from "~/auth.server";
import { type SUPPORTED_COOKIE_LANGUAGES } from "~/i18n.shared";
import { insertParametersIntoLocale } from "~/lib/utils/i18n";
import { invariantResponse } from "~/lib/utils/response";
import { type ArrayElement } from "~/lib/utils/types";
import { type languageModuleMap } from "~/locales/.server";
import { createLoginSchema } from ".";
import { type LandingPageLocales } from "../index.server";

export type LoginLocales = (typeof languageModuleMap)[ArrayElement<
  typeof SUPPORTED_COOKIE_LANGUAGES
>]["login/index"];

export async function login(options: {
  formData: FormData;
  request: Request;
  authClient: SupabaseClient;
  locales: LoginLocales | LandingPageLocales["route"];
}) {
  const { formData, locales, request, authClient } = options;
  const submission = await parseWithZod(formData, {
    schema: createLoginSchema(locales).transform(async (data, ctx) => {
      if (
        typeof data.loginRedirect !== "undefined" &&
        data.loginRedirect.startsWith("/") === false &&
        data.loginRedirect.startsWith(process.env.COMMUNITY_BASE_URL) === false
      ) {
        invariantResponse(false, "Invalid login redirect", {
          status: 400,
        });
      }

      const { error, headers } = await signIn(
        request,
        data.email,
        data.password
      );

      if (error !== null) {
        if (
          error.code === "invalid_credentials" ||
          error.message === "Invalid login credentials"
        ) {
          ctx.addIssue({
            code: "custom",
            message: locales.error.invalidCredentials,
          });
          return z.NEVER;
        } else if (
          error.code === "email_not_confirmed" ||
          error.message === "Email not confirmed"
        ) {
          const { error } = await authClient.auth.resend({
            type: "signup",
            email: data.email,
            options: { emailRedirectTo: data.loginRedirect },
          });
          console.error("Resending confirmation email", error);
          // If the error is not null, it means the
          invariantResponse(
            error === null,
            "Error while resending confirmation email",
            { status: 500 }
          );
          ctx.addIssue({
            code: "custom",
            message: insertParametersIntoLocale(locales.error.notConfirmed, {
              supportMail: process.env.SUPPORT_MAIL,
            }),
          });
          return z.NEVER;
        } else {
          invariantResponse(false, `${error.code}: ${error.message}`, {
            status: 500,
          });
        }
      }

      return { ...data, headers };
    }),
    async: true,
  });
  return {
    submission,
  };
}
