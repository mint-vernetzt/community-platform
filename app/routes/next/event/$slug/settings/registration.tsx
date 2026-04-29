import {
  Link,
  Outlet,
  useLoaderData,
  useLocation,
  type LoaderFunctionArgs,
} from "react-router";
import BasicStructure from "~/components/next/BasicStructure";
import TabBar from "~/components/next/TabBar";
import { detectLanguage } from "~/i18n.server";
import { invariantResponse } from "~/lib/utils/response";
import { Deep } from "~/lib/utils/searchParams";
import { languageModuleMap } from "~/locales/.server";
import { getEventBySlug } from "./registration.server";

export async function loader(args: LoaderFunctionArgs) {
  const { request, params } = args;
  const { slug } = params;

  invariantResponse(typeof slug === "string", "slug is not defined", {
    status: 400,
  });

  const language = await detectLanguage(request);
  const locales =
    languageModuleMap[language]["next/event/$slug/settings/registration"];

  const event = await getEventBySlug(slug);
  invariantResponse(event !== null, "Event not found", { status: 404 });

  return { locales, event };
}

export default function Registration() {
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
          <TabBar.Item active={pathname.endsWith("/access")}>
            <Link
              to={`./access?${Deep}=true`}
              {...TabBar.getItemElementClasses(pathname.endsWith("/access"))}
              preventScrollReset
              prefetch="intent"
            >
              <TabBar.Item.Title>{locales.route.tabs.access}</TabBar.Item.Title>
            </Link>
          </TabBar.Item>
          <TabBar.Item active={pathname.endsWith("/period")}>
            {event.published === false &&
            event.external === false &&
            event.openForRegistration ? (
              <Link
                to={`./period?${Deep}=true`}
                {...TabBar.getItemElementClasses(pathname.endsWith("/period"))}
                preventScrollReset
                prefetch="intent"
              >
                <TabBar.Item.Title>
                  {locales.route.tabs.period}
                </TabBar.Item.Title>
              </Link>
            ) : (
              <>
                <h2 className="text-lg font-semibold text-neutral-300 mb-3 p-2 flex gap-2 items-center cursor-not-allowed">
                  {locales.route.tabs.period}
                </h2>
              </>
            )}
          </TabBar.Item>
          <TabBar.Item active={pathname.endsWith("/limit")}>
            {event.external === false && event.openForRegistration ? (
              <Link
                to={`./limit?${Deep}=true`}
                {...TabBar.getItemElementClasses(pathname.endsWith("/limit"))}
                preventScrollReset
                prefetch="intent"
              >
                <TabBar.Item.Title>
                  {locales.route.tabs.limit}
                </TabBar.Item.Title>
              </Link>
            ) : (
              <>
                <h2 className="text-lg font-semibold text-neutral-300 mb-3 p-2 flex gap-2 items-center cursor-not-allowed">
                  {locales.route.tabs.limit}
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
