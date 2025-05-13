import { type supportedCookieLanguages } from "~/i18n.shared";
import { type ArrayElement } from "~/lib/utils/types";
import { type languageModuleMap } from "~/locales/.server";
import { parseWithZod } from "@conform-to/zod-v1";
import { type SupabaseClient } from "@supabase/supabase-js";
import { createAdminAuthClient, sendResetPasswordLink } from "~/auth.server";
import { invariantResponse } from "~/lib/utils/response";
import { createRequestPasswordChangeSchema } from ".";
import { prismaClient } from "~/prisma.server";

export type ResetPasswordLocales = (typeof languageModuleMap)[ArrayElement<
  typeof supportedCookieLanguages
>]["reset/index"];

export async function requestPasswordChange(options: {
  formData: FormData;
  authClient: SupabaseClient;
  locales: ResetPasswordLocales;
}) {
  const { formData, locales, authClient } = options;
  const submission = await parseWithZod(formData, {
    schema: createRequestPasswordChangeSchema(locales).transform(
      async (data) => {
        if (
          typeof data.loginRedirect !== "undefined" &&
          data.loginRedirect.startsWith("/") === false &&
          data.loginRedirect.startsWith(process.env.COMMUNITY_BASE_URL) ===
            false
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

        // get profile by email to be able to find user in auth table
        const profile = await prismaClient.profile.findFirst({
          where: {
            email: {
              contains: data.email,
              mode: "insensitive",
            },
          },
          select: { id: true },
        });

        if (profile !== null) {
          const adminAuthClient = createAdminAuthClient();
          const { data: authClientData, error } =
            await adminAuthClient.auth.admin.getUserById(profile.id);
          invariantResponse(error === null, "User not found", { status: 404 });
          // if user uses email provider send password reset link. TODO: Else inform, that user is using MINT-ID
          if (authClientData.user.app_metadata.provider === "email") {
            const { error } = await sendResetPasswordLink(
              authClient,
              data.email,
              loginRedirect
            );
            invariantResponse(
              error === null,
              "Error while resending confirmation email",
              { status: 500 }
            );
          }
        }
        return { ...data };
      }
    ),
    async: true,
  });
  return {
    submission,
  };
}
