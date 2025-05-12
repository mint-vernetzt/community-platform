import { parseWithZod } from "@conform-to/zod-v1";
import { type SupabaseClient } from "@supabase/supabase-js";
import { type supportedCookieLanguages } from "~/i18n.shared";
import { type ArrayElement } from "~/lib/utils/types";
import { type languageModuleMap } from "~/locales/.server";
import { createRegisterSchema } from ".";
import { invariantResponse } from "~/lib/utils/response";
import { z } from "zod";
import { generateUsername } from "~/utils.server";
import { signUp } from "~/auth.server";

export type RegisterLocales = (typeof languageModuleMap)[ArrayElement<
  typeof supportedCookieLanguages
>]["register/index"];

export async function register(options: {
  formData: FormData;
  authClient: SupabaseClient;
  locales: RegisterLocales;
}) {
  const { formData, locales, authClient } = options;
  const submission = await parseWithZod(formData, {
    schema: createRegisterSchema(locales).transform(async (data, ctx) => {
      if (
        typeof data.loginRedirect !== "undefined" &&
        data.loginRedirect.startsWith("/") === false &&
        data.loginRedirect.startsWith(process.env.COMMUNITY_BASE_URL) === false
      ) {
        invariantResponse(false, "Invalid login redirect", {
          status: 400,
        });
      }
      if (data.termsAccepted === false) {
        ctx.addIssue({
          code: "custom",
          message: locales.validation.termsAccepted,
          path: ["termsAccepted"],
        });
        return z.NEVER;
      }
      const username = `${generateUsername(data.firstName, data.lastName)}`;
      const { error } = await signUp(
        authClient,
        data.email,
        data.password,
        {
          firstName: data.firstName,
          lastName: data.lastName,
          username,
          academicTitle:
            data.academicTitle === locales.form.title.options.none
              ? null
              : data.academicTitle,
          termsAccepted: data.termsAccepted,
        },
        data.loginRedirect
      );

      console.log({ error });

      if (
        error !== null &&
        error.code !== "user_already_exists" &&
        error.message !== "User already registered"
      ) {
        invariantResponse(false, "Server Error", { status: 500 });
      }

      return { ...data };
    }),
    async: true,
  });
  return {
    submission,
  };
}
