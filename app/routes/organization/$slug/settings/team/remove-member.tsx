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

const schema = z.object({
  profileId: z.string().uuid(),
});

export const removeMemberSchema = schema;

const environmentSchema = z.object({
  memberCount: z.number(),
});

const mutation = makeDomainFunction(
  schema,
  environmentSchema
)(async (values, environment) => {
  if (environment.memberCount === 1) {
    throw "Es muss immer ein Teammitglied geben. Bitte füge zuerst jemand anderen als Teammitglied hinzu.";
  }

  return values;
});

export const action = async (args: DataFunctionArgs) => {
  const { request, params } = args;
  const response = new Response();
  const authClient = createAuthClient(request, response);
  const sessionUser = await getSessionUserOrThrow(authClient);
  const slug = getParamValueOrThrow(params, "slug");
  const organization = await getOrganizationBySlug(slug);
  invariantResponse(organization, "Organization not found", { status: 404 });

  const result = await performMutation({
    request,
    schema,
    mutation,
    environment: { memberCount: organization._count.teamMembers },
  });

  if (result.success === true) {
    const mode = await deriveOrganizationMode(sessionUser, slug);
    invariantResponse(mode === "admin", "Not privileged", { status: 403 });
    await removeTeamMemberFromOrganization(
      organization.id,
      result.data.profileId
    );
  }

  return json(result, { headers: response.headers });
};
