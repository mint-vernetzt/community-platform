import { ActionFunction, json, LoaderFunction, useLoaderData } from "remix";
import ImageCropper from "~/components/ImageCropper/ImageCropper";

import styles from "react-image-crop/dist/ReactCrop.css";
import { notFound } from "remix-utils";
import { getProfileByUsername } from "~/profile.server";
import { getPublicURL } from "~/storage.server";
import { getImageURL } from "~/images.server";

export function links() {
  return [{ rel: "stylesheet", href: styles }];
}

export const loader: LoaderFunction = async (args) => {
  const profile = await getProfileByUsername("manuelportela");
  if (profile === null) {
    throw notFound({ message: "Not found" });
  }

  let images: {
    avatar?: string;
  } = {};

  if (profile.avatar !== null) {
    const publicURL = getPublicURL(profile.avatar);
    if (publicURL !== null) {
      images.avatar = getImageURL(publicURL, {
        resize: { type: "fill", width: 244, height: 244 },
      });
    }
  }

  return json({ images });
};

export const action: ActionFunction = async (args) => {
  return null;
};

export default function Index() {
  const loaderData = useLoaderData();
  const avatar = loaderData.images.avatar;

  return (
    <ImageCropper
      uploadUrl="/profile/manuelportela/upload"
      uploadKey="avatar"
      image={avatar}
      aspect={1}
    />
  );
}
