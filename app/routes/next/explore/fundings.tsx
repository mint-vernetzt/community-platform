import { redirect, type LoaderFunctionArgs } from "@remix-run/server-runtime";
import { createAuthClient } from "~/auth.server";
import { getFeatureAbilities } from "~/lib/utils/application";

export const loader = async (args: LoaderFunctionArgs) => {
  const { request } = args;

  const { authClient } = createAuthClient(request);
  const abilities = await getFeatureAbilities(authClient, ["next"]);
  if (!abilities.next.hasAccess) {
    return redirect("/explore/profiles");
  }
  return null;
};

export default function ExploreFundings() {
  return (
    <div className="mv-w-full mv-text-center mv-pt-8 mv-text-xl mv-text-primary-500">
      Next Explore Fundings
    </div>
  );
}
