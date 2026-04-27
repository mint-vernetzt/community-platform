import {
  Link,
  Outlet,
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
import { getEventBySlug } from "./speakers.server";

export const loader = async (args: LoaderFunctionArgs) => {
  const { request, params } = args;

  invariantResponse(typeof params.slug === "string", "slug is not defined", {
    status: 400,
  });

  const language = await detectLanguage(request);
  const locales =
    languageModuleMap[language]["next/event/$slug/settings/speakers"];

  const event = await getEventBySlug(params.slug);
  invariantResponse(event !== null, "Event not found", { status: 404 });

  return { locales, event };
};

export default function Speakers() {
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
          <TabBar.Item active={pathname.endsWith("/list")}>
            {event._count.speakers > 0 ? (
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
                  {loaderData.event._count.speakers}
                </TabBar.Item.Counter>
              </Link>
            ) : (
              <>
                <h2 className="text-lg font-semibold text-neutral-300 mb-3 p-2 flex gap-2 items-center cursor-not-allowed">
                  {locales.route.tabbar.list}
                  <Counter active={false}>
                    {loaderData.event._count.speakers}
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
              <TabBar.Item.Title>{locales.route.tabbar.add}</TabBar.Item.Title>
            </Link>
          </TabBar.Item>
          <TabBar.Item active={pathname.endsWith("/invites")}>
            {event._count.profileJoinInvites > 0 ? (
              <Link
                to={`./invites?${Deep}=true`}
                {...TabBar.getItemElementClasses(pathname.endsWith("/invites"))}
                preventScrollReset
                prefetch="intent"
              >
                <TabBar.Item.Title>
                  {locales.route.tabbar.invites}
                </TabBar.Item.Title>
                <TabBar.Item.Counter>
                  {loaderData.event._count.profileJoinInvites}
                </TabBar.Item.Counter>
              </Link>
            ) : (
              <>
                <h2 className="text-lg font-semibold text-neutral-300 mb-3 p-2 flex gap-2 items-center cursor-not-allowed">
                  {locales.route.tabbar.invites}
                  <Counter active={false}>
                    {loaderData.event._count.profileJoinInvites}
                  </Counter>
                </h2>
              </>
            )}
          </TabBar.Item>
        </TabBar>
        <Outlet />
      </BasicStructure.Container>
    </div>
  );
}
