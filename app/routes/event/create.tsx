import { ActionFunction, LoaderFunction } from "remix";
import { forbidden } from "remix-utils";
import { getUserByRequest } from "~/auth.server";
import { validateFeatureAccess } from "~/lib/utils/application";

export const loader: LoaderFunction = async (args) => {
  const { request } = args;
  const currentUser = await getUserByRequest(request);
  if (currentUser === null) {
    throw forbidden({ message: "Not allowed" });
  }

  await validateFeatureAccess(request, "events");

  return { id: currentUser.id };
};

export const action: ActionFunction = async (args) => {
  return null;
};

export default function Create() {
  return <>Create</>;
}
