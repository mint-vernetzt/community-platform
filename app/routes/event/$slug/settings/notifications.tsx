import {
  Link,
  type LoaderFunctionArgs,
  Outlet,
  redirect,
  useLoaderData,
  useLocation,
} from "react-router";
import { createAuthClient, getSessionUser } from "~/auth.server";
import BasicStructure from "~/components/next/BasicStructure";
import TabBar from "~/components/next/TabBar";
import { invariantResponse } from "~/lib/utils/response";
import { Deep } from "~/lib/utils/searchParams";
import { languageModuleMap } from "~/locales/.server";
import { detectLanguage } from "~/root.server";
import { checkFeatureAbilitiesOrThrow } from "~/routes/feature-access.server";
import {
  getEventBySlug,
  getRedirectPathOnProtectedEventRoute,
} from "../settings.server";

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
    languageModuleMap[language]["event/$slug/settings/notifications"];

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

function Notifications() {
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
          <TabBar.Item active={pathname.endsWith("/list")}>
            <Link
              to={`./list?${Deep}=true`}
              {...TabBar.getItemElementClasses(pathname.endsWith("/list"))}
              preventScrollReset
              prefetch="intent"
            >
              <TabBar.Item.Title>{locales.route.tabbar.list}</TabBar.Item.Title>
            </Link>
          </TabBar.Item>
        </TabBar>
        <Outlet />
      </BasicStructure.Container>
    </div>
  );
}

export default Notifications;
