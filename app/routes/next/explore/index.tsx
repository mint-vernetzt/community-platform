import { type LoaderFunctionArgs, redirect } from "@remix-run/node";
import { createAuthClient } from "~/auth.server";
import { getFeatureAbilities } from "~/lib/utils/application";

// handle "/profiles" as default route
export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { authClient } = createAuthClient(request);

  const abilities = await getFeatureAbilities(authClient, ["filter"]);

  if (abilities.filter.hasAccess === false) {
    return redirect("/explore/profiles");
  }

  return redirect("/next/explore/profiles");
};
