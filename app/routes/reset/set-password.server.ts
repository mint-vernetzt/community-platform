import { parseWithZod } from "@conform-to/zod-v1";
import { type SupabaseClient } from "@supabase/supabase-js";
import { type supportedCookieLanguages } from "~/i18n.shared";
import { type ArrayElement } from "~/lib/utils/types";
import { type languageModuleMap } from "~/locales/.server";
import { createSetPasswordSchema } from "./set-password";
import { invariantResponse } from "~/lib/utils/response";
import { z } from "zod";

export type SetPasswordLocales = (typeof languageModuleMap)[ArrayElement<
  typeof supportedCookieLanguages
>]["reset/set-password"];

export async function setNewPassword(options: {
  formData: FormData;
  authClient: SupabaseClient;
  locales: SetPasswordLocales;
}) {
  const { formData, locales, authClient } = options;
  const submission = await parseWithZod(formData, {
    schema: createSetPasswordSchema(locales).transform(async (data, ctx) => {
      if (
        typeof data.loginRedirect !== "undefined" &&
        data.loginRedirect.startsWith("/") === false &&
        data.loginRedirect.startsWith(process.env.COMMUNITY_BASE_URL) === false
      ) {
        invariantResponse(false, "Invalid login redirect", {
          status: 400,
        });
      }
      if (data.password !== data.confirmPassword) {
        ctx.addIssue({
          code: "custom",
          message: locales.validation.passwordMismatch,
          path: ["confirmPassword"],
        });
        return z.NEVER;
      }

      const { error } = await authClient.auth.updateUser({
        password: data.password,
      });
      invariantResponse(error === null, "Error while updating password", {
        status: 500,
      });

      return { ...data };
    }),
    async: true,
  });
  return {
    submission,
  };
}
