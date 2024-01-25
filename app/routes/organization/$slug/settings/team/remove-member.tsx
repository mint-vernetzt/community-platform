import type { DataFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { makeDomainFunction } from "remix-domains";
import { performMutation } from "remix-forms";
import { z } from "zod";
import { createAuthClient, getSessionUserOrThrow } from "~/auth.server";
import { invariantResponse } from "~/lib/utils/response";
import { getParamValueOrThrow } from "~/lib/utils/routes";
import { deriveOrganizationMode } from "../../utils.server";
import {
  getOrganizationBySlug,
  removeTeamMemberFromOrganization,
} from "./remove-member.server";
import i18next from "~/i18next.server";
import { type TFunction } from "i18next";
import { detectLanguage } from "~/root.server";

const schema = z.object({
  profileId: z.string().uuid(),
});

const i18nNS = ["routes/organization/settings/team/remove-member"];
export const handle = {
  i18n: i18nNS,
};

export const removeMemberSchema = schema;

const environmentSchema = z.object({
  memberCount: z.number(),
});

const createMutation = (t: TFunction) => {
  return makeDomainFunction(
    schema,
    environmentSchema
  )(async (values, environment) => {
    if (environment.memberCount === 1) {
      throw t("error.memberCount");
    }

    return values;
  });
};

export const action = async (args: DataFunctionArgs) => {
  const { request, params } = args;
  const response = new Response();
  const locale = detectLanguage(request);
  const t = await i18next.getFixedT(locale, [
    "routes/organization/settings/team/remove-member",
  ]);
  const slug = getParamValueOrThrow(params, "slug");
  const authClient = createAuthClient(request, response);
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
    environment: { memberCount: organization._count.teamMembers },
  });

  if (result.success === true) {
    await removeTeamMemberFromOrganization(
      organization.id,
      result.data.profileId
    );
  }

  return json(result, { headers: response.headers });
};
