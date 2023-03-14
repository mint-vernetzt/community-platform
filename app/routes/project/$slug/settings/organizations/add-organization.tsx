import type { ActionFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import { InputError, makeDomainFunction } from "remix-domains";
import type { PerformMutation } from "remix-forms";
import { performMutation } from "remix-forms";
import type { Schema } from "zod";
import { z } from "zod";
import { createAuthClient, getSessionUserOrThrow } from "~/auth.server";
import { getOrganizationByName } from "~/routes/organization/$slug/settings/utils.server";
import { checkIdentityOrThrow } from "~/routes/project/utils.server";
import { getProjectByIdOrThrow } from "../../utils.server";
import {
  checkOwnershipOrThrow,
  checkSameProjectOrThrow,
  getOrganizationById,
} from "../utils.server";
import { connectOrganizationToProject } from "./utils.server";

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
  return { ...values, name: organization.name };
});

export type SuccessActionData = {
  message: string;
};

export type FailureActionData = PerformMutation<
  z.infer<Schema>,
  z.infer<typeof schema>
>;

export const action: ActionFunction = async (args) => {
  const { request } = args;
  const response = new Response();

  const authClient = createAuthClient(request, response);
  const sessionUser = await getSessionUserOrThrow(authClient);
  await checkIdentityOrThrow(request, sessionUser);

  const result = await performMutation({ request, schema, mutation });

  if (result.success === true) {
    const project = await getProjectByIdOrThrow(result.data.projectId);
    await checkOwnershipOrThrow(project, sessionUser);
    await checkSameProjectOrThrow(request, project.id);
    const organization = await getOrganizationByName(result.data.name);
    if (organization !== null) {
      await connectOrganizationToProject(project.id, organization.id);
    }
    return json<SuccessActionData>(
      {
        message: `Die Organisation "${result.data.name}" ist jetzt verantwortlich für Euer Projekt.`,
      },
      { headers: response.headers }
    );
  }
  return json<FailureActionData>(result, { headers: response.headers });
};
