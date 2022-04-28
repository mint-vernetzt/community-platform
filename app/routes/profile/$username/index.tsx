import { getUser } from "~/auth.server";
import { json, LoaderFunction, useLoaderData } from "remix";
import { badRequest, notFound } from "remix-utils";
import { Profile } from "@prisma/client";
import { getProfileByUsername } from "~/profile.server";

type Mode = "anon" | "authenticated" | "owner";

type ProfileLoaderData = {
  mode: Mode;
  data: Partial<Profile>;
};

export const loader: LoaderFunction = async (
  args
): Promise<Response | ProfileLoaderData> => {
  const { request, params } = args;

  const { username } = params;

  if (typeof username !== "string" || username === "") {
    throw badRequest({ message: "Username must be provided" });
  }

  const profile = await getProfileByUsername(username);
  if (profile === null) {
    throw notFound({ message: "Not found" });
  }

  let mode: Mode;
  const currentUser = await getUser(request);

  if (currentUser === null) {
    mode = "anon";
  } else if (currentUser.user_metadata.username === username) {
    mode = "owner";
  } else {
    mode = "authenticated";
  }

  const publicFields = [
    "id",
    "username",
    "firstName",
    "lastName",
    "academicTitle",
    ...profile.publicFields,
  ];

  let data: Partial<Profile> = {};
  let key: keyof Profile;
  for (key in profile) {
    if (mode !== "anon" || publicFields.includes(key)) {
      // @ts-ignore <-- Partials allow undefined, Profile not
      data[key] = profile[key];
    }
  }

  return json({ mode, data });
};

export default function Index() {
  const loaderData = useLoaderData<ProfileLoaderData>();

  return <pre>{JSON.stringify(loaderData, null, 2)}</pre>;
}
