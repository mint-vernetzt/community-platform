import { redirect, type LoaderFunctionArgs } from "@remix-run/node";
import { getParamValueOrThrow } from "~/lib/utils/routes";

// handle "/organizations" as default route
export const loader = async ({ params }: LoaderFunctionArgs) => {
  const username = getParamValueOrThrow(params, "username");
  return redirect(`/my/${username}/organizations`);
};
