import type { DataFunctionArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { makeDomainFunction } from "remix-domains";
import { performMutation } from "remix-forms";
import { notFound, serverError } from "remix-utils";
import { createAuthClient, getSessionUserOrThrow } from "~/auth.server";
import { deriveMode, getEvent } from "../event/$slug/utils.server";
import {
  getOrganizationBySlug,
  removeImageFromEvent,
  removeImageFromOrganization,
  removeImageFromProfile,
} from "./delete.server";
import { environment, schema } from "./schema";

const mutation = makeDomainFunction(
  schema,
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
      const event = await getEvent(slug);
      if (event === null) {
        throw notFound({ message: `Event not found` });
      }
      const mode = await deriveMode(event, sessionUser);
      if (mode !== "owner") {
        throw serverError({ message: "Not allowed." });
      }
      await removeImageFromEvent(slug, uploadKey);
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
    schema,
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
