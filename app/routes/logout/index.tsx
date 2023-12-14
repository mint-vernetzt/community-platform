import type { ActionFunctionArgs } from "@remix-run/node";
import { redirect } from "@remix-run/node";
import { serverError } from "remix-utils";
import { createAuthClient, signOut } from "~/auth.server";

export const action = async (args: ActionFunctionArgs) => {
  const { request } = args;
  const response = new Response();

  const authClient = createAuthClient(request, response);

  const { error } = await signOut(authClient);

  if (error !== null) {
    throw serverError({ message: error.message });
  }

  const cookie = response.headers.get("set-cookie");
  if (cookie !== null) {
    response.headers.set("set-cookie", cookie.replace("-code-verifier", ""));
  }

  return redirect("/", { headers: response.headers });
};
