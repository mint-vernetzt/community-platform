import { redirect, type LoaderFunctionArgs } from "react-router";
import { getParamValueOrThrow } from "~/lib/utils/routes";

// handle "/general" as default route
export const loader = async (args: LoaderFunctionArgs) => {
  const { params } = args;

  const username = getParamValueOrThrow(params, "username");

  return redirect(`/profile/${username}/settings/general`);
};
