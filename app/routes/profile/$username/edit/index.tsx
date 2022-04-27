import { ActionFunction, json, LoaderFunction, useParams } from "remix";
import { badRequest, forbidden, unauthorized } from "remix-utils";
import { getProfileByUsername } from "../../../../profile.server";

import { getUser } from "../../../../auth.server";

export const loader: LoaderFunction = async (args) => {
  const { request, params } = args;
  const username = params.username; //?
  const currentUser = await getUser(request); //?
  const isOwner = currentUser?.user_metadata.username === username;

  if (typeof username !== "string") {
    return badRequest({ message: "username must be provided" });
  }

  if (!isOwner) {
    return forbidden({ message: "not allowed" });
  }

  const profileData = await getProfileByUsername(username);

  return json(profileData);
};

export const action: ActionFunction = async (args) => {
  return null;
};

export default function Index() {
  let { username } = useParams();

  return <>Hello {username}</>;
}
