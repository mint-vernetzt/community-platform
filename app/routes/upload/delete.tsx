import type { DataFunctionArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { makeDomainFunction } from "remix-domains";
import { performMutation } from "remix-forms";
import { notFound, serverError } from "remix-utils";
import { z } from "zod";
import { createAuthClient, getSessionUserOrThrow } from "~/auth.server";
import { fileUploadSchema } from "~/lib/utils/schemas";
import { deriveMode } from "../event/$slug/utils.server";
import { deriveMode as deriveProjectMode } from "../project/$slug/utils.server";
import {
  getEventBySlug,
  getOrganizationBySlug,
  getProjectBySlug,
  removeImageFromEvent,
  removeImageFromOrganization,
  removeImageFromProfile,
  removeImageFromProject,
} from "./delete.server";

const environment = z.object({
  authClient: z.unknown(),
  // authClient: z.instanceof(SupabaseClient),
});

const mutation = makeDomainFunction(
  fileUploadSchema,
  environment
)(async (values, environment) => {
  const { subject, slug, uploadKey } = values;

  let success = true;

  const sessionUser = await getSessionUserOrThrow(environment.authClient);

  try {
    if (subject === "user") {
      await removeImageFromProfile(sessionUser.id, uploadKey);
    }

    if (subject === "organization") {
      const organization = await getOrganizationBySlug(slug);
      if (organization === null) {
        throw serverError({ message: "Unknown organization." });
      }

      const isPriviliged = organization.teamMembers.some(
        (member) => member.profileId === sessionUser.id && member.isPrivileged
      );

      if (isPriviliged) {
        await removeImageFromOrganization(slug, uploadKey);
      }
    }

    if (subject === "event") {
      const event = await getEventBySlug(slug);
      if (event === null) {
        throw notFound({ message: `Event not found` });
      }
      const mode = await deriveMode(event, sessionUser);
      if (mode !== "owner") {
        throw serverError({ message: "Not allowed." });
      }
      await removeImageFromEvent(slug, uploadKey);
    }

    if (subject === "project") {
      const project = await getProjectBySlug(slug);
      if (project === null) {
        throw notFound({ message: `Project not found` });
      }
      const mode = await deriveProjectMode(project, sessionUser);
      if (mode !== "owner") {
        throw serverError({ message: "Not allowed." });
      }
      await removeImageFromProject(slug, uploadKey);
    }
  } catch (e) {
    success = false;
  }

  return { success };
});

export const action = async ({ request }: DataFunctionArgs) => {
  const response = new Response();

  const authClient = createAuthClient(request, response);
  const formData = await request.clone().formData();
  const redirectUrl = formData.get("redirect")?.toString();

  const result = await performMutation({
    request,
    schema: fileUploadSchema,
    mutation,
    environment: {
      authClient: authClient,
    },
  });

  if (result.success && redirectUrl !== undefined) {
    return redirect(redirectUrl, { headers: response.headers });
  }

  return json(result, { headers: response.headers });
};
