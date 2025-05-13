import { parseWithZod } from "@conform-to/zod-v1";
import { type supportedCookieLanguages } from "~/i18n.shared";
import { type ArrayElement } from "~/lib/utils/types";
import { type languageModuleMap } from "~/locales/.server";
import { acceptTermsSchema } from "./accept-terms";
import { z } from "zod";
import { prismaClient } from "~/prisma.server";
import { type User } from "@supabase/supabase-js";
import { invariantResponse } from "~/lib/utils/response";

export type AcceptTermsLocales = (typeof languageModuleMap)[ArrayElement<
  typeof supportedCookieLanguages
>]["accept-terms"];

export async function acceptTerms(options: {
  formData: FormData;
  sessionUser: User;
  locales: AcceptTermsLocales;
}) {
  const { formData, locales, sessionUser } = options;
  const submission = await parseWithZod(formData, {
    schema: acceptTermsSchema.transform(async (data, ctx) => {
      if (
        typeof data.redirectTo !== "undefined" &&
        data.redirectTo.startsWith("/") === false &&
        data.redirectTo.startsWith(process.env.COMMUNITY_BASE_URL) === false
      ) {
        invariantResponse(false, "Invalid redirect to", {
          status: 400,
        });
      }
      if (data.termsAccepted === false) {
        ctx.addIssue({
          code: "custom",
          message: locales.error.notAccepted,
        });
        return z.NEVER;
      }
      try {
        await prismaClient.profile.update({
          where: { id: sessionUser.id },
          data: {
            termsAccepted: data.termsAccepted,
            termsAcceptedAt: new Date(),
          },
        });
      } catch (error) {
        console.error({ error });
        invariantResponse(false, "Error updating terms accepted", {
          status: 500,
        });
      }
      return { ...data };
    }),
    async: true,
  });
  return {
    submission,
  };
}
