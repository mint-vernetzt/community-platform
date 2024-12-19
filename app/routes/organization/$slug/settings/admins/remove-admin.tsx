import type { ActionFunctionArgs } from "@remix-run/node";
import { redirect } from "@remix-run/node";
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
  type RemoveAdminFromOrganizationLocales,
} from "./remove-admin.server";
import { detectLanguage } from "~/i18n.server";
import { languageModuleMap } from "~/locales/.server";

const schema = z.object({
  profileId: z.string(),
});

export const removeAdminSchema = schema;

const environmentSchema = z.object({
  adminCount: z.number(),
});

const createMutation = (locales: RemoveAdminFromOrganizationLocales) => {
  return makeDomainFunction(
    schema,
    environmentSchema
  )(async (values, environment) => {
    if (environment.adminCount === 1) {
      throw locales.error.adminCount;
    }

    return values;
  });
};

export const action = async (args: ActionFunctionArgs) => {
  const { request, params } = args;
  const language = await detectLanguage(request);
  const locales =
    languageModuleMap[language][
      "organization/$slug/settings/admins/remove-admin"
    ];
  const { authClient } = createAuthClient(request);
  const slug = getParamValueOrThrow(params, "slug");
  const sessionUser = await getSessionUserOrThrow(authClient);
  const mode = await deriveOrganizationMode(sessionUser, slug);
  invariantResponse(mode === "admin", locales.error.notPrivileged, {
    status: 403,
  });
  const organization = await getOrganizationBySlug(slug);
  invariantResponse(organization, locales.error.notFound, { status: 404 });

  const result = await performMutation({
    request,
    schema,
    mutation: createMutation(locales),
    environment: { adminCount: organization._count.admins },
  });

  if (result.success === true) {
    await removeAdminFromOrganization(organization.id, result.data.profileId);
    if (sessionUser.id === result.data.profileId) {
      return redirect(`/organization/${slug}`);
    }
  }
  return result;
};
