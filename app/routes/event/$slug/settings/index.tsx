import type { LoaderFunctionArgs } from "react-router";
import { redirect } from "react-router";
import { getParamValueOrThrow } from "~/lib/utils/routes";

// handle "/general" as default route
export const loader = async (args: LoaderFunctionArgs) => {
  const { params } = args;
  const slug = getParamValueOrThrow(params, "slug");
  return redirect(`/event/${slug}/settings/general`);
};
