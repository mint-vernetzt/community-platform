import { type LoaderFunctionArgs, Outlet, redirect } from "react-router";
import { createAuthClient } from "~/auth.server";
import { getFeatureAbilities } from "~/routes/feature-access.server";

export async function loader(args: LoaderFunctionArgs) {
  const { request } = args;
  const { authClient } = createAuthClient(request);
  const abilities = await getFeatureAbilities(authClient, "next_event");
  if (abilities.next_event.hasAccess === false) {
    return redirect("/");
  }
  return null;
}

function Detail() {
  return (
    <>
      <div>Detail Page</div>
      <Outlet />
    </>
  );
}

export default Detail;
