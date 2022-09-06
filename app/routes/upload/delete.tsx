import { ActionFunction } from "remix";
import { makeDomainFunction } from "remix-domains";
import { formAction } from "remix-forms";
import { serverError } from "remix-utils";
import { getUserByRequest } from "~/auth.server";
import { getOrganizationBySlug } from "~/organization.server";
import {
  removeImageFromOrganitaion,
  removeImageFromProfile,
} from "./delete.server";
import { environment, schema } from "./schema";

const mutation = makeDomainFunction(
  schema,
  environment
)(async (values, { profileId }) => {
  const { subject, slug, uploadKey } = values;

  let success = true;

  try {
    if (subject === "user") {
      await removeImageFromProfile(profileId, uploadKey);
    }

    if (subject === "organisation") {
      const organisation = await getOrganizationBySlug(slug);
      if (organisation === null) {
        throw serverError({ message: "Unknown organization." });
      }

      const isPriviliged = organisation?.teamMembers.some(
        (member) => member.profileId === profileId && member.isPrivileged
      );

      if (isPriviliged) {
        await removeImageFromOrganitaion(slug, uploadKey);
      }
    }
  } catch (e) {
    success = false;
  }

  return { success };
});

export const action: ActionFunction = async ({ request }) => {
  const sessionUser = await getUserByRequest(request);
  if (!sessionUser?.id) {
    throw serverError({ message: "You must be logged in." });
  }
  const formData = await request.clone().formData();
  const redirect = formData.get("redirect")?.toString();

  // TODO: CSRF -> await validateCSRFToken(clonedRequest);

  return formAction({
    request,
    schema,
    mutation,
    environment: {
      profileId: sessionUser.id,
    },
    successPath: redirect,
  });
};
