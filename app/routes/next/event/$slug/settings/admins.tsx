import {
  Link,
  Outlet,
  useLoaderData,
  useLocation,
  useSearchParams,
  type LoaderFunctionArgs,
} from "react-router";
import BasicStructure from "~/components/next/BasicStructure";
import TabBar from "~/components/next/TabBar";
import { detectLanguage } from "~/i18n.server";
import { Deep } from "~/lib/utils/searchParams";
import { languageModuleMap } from "~/locales/.server";
import { getEventBySlug } from "./admins.server";
import { invariantResponse } from "~/lib/utils/response";
import { Counter } from "~/components/next/Counter";

export const loader = async (args: LoaderFunctionArgs) => {
  const { request, params } = args;

  invariantResponse(typeof params.slug === "string", "slug is not defined", {
    status: 400,
  });

  const language = await detectLanguage(request);
  const locales =
    languageModuleMap[language]["next/event/$slug/settings/admins"];

  const event = await getEventBySlug(params.slug);
  invariantResponse(event !== null, "Event not found", { status: 404 });

  return { locales, event };
};

export default function Admins() {
  const loaderData = useLoaderData<typeof loader>();
  const { locales, event } = loaderData;

  const location = useLocation();
  const { pathname } = location;

  const [searchParams] = useSearchParams();
  const deep = searchParams.get(Deep);

  return (
    <>
      <div className="p-4 lg:mx-6 lg:mt-6 bg-primary-50 lg:rounded-lg text-neutral-600 leading-[1.3rem]">
        {locales.route.explanation}
      </div>
      <div className="w-full flex flex-col p-4 gap-8 lg:p-6 lg:gap-6">
        <BasicStructure.Container
          deflatedUntil="lg"
          gaps={{ base: "gap-4", md: "gap-4", xl: "gap-4" }}
          rounded="rounded-lg"
        >
          <TabBar>
            <TabBar.Item active={pathname.endsWith("/list")}>
              <Link
                to={`./list?${Deep}=${deep}`}
                {...TabBar.getItemElementClasses(pathname.endsWith("/list"))}
                preventScrollReset
                prefetch="intent"
              >
                <TabBar.Item.Title>
                  {locales.route.tabbar.list}
                </TabBar.Item.Title>
                <TabBar.Item.Counter>
                  {loaderData.event._count.admins}
                </TabBar.Item.Counter>
              </Link>
            </TabBar.Item>
            <TabBar.Item active={pathname.endsWith("/add")}>
              <Link
                to={`./add?${Deep}=${deep}`}
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
              {event._count.profileJoinInvites > 0 ? (
                <Link
                  to={`./invites?${Deep}=${deep}`}
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
    </>
  );
}
