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

const schema = z.object({
  profileId: z.string(),
});

const environmentSchema = z.object({
  organizationSlug: z.string(),
});

export const addAdminSchema = schema;

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
  const alreadyAdmin = profile.administeredOrganizations.some((relation) => {
    return relation.organization.slug === environment.organizationSlug;
  });
  if (alreadyAdmin) {
    throw new InputError(
      "Das Profil unter diesem Namen ist bereits Administrator:in Eurer Organisation.",
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
  const { authClient, response } = createAuthClient(request);
  const slug = getParamValueOrThrow(params, "slug");
  const sessionUser = await getSessionUserOrThrow(authClient);
  const mode = await deriveOrganizationMode(sessionUser, slug);
  invariantResponse(mode === "admin", "Not privileged", { status: 403 });

  const result = await performMutation({
    request,
    schema,
    mutation,
    environment: { organizationSlug: slug },
  });

  if (result.success === true) {
    const organization = await getOrganizationBySlug(slug);
    invariantResponse(organization, "Organization not found", { status: 404 });
    await addAdminToOrganization(organization.id, result.data.profileId);

    return json(
      {
        message: `"${result.data.firstName} ${result.data.lastName}" wurde als Administrator:in hinzugefügt.`,
      },
      { headers: response.headers }
    );
  }
  return json(result, { headers: response.headers });
};
