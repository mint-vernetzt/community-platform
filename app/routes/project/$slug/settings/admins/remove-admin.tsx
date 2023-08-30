import type { DataFunctionArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { makeDomainFunction } from "remix-domains";
import { performMutation } from "remix-forms";
import { z } from "zod";
import { createAuthClient, getSessionUserOrThrow } from "~/auth.server";
import { invariantResponse } from "~/lib/utils/response";
import { getParamValueOrThrow } from "~/lib/utils/routes";
import {
  getProjectBySlug,
  removeAdminFromProject,
} from "./remove-admin.server";
import { isProjectAdmin } from "../utils.server";

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
  const sessionUser = await getSessionUserOrThrow(authClient);
  const project = await getProjectBySlug(slug);
  invariantResponse(project, "Project not found", { status: 404 });
  const isAdmin = await isProjectAdmin(slug, sessionUser);
  invariantResponse(isAdmin, "Not privileged", { status: 403 });

  const result = await performMutation({
    request,
    schema,
    mutation,
    environment: { adminCount: project._count.admins },
  });

  if (result.success === true) {
    await removeAdminFromProject(project.id, result.data.profileId);
    if (sessionUser.id === result.data.profileId) {
      return redirect(`/project/${slug}`);
    }
  }
  return json(result, { headers: response.headers });
};
