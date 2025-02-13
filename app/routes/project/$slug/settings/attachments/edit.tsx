import { parse } from "@conform-to/zod";
import { redirect, type ActionFunctionArgs } from "react-router";
import { z } from "zod";
import { createAuthClient, getSessionUser } from "~/auth.server";
import { invariantResponse } from "~/lib/utils/response";
import { prismaClient } from "~/prisma.server";
import { detectLanguage } from "~/i18n.server";
import {
  getRedirectPathOnProtectedProjectRoute,
  getHash,
} from "../utils.server";
import { Deep } from "~/lib/utils/searchParams";
import { languageModuleMap } from "~/locales/.server";

export const documentSchema = z.object({
  id: z.string(),
  type: z.literal("document"),
  title: z
    .string()

    .optional()
    .transform((value) =>
      typeof value === "undefined" || value === "" ? null : value
    ),
  description: z
    .string()
    .max(80)
    .optional()
    .transform((value) =>
      typeof value === "undefined" || value === "" ? null : value
    ),
});

export const imageSchema = z.object({
  id: z.string(),
  type: z.literal("image"),
  title: z
    .string()

    .optional()
    .transform((value) =>
      typeof value === "undefined" || value === "" ? null : value
    ),
  description: z
    .string()
    .max(80)
    .optional()
    .transform((value) =>
      typeof value === "undefined" || value === "" ? null : value
    ),
  credits: z
    .string()
    .max(80)
    .optional()
    .transform((value) =>
      typeof value === "undefined" || value === "" ? null : value
    ),
});

export const action = async (args: ActionFunctionArgs) => {
  const { request, params } = args;

  const language = await detectLanguage(request);
  const locales =
    languageModuleMap[language]["project/$slug/settings/attachments/edit"];

  const { authClient } = createAuthClient(request);

  const sessionUser = await getSessionUser(authClient);

  // check slug exists (throw bad request if not)
  invariantResponse(params.slug !== undefined, locales.error.invalidRoute, {
    status: 400,
  });

  const redirectPath = await getRedirectPathOnProtectedProjectRoute({
    request,
    slug: params.slug,
    sessionUser,
    authClient,
  });

  if (redirectPath !== null) {
    return redirect(redirectPath);
  }

  const formData = await request.formData();
  let schema;
  const schemaType = formData.get("type");
  if (schemaType === "document") {
    schema = documentSchema;
  } else {
    schema = imageSchema;
  }
  const submission = parse(formData, { schema });
  const hash = getHash(submission);

  if (typeof submission.value !== "undefined" && submission.value !== null) {
    const { id, type, ...rest } = submission.value;
    if (type === "document") {
      await prismaClient.document.update({
        where: {
          id,
        },
        data: {
          ...rest,
        },
      });
    } else {
      await prismaClient.image.update({
        where: {
          id,
        },
        data: {
          ...rest,
        },
      });
    }
  } else {
    return { status: "error", submission, hash };
  }

  const redirectUrl = new URL("./", request.url);
  redirectUrl.searchParams.set(Deep, "true");

  return redirect(redirectUrl.toString());
};
