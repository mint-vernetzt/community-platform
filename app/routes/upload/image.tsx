import { ActionFunction, LoaderFunction } from "remix";
import { badRequest, serverError } from "remix-utils";
import { getUserByRequest } from "~/auth.server";
import { getOrganizationBySlug } from "~/organization.server";
import { Subject, uploadKeys } from "./schema";
import {
  updateOrganizationProfileImage,
  updateUserProfileImage,
  upload,
} from "./uploadHandler.server";

export const loader: LoaderFunction = ({ request }) => {
  if (request.method !== "POST") {
    throw badRequest({
      message: `I'm a teapot. This endpoint is only for method POST uploads`,
    });
  }

  return null;
};

async function handleAuth(profileId: string, subject: Subject, slug: string) {
  if (subject === "organisation") {
    if (slug === "") {
      throw serverError({ message: "Unknown organization." });
    }

    const organisation = await getOrganizationBySlug(slug);
    if (organisation === null) {
      throw serverError({ message: "Unknown organization." });
    }

    const isPriviliged = organisation?.teamMembers.some(
      (member) => member.profileId === profileId && member.isPrivileged
    );

    if (!isPriviliged) {
      throw serverError({ message: "Not allowed." });
    }
  }
}

export const action: ActionFunction = async ({ request }) => {
  const sessionUser = await getUserByRequest(request);
  if (!sessionUser?.id) {
    throw serverError({ message: "You must be logged in." });
  }
  const profileId = sessionUser.id;

  const formData = await upload(request);
  const subject = formData.get("subject") as Subject;
  const slug = formData.get("slug") as string;

  handleAuth(profileId, subject, slug);

  const formDataUploadKey = formData.get("uploadKey") as string;
  const name = uploadKeys.filter((key) => key === formDataUploadKey)[0];
  const path = formData.get(name) as string;
  console.table({ name, path, profileId, subject });
  if (name !== undefined && path !== null && profileId !== null) {
    if (subject === "user") {
      await updateUserProfileImage(profileId, name, path);
    }

    if (subject === "organisation") {
      await updateOrganizationProfileImage(slug, name, path);
    }
  }

  return null;
};
