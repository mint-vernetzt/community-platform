import type { ActionFunctionArgs } from "@remix-run/node";
import { makeDomainFunction } from "domain-functions";
import { performMutation } from "remix-forms";
import { z } from "zod";
import { createAuthClient, getSessionUserOrThrow } from "~/auth.server";
import { invariantResponse } from "~/lib/utils/response";
import { getParamValueOrThrow } from "~/lib/utils/routes";
import { deriveOrganizationMode } from "../../utils.server";
import {
  getOrganizationBySlug,
  type RemoveOrganizationTeamMemberLocales,
  removeTeamMemberFromOrganization,
} from "./remove-member.server";
import { detectLanguage } from "~/i18n.server";
import { languageModuleMap } from "~/locales/.server";

const schema = z.object({
  profileId: z.string().uuid(),
});

export const removeMemberSchema = schema;

const environmentSchema = z.object({
  memberCount: z.number(),
});

const createMutation = (locales: RemoveOrganizationTeamMemberLocales) => {
  return makeDomainFunction(
    schema,
    environmentSchema
  )(async (values, environment) => {
    if (environment.memberCount === 1) {
      throw locales.error.memberCount;
    }

    return values;
  });
};

export const action = async (args: ActionFunctionArgs) => {
  const { request, params } = args;
  const language = await detectLanguage(request);
  const locales =
    languageModuleMap[language][
      "organization/$slug/settings/team/remove-member"
    ];
  const slug = getParamValueOrThrow(params, "slug");
  const { authClient } = createAuthClient(request);
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
    environment: { memberCount: organization._count.teamMembers },
  });

  if (result.success === true) {
    await removeTeamMemberFromOrganization(
      organization.id,
      result.data.profileId
    );
  }

  return result;
};
