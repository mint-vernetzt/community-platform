import type { DataFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { makeDomainFunction } from "remix-domains";
import { performMutation } from "remix-forms";
import { z } from "zod";
import { createAuthClient, getSessionUserOrThrow } from "~/auth.server";
import { checkFeatureAbilitiesOrThrow } from "~/lib/utils/application";
import { invariantResponse } from "~/lib/utils/response";
import { checkIdentityOrThrow } from "~/routes/project/utils.server";
import {
  checkOwnershipOrThrow,
  checkSameProjectOrThrow,
} from "../utils.server";
import {
  disconnectOrganizationFromProject,
  getProjectById,
} from "./utils.server";

const schema = z.object({
  userId: z.string(),
  projectId: z.string(),
  organizationId: z.string(),
});

export const removeOrganizationSchema = schema;

const mutation = makeDomainFunction(schema)(async (values) => {
  return values;
});

export const action = async (args: DataFunctionArgs) => {
  const { request } = args;
  const response = new Response();

  const authClient = createAuthClient(request, response);
  const sessionUser = await getSessionUserOrThrow(authClient);
  await checkIdentityOrThrow(request, sessionUser);
  await checkFeatureAbilitiesOrThrow(authClient, "projects");

  const result = await performMutation({ request, schema, mutation });

  if (result.success === true) {
    const project = await getProjectById(result.data.projectId);
    invariantResponse(project, "Project not Found", { status: 404 });
    await checkOwnershipOrThrow(project, sessionUser);
    await checkSameProjectOrThrow(request, project.id);
    await disconnectOrganizationFromProject(
      project.id,
      result.data.organizationId
    );
  }
  return json(result, { headers: response.headers });
};
