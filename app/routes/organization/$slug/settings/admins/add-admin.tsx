import type { ActionFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { InputError, makeDomainFunction } from "domain-functions";
import { performMutation } from "remix-forms";
import { z } from "zod";
import { createAuthClient, getSessionUserOrThrow } from "~/auth.server";
import { invariantResponse } from "~/lib/utils/response";
import { getParamValueOrThrow } from "~/lib/utils/routes";
import { deriveOrganizationMode } from "../../utils.server";
import {
  addAdminToOrganization,
  getOrganizationBySlug,
  getProfileById,
} from "./add-admin.server";
import { type TFunction } from "i18next";
import i18next from "~/i18next.server";
import { detectLanguage } from "~/root.server";

const i18nNS = ["routes/organization/settings/admin/add-admin"];
export const handle = {
  i18n: i18nNS,
};

const schema = z.object({
  profileId: z.string(),
});

const environmentSchema = z.object({
  organizationSlug: z.string(),
});

export const addAdminSchema = schema;

const createMutation = (t: TFunction) => {
  return makeDomainFunction(
    schema,
    environmentSchema
  )(async (values, environment) => {
    const profile = await getProfileById(values.profileId);
    if (profile === null) {
      throw new InputError(t("error.inputError.doesNotExist"), "profileId");
    }
    const alreadyAdmin = profile.administeredOrganizations.some((relation) => {
      return relation.organization.slug === environment.organizationSlug;
    });
    if (alreadyAdmin) {
      throw new InputError(t("error.inputError.alreadyAdmin"), "profileId");
    }
    return {
      ...values,
      firstName: profile.firstName,
      lastName: profile.lastName,
    };
  });
};

export const action = async (args: ActionFunctionArgs) => {
  const { request, params } = args;
  const locale = detectLanguage(request);
  const t = await i18next.getFixedT(locale, [
    "routes/organization/settings/admin/add-admin",
  ]);
  const { authClient } = createAuthClient(request);
  const slug = getParamValueOrThrow(params, "slug");
  const sessionUser = await getSessionUserOrThrow(authClient);
  const mode = await deriveOrganizationMode(sessionUser, slug);
  invariantResponse(mode === "admin", t("error.notPrivileged"), {
    status: 403,
  });

  const result = await performMutation({
    request,
    schema,
    mutation: createMutation(t),
    environment: { organizationSlug: slug },
  });

  if (result.success === true) {
    const organization = await getOrganizationBySlug(slug);
    invariantResponse(organization, t("error.notFound"), { status: 404 });
    await addAdminToOrganization(organization.id, result.data.profileId);

    return json({
      message: t("feedback", {
        firstName: result.data.firstName,
        lastName: result.data.lastName,
      }),
    });
  }
  return json(result);
};
