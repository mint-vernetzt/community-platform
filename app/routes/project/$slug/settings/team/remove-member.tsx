import type { ActionFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import { makeDomainFunction } from "remix-domains";
import type { PerformMutation } from "remix-forms";
import { performMutation } from "remix-forms";
import type { Schema } from "zod";
import { z } from "zod";
import { createAuthClient, getSessionUserOrThrow } from "~/auth.server";
import { invariantResponse } from "~/lib/utils/response";
import { getParamValueOrThrow } from "~/lib/utils/routes";
import {
  getProjectBySlug,
  removeTeamMemberFromProject,
} from "./remove-member.server";
import { isProjectAdmin } from "../utils.server";

const schema = z.object({
  userId: z.string().uuid(),
  profileId: z.string().uuid(),
});

export const removeMemberSchema = schema;

const environmentSchema = z.object({
  memberCount: z.number(),
});

const mutation = makeDomainFunction(
  schema,
  environmentSchema
)(async (values, environment) => {
  if (environment.memberCount === 1) {
    throw "Es muss immer ein Teammitglied geben. Bitte füge zuerst jemand anderen als Teammitglied hinzu.";
  }

  return values;
});

export type ActionData = PerformMutation<
  z.infer<Schema>,
  z.infer<typeof schema>
>;

export const action: ActionFunction = async (args) => {
  const { request, params } = args;
  const response = new Response();
  const authClient = createAuthClient(request, response);
  const sessionUser = await getSessionUserOrThrow(authClient);
  const slug = getParamValueOrThrow(params, "slug");
  const isAdmin = await isProjectAdmin(slug, sessionUser);
  invariantResponse(isAdmin, "Not privileged", { status: 403 });
  const project = await getProjectBySlug(slug);
  invariantResponse(project, "Project not found", { status: 404 });

  const result = await performMutation({
    request,
    schema,
    mutation,
    environment: { memberCount: project._count.teamMembers },
  });

  if (result.success === true) {
    await removeTeamMemberFromProject(project.id, result.data.profileId);
  }

  return json<ActionData>(result, { headers: response.headers });
};
