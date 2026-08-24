import {
  Link,
  redirect,
  useLoaderData,
  type LoaderFunctionArgs,
} from "react-router";
import { createAuthClient, getSessionUser } from "~/auth.server";
import TitleSection from "~/components/next/TitleSection";
import { invariantResponse } from "~/lib/utils/response";
import { getRedirectPathOnProtectedEventRoute } from "../../settings.server";
import {
  NOTIFICATION_TYPE_SEARCH_PARAM,
  NOTIFICATION_TYPE_ON_FIFTEEN_MINUTES_BEFORE,
  NOTIFICATION_TYPE_ON_HOUR_BEFORE,
  NOTIFICATION_TYPE_ON_DAY_BEFORE,
} from "./list.shared";
import { detectLanguage } from "~/i18n.server";
import { languageModuleMap } from "~/locales/.server";
import { getEventStage } from "./list.server";
import { OverlayMenu } from "~/components/next/OverlayMenu";
import { Deep } from "~/lib/utils/searchParams";

export async function loader(args: LoaderFunctionArgs) {
  const { request, params } = args;
  const { slug } = params;

  invariantResponse(typeof slug === "string", "slug is not defined", {
    status: 400,
  });
  const { authClient } = createAuthClient(request);
  const sessionUser = await getSessionUser(authClient);
  const redirectPath = await getRedirectPathOnProtectedEventRoute({
    request,
    slug,
    sessionUser,
    authClient,
  });
  if (redirectPath !== null) {
    return redirect(redirectPath);
  }
  invariantResponse(sessionUser, "User not authenticated", { status: 401 });

  const language = await detectLanguage(request);
  const locales =
    languageModuleMap[language]["event/$slug/settings/notifications/list"];
  const stage = await getEventStage(slug);

  return { locales, stage };
}

function NotificationsList() {
  const loaderData = useLoaderData<typeof loader>();
  const { locales, stage } = loaderData;

  return (
    <div className="flex flex-col gap-8 pt-4">
      <div className="flex flex-col gap-4">
        <TitleSection>
          <TitleSection.Headline>
            {locales.route.system.title}
          </TitleSection.Headline>
          <TitleSection.Subline>
            {locales.route.system.description}
          </TitleSection.Subline>
        </TitleSection>
        <ul className="flex flex-col border border-neutral-200 rounded-xl *:border-b *:border-neutral-200 *:last:border-b-0 text-neutral-700 text-sm">
          <li className="flex gap-0.5 p-4 justify-between">
            <div className="flex flex-col gap-0.5">
              <p className="font-semibold">
                {locales.route.system.list.oneDayBefore.title}
              </p>
              <p>{locales.route.system.list.oneDayBefore.description}</p>
            </div>
            <OverlayMenu
              as="circle-button"
              searchParam={`overlay-menu-${NOTIFICATION_TYPE_ON_DAY_BEFORE}`}
              locales={locales.route.system.list}
            >
              <OverlayMenu.ListItem>
                <Link
                  {...OverlayMenu.getListChildrenStyles()}
                  {...OverlayMenu.getIdToFocusWhenOpening()}
                  to={`../preview?${NOTIFICATION_TYPE_SEARCH_PARAM}=${NOTIFICATION_TYPE_ON_DAY_BEFORE}&${Deep}=true`}
                  prefetch="intent"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 20 20"
                    fill="none"
                  >
                    <path
                      d="M10 3.125C16.2494 3.125 19.9993 9.99863 20 10C19.9996 10.0007 16.2497 16.875 10 16.875C3.75 16.875 0 10 0 10C0.000464002 9.99915 3.75039 3.125 10 3.125ZM10 4.375C7.35 4.375 5.14977 5.83504 3.54102 7.44629C2.76562 8.22586 2.07018 9.08146 1.46582 10H1.46484C2.06924 10.9186 2.7646 11.7741 3.54004 12.5537C5.15129 14.165 7.35 15.625 10 15.625C12.6488 15.625 14.8487 14.165 16.46 12.5537C17.2536 11.7601 17.8723 10.9603 18.291 10.3604C18.3823 10.2291 18.4627 10.1087 18.5352 10C17.9308 9.0814 17.2354 8.2259 16.46 7.44629C14.8487 5.83504 12.65 4.375 10 4.375ZM10 5.625C11.1603 5.625 12.2733 6.08578 13.0938 6.90625C13.9142 7.72672 14.375 8.83968 14.375 10C14.375 11.1603 13.9142 12.2733 13.0938 13.0938C12.2733 13.9142 11.1603 14.375 10 14.375C8.83968 14.375 7.72672 13.9142 6.90625 13.0938C6.08578 12.2733 5.625 11.1603 5.625 10C5.625 8.83968 6.08578 7.72672 6.90625 6.90625C7.72672 6.08578 8.83968 5.625 10 5.625ZM10 6.875C9.1712 6.875 8.37609 7.20399 7.79004 7.79004C7.20399 8.37609 6.875 9.1712 6.875 10C6.875 10.8288 7.20399 11.6239 7.79004 12.21C8.37609 12.796 9.1712 13.125 10 13.125C10.8288 13.125 11.6239 12.796 12.21 12.21C12.796 11.6239 13.125 10.8288 13.125 10C13.125 9.1712 12.796 8.37609 12.21 7.79004C11.6239 7.20399 10.8288 6.875 10 6.875Z"
                      fill="#3C4658"
                    />
                  </svg>
                  {locales.route.system.list.preview}
                </Link>
              </OverlayMenu.ListItem>
            </OverlayMenu>
          </li>
          {(stage === null || stage.slug !== "online") && (
            <li className="flex gap-0.5 p-4 justify-between">
              <div className="flex flex-col gap-0.5">
                <p className="font-semibold">
                  {locales.route.system.list.oneHourBefore.title}
                </p>
                <p>{locales.route.system.list.oneHourBefore.description}</p>
              </div>
              <OverlayMenu
                as="circle-button"
                searchParam={`overlay-menu-${NOTIFICATION_TYPE_ON_HOUR_BEFORE}`}
                locales={locales.route.system.list}
              >
                <OverlayMenu.ListItem>
                  <Link
                    {...OverlayMenu.getListChildrenStyles()}
                    {...OverlayMenu.getIdToFocusWhenOpening()}
                    to={`../preview?${NOTIFICATION_TYPE_SEARCH_PARAM}=${NOTIFICATION_TYPE_ON_HOUR_BEFORE}&${Deep}=true`}
                    prefetch="intent"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="20"
                      height="20"
                      viewBox="0 0 20 20"
                      fill="none"
                    >
                      <path
                        d="M10 3.125C16.2494 3.125 19.9993 9.99863 20 10C19.9996 10.0007 16.2497 16.875 10 16.875C3.75 16.875 0 10 0 10C0.000464002 9.99915 3.75039 3.125 10 3.125ZM10 4.375C7.35 4.375 5.14977 5.83504 3.54102 7.44629C2.76562 8.22586 2.07018 9.08146 1.46582 10H1.46484C2.06924 10.9186 2.7646 11.7741 3.54004 12.5537C5.15129 14.165 7.35 15.625 10 15.625C12.6488 15.625 14.8487 14.165 16.46 12.5537C17.2536 11.7601 17.8723 10.9603 18.291 10.3604C18.3823 10.2291 18.4627 10.1087 18.5352 10C17.9308 9.0814 17.2354 8.2259 16.46 7.44629C14.8487 5.83504 12.65 4.375 10 4.375ZM10 5.625C11.1603 5.625 12.2733 6.08578 13.0938 6.90625C13.9142 7.72672 14.375 8.83968 14.375 10C14.375 11.1603 13.9142 12.2733 13.0938 13.0938C12.2733 13.9142 11.1603 14.375 10 14.375C8.83968 14.375 7.72672 13.9142 6.90625 13.0938C6.08578 12.2733 5.625 11.1603 5.625 10C5.625 8.83968 6.08578 7.72672 6.90625 6.90625C7.72672 6.08578 8.83968 5.625 10 5.625ZM10 6.875C9.1712 6.875 8.37609 7.20399 7.79004 7.79004C7.20399 8.37609 6.875 9.1712 6.875 10C6.875 10.8288 7.20399 11.6239 7.79004 12.21C8.37609 12.796 9.1712 13.125 10 13.125C10.8288 13.125 11.6239 12.796 12.21 12.21C12.796 11.6239 13.125 10.8288 13.125 10C13.125 9.1712 12.796 8.37609 12.21 7.79004C11.6239 7.20399 10.8288 6.875 10 6.875Z"
                        fill="#3C4658"
                      />
                    </svg>
                    {locales.route.system.list.preview}
                  </Link>
                </OverlayMenu.ListItem>
              </OverlayMenu>
            </li>
          )}
          {(stage === null || stage.slug !== "on-site") && (
            <li className="flex gap-0.5 p-4 justify-between">
              <div className="flex flex-col gap-0.5">
                <p className="font-semibold">
                  {locales.route.system.list.fifteenMinutesBefore.title}
                </p>
                <p>
                  {locales.route.system.list.fifteenMinutesBefore.description}
                </p>
              </div>
              <OverlayMenu
                as="circle-button"
                searchParam={`overlay-menu-${NOTIFICATION_TYPE_ON_FIFTEEN_MINUTES_BEFORE}`}
                locales={locales.route.system.list}
              >
                <OverlayMenu.ListItem>
                  <Link
                    {...OverlayMenu.getListChildrenStyles()}
                    {...OverlayMenu.getIdToFocusWhenOpening()}
                    to={`../preview?${NOTIFICATION_TYPE_SEARCH_PARAM}=${NOTIFICATION_TYPE_ON_FIFTEEN_MINUTES_BEFORE}&${Deep}=true`}
                    prefetch="intent"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="20"
                      height="20"
                      viewBox="0 0 20 20"
                      fill="none"
                    >
                      <path
                        d="M10 3.125C16.2494 3.125 19.9993 9.99863 20 10C19.9996 10.0007 16.2497 16.875 10 16.875C3.75 16.875 0 10 0 10C0.000464002 9.99915 3.75039 3.125 10 3.125ZM10 4.375C7.35 4.375 5.14977 5.83504 3.54102 7.44629C2.76562 8.22586 2.07018 9.08146 1.46582 10H1.46484C2.06924 10.9186 2.7646 11.7741 3.54004 12.5537C5.15129 14.165 7.35 15.625 10 15.625C12.6488 15.625 14.8487 14.165 16.46 12.5537C17.2536 11.7601 17.8723 10.9603 18.291 10.3604C18.3823 10.2291 18.4627 10.1087 18.5352 10C17.9308 9.0814 17.2354 8.2259 16.46 7.44629C14.8487 5.83504 12.65 4.375 10 4.375ZM10 5.625C11.1603 5.625 12.2733 6.08578 13.0938 6.90625C13.9142 7.72672 14.375 8.83968 14.375 10C14.375 11.1603 13.9142 12.2733 13.0938 13.0938C12.2733 13.9142 11.1603 14.375 10 14.375C8.83968 14.375 7.72672 13.9142 6.90625 13.0938C6.08578 12.2733 5.625 11.1603 5.625 10C5.625 8.83968 6.08578 7.72672 6.90625 6.90625C7.72672 6.08578 8.83968 5.625 10 5.625ZM10 6.875C9.1712 6.875 8.37609 7.20399 7.79004 7.79004C7.20399 8.37609 6.875 9.1712 6.875 10C6.875 10.8288 7.20399 11.6239 7.79004 12.21C8.37609 12.796 9.1712 13.125 10 13.125C10.8288 13.125 11.6239 12.796 12.21 12.21C12.796 11.6239 13.125 10.8288 13.125 10C13.125 9.1712 12.796 8.37609 12.21 7.79004C11.6239 7.20399 10.8288 6.875 10 6.875Z"
                        fill="#3C4658"
                      />
                    </svg>
                    {locales.route.system.list.preview}
                  </Link>
                </OverlayMenu.ListItem>
              </OverlayMenu>
            </li>
          )}
        </ul>
      </div>
    </div>
  );
}

export default NotificationsList;
