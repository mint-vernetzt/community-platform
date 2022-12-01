import { ActionFunction } from "@remix-run/node";
import { makeDomainFunction } from "remix-domains";
import { formAction } from "remix-forms";
import { notFound, serverError } from "remix-utils";
import { getUserByRequest } from "~/auth.server";
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
)(async (values, { request }) => {
  const { subject, slug, uploadKey } = values;

  let success = true;

  const sessionUser = await getUserByRequest(request);
  if (!sessionUser?.id) {
    throw serverError({ message: "You must be logged in." });
  }

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

export const action: ActionFunction = async ({ request }) => {
  const formData = await request.clone().formData();
  const redirect = formData.get("redirect")?.toString();

  return formAction({
    request,
    schema,
    mutation,
    environment: {
      request: request,
    },
    successPath: redirect,
  });
};
