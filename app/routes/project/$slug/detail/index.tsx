import { redirect, type DataFunctionArgs } from "@remix-run/node";
import { createAuthClient } from "~/auth.server";
import { getFeatureAbilities } from "~/lib/utils/application";

export const loader = async (args: DataFunctionArgs) => {
  const { request, params } = args;
  const response = new Response();

  const authClient = createAuthClient(request, response);

  const featureAbilities = await getFeatureAbilities(
    authClient,
    "next_projects"
  );
  if (featureAbilities.next_projects.hasAccess === false) {
    return redirect(`/project/${params.slug}`, { headers: response.headers });
  }

  return redirect("./about", { headers: response.headers });
};
