import type { LoaderFunctionArgs } from "@remix-run/node";
import { redirect } from "@remix-run/node";
import { getParamValueOrThrow } from "~/lib/utils/routes";

// handle "/general" as default route
export const loader = async (args: LoaderFunctionArgs) => {
  const { params } = args;
  const slug = getParamValueOrThrow(params, "slug");
  return redirect(`/organization/${slug}/settings/general`);
};
