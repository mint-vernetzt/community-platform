import type { ActionFunctionArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { makeDomainFunction } from "domain-functions";
import { performMutation } from "remix-forms";
import { z } from "zod";
import { createAuthClient, getSessionUserOrThrow } from "~/auth.server";
import { invariantResponse } from "~/lib/utils/response";
import { getParamValueOrThrow } from "~/lib/utils/routes";
import { deriveOrganizationMode } from "../../utils.server";
import {
  getOrganizationBySlug,
  removeAdminFromOrganization,
} from "./remove-admin.server";
import { type TFunction } from "i18next";
import i18next from "~/i18next.server";
import { detectLanguage } from "~/root.server";

const i18nNS = ["routes/organization/settings/admin/remove-admin"] as const;
export const handle = {
  i18n: i18nNS,
};

const schema = z.object({
  profileId: z.string(),
});

export const removeAdminSchema = schema;

const environmentSchema = z.object({
  adminCount: z.number(),
});

const createMutation = (t: TFunction) => {
  return makeDomainFunction(
    schema,
    environmentSchema
  )(async (values, environment) => {
    if (environment.adminCount === 1) {
      throw t("error.adminCount");
    }

    return values;
  });
};

export const action = async (args: ActionFunctionArgs) => {
  const { request, params } = args;
  const locale = detectLanguage(request);
  const t = await i18next.getFixedT(locale, [
    "routes/organization/settings/admin/remove-admin",
  ]);
  const { authClient } = createAuthClient(request);
  const slug = getParamValueOrThrow(params, "slug");
  const sessionUser = await getSessionUserOrThrow(authClient);
  const mode = await deriveOrganizationMode(sessionUser, slug);
  invariantResponse(mode === "admin", t("error.notPrivileged"), {
    status: 403,
  });
  const organization = await getOrganizationBySlug(slug);
  invariantResponse(organization, t("error.notFound"), { status: 404 });

  const result = await performMutation({
    request,
    schema,
    mutation: createMutation(t),
    environment: { adminCount: organization._count.admins },
  });

  if (result.success === true) {
    await removeAdminFromOrganization(organization.id, result.data.profileId);
    if (sessionUser.id === result.data.profileId) {
      return redirect(`/organization/${slug}`);
    }
  }
  return json(result);
};
