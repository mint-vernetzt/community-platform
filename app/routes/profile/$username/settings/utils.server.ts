import { DataFunctionArgs } from "@remix-run/server-runtime";
import { badRequest, forbidden } from "remix-utils";
import { getUserByRequest } from "~/auth.server";

export async function handleAuthorization(args: DataFunctionArgs) {
  const { params, request } = args;

  const { username } = params;

  if (typeof username !== "string" || username === "") {
    throw badRequest({ message: "username must be provided" });
  }
  const currentUser = await getUserByRequest(request);

  if (currentUser?.user_metadata.username !== username) {
    throw forbidden({ message: "not allowed" });
  }

  return { currentUser };
}
