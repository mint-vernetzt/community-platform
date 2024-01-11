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
  addTeamMemberToOrganization,
  getOrganizationBySlug,
  getProfileById,
} from "./add-member.server";

const schema = z.object({
  profileId: z.string(),
});

const environmentSchema = z.object({
  organizationSlug: z.string(),
});

export const addMemberSchema = schema;

const mutation = makeDomainFunction(
  schema,
  environmentSchema
)(async (values, environment) => {
  const profile = await getProfileById(values.profileId);

  if (profile === null) {
    throw new InputError(
      "Es existiert noch kein Profil unter diesem Namen.",
      "profileId"
    );
  }

  const alreadyMember = profile.memberOf.some((relation) => {
    return relation.organization.slug === environment.organizationSlug;
  });

  if (alreadyMember) {
    throw new InputError(
      "Das Profil unter diesem Namen ist bereits Mitglied Eurer Organisation.",
      "profileId"
    );
  }

  return {
    ...values,
    firstName: profile.firstName,
    lastName: profile.lastName,
  };
});

export const action = async (args: ActionFunctionArgs) => {
  const { request, params } = args;
  const response = new Response();
  const slug = getParamValueOrThrow(params, "slug");
  const authClient = createAuthClient(request, response);
  const sessionUser = await getSessionUserOrThrow(authClient);
  const mode = await deriveOrganizationMode(sessionUser, slug);
  invariantResponse(mode === "admin", "Not privileged", { status: 403 });

  const result = await performMutation({
    request,
    schema,
    mutation,
    environment: {
      organizationSlug: slug,
    },
  });

  if (result.success) {
    const organization = await getOrganizationBySlug(slug);
    invariantResponse(organization, "Organization not found", { status: 404 });
    await addTeamMemberToOrganization(organization.id, result.data.profileId);
    return json(
      {
        message: `Ein neues Teammitglied mit dem Namen "${result.data.firstName} ${result.data.lastName}" wurde hinzugefügt.`,
      },
      { headers: response.headers }
    );
  }

  return json(result, { headers: response.headers });
};
