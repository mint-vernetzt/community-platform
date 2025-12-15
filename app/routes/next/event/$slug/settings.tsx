import { Button } from "@mint-vernetzt/components/src/molecules/Button";
import { captureException } from "@sentry/node";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import {
  Form,
  Link,
  NavLink,
  Outlet,
  redirect,
  useLoaderData,
  useLocation,
  useSearchParams,
} from "react-router";
import { createAuthClient, getSessionUserOrThrow } from "~/auth.server";
import BackButton from "~/components/next/BackButton";
import BasicStructure from "~/components/next/BasicStructure";
import SettingsHeading from "~/components/next/SettingsHeading";
import SettingsNavigation from "~/components/next/SettingsNavigation";
import { INTENT_FIELD_NAME } from "~/form-helpers";
import { detectLanguage } from "~/i18n.server";
import { invariantResponse } from "~/lib/utils/response";
import { Deep } from "~/lib/utils/searchParams";
import { languageModuleMap } from "~/locales/.server";
import { checkFeatureAbilitiesOrThrow } from "~/routes/feature-access.server";
import { redirectWithToast } from "~/toast.server";
import {
  getEventBySlug,
  getRedirectPathOnProtectedEventRoute,
  updateEventBySlug,
} from "./settings.server";

export const loader = async (args: LoaderFunctionArgs) => {
  const { request, params } = args;
  const slug = params.slug;
  invariantResponse(typeof slug === "string", "Slug is required", {
    status: 400,
  });
  const { authClient } = createAuthClient(request);
  const sessionUser = await getSessionUserOrThrow(authClient);
  const redirectPath = await getRedirectPathOnProtectedEventRoute({
    request,
    slug,
    sessionUser,
    authClient,
  });
  if (redirectPath !== null) {
    return redirect(redirectPath);
  }

  const language = await detectLanguage(request);
  const locales = languageModuleMap[language]["next/event/$slug/settings"];

  await checkFeatureAbilitiesOrThrow(authClient, "next_event_settings");
  await checkFeatureAbilitiesOrThrow(authClient, "events");

  const event = await getEventBySlug(slug);
  invariantResponse(event !== null, "Event not found", { status: 404 });

  return { locales, event };
};

export const action = async (args: ActionFunctionArgs) => {
  const { request, params } = args;
  invariantResponse(typeof params.slug === "string", "slug is not defined", {
    status: 400,
  });
  const { authClient } = createAuthClient(request);
  await checkFeatureAbilitiesOrThrow(authClient, [
    "events",
    "next_event_settings",
  ]);
  const sessionUser = await getSessionUserOrThrow(authClient);
  const redirectPath = await getRedirectPathOnProtectedEventRoute({
    request,
    slug: params.slug,
    sessionUser,
    authClient,
  });
  if (redirectPath !== null) {
    return redirect(redirectPath);
  }
  const language = await detectLanguage(request);
  const locales = languageModuleMap[language]["next/event/$slug/settings"];

  const formData = await request.formData();
  const intent = formData.get(INTENT_FIELD_NAME);
  invariantResponse(intent === "publish", locales.route.errors.invalidIntent, {
    status: 400,
  });

  try {
    await updateEventBySlug(params.slug, {
      published: true,
    });
  } catch (error) {
    captureException(error);
    return redirectWithToast(`/event/${params.slug}/settings/time-period`, {
      id: "publish-error",
      key: `publish-error-${Date.now()}`,
      message: locales.route.errors.publishFailed,
      level: "negative",
    });
  }

  return redirectWithToast(`/event/${params.slug}/detail/about`, {
    id: "publish-success",
    key: `publish-success-${Date.now()}`,
    message: locales.route.publishSuccess,
  });
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
    <BasicStructure>
      <div className="hidden lg:block">
        <BackButton to={`/event/${event.slug}/detail/about`} prefetch="intent">
          {loaderData.locales.route.close}
        </BackButton>
      </div>
      <div className="hidden lg:block">
        <SettingsHeading>{locales.route.desktopHeadline}</SettingsHeading>
      </div>
      <SettingsNavigation deep={deep}>
        <SettingsNavigation.MobileHeader>
          <SettingsNavigation.MobileHeader.Heading>
            {deep === null
              ? locales.route.mobileHeadline
              : links.find((link) => {
                  const toSlug = link.to.replace(`?${Deep}`, "");
                  return toSlug === leafPathname;
                })?.label || locales.route.mobileHeadline}
          </SettingsNavigation.MobileHeader.Heading>
          {deep === null ? (
            <SettingsNavigation.MobileHeader.Close>
              <Link
                to={`/event/${event.slug}/detail/about`}
                aria-label={locales.route.close}
                prefetch="intent"
              >
                <SettingsNavigation.MobileHeader.CloseIcon />
              </Link>
            </SettingsNavigation.MobileHeader.Close>
          ) : (
            <SettingsNavigation.MobileHeader.Back>
              <Link
                to={location.pathname}
                aria-label={locales.route.back}
                prefetch="intent"
              >
                <SettingsNavigation.MobileHeader.BackIcon />
              </Link>
            </SettingsNavigation.MobileHeader.Back>
          )}
        </SettingsNavigation.MobileHeader>
        <SettingsNavigation.DesktopHeader>
          {event.name}
        </SettingsNavigation.DesktopHeader>
        {event.published === false ? (
          <SettingsNavigation.MobileActionSection>
            <div className="w-full p-4 flex flex-col gap-2.5 bg-primary-50 lg:hidden">
              <p className="text-neutral-600 text-base font-normal leading-5">
                {locales.route.publishHint}
              </p>
              <Form method="post">
                <div className="w-full md:w-fit">
                  <Button
                    name={INTENT_FIELD_NAME}
                    value="publish"
                    type="submit"
                    variant="outline"
                    fullSize
                  >
                    {locales.route.publishCta}
                  </Button>
                </div>
              </Form>
            </div>
          </SettingsNavigation.MobileActionSection>
        ) : null}
        {event.published === false ? (
          <SettingsNavigation.DesktopActionSection>
            <span>{locales.route.publishHint}</span>
            <Form method="post">
              <Button
                name={INTENT_FIELD_NAME}
                value="publish"
                type="submit"
                variant="outline"
              >
                {locales.route.publishCta}
              </Button>
            </Form>
          </SettingsNavigation.DesktopActionSection>
        ) : null}
        {links.map((link) => {
          return (
            <SettingsNavigation.Item
              key={link.to}
              active={leafPathname === link.to.replace(`?${Deep}`, "")}
              critical={link.to.includes("danger-zone")}
            >
              <NavLink
                to={link.to}
                prefetch="intent"
                className={({ isActive }) => {
                  return SettingsNavigation.getSettingsNavigationItemStyles({
                    active: isActive,
                    critical: link.to.includes("danger-zone"),
                  }).className;
                }}
                preventScrollReset={true}
              >
                <SettingsNavigation.Item.Label>
                  <span>{link.label}</span>
                  {typeof link.count !== "undefined" && link.count !== 0 ? (
                    <SettingsNavigation.Item.Counter>
                      {link.count}
                    </SettingsNavigation.Item.Counter>
                  ) : null}
                </SettingsNavigation.Item.Label>
                <SettingsNavigation.Item.ChevronRightIcon />
              </NavLink>
            </SettingsNavigation.Item>
          );
        })}
        <SettingsNavigation.Content>
          <Outlet />
        </SettingsNavigation.Content>
      </SettingsNavigation>
    </BasicStructure>
  );
}
