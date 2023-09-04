import type { DataFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { InputError, makeDomainFunction } from "remix-domains";
import { performMutation } from "remix-forms";
import { z } from "zod";
import { createAuthClient, getSessionUserOrThrow } from "~/auth.server";
import { invariantResponse } from "~/lib/utils/response";
import { getParamValueOrThrow } from "~/lib/utils/routes";
import { deriveProjectMode } from "~/routes/project/utils.server";
import {
  addTeamMemberToProject,
  getProfileById,
  getProjectBySlug,
} from "./add-member.server";

const schema = z.object({
  userId: z.string().uuid(),
  profileId: z.string(),
});

const environmentSchema = z.object({
  projectSlug: z.string(),
});

export const addMemberSchema = schema;

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

  const alreadyMember = profile.teamMemberOfProjects.some((relation) => {
    return relation.project.slug === environment.projectSlug;
  });

  if (alreadyMember) {
    throw new InputError(
      "Das Profil unter diesem Namen ist bereits Mitglied Eures Projekts.",
      "profileId"
    );
  }

  return {
    ...values,
    firstName: profile.firstName,
    lastName: profile.lastName,
  };
});

export const action = async (args: DataFunctionArgs) => {
  const { request, params } = args;
  const response = new Response();
  const authClient = createAuthClient(request, response);
  const sessionUser = await getSessionUserOrThrow(authClient);
  const slug = getParamValueOrThrow(params, "slug");
  const mode = await deriveProjectMode(sessionUser, slug);
  invariantResponse(mode === "admin", "Not privileged", { status: 403 });

  const result = await performMutation({
    request,
    schema,
    mutation,
    environment: {
      projectSlug: slug,
    },
  });

  if (result.success) {
    const project = await getProjectBySlug(slug);
    invariantResponse(project, "Project not found", { status: 404 });
    await addTeamMemberToProject(project.id, result.data.profileId);
    return json(
      {
        message: `Ein neues Teammitglied mit dem Namen "${result.data.firstName} ${result.data.lastName}" wurde hinzugefügt.`,
      },
      { headers: response.headers }
    );
  }

  return json(result, { headers: response.headers });
};
