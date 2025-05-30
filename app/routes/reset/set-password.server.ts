import { parseWithZod } from "@conform-to/zod-v1";
import { type User } from "@supabase/supabase-js";
import { type SUPPORTED_COOKIE_LANGUAGES } from "~/i18n.shared";
import { type ArrayElement } from "~/lib/utils/types";
import { type languageModuleMap } from "~/locales/.server";
import { createSetPasswordSchema } from "./set-password";
import { invariantResponse } from "~/lib/utils/response";
import { z } from "zod";
import { createAdminAuthClient } from "~/auth.server";

export type SetPasswordLocales = (typeof languageModuleMap)[ArrayElement<
  typeof SUPPORTED_COOKIE_LANGUAGES
>]["reset/set-password"];

export async function setNewPassword(options: {
  formData: FormData;
  sessionUser: User;
  locales: SetPasswordLocales;
}) {
  const { formData, locales, sessionUser } = options;
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

      const adminAuthClient = createAdminAuthClient();

      const { error } = await adminAuthClient.auth.admin.updateUserById(
        sessionUser.id,
        {
          password: data.password,
        }
      );
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
