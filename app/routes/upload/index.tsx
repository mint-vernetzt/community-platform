import { json, LoaderFunction, useLoaderData } from "remix";
import ImageCropper from "~/components/ImageCropper/ImageCropper";

import styles from "react-image-crop/dist/ReactCrop.css";
import { notFound } from "remix-utils";
import { getProfileByUsername } from "~/profile.server";
import { getPublicURL } from "~/storage.server";
import { getImageURL } from "~/images.server";
import { getSession } from "~/auth.server";

export function links() {
  return [{ rel: "stylesheet", href: styles }];
}

type LoaderData = {
  images: {
    avatar: string;
  };
  csrfToken: string;
};

export const loader: LoaderFunction = async ({ request }) => {
  const session = await getSession(request);
  const csrfToken = session.get("csrf");

  const profile = await getProfileByUsername("manuelportela");
  if (profile === null) {
    throw notFound({ message: "Not found" });
  }

  let images: {
    avatar?: string;
  } = {
    avatar: "",
  };

  if (profile.avatar !== null) {
    const publicURL = getPublicURL(profile.avatar);
    if (publicURL !== null) {
      images.avatar = getImageURL(publicURL, {
        resize: { type: "fill", width: 244, height: 244 },
      });
    }
  }

  return json({ images, csrfToken });
};

export default function Index() {
  const loaderData = useLoaderData<LoaderData>();
  const avatar = loaderData.images.avatar;

  return (
    <ImageCropper
      headline="Profilfoto"
      id="testcrop"
      deleteUrl="/profile/manuelportela/image/delete"
      uploadUrl="/profile/manuelportela/image/upload"
      uploadKey="avatar"
      image={avatar}
      aspect={1}
      minWidth={100}
      minHeight={100}
      handleCancel={() => document.location.reload()}
      username={"manuelportela"}
      csrfToken={loaderData.csrfToken}
      initials="MP"
    />
  );
}
