import type { ActionFunction } from "@remix-run/node";
import { redirect } from "@remix-run/node";
import { serverError } from "remix-utils";
import { createAuthClient, signOut } from "~/auth.server";

export const action: ActionFunction = async (args) => {
  const { request } = args;
  const response = new Response();

  const authClient = createAuthClient(request, response);

  const { error } = await signOut(authClient);

  if (error !== null) {
    throw serverError({ message: error.message });
  }

  return redirect("/", { headers: response.headers });
};
