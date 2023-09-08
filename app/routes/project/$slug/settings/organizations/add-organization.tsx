import type { DataFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { InputError, makeDomainFunction } from "remix-domains";
import { performMutation } from "remix-forms";
import { z } from "zod";
import { createAuthClient, getSessionUserOrThrow } from "~/auth.server";
import { checkFeatureAbilitiesOrThrow } from "~/lib/utils/application";
import { invariantResponse } from "~/lib/utils/response";
import { getParamValueOrThrow } from "~/lib/utils/routes";
import { deriveProjectMode } from "~/routes/project/utils.server";
import { getOrganizationById } from "../utils.server";
import { connectOrganizationToProject, getProjectBySlug } from "./utils.server";

const schema = z.object({
  organizationId: z.string(),
});

export const addOrganizationSchema = schema;

const environmentSchema = z.object({
  slug: z.string(),
});

const mutation = makeDomainFunction(
  schema,
  environmentSchema
)(async (values, environment) => {
  const organization = await getOrganizationById(values.organizationId);
  if (organization === null) {
    throw new InputError(
      "Es existiert noch keine Organisation mit diesem Namen.",
      "organizationId"
    );
  }
  const alreadyResponsible = organization.responsibleForProject.some(
    (entry) => {
      return entry.project.slug === environment.slug;
    }
  );
  if (alreadyResponsible) {
    throw new InputError(
      "Die Organisation mit diesem Namen ist bereits für Euer Projekt verantwortlich.",
      "organizationId"
    );
  }
  return {
    ...values,
    name: organization.name,
  };
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

  const result = await performMutation({
    request,
    schema,
    mutation,
    environment: { slug: slug },
  });

  if (result.success === true) {
    const project = await getProjectBySlug(slug);
    invariantResponse(project, "Project not Found", { status: 404 });
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
