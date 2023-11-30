import type { DataFunctionArgs } from "@remix-run/node";
import type { User } from "@supabase/supabase-js";
import { badRequest, serverError } from "remix-utils";
import { createAuthClient, getSessionUserOrThrow } from "~/auth.server";
import { invariantResponse } from "~/lib/utils/response";
import { deriveEventMode } from "../event/utils.server";
import { deriveOrganizationMode } from "../organization/$slug/utils.server";
import { deriveProjectMode } from "../project/utils.server";
import {
  updateEventBackgroundImage,
  updateOrganizationProfileImage,
  updateProjectBackgroundImage,
  updateUserProfileImage,
  upload,
} from "./uploadHandler.server";
import { uploadKeys, type Subject } from "./utils.server";
import { deriveProfileMode } from "../profile/$username/utils.server";
import i18next from "~/i18next.server";
import { TFunction } from "i18next";

export const handle = {
  i18n: ["routes/upload/image"],
};

export const loader = async ({ request }: DataFunctionArgs) => {
  const response = new Response();

  const t = await i18next.getFixedT(request, ["routes/upload/image"]);
  createAuthClient(request, response);

  if (request.method !== "POST") {
    throw badRequest({
      message: t("error.teapot"),
    });
  }

  return response;
};

async function handleAuth(
  subject: Subject,
  slug: string,
  sessionUser: User,
  t: TFunction
) {
  if (subject === "user") {
    const username = slug;
    const mode = await deriveProfileMode(sessionUser, username);
    invariantResponse(mode === "owner", t("error.notPrivileged"), {
      status: 403,
    });
  }
  if (subject === "organization") {
    const mode = await deriveOrganizationMode(sessionUser, slug);
    invariantResponse(mode === "admin", t("error.notPrivileged"), {
      status: 403,
    });
  }
  if (subject === "event") {
    const mode = await deriveEventMode(sessionUser, slug);
    invariantResponse(mode === "admin", t("error.notPrivileged"), {
      status: 403,
    });
  }
  if (subject === "project") {
    const mode = await deriveProjectMode(sessionUser, slug);
    invariantResponse(mode === "admin", t("error.notPrivileged"), {
      status: 403,
    });
  }
}

export const action = async ({ request }: DataFunctionArgs) => {
  const response = new Response();

  const authClient = createAuthClient(request, response);
  const t = await i18next.getFixedT(request, ["routes/upload/image"]);

  const sessionUser = await getSessionUserOrThrow(authClient);
  const profileId = sessionUser.id;

  const formData = await upload(authClient, request, "images");
  // TODO: can this type assertion be removed and proofen by code?
  const subject = formData.get("subject") as Subject;
  const slug = formData.get("slug") as string;

  await handleAuth(subject, slug, sessionUser, t);

  const formDataUploadKey = formData.get("uploadKey");
  const name = uploadKeys.filter((key) => key === formDataUploadKey)[0];
  // TODO: can this type assertion be removed and proofen by code?
  const uploadHandlerResponseJSON = formData.get(name as string);

  if (uploadHandlerResponseJSON === null) {
    throw serverError({ message: t("error.serverError") });
  }
  const uploadHandlerResponse: {
    buffer: Buffer;
    path: string;
    filename: string;
    mimeType: string;
    sizeInBytes: number;
    // TODO: can this type assertion be removed and proofen by code?
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
