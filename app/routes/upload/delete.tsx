import type { DataFunctionArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { makeDomainFunction } from "remix-domains";
import { performMutation } from "remix-forms";
import { z } from "zod";
import { createAuthClient, getSessionUserOrThrow } from "~/auth.server";
import { fileUploadSchema } from "~/lib/utils/schemas";
import {
  removeImageFromEvent,
  removeImageFromOrganization,
  removeImageFromProfile,
  removeImageFromProject,
} from "./delete.server";
import { deriveOrganizationMode } from "../organization/$slug/utils.server";
import { invariantResponse } from "~/lib/utils/response";
import { deriveEventMode } from "../event/utils.server";
import { deriveProjectMode } from "../project/utils.server";
import { deriveProfileMode } from "../profile/$username/utils.server";

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
  // TODO: fix type issue
  const sessionUser = await getSessionUserOrThrow(environment.authClient);

  try {
    if (subject === "user") {
      const username = slug;
      const mode = await deriveProfileMode(sessionUser, username);
      invariantResponse(mode === "owner", "Not privileged", { status: 403 });
      await removeImageFromProfile(sessionUser.id, uploadKey);
    }

    if (subject === "organization") {
      const mode = await deriveOrganizationMode(sessionUser, slug);
      invariantResponse(mode === "admin", "Not privileged", { status: 403 });
      await removeImageFromOrganization(slug, uploadKey);
    }

    if (subject === "event") {
      const mode = await deriveEventMode(sessionUser, slug);
      invariantResponse(mode === "admin", "Not privileged", { status: 403 });
      await removeImageFromEvent(slug, uploadKey);
    }

    if (subject === "project") {
      const mode = await deriveProjectMode(sessionUser, slug);
      invariantResponse(mode === "admin", "Not privileged", { status: 403 });
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
