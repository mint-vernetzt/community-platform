import type { ActionFunctionArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { signOut } from "~/auth.server";

export const action = async (args: ActionFunctionArgs) => {
  const { request } = args;

  const { error, headers } = await signOut(request);

  if (error !== null) {
    throw json({ message: "Server Error" }, { status: 500 });
  }

  return redirect("/", { headers: headers });
};
