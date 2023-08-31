import type { DataFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { InputError, makeDomainFunction } from "remix-domains";
import { performMutation } from "remix-forms";
import { z } from "zod";
import { createAuthClient, getSessionUserOrThrow } from "~/auth.server";
import { checkFeatureAbilitiesOrThrow } from "~/lib/utils/application";
import { invariantResponse } from "~/lib/utils/response";
import { checkIdentityOrThrow } from "~/routes/project/utils.server";
import {
  checkOwnershipOrThrow,
  checkSameProjectOrThrow,
  getOrganizationById,
} from "../utils.server";
import { connectOrganizationToProject, getProjectById } from "./utils.server";

const schema = z.object({
  userId: z.string(),
  projectId: z.string(),
  id: z.string(),
});

export const addOrganizationSchema = schema;

const mutation = makeDomainFunction(schema)(async (values) => {
  const organization = await getOrganizationById(values.id);
  if (organization === null) {
    throw new InputError(
      "Es existiert noch keine Organisation mit diesem Namen.",
      "id"
    );
  }
  const alreadyMember = organization.responsibleForProject.some((entry) => {
    return entry.project.id === values.projectId;
  });
  if (alreadyMember) {
    throw new InputError(
      "Die Organisation mit diesem Namen ist bereits für Euer Projekt verantwortlich.",
      "id"
    );
  }
  return {
    ...values,
    name: organization.name,
    slug: organization.slug,
    organizationId: organization.id,
  };
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
    await connectOrganizationToProject(project.id, result.data.organizationId);
    return json(
      {
        message: `Die Organisation "${result.data.name}" ist jetzt verantwortlich für Euer Projekt.`,
      },
      { headers: response.headers }
    );
  }
  return json(result, { headers: response.headers });
};
