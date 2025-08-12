import { type LoaderFunctionArgs } from "react-router";
import { checkFeatureAbilitiesOrThrow } from "../feature-access.server";
import { createAuthClient } from "~/auth.server";

export async function loader(args: LoaderFunctionArgs) {
  const { request } = args;

  const { authClient } = createAuthClient(request);

  await checkFeatureAbilitiesOrThrow(authClient, "map");

  return null;
}

function MapIndex() {
  return (
    <div>
      <h1>Map Index</h1>
    </div>
  );
}

export default MapIndex;
