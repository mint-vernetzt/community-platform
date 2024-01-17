import type { ActionFunctionArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { createAuthClient, signOut } from "~/auth.server";

export const action = async (args: ActionFunctionArgs) => {
  const { request } = args;
  const { authClient, response } = createAuthClient(request);

  const { error } = await signOut(authClient);

  if (error !== null) {
    throw json({ message: error.message }, { status: 500 });
  }

  const cookie = response.headers.get("set-cookie");
  if (cookie !== null) {
    response.headers.set("set-cookie", cookie.replace("-code-verifier", ""));
  }

  return redirect("/", { headers: response.headers });
};
