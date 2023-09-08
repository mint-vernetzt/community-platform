import type { DataFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { makeDomainFunction } from "remix-domains";
import { performMutation } from "remix-forms";
import { z } from "zod";
import { createAuthClient, getSessionUserOrThrow } from "~/auth.server";
import { invariantResponse } from "~/lib/utils/response";
import { getParamValueOrThrow } from "~/lib/utils/routes";
import { deriveProjectMode } from "~/routes/project/utils.server";
import {
  getProjectBySlug,
  removeTeamMemberFromProject,
} from "./remove-member.server";
import { checkFeatureAbilitiesOrThrow } from "~/lib/utils/application";

const schema = z.object({
  profileId: z.string(),
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

export const action = async (args: DataFunctionArgs) => {
  const { request, params } = args;
  const response = new Response();
  const slug = getParamValueOrThrow(params, "slug");
  const authClient = createAuthClient(request, response);
  const sessionUser = await getSessionUserOrThrow(authClient);
  const mode = await deriveProjectMode(sessionUser, slug);
  invariantResponse(mode === "admin", "Not privileged", { status: 403 });
  await checkFeatureAbilitiesOrThrow(authClient, "projects");
  const project = await getProjectBySlug(slug);
  invariantResponse(project, "Project not found", { status: 404 });
  console.log(project);
  const result = await performMutation({
    request,
    schema,
    mutation,
    environment: { memberCount: project._count.teamMembers },
  });

  if (result.success === true) {
    await removeTeamMemberFromProject(project.id, result.data.profileId);
  }

  return json(result, { headers: response.headers });
};
