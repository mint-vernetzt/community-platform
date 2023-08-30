import type { DataFunctionArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { makeDomainFunction } from "remix-domains";
import { performMutation } from "remix-forms";
import { z } from "zod";
import { createAuthClient } from "~/auth.server";
import { invariantResponse } from "~/lib/utils/response";
import { getParamValueOrThrow } from "~/lib/utils/routes";
import { handleAuthorization, isOrganizationAdmin } from "../utils.server";
import {
  getOrganizationBySlug,
  removeAdminFromOrganization,
} from "./remove-admin.server";

const schema = z.object({
  userId: z.string(),
  profileId: z.string(),
});

export const removeAdminSchema = schema;

const environmentSchema = z.object({
  adminCount: z.number(),
});

const mutation = makeDomainFunction(
  schema,
  environmentSchema
)(async (values, environment) => {
  if (environment.adminCount === 1) {
    throw "Es muss immer eine:n Administrator:in geben. Bitte füge zuerst jemand anderen als Administrator:in hinzu.";
  }

  return values;
});

export const action = async (args: DataFunctionArgs) => {
  const { request, params } = args;
  const response = new Response();
  const authClient = createAuthClient(request, response);
  const slug = getParamValueOrThrow(params, "slug");
  const { sessionUser } = await handleAuthorization(authClient, slug);
  const organization = await getOrganizationBySlug(slug);
  invariantResponse(organization, "Organization not found", { status: 404 });

  const result = await performMutation({
    request,
    schema,
    mutation,
    environment: { adminCount: organization._count.admins },
  });

  if (result.success === true) {
    const isAdmin = await isOrganizationAdmin(slug, sessionUser);
    invariantResponse(isAdmin, "Not privileged", { status: 403 });
    await removeAdminFromOrganization(organization.id, result.data.profileId);
    if (sessionUser.id === result.data.profileId) {
      return redirect(`/organization/${slug}`);
    }
  }
  return json(result, { headers: response.headers });
};
