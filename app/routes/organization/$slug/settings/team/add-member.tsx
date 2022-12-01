import { ActionFunction, json } from "@remix-run/node";
import { createServerClient } from "@supabase/auth-helpers-remix";
import { InputError, makeDomainFunction } from "remix-domains";
import { PerformMutation, performMutation } from "remix-forms";
import { Schema, z } from "zod";
import { getSessionUserOrThrow } from "~/auth.server";
import { getParamValueOrThrow } from "~/lib/utils/routes";
import {
  checkIdentityOrThrow,
  checkSameOrganizationOrThrow,
} from "../../utils.server";
import {
  connectProfileToOrganization,
  getOrganizationIdBySlug,
  getProfileByEmail,
  handleAuthorization,
} from "../utils.server";

const schema = z.object({
  userId: z.string().uuid(),
  organizationId: z.string().uuid(),
  email: z.string().email(),
  slug: z.string(),
});

export const addMemberSchema = schema;

const mutation = makeDomainFunction(schema)(async (values) => {
  const { email, slug } = values;
  // TODO: Duplicate code - see utils.server.ts handleAuthorization()
  // Problem:
  // - organization.id is required inside the mutation scope
  // - handleAuthorization returns the organization.id but needs to be called inside the action scope as it needs the action args (params, request)
  // TODO: Solution: Provide Action args via environment
  const organization = await getOrganizationIdBySlug(slug);
  if (organization === null) {
    throw "Die Organisation konnte nicht gefunden werden.";
  }

  const profile = await getProfileByEmail(email);

  if (profile === null) {
    throw new InputError(
      "Es existiert noch kein Profil unter dieser E-Mail.",
      "email"
    );
  }

  const alreadyMember = profile.memberOf.some((entry) => {
    return entry.organization.slug === slug;
  });

  if (alreadyMember) {
    throw new InputError(
      "Das Profil unter dieser E-Mail ist bereits Mitglied Eurer Organisation.",
      "email"
    );
  }

  const result = await connectProfileToOrganization(
    profile.id,
    organization.id
  );
  if (result === null) {
    throw "Das profil unter dieser E-Mail konnte leider nicht hinzugefügt werden.";
  }

  return values;
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

  const supabaseClient = createServerClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY,
    {
      request,
      response,
    }
  );

  const sessionUser = await getSessionUserOrThrow(supabaseClient);
  await checkIdentityOrThrow(request, sessionUser);
  const slug = getParamValueOrThrow(params, "slug");

  const { organization } = await handleAuthorization(supabaseClient, slug);

  await checkSameOrganizationOrThrow(request, organization.id);

  const result = await performMutation({ request, schema, mutation });

  if (result.success) {
    return json<SuccessActionData>(
      {
        message: `Ein neues Teammitglied mit der E-Mail "${result.data.email}" wurde hinzugefügt.`,
      },
      { headers: response.headers }
    );
  }

  return json<FailureActionData>(result, { headers: response.headers });
};
