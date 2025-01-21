import { type ActionFunctionArgs } from "@remix-run/node";
import { createAuthClient, getSessionUserOrThrow } from "~/auth.server";
import { detectLanguage } from "~/i18n.server";
import {
  updateEventBackgroundImage,
  updateOrganizationProfileImage,
  updateProjectBackgroundImage,
  updateUserProfileImage,
  upload,
} from "./uploadHandler.server";
import { uploadKeys, type Subject } from "./utils.server";
import { handleAuth } from "./image.server";
import { languageModuleMap } from "~/locales/.server";
import { invariantResponse } from "~/lib/utils/response";

export const action = async ({ request }: ActionFunctionArgs) => {
  const { authClient } = createAuthClient(request);

  const language = await detectLanguage(request);
  const locales = languageModuleMap[language]["upload/image"];
  const sessionUser = await getSessionUserOrThrow(authClient);
  const profileId = sessionUser.id;

  const formData = await upload(authClient, request, "images");
  // TODO: can this type assertion be removed and proofen by code?
  const subject = formData.get("subject") as Subject;
  const slug = formData.get("slug") as string;

  await handleAuth(subject, slug, sessionUser, locales);

  const formDataUploadKey = formData.get("uploadKey");
  const name = uploadKeys.filter((key) => key === formDataUploadKey)[0];
  // TODO: can this type assertion be removed and proofen by code?
  const uploadHandlerResponseJSON = formData.get(name as string);

  if (uploadHandlerResponseJSON === null) {
    invariantResponse(false, locales.error.serverError, { status: 500 });
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

  return null;
};
