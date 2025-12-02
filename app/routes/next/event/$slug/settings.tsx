import type { LoaderFunctionArgs } from "react-router";
import {
  Link,
  NavLink,
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
import { Button } from "@mint-vernetzt/components/src/molecules/Button";
import SettingsNavi from "~/components/next/SettingsNavi";

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
  const deep = searchParams.get(Deep);

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
    {
      to: `admins?${Deep}`,
      label: locales.route.menu.admins,
      count: event._count.admins,
    },
    {
      to: `team?${Deep}`,
      label: locales.route.menu.team,
      count: event._count.teamMembers,
    },
    {
      to: `speakers?${Deep}`,
      label: locales.route.menu.speakers,
      count: event._count.speakers,
    },
    {
      to: `participants?${Deep}`,
      label: locales.route.menu.participants,
      count: event._count.participants,
    },
    {
      to: `responsible-orgs?${Deep}`,
      label: locales.route.menu.responsibleOrgs,
      count: event._count.responsibleOrganizations,
    },
    {
      to: `documents?${Deep}`,
      label: locales.route.menu.documents,
      count: event._count.documents,
    },
    {
      to: `related-events?${Deep}`,
      label: locales.route.menu.relatedEvents,
      count: event._count.childEvents,
    },
    { to: `danger-zone?${Deep}`, label: locales.route.menu.dangerZone },
  ];

  return (
    <>
      <SettingsNavi deep={deep}>
        <SettingsNavi.MobileSettingsHeader>
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
                aria-label={locales.route.back}
                prefetch="intent"
              >
                <MobileSettingsHeader.BackIcon />
              </Link>
            </MobileSettingsHeader.Back>
          )}
        </SettingsNavi.MobileSettingsHeader>
        {event.published === false ? (
          <SettingsNavi.ActionSection>
            <div className="w-full p-4 flex flex-col gap-2.5 bg-primary-50 lg:hidden">
              <p className="text-neutral-600 text-base font-normal leading-5">
                {locales.route.publishHint}
              </p>
              <div className="w-full md:w-fit">
                {/* TODO: When implementing action remember to redirect to current leaf route and not this parent route */}
                <Button variant="outline" fullSize>
                  {locales.route.publishCta}
                </Button>
              </div>
            </div>
          </SettingsNavi.ActionSection>
        ) : null}
        {links.map((link) => {
          return (
            <SettingsNavi.Item
              key={link.to}
              active={leafPathname === link.to.replace(`?${Deep}`, "")}
              critical={link.to.includes("danger-zone")}
            >
              <NavLink
                to={link.to}
                prefetch="intent"
                className={({ isActive }) => {
                  return SettingsNavi.getSettingsNaviItemStyles({
                    active: isActive,
                    critical: link.to.includes("danger-zone"),
                  }).className;
                }}
                preventScrollReset={true}
              >
                <SettingsNavi.Item.Label>
                  <span>{link.label}</span>
                  {typeof link.count !== "undefined" && link.count !== 0 ? (
                    <SettingsNavi.Item.Counter>
                      {link.count}
                    </SettingsNavi.Item.Counter>
                  ) : null}
                </SettingsNavi.Item.Label>
                <SettingsNavi.Item.ChevronRightIcon />
              </NavLink>
            </SettingsNavi.Item>
          );
        })}
      </SettingsNavi>
      {deep !== null ? <Outlet /> : null}
    </>
  );
}
