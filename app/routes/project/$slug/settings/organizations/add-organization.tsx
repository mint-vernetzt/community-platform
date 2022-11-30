import type { ActionFunction } from "@remix-run/node";
import { InputError, makeDomainFunction } from "remix-domains";
import type { PerformMutation } from "remix-forms";
import { performMutation } from "remix-forms";
import type { Schema } from "zod";
import { z } from "zod";
import { getUserByRequestOrThrow } from "~/auth.server";
import { getOrganizationByName } from "~/routes/organization/$slug/settings/utils.server";
import { checkIdentityOrThrow } from "~/routes/project/utils.server";
import { getProjectByIdOrThrow } from "../../utils.server";
import {
  checkOwnershipOrThrow,
  checkSameProjectOrThrow,
} from "../utils.server";
import { connectOrganizationToProject } from "./utils.server";

const schema = z.object({
  userId: z.string(),
  projectId: z.string(),
  organizationName: z.string(),
});

export const addOrganizationSchema = schema;

const mutation = makeDomainFunction(schema)(async (values) => {
  const organization = await getOrganizationByName(values.organizationName);
  if (organization === null) {
    throw new InputError(
      "Es existiert noch keine Organisation mit diesem Namen.",
      "organizationName"
    );
  }
  const alreadyMember = organization.responsibleForProject.some((entry) => {
    return entry.project.id === values.projectId;
  });
  if (alreadyMember) {
    throw new InputError(
      "Die Organisation mit diesem Namen ist bereits für Euer Projekt verantwortlich.",
      "organizationName"
    );
  }
  return values;
});

export type ActionData = PerformMutation<
  z.infer<Schema>,
  z.infer<typeof schema>
>;

export const action: ActionFunction = async (args) => {
  const { request } = args;
  const currentUser = await getUserByRequestOrThrow(request);
  await checkIdentityOrThrow(request, currentUser);

  const result = await performMutation({ request, schema, mutation });

  if (result.success === true) {
    const project = await getProjectByIdOrThrow(result.data.projectId);
    await checkOwnershipOrThrow(project, currentUser);
    await checkSameProjectOrThrow(request, project.id);
    const organization = await getOrganizationByName(
      result.data.organizationName
    );
    if (organization !== null) {
      await connectOrganizationToProject(project.id, organization.id);
    }
  }
  return result;
};
