import type { DataFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { InputError, makeDomainFunction } from "remix-domains";
import { performMutation } from "remix-forms";
import { z } from "zod";
import { createAuthClient, getSessionUserOrThrow } from "~/auth.server";
import { invariantResponse } from "~/lib/utils/response";
import { getParamValueOrThrow } from "~/lib/utils/routes";
import { deriveOrganizationMode } from "../../utils.server";
import {
  addTeamMemberToOrganization,
  getOrganizationBySlug,
  getProfileById,
} from "./add-member.server";
import i18next from "~/i18next.server";
import { TFunction } from "i18next";

export const handle = {
  i18n: ["routes/organization/settings/team/add-member"],
};

const schema = z.object({
  profileId: z.string(),
});

const environmentSchema = z.object({
  organizationSlug: z.string(),
});

export const addMemberSchema = schema;

const createMutation = (t: TFunction) => {
  return makeDomainFunction(
    schema,
    environmentSchema
  )(async (values, environment) => {
    const profile = await getProfileById(values.profileId);

    if (profile === null) {
      throw new InputError(t("error.inputError.doesNotExist"), "profileId");
    }

    const alreadyMember = profile.memberOf.some((relation) => {
      return relation.organization.slug === environment.organizationSlug;
    });

    if (alreadyMember) {
      throw new InputError(t("error.inputError.alreadyMember"), "profileId");
    }

    return {
      ...values,
      firstName: profile.firstName,
      lastName: profile.lastName,
    };
  });
};

export const action = async (args: DataFunctionArgs) => {
  const { request, params } = args;
  const response = new Response();
  const t = await i18next.getFixedT(request, [
    "routes/organization/settings/team/add-member",
  ]);
  const slug = getParamValueOrThrow(params, "slug");
  const authClient = createAuthClient(request, response);
  const sessionUser = await getSessionUserOrThrow(authClient);
  const mode = await deriveOrganizationMode(sessionUser, slug);
  invariantResponse(mode === "admin", t("error.notPrivileged"), {
    status: 403,
  });

  const result = await performMutation({
    request,
    schema,
    mutation: createMutation(t),
    environment: {
      organizationSlug: slug,
    },
  });

  if (result.success) {
    const organization = await getOrganizationBySlug(slug);
    invariantResponse(organization, t("error.notFound"), { status: 404 });
    await addTeamMemberToOrganization(organization.id, result.data.profileId);
    return json(
      {
        message: t("feedback", {
          firstName: result.data.firstName,
          lastName: result.data.lastName,
        }),
      },
      { headers: response.headers }
    );
  }

  return json(result, { headers: response.headers });
};
