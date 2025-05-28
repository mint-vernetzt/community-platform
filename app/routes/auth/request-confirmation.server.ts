import { parseWithZod } from "@conform-to/zod-v1";
import { type SupabaseClient } from "@supabase/supabase-js";
import { sendResetPasswordLink } from "~/auth.server";
import { type SUPPORTED_COOKIE_LANGUAGES } from "~/i18n.shared";
import { invariantResponse } from "~/lib/utils/response";
import { type ArrayElement } from "~/lib/utils/types";
import { type languageModuleMap } from "~/locales/.server";
import { createRequestConfirmationSchema } from "./request-confirmation";

export type RequestConfirmationLocales =
  (typeof languageModuleMap)[ArrayElement<
    typeof SUPPORTED_COOKIE_LANGUAGES
  >]["auth/request-confirmation"];

export async function requestConfirmation(options: {
  formData: FormData;
  authClient: SupabaseClient;
  locales: RequestConfirmationLocales;
}) {
  const { formData, locales, authClient } = options;
  const submission = await parseWithZod(formData, {
    schema: createRequestConfirmationSchema(locales).transform(async (data) => {
      if (
        typeof data.loginRedirect !== "undefined" &&
        data.loginRedirect.startsWith("/") === false &&
        data.loginRedirect.startsWith(process.env.COMMUNITY_BASE_URL) === false
      ) {
        invariantResponse(false, "Invalid login redirect", {
          status: 400,
        });
      }
      const loginRedirect =
        typeof data.loginRedirect !== "undefined"
          ? data.loginRedirect.startsWith("/")
            ? `${process.env.COMMUNITY_BASE_URL}${data.loginRedirect}`
            : data.loginRedirect
          : undefined;

      if (data.type === "signup" || data.type === "email_change") {
        const { error } = await authClient.auth.resend({
          type: "signup",
          email: data.email,
          options: { emailRedirectTo: loginRedirect },
        });
        invariantResponse(
          error === null,
          "Error while resending confirmation email",
          { status: 500 }
        );
      } else {
        const { error } = await sendResetPasswordLink(
          authClient,
          data.email,
          data.loginRedirect
        );
        invariantResponse(
          error === null,
          "Error while resending confirmation email",
          { status: 500 }
        );
      }

      return { ...data };
    }),
    async: true,
  });
  return {
    submission,
  };
}
