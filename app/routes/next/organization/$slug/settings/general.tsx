import { type LoaderFunctionArgs } from "@remix-run/node";
import { createAuthClient } from "~/auth.server";
import { checkFeatureAbilitiesOrThrow } from "~/lib/utils/application";

export const loader = async (args: LoaderFunctionArgs) => {
  const { request } = args;

  const { authClient } = createAuthClient(request);

  await checkFeatureAbilitiesOrThrow(authClient, ["next-organization-create"]);

  return null;
};

function General() {
  return <div>General</div>;
}

export default General;
