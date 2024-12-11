import type { ActionFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { makeDomainFunction } from "domain-functions";
import { type TFunction } from "i18next";
import { performMutation } from "remix-forms";
import { z } from "zod";
import { createAuthClient, getSessionUserOrThrow } from "~/auth.server";
import i18next from "~/i18next.server";
import { invariantResponse } from "~/lib/utils/response";
import { getParamValueOrThrow } from "~/lib/utils/routes";
import { detectLanguage } from "~/root.server";
import { deriveOrganizationMode } from "../../utils.server";
import {
  cancelInviteOfProfileFromOrganization,
  getOrganizationBySlug,
} from "./cancel-invite.server";

const schema = z.object({
  profileId: z.string().uuid(),
});

const i18nNS = ["routes-organization-settings-team-cancel-invite"] as const;
export const handle = {
  i18n: i18nNS,
};

export const cancelInviteSchema = schema;

const createMutation = (t: TFunction) => {
  return makeDomainFunction(schema)(async (values) => {
    return values;
  });
};

export const action = async (args: ActionFunctionArgs) => {
  const { request, params } = args;
  const locale = await detectLanguage(request);
  const t = await i18next.getFixedT(locale, [
    "routes-organization-settings-team-cancel-invite",
  ]);
  const slug = getParamValueOrThrow(params, "slug");
  const { authClient } = createAuthClient(request);
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
  });

  if (result.success === true) {
    await cancelInviteOfProfileFromOrganization(
      organization.id,
      result.data.profileId
    );
  }

  return json(result);
};
