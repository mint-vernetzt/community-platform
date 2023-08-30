import type { ActionFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import { InputError, makeDomainFunction } from "remix-domains";
import type { PerformMutation } from "remix-forms";
import { performMutation } from "remix-forms";
import type { Schema } from "zod";
import { z } from "zod";
import { createAuthClient, getSessionUserOrThrow } from "~/auth.server";
import { invariantResponse } from "~/lib/utils/response";
import { getParamValueOrThrow } from "~/lib/utils/routes";
import { checkIdentityOrThrow } from "../../utils.server";
import { getProfileById, isOrganizationAdmin } from "../utils.server";
import {
  addTeamMemberToOrganization,
  getOrganizationBySlug,
} from "./add-member.server";

const schema = z.object({
  userId: z.string().uuid(),
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

export type SuccessActionData = {
  message: string;
};

export type FailureActionData = PerformMutation<
  z.infer<Schema>,
  z.infer<typeof schema>
>;
export const action: ActionFunction = async (args) => {
  const { request, params } = args;
  const response = new Response();
  const authClient = createAuthClient(request, response);
  const sessionUser = await getSessionUserOrThrow(authClient);
  await checkIdentityOrThrow(request, sessionUser);
  const slug = getParamValueOrThrow(params, "slug");

  const result = await performMutation({
    request,
    schema,
    mutation,
    environment: {
      organizationSlug: slug,
    },
  });

  if (result.success) {
    const isAdmin = await isOrganizationAdmin(slug, sessionUser);
    invariantResponse(isAdmin, "Not privileged", { status: 403 });
    const organization = await getOrganizationBySlug(slug);
    invariantResponse(organization, "Organization not found", { status: 404 });
    await addTeamMemberToOrganization(organization.id, result.data.profileId);
    return json<SuccessActionData>(
      {
        message: `Ein neues Teammitglied mit dem Namen "${result.data.firstName} ${result.data.lastName}" wurde hinzugefügt.`,
      },
      { headers: response.headers }
    );
  }

  return json<FailureActionData>(result, { headers: response.headers });
};
