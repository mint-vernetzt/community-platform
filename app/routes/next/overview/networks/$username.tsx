import { redirect, type LoaderFunctionArgs } from "@remix-run/server-runtime";
import { createAuthClient, getSessionUser } from "~/auth.server";
import { getFeatureAbilities } from "~/lib/utils/application";
import { invariantResponse } from "~/lib/utils/response";
import { getParamValueOrThrow } from "~/lib/utils/routes";
import { deriveProfileMode } from "~/routes/profile/$username/utils.server";

export const loader = async (args: LoaderFunctionArgs) => {
  const { request, params } = args;
  const username = getParamValueOrThrow(params, "username");

  const { authClient } = createAuthClient(request);
  const sessionUser = await getSessionUser(authClient);
  const mode = await deriveProfileMode(sessionUser, username);
  invariantResponse(mode !== "anon" && mode !== "authenticated", "Forbidden", {
    status: 403,
  });
  const abilities = await getFeatureAbilities(authClient, ["next"]);
  if (!abilities.next.hasAccess) {
    const username = getParamValueOrThrow(params, "username");
    return redirect(`/profile/${username}`);
  }
  return null;
};

export default function NetworksOverview() {
  return (
    <div className="mv-w-full mv-text-center mv-pt-8 mv-text-xl mv-text-primary-500">
      Next Networks Overview
    </div>
  );
}
