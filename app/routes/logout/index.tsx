import type { ActionFunctionArgs } from "react-router";
import { redirect } from "react-router";
import { signOut } from "~/auth.server";
import { invariantResponse } from "~/lib/utils/response";

export const action = async (args: ActionFunctionArgs) => {
  const { request } = args;

  const { error, headers } = await signOut(request);

  if (error !== null) {
    invariantResponse(false, "Server Error", { status: 500 });
  }

  return redirect("/", { headers: headers });
};
