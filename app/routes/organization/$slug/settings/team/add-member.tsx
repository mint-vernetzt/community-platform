import type { ActionFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import { InputError, makeDomainFunction } from "remix-domains";
import type { PerformMutation } from "remix-forms";
import { performMutation } from "remix-forms";
import type { Schema } from "zod";
import { z } from "zod";
import { createAuthClient, getSessionUserOrThrow } from "~/auth.server";
import { getParamValueOrThrow } from "~/lib/utils/routes";
import {
  checkIdentityOrThrow,
  checkSameOrganizationOrThrow,
} from "../../utils.server";
import {
  connectProfileToOrganization,
  getOrganizationIdBySlug,
  getProfileById,
  handleAuthorization,
} from "../utils.server";

const schema = z.object({
  userId: z.string().uuid(),
  organizationId: z.string().uuid(),
  id: z.string(),
  slug: z.string(),
});

export const addMemberSchema = schema;

const mutation = makeDomainFunction(schema)(async (values) => {
  const { id, slug } = values;
  // TODO: Duplicate code - see utils.server.ts handleAuthorization()
  // Problem:
  // - organization.id is required inside the mutation scope
  // - handleAuthorization returns the organization.id but needs to be called inside the action scope as it needs the action args (params, request)
  // TODO: Solution: Provide Action args via environment
  const organization = await getOrganizationIdBySlug(slug);
  if (organization === null) {
    throw "Die Organisation konnte nicht gefunden werden.";
  }

  const profile = await getProfileById(id);

  if (profile === null) {
    throw new InputError(
      "Es existiert noch kein Profil unter diesem Namen.",
      "id"
    );
  }

  const alreadyMember = profile.memberOf.some((entry) => {
    return entry.organization.slug === slug;
  });

  if (alreadyMember) {
    throw new InputError(
      "Das Profil unter diesem Namen ist bereits Mitglied Eurer Organisation.",
      "id"
    );
  }

  const result = await connectProfileToOrganization(
    profile.id,
    organization.id
  );
  if (result === null) {
    throw "Das profil unter diesem Namen konnte leider nicht hinzugefügt werden.";
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

  const { organization } = await handleAuthorization(authClient, slug);

  await checkSameOrganizationOrThrow(request, organization.id);

  const result = await performMutation({ request, schema, mutation });

  if (result.success) {
    return json<SuccessActionData>(
      {
        message: `Ein neues Teammitglied mit dem Namen "${result.data.firstName} ${result.data.lastName}" wurde hinzugefügt.`,
      },
      { headers: response.headers }
    );
  }

  return json<FailureActionData>(result, { headers: response.headers });
};
