import { ActionFunction, json, LoaderFunction } from "remix";
import { badRequest } from "remix-utils";
import { getImageURL } from "~/images.server";
import { handleAuthorization } from "~/lib/auth/handleAuth";
import { upload } from "./uploadHandler.server";

export const loader: LoaderFunction = ({ request }) => {
  if (request.method !== "POST") {
    throw badRequest({
      message: `I'm a teapot. This endpoint is only for method POST uploads`,
    });
  }

  return null;
};

export const action: ActionFunction = async ({
  request,
  params: { username },
}) => {
  handleAuthorization(request, username ?? "");
  const formData = await upload(request);

  let images: { avatar?: string; background?: string } = {};

  const avatarPublicURL = formData.get("avatar");
  if (avatarPublicURL !== null && typeof avatarPublicURL === "string") {
    images.avatar = getImageURL(avatarPublicURL, {
      resize: { type: "fill", width: 144, height: 144 },
    });
  }
  const backgroundPublicURL = formData.get("background");
  if (backgroundPublicURL !== null && typeof backgroundPublicURL === "string") {
    images.background = getImageURL(backgroundPublicURL, {
      resize: { type: "fit", width: 1488, height: 480 },
    });
  }

  return json(images, { statusText: "success", status: 200 });
};
