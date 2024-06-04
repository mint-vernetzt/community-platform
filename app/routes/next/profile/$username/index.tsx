import { redirect, type LoaderFunctionArgs } from "@remix-run/server-runtime";
import { createAuthClient } from "~/auth.server";
import { getFeatureAbilities } from "~/lib/utils/application";
import { getParamValueOrThrow } from "~/lib/utils/routes";

export const loader = async (args: LoaderFunctionArgs) => {
  const { request, params } = args;

  const { authClient } = createAuthClient(request);
  const abilities = await getFeatureAbilities(authClient, ["next"]);
  if (!abilities.next.hasAccess) {
    const username = getParamValueOrThrow(params, "username");
    return redirect(`/profile/${username}`);
  }
  return null;
};

export default function NextProfile() {
  return (
    <div className="mv-w-full mv-text-center mv-pt-8 mv-text-xl mv-text-primary-500">
      Next Profile
    </div>
  );
}
