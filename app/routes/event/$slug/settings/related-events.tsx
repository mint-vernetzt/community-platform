import {
  Link,
  Outlet,
  redirect,
  useLoaderData,
  useLocation,
  type LoaderFunctionArgs,
} from "react-router";
import BasicStructure from "~/components/next/BasicStructure";
import { detectLanguage } from "~/i18n.server";
import { languageModuleMap } from "~/locales/.server";
import TabBar from "~/components/next/TabBar";
import { Deep } from "~/lib/utils/searchParams";
import { invariantResponse } from "~/lib/utils/response";
import { getEventBySlug } from "./related-events.server";
import { createAuthClient, getSessionUser } from "~/auth.server";
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
  await checkFeatureAbilitiesOrThrow(authClient, ["events"]);

  const language = await detectLanguage(request);
  const locales =
    languageModuleMap[language]["event/$slug/settings/related-events"];

  const event = await getEventBySlug(params.slug);
  invariantResponse(event !== null, "Event not found", { status: 404 });

  return { locales, event };
}

export default function RelatedEvents() {
  const loaderData = useLoaderData<typeof loader>();
  const { locales, event } = loaderData;

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
          <TabBar.Item active={pathname.endsWith("/parent-event")}>
            <Link
              to={`./parent-event?${Deep}=true`}
              {...TabBar.getItemElementClasses(
                pathname.endsWith("/parent-event")
              )}
              preventScrollReset
              prefetch="intent"
            >
              <TabBar.Item.Title>
                {locales.route.tabbar.parentEvent}
              </TabBar.Item.Title>
            </Link>
          </TabBar.Item>
          <TabBar.Item active={pathname.endsWith("/child-events")}>
            <Link
              to={`./child-events?${Deep}=true`}
              {...TabBar.getItemElementClasses(
                pathname.endsWith("/child-events")
              )}
              preventScrollReset
              prefetch="intent"
            >
              <TabBar.Item.Title>
                {locales.route.tabbar.childEvents}
              </TabBar.Item.Title>
              <TabBar.Item.Counter>
                {event._count.childEvents}
              </TabBar.Item.Counter>
            </Link>
          </TabBar.Item>
        </TabBar>
        <Outlet />
      </BasicStructure.Container>
    </div>
  );
}
