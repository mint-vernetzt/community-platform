import {
  ActionFunction,
  json,
  LoaderFunction,
  useActionData,
  useParams,
} from "remix";
import { badRequest, forbidden } from "remix-utils";
import {
  getProfileByUsername,
  updateProfileByUsername,
} from "../../../../profile.server";

import { getUser } from "../../../../auth.server";
import { Profile } from "@prisma/client";

export async function handleAuthorization(request: Request, username: string) {
  if (typeof username !== "string" || username === "") {
    throw badRequest({ message: "username must be provided" });
  }
  const currentUser = await getUser(request);

  if (currentUser?.user_metadata.username !== username) {
    throw forbidden({ message: "not allowed" });
  }
}

export const loader: LoaderFunction = async ({ request, params }) => {
  const username = params.username ?? ""; //?

  await handleAuthorization(request, username);

  const profileData = await getProfileByUsername(username);

  return json(profileData);
};

export const action: ActionFunction = async ({ request, params }) => {
  const username = params.username ?? ""; //?
  await handleAuthorization(request, username);

  const intention = params.intention;

  const formData = await request.formData();
  const profileData: Partial<Profile> = {
    firstName: formData.get("firstName") as string,
  };

  if (intention === "save") {
    await updateProfileByUsername(username, profileData);
  }

  return null;
};

export default function Index() {
  let { username } = useParams();
  let actionData = useActionData<Partial<Profile>>();

  return (
    <>
      Hello {username}
      <pre>{JSON.stringify(actionData, null, 2)}</pre>
    </>
  );
}
