import type { DataFunctionArgs } from "@remix-run/node";
import { redirect } from "@remix-run/node";
import { createAuthClient } from "~/auth.server";
import { getParamValueOrThrow } from "~/lib/utils/routes";

// handle "/general" as default route
export const loader = async (args: DataFunctionArgs) => {
  const { request, params } = args;
  const response = new Response();

  createAuthClient(request, response);

  const slug = getParamValueOrThrow(params, "slug");
  return redirect(`/project/${slug}/settings/general`, {
    headers: response.headers,
  });
};
