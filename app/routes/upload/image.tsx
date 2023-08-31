import type { DataFunctionArgs } from "@remix-run/node";
import type { User } from "@supabase/supabase-js";
import { badRequest, notFound, serverError } from "remix-utils";
import { createAuthClient, getSessionUserOrThrow } from "~/auth.server";
import { invariantResponse } from "~/lib/utils/response";
import { deriveMode as deriveEventMode } from "../event/$slug/utils.server";
import { deriveMode as deriveProjectMode } from "../project/$slug/utils.server";
import {
  getEventBySlug,
  getOrganizationBySlug,
  getProjectBySlug,
} from "./image.server";
import {
  updateEventBackgroundImage,
  updateOrganizationProfileImage,
  updateProjectBackgroundImage,
  updateUserProfileImage,
  upload,
} from "./uploadHandler.server";
import { uploadKeys, type Subject } from "./utils.server";

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

    const organization = await getOrganizationBySlug(slug);
    if (organization === null) {
      throw serverError({ message: "Unknown organization." });
    }

    const isPriviliged = organization.teamMembers.some(
      (member) => member.profileId === profileId && member.isPrivileged
    );

    if (!isPriviliged) {
      throw serverError({ message: "Not allowed." });
    }
  }
  if (subject === "event") {
    const event = await getEventBySlug(slug);
    if (event === null) {
      throw notFound({ message: `Event not found` });
    }
    const mode = await deriveEventMode(event, sessionUser);
    if (mode !== "owner") {
      throw serverError({ message: "Not allowed." });
    }
  }
  if (subject === "project") {
    const project = await getProjectBySlug(slug);
    invariantResponse(project, "Project not Found", { status: 404 });
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

  await handleAuth(profileId, subject, slug, sessionUser);

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
