import { type LoaderFunctionArgs, redirect } from "@remix-run/node";
import { createAuthClient } from "~/auth.server";

export const loader = async (args: LoaderFunctionArgs) => {
  const { response } = createAuthClient(args.request);

  return redirect("./about", { headers: response.headers });
};
