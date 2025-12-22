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

export const loader = async (args: LoaderFunctionArgs) => {
  const { request } = args;

  const language = await detectLanguage(request);
  const locales =
    languageModuleMap[language]["next/event/$slug/settings/danger-zone"];

  return { locales };
};

export default function DangerZone() {
  const loaderData = useLoaderData<typeof loader>();
  const { locales } = loaderData;

  const location = useLocation();
  const { pathname } = location;

  const [searchParams] = useSearchParams();
  const deep = searchParams.get(Deep);

  return (
    <div className="w-full flex flex-col p-4 gap-8 lg:p-6 lg:gap-6">
      <BasicStructure.Container
        deflatedUntil="lg"
        gaps={{ base: "gap-4", md: "gap-4", xl: "gap-4" }}
        rounded="rounded-lg"
      >
        <TabBar>
          <TabBar.Item active={pathname.endsWith("/change-url")}>
            <Link
              to={`./change-url?${Deep}=${deep}`}
              {...TabBar.getItemElementClasses(
                pathname.endsWith("/change-url")
              )}
              preventScrollReset
              prefetch="intent"
            >
              <TabBar.Item.Title>
                {locales.route.tabbar.changeURL}
              </TabBar.Item.Title>
            </Link>
          </TabBar.Item>
        </TabBar>
        <Outlet />
      </BasicStructure.Container>
    </div>
  );
}
