import {
  Link,
  Outlet,
  redirect,
  useLoaderData,
  useLocation,
  type LoaderFunctionArgs,
} from "react-router";
import BasicStructure from "~/components/next/BasicStructure";
import { Counter } from "~/components/next/Counter";
import TabBar from "~/components/next/TabBar";
import { detectLanguage } from "~/i18n.server";
import { invariantResponse } from "~/lib/utils/response";
import { Deep } from "~/lib/utils/searchParams";
import { languageModuleMap } from "~/locales/.server";
import { getEventBySlug } from "./participants.server";
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
  await checkFeatureAbilitiesOrThrow(authClient, [
    "events",
    "next_event_settings",
  ]);

  const language = await detectLanguage(request);
  const locales =
    languageModuleMap[language]["next/event/$slug/settings/participants"];

  const event = await getEventBySlug(params.slug);
  invariantResponse(event !== null, "Event not found", { status: 404 });

  if (event.published === false || event.external) {
    const url = new URL(request.url);
    const searchParams = url.searchParams;
    const deep = searchParams.get(Deep);
    return redirect(`./time-period?${Deep}=${deep}`);
  }

  return { locales, event };
}

export default function Participants() {
  const loaderData = useLoaderData<typeof loader>();
  const { locales, event } = loaderData;

  const location = useLocation();
  const { pathname } = location;

  return (
    <>
      <div className="w-full flex flex-col p-4 gap-8 lg:p-6 lg:gap-6">
        <BasicStructure.Container
          deflatedUntil="lg"
          gaps={{ base: "gap-4", md: "gap-4", xl: "gap-4" }}
          rounded="rounded-lg"
        >
          <TabBar>
            <TabBar.Item active={pathname.endsWith("/list")}>
              {event._count.participants > 0 ? (
                <Link
                  to={`./list?${Deep}=true`}
                  {...TabBar.getItemElementClasses(pathname.endsWith("/list"))}
                  preventScrollReset
                  prefetch="intent"
                >
                  <TabBar.Item.Title>
                    {locales.route.tabbar.list}
                  </TabBar.Item.Title>
                  <TabBar.Item.Counter>
                    {loaderData.event._count.participants}
                  </TabBar.Item.Counter>
                </Link>
              ) : (
                <>
                  <h2 className="text-lg font-semibold text-neutral-300 mb-3 p-2 flex gap-2 items-center cursor-not-allowed">
                    {locales.route.tabbar.list}
                    <Counter active={false}>
                      {loaderData.event._count.participants}
                    </Counter>
                  </h2>
                </>
              )}
            </TabBar.Item>
            <TabBar.Item active={pathname.endsWith("/waiting-list")}>
              {event._count.waitingList > 0 ? (
                <Link
                  to={`./waiting-list?${Deep}=true`}
                  {...TabBar.getItemElementClasses(
                    pathname.endsWith("/waiting-list")
                  )}
                  preventScrollReset
                  prefetch="intent"
                >
                  <TabBar.Item.Title>
                    {locales.route.tabbar.waitingList}
                  </TabBar.Item.Title>
                  <TabBar.Item.Counter>
                    {loaderData.event._count.waitingList}
                  </TabBar.Item.Counter>
                </Link>
              ) : (
                <>
                  <h2 className="text-lg font-semibold text-neutral-300 mb-3 p-2 flex gap-2 items-center cursor-not-allowed">
                    {locales.route.tabbar.waitingList}
                    <Counter active={false}>
                      {loaderData.event._count.waitingList}
                    </Counter>
                  </h2>
                </>
              )}
            </TabBar.Item>
            <TabBar.Item active={pathname.endsWith("/add")}>
              <Link
                to={`./add?${Deep}=true`}
                {...TabBar.getItemElementClasses(pathname.endsWith("/add"))}
                preventScrollReset
                prefetch="intent"
              >
                <TabBar.Item.Title>
                  {locales.route.tabbar.add}
                </TabBar.Item.Title>
              </Link>
            </TabBar.Item>
            <TabBar.Item active={pathname.endsWith("/invites")}>
              {event._count.participantInvites > 0 ? (
                <Link
                  to={`./invites?${Deep}=true`}
                  {...TabBar.getItemElementClasses(
                    pathname.endsWith("/invites")
                  )}
                  preventScrollReset
                  prefetch="intent"
                >
                  <TabBar.Item.Title>
                    {locales.route.tabbar.invites}
                  </TabBar.Item.Title>
                  <TabBar.Item.Counter>
                    {loaderData.event._count.participantInvites}
                  </TabBar.Item.Counter>
                </Link>
              ) : (
                <>
                  <h2 className="text-lg font-semibold text-neutral-300 mb-3 p-2 flex gap-2 items-center cursor-not-allowed">
                    {locales.route.tabbar.invites}
                    <Counter active={false}>
                      {loaderData.event._count.participantInvites}
                    </Counter>
                  </h2>
                </>
              )}
            </TabBar.Item>
          </TabBar>
          <Outlet />
        </BasicStructure.Container>
      </div>
    </>
  );
}
