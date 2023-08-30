import type { DataFunctionArgs } from "@remix-run/node";
import type { User } from "@supabase/supabase-js";
import { badRequest, notFound, serverError } from "remix-utils";
import { createAuthClient, getSessionUserOrThrow } from "~/auth.server";
import { getOrganizationBySlug } from "~/organization.server";
import {
  deriveMode as deriveEventMode,
  getEvent,
} from "../event/$slug/utils.server";
import {
  deriveMode as deriveProjectMode,
  getProjectBySlugOrThrow,
} from "../project/$slug/utils.server";
import type { Subject } from "./schema";
import { uploadKeys } from "./schema";
import {
  updateEventBackgroundImage,
  updateOrganizationProfileImage,
  updateProjectBackgroundImage,
  updateUserProfileImage,
  upload,
} from "./uploadHandler.server";

export const loader = ({ request }: DataFunctionArgs) => {
  const response = new Response();

  createAuthClient(request, response);

  if (request.method !== "POST") {
    throw badRequest({
      message: `I'm a teapot. This endpoint is only for method POST uploads`,
    });
  }

  return response;
};

async function handleAuth(
  profileId: string,
  subject: Subject,
  slug: string,
  sessionUser: User
) {
  if (subject === "organization") {
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
  if (subject === "event") {
    const event = await getEvent(slug);
    if (event === null) {
      throw notFound({ message: `Event not found` });
    }
    const mode = await deriveEventMode(event, sessionUser);
    if (mode !== "owner") {
      throw serverError({ message: "Not allowed." });
    }
  }
  if (subject === "project") {
    const project = await getProjectBySlugOrThrow(slug);
    const mode = await deriveProjectMode(project, sessionUser);
    if (mode !== "owner") {
      throw serverError({ message: "Not allowed." });
    }
  }
}

export const action = async ({ request }: DataFunctionArgs) => {
  const response = new Response();

  const authClient = createAuthClient(request, response);

  const sessionUser = await getSessionUserOrThrow(authClient);
  const profileId = sessionUser.id;

  const formData = await upload(authClient, request, "images");

  const subject = formData.get("subject") as Subject;
  const slug = formData.get("slug") as string;

  handleAuth(profileId, subject, slug, sessionUser);

  const formDataUploadKey = formData.get("uploadKey");
  const name = uploadKeys.filter((key) => key === formDataUploadKey)[0];
  const uploadHandlerResponseJSON = formData.get(name as string);

  if (uploadHandlerResponseJSON === null) {
    throw serverError({ message: "Something went wrong on upload." });
  }
  const uploadHandlerResponse: {
    buffer: Buffer;
    path: string;
    filename: string;
    mimeType: string;
    sizeInBytes: number;
  } = JSON.parse(uploadHandlerResponseJSON as string);

  if (
    name !== undefined &&
    uploadHandlerResponse.path !== null &&
    profileId !== null
  ) {
    if (subject === "user") {
      await updateUserProfileImage(profileId, name, uploadHandlerResponse.path);
    }

    if (subject === "organization") {
      await updateOrganizationProfileImage(
        slug,
        name,
        uploadHandlerResponse.path
      );
    }

    if (subject === "event") {
      await updateEventBackgroundImage(slug, name, uploadHandlerResponse.path);
    }

    if (subject === "project") {
      await updateProjectBackgroundImage(
        slug,
        name,
        uploadHandlerResponse.path
      );
    }
  }

  return response;
};
