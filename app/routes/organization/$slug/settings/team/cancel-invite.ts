import type { ActionFunctionArgs } from "@remix-run/node";
import { makeDomainFunction } from "domain-functions";
import { performMutation } from "remix-forms";
import { z } from "zod";
import { createAuthClient, getSessionUserOrThrow } from "~/auth.server";
import { invariantResponse } from "~/lib/utils/response";
import { getParamValueOrThrow } from "~/lib/utils/routes";
import { detectLanguage } from "~/i18n.server";
import { deriveOrganizationMode } from "../../utils.server";
import {
  cancelInviteOfProfileFromOrganization,
  getOrganizationBySlug,
} from "./cancel-invite.server";
import { languageModuleMap } from "~/locales/.server";

const schema = z.object({
  profileId: z.string().uuid(),
});

export const cancelInviteSchema = schema;

const createMutation = () => {
  return makeDomainFunction(schema)(async (values) => {
    return values;
  });
};

export const action = async (args: ActionFunctionArgs) => {
  const { request, params } = args;
  const language = await detectLanguage(request);
  const locales =
    languageModuleMap[language][
      "organization/$slug/settings/team/cancel-invite"
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
    mutation: createMutation(),
  });

  if (result.success === true) {
    await cancelInviteOfProfileFromOrganization(
      organization.id,
      result.data.profileId
    );
  }

  return result;
};
