import { redirect, type DataFunctionArgs } from "@remix-run/node";
import { Link, Outlet, useLocation } from "@remix-run/react";
import { createAuthClient, getSessionUser } from "~/auth.server";
import { invariantResponse } from "~/lib/utils/response";
import { BackButton } from "./__components";
import { getRedirectPathOnProtectedProjectRoute } from "./utils.server";
import { Section, TabBar } from "@mint-vernetzt/components";

export const loader = async (args: DataFunctionArgs) => {
  const { request, params } = args;
  const response = new Response();

  const authClient = createAuthClient(request, response);

  const sessionUser = await getSessionUser(authClient);

  // check slug exists (throw bad request if not)
  invariantResponse(params.slug !== undefined, "No valid route", {
    status: 400,
  });

  const redirectPath = await getRedirectPathOnProtectedProjectRoute({
    request,
    slug: params.slug,
    sessionUser,
    authClient,
  });

  if (redirectPath !== null) {
    return redirect(redirectPath, { headers: response.headers });
  }

  return null;
};

function DangerZone() {
  const location = useLocation();

  return (
    <Section>
      <BackButton to={location.pathname}>Kritischer Bereich</BackButton>
      <div id="danger-zone-tab-bar" className="md:mv--mt-6">
        <TabBar>
          <TabBar.Item active={location.pathname.endsWith("/change-url")}>
            <Link to="./change-url?deep#danger-zone-tab-bar">URL ändern</Link>
          </TabBar.Item>
          <TabBar.Item active={location.pathname.endsWith("/delete")}>
            <Link to="./delete?deep#danger-zone-tab-bar">Projekt löschen</Link>
          </TabBar.Item>
        </TabBar>
      </div>
      <div className="mv-flex mv-flex-col mv-gap-6 md:mv-gap-4">
        <Outlet />
      </div>
    </Section>
  );
}

export default DangerZone;
