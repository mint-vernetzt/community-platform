import type { LoaderFunctionArgs } from "react-router";
import {
  Link,
  Outlet,
  redirect,
  useLoaderData,
  useLocation,
  useSearchParams,
} from "react-router";
import {
  createAuthClient,
  getSessionUserOrRedirectPathToLogin,
} from "~/auth.server";
import MobileSettingsHeader from "~/components/next/MobileSettingsHeader";
import { detectLanguage } from "~/i18n.server";
import { invariantResponse } from "~/lib/utils/response";
import { Deep } from "~/lib/utils/searchParams";
import { languageModuleMap } from "~/locales/.server";
import { deriveEventMode } from "~/routes/event/utils.server";
import { checkFeatureAbilitiesOrThrow } from "~/routes/feature-access.server";
import { getEventBySlug } from "./settings.server";
import { useState } from "react";

export const loader = async (args: LoaderFunctionArgs) => {
  const { request, params } = args;
  const slug = params.slug;
  invariantResponse(typeof slug === "string", "Slug is required", {
    status: 400,
  });
  const { authClient } = createAuthClient(request);
  const { sessionUser, redirectPath } =
    await getSessionUserOrRedirectPathToLogin(authClient, request);

  if (sessionUser === null && redirectPath !== null) {
    return redirect(redirectPath);
  }
  const mode = await deriveEventMode(sessionUser, slug);
  invariantResponse(mode === "admin", "Not authorized", { status: 403 });

  const language = await detectLanguage(request);
  const locales = languageModuleMap[language]["next/event/$slug/settings"];

  await checkFeatureAbilitiesOrThrow(authClient, "next_event_settings");
  await checkFeatureAbilitiesOrThrow(authClient, "events");

  const event = await getEventBySlug(slug);
  invariantResponse(event !== null, "Event not found", { status: 404 });

  return { locales, event };
};

export default function Settings() {
  const loaderData = useLoaderData<typeof loader>();
  const { locales, event } = loaderData;
  const [searchParams] = useSearchParams();
  const deepParam = searchParams.get(Deep);
  const [deep, setDeep] = useState(deepParam);

  const location = useLocation();
  const leafPathname = location.pathname.replace(
    `/next/event/${event.slug}/settings/`,
    ""
  );
  const links = [
    { to: `time-period?${Deep}`, label: locales.route.menu.timePeriod },
    { to: `registration?${Deep}`, label: locales.route.menu.registration },
    { to: `details?${Deep}`, label: locales.route.menu.details },
    { to: `location?${Deep}`, label: locales.route.menu.location },
    { to: `admins?${Deep}`, label: locales.route.menu.admins },
    { to: `team?${Deep}`, label: locales.route.menu.team },
    { to: `speakers?${Deep}`, label: locales.route.menu.speakers },
    { to: `participants?${Deep}`, label: locales.route.menu.participants },
    {
      to: `responsible-orgs?${Deep}`,
      label: locales.route.menu.responsibleOrgs,
    },
    { to: `documents?${Deep}`, label: locales.route.menu.documents },
    { to: `related-events?${Deep}`, label: locales.route.menu.relatedEvents },
    { to: `danger-zone?${Deep}`, label: locales.route.menu.dangerZone },
  ];

  return (
    <>
      <MobileSettingsHeader>
        <MobileSettingsHeader.Heading>
          {deep === null
            ? locales.route.mobileHeadline
            : links.find((link) => {
                const toSlug = link.to.replace(`?${Deep}`, "");
                return toSlug === leafPathname;
              })?.label || locales.route.mobileHeadline}
        </MobileSettingsHeader.Heading>
        {deep === null ? (
          <MobileSettingsHeader.Close>
            <Link
              to={`/event/${event.slug}/detail/about`}
              aria-label={locales.route.close}
              prefetch="intent"
            >
              <MobileSettingsHeader.CloseIcon />
            </Link>
          </MobileSettingsHeader.Close>
        ) : (
          <MobileSettingsHeader.Back>
            <Link
              to={location.pathname}
              onClick={(event) => {
                event.preventDefault();
                setDeep(null);
              }}
              aria-label={locales.route.back}
              prefetch="intent"
            >
              <MobileSettingsHeader.BackIcon />
            </Link>
          </MobileSettingsHeader.Back>
        )}
      </MobileSettingsHeader>
      {deep !== null ? <Outlet /> : null}
    </>
  );
}
