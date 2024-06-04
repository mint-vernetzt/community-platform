import { redirect, type LoaderFunctionArgs } from "@remix-run/server-runtime";
import { createAuthClient, getSessionUser } from "~/auth.server";
import { getFeatureAbilities } from "~/lib/utils/application";
import { deriveMode } from "~/utils.server";

export const loader = async (args: LoaderFunctionArgs) => {
  const { request } = args;

  const { authClient } = createAuthClient(request);
  const sessionUser = await getSessionUser(authClient);
  const mode = deriveMode(sessionUser);
  if (mode === "anon") {
    return redirect("/");
  }
  const abilities = await getFeatureAbilities(authClient, ["next"]);
  if (!abilities.next.hasAccess) {
    return redirect("/dashboard");
  }
  return null;
};

export default function NextDashboard() {
  return (
    <div className="mv-w-full mv-text-center mv-pt-8 mv-text-xl mv-text-primary-500">
      Next Dashboard
    </div>
  );
}
