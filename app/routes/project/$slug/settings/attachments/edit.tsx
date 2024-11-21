import { parse } from "@conform-to/zod";
import { json, redirect, type ActionFunctionArgs } from "@remix-run/node";
import { z } from "zod";
import { createAuthClient, getSessionUser } from "~/auth.server";
import i18next from "~/i18next.server";
import { invariantResponse } from "~/lib/utils/response";
import { prismaClient } from "~/prisma.server";
import { detectLanguage } from "~/root.server";
import {
  getRedirectPathOnProtectedProjectRoute,
  getSubmissionHash,
} from "../utils.server";
import { DeepSearchParam } from "~/form-helpers";

const i18nNS = ["routes/project/settings/attachments/edit"];
export const handle = {
  i18n: i18nNS,
};

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

  const locale = detectLanguage(request);
  const t = await i18next.getFixedT(locale, i18nNS);

  const { authClient } = createAuthClient(request);

  const sessionUser = await getSessionUser(authClient);

  // check slug exists (throw bad request if not)
  invariantResponse(params.slug !== undefined, t("error.invalidRoute"), {
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
  const hash = getSubmissionHash(submission);

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
    return json({ status: "error", submission, hash } as const, {
      status: 400,
    });
  }

  const redirectUrl = new URL("./", request.url);
  redirectUrl.searchParams.set(DeepSearchParam, "true");

  return redirect(redirectUrl.toString());
};
