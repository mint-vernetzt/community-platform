import type { LoaderFunctionArgs } from "@remix-run/node";
import { redirect } from "@remix-run/node";
import { createAuthClient } from "~/auth.server";

// handle "/profiles" as default route
export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { response } = createAuthClient(request);
  return redirect("/explore/profiles", { headers: response.headers });
};
