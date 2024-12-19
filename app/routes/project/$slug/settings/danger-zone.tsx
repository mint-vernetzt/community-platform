import { redirect, type LoaderFunctionArgs } from "@remix-run/node";
import { Link, Outlet, useLoaderData, useLocation } from "@remix-run/react";
import { createAuthClient, getSessionUser } from "~/auth.server";
import { invariantResponse } from "~/lib/utils/response";
import { BackButton } from "~/components-next/BackButton";
import { getRedirectPathOnProtectedProjectRoute } from "./utils.server";
import { detectLanguage } from "~/i18n.server";
import { Deep } from "~/lib/utils/searchParams";
import { Section } from "@mint-vernetzt/components/src/organisms/containers/Section";
import { TabBar } from "@mint-vernetzt/components/src/organisms/TabBar";
import { languageModuleMap } from "~/locales/.server";

export const loader = async (args: LoaderFunctionArgs) => {
  const { request, params } = args;

  const language = await detectLanguage(request);
  const locales =
    languageModuleMap[language]["project/$slug/settings/danger-zone"];
  const { authClient } = createAuthClient(request);

  const sessionUser = await getSessionUser(authClient);

  // check slug exists (throw bad request if not)
  invariantResponse(params.slug !== undefined, locales.error.invalidRoute, {
    status: 400,
  });

  const redirectPath = await getRedirectPathOnProtectedProjectRoute({
    request,
    slug: params.slug,
    sessionUser,
    authClient,
  });

  if (redirectPath !== null) {
    return redirect(redirectPath);
  }

  return { locales };
};

function DangerZone() {
  const location = useLocation();
  const { locales } = useLoaderData<typeof loader>();

  return (
    <Section>
      <BackButton to={location.pathname}>{locales.content.back}</BackButton>
      <div id="danger-zone-tab-bar" className="mv-mt-2 @md:-mv-mt-2 mv-mb-4">
        <TabBar>
          <TabBar.Item active={location.pathname.endsWith("/change-url")}>
            <Link to={`./change-url?${Deep}=true`} preventScrollReset>
              {locales.content.changeUrl}
            </Link>
          </TabBar.Item>
          <TabBar.Item active={location.pathname.endsWith("/delete")}>
            <Link to={`./delete?${Deep}=true`} preventScrollReset>
              {locales.content.projectDelete}
            </Link>
          </TabBar.Item>
        </TabBar>
      </div>
      <div className="mv-flex mv-flex-col mv-gap-6 @md:mv-gap-4">
        <Outlet />
      </div>
    </Section>
  );
}

export default DangerZone;
