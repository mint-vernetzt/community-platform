import {
  Link,
  Outlet,
  redirect,
  useLoaderData,
  useLocation,
  type LoaderFunctionArgs,
} from "react-router";
import { createAuthClient, getSessionUser } from "~/auth.server";
import BasicStructure from "~/components/next/BasicStructure";
import TabBar from "~/components/next/TabBar";
import { detectLanguage } from "~/i18n.server";
import { invariantResponse } from "~/lib/utils/response";
import { Deep } from "~/lib/utils/searchParams";
import { languageModuleMap } from "~/locales/.server";
import { getRedirectPathOnProtectedEventRoute } from "../settings.server";
import { checkFeatureAbilitiesOrThrow } from "~/routes/feature-access.server";

export async function loader(args: LoaderFunctionArgs) {
  const { request, params } = args;

  invariantResponse(typeof params.slug === "string", "slug is not defined", {
    status: 400,
  });
  const { authClient } = createAuthClient(request);
  const sessionUser = await getSessionUser(authClient);
  const redirectPath = await getRedirectPathOnProtectedEventRoute({
    request,
    slug: params.slug,
    sessionUser,
    authClient,
  });
  if (redirectPath !== null) {
    return redirect(redirectPath);
  }
  invariantResponse(sessionUser, "User not authenticated", { status: 401 });
  await checkFeatureAbilitiesOrThrow(authClient, [
    "events",
    "next_event_settings",
  ]);

  const language = await detectLanguage(request);
  const locales =
    languageModuleMap[language]["next/event/$slug/settings/details"];

  return { locales };
}

export default function Details() {
  const loaderData = useLoaderData<typeof loader>();
  const { locales } = loaderData;

  const location = useLocation();
  const { pathname } = location;

  return (
    <div className="w-full flex flex-col p-4 gap-8 lg:p-6 lg:gap-6">
      <BasicStructure.Container
        deflatedUntil="lg"
        gaps={{ base: "gap-4", md: "gap-4", xl: "gap-4" }}
        rounded="rounded-lg"
      >
        <TabBar>
          <TabBar.Item active={pathname.endsWith("/info")}>
            <Link
              to={`./info?${Deep}=true`}
              {...TabBar.getItemElementClasses(pathname.endsWith("/info"))}
              preventScrollReset
              prefetch="intent"
            >
              <TabBar.Item.Title>{locales.route.tabbar.info}</TabBar.Item.Title>
            </Link>
          </TabBar.Item>
          <TabBar.Item active={pathname.endsWith("/background")}>
            <Link
              to={`./background?${Deep}=true`}
              {...TabBar.getItemElementClasses(
                pathname.endsWith("/background")
              )}
              preventScrollReset
              prefetch="intent"
            >
              <TabBar.Item.Title>
                {locales.route.tabbar.background}
              </TabBar.Item.Title>
            </Link>
          </TabBar.Item>
        </TabBar>
        <Outlet />
      </BasicStructure.Container>
    </div>
  );
}
