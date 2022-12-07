import type { ActionFunction } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { makeDomainFunction } from "remix-domains";
import type { PerformMutation } from "remix-forms";
import { performMutation } from "remix-forms";
import { notFound, serverError } from "remix-utils";
import type { Schema, z } from "zod";
import { createAuthClient, getSessionUserOrThrow } from "~/auth.server";
import { getOrganizationBySlug } from "~/organization.server";
import { deriveMode, getEvent } from "../event/$slug/utils.server";
import {
  removeImageFromEvent,
  removeImageFromOrganization,
  removeImageFromProfile,
} from "./delete.server";
import { environment, schema } from "./schema";

const mutation = makeDomainFunction(
  schema,
  environment
)(async (values, { supabaseClient }) => {
  const { subject, slug, uploadKey } = values;

  let success = true;

  const sessionUser = await getSessionUserOrThrow(supabaseClient);

  try {
    if (subject === "user") {
      await removeImageFromProfile(sessionUser.id, uploadKey);
    }

    if (subject === "organization") {
      const organisation = await getOrganizationBySlug(slug);
      if (organisation === null) {
        throw serverError({ message: "Unknown organization." });
      }

      const isPriviliged = organisation?.teamMembers.some(
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

type ActionData = PerformMutation<z.infer<Schema>, z.infer<typeof schema>>;

export const action: ActionFunction = async ({ request }) => {
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

  // TODO: fix type issue or let it be fixed by aligning with upload documents
  return json<ActionData>(result, { headers: response.headers });
};
