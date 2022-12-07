import type { ActionFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import { makeDomainFunction } from "remix-domains";
import type { PerformMutation } from "remix-forms";
import { performMutation } from "remix-forms";
import type { Schema } from "zod";
import { z } from "zod";
import { createAuthClient, getSessionUserOrThrow } from "~/auth.server";
import { checkIdentityOrThrow } from "~/routes/project/utils.server";
import { getProjectByIdOrThrow } from "../../utils.server";
import {
  checkOwnershipOrThrow,
  checkSameProjectOrThrow,
} from "../utils.server";
import { disconnectOrganizationFromProject } from "./utils.server";

const schema = z.object({
  userId: z.string(),
  projectId: z.string(),
  organizationId: z.string(),
});

export const removeOrganizationSchema = schema;

const mutation = makeDomainFunction(schema)(async (values) => {
  return values;
});

export type ActionData = PerformMutation<
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
    await disconnectOrganizationFromProject(
      project.id,
      result.data.organizationId
    );
  }
  return json<ActionData>(result, { headers: response.headers });
};
