import { redirect, type DataFunctionArgs } from "@remix-run/node";
import { createAuthClient, getSessionUser } from "~/auth.server";
import { getFeatureAbilities } from "~/lib/utils/application";
import { invariantResponse } from "~/lib/utils/response";
import { deriveProjectMode } from "~/routes/next/project.server";

export const loader = async (args: DataFunctionArgs) => {
  const { request, params } = args;
  const response = new Response();

  const authClient = createAuthClient(request, response);

  const sessionUser = await getSessionUser(authClient);

  // redirect to login if not logged in
  if (sessionUser === null) {
    // TODO: Maybe rename login_redirect to redirect_to everywhere?
    return redirect(`/login?login_redirect=/project/${params.slug}`, {
      headers: response.headers,
    });
  }

  // check slug exists (throw bad request if not)
  invariantResponse(params.slug !== undefined, "No valid route", {
    status: 400,
  });

  // check feature flag abilities and redirect to legacy if hasn't access
  const featureAbilities = await getFeatureAbilities(
    authClient,
    "next_projects"
  );
  if (featureAbilities.next_projects.hasAccess === false) {
    return redirect(`/project/${params.slug}`, { headers: response.headers });
  }

  // check if admin of project and redirect to project details if not
  const mode = await deriveProjectMode(sessionUser, params.slug);
  if (mode !== "admin") {
    return redirect(`/project/${params.slug}`, { headers: response.headers });
  }

  return redirect("./general", { headers: response.headers });
};
