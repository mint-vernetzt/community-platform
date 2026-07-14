import { Button } from "@mint-vernetzt/components/src/molecules/Button";
import { captureException } from "@sentry/node";
import {
  Form,
  Link,
  NavLink,
  Outlet,
  redirect,
  useLoaderData,
  useLocation,
  useSearchParams,
  type LoaderFunctionArgs,
  type ActionFunctionArgs,
} from "react-router";
import {
  createAuthClient,
  getSessionUser,
  getSessionUserOrThrow,
} from "~/auth.server";
import BackButton from "~/components/next/BackButton";
import BasicStructure from "~/components/next/BasicStructure";
import SettingsHeading from "~/components/next/SettingsHeading";
import SettingsNavigation from "~/components/next/SettingsNavigation";
import { INTENT_FIELD_NAME } from "~/form-helpers";
import { detectLanguage } from "~/i18n.server";
import { invariantResponse } from "~/lib/utils/response";
import { Deep, extendSearchParams } from "~/lib/utils/searchParams";
import { languageModuleMap } from "~/locales/.server";
import { checkFeatureAbilitiesOrThrow } from "~/routes/feature-access.server";
import { redirectWithToast } from "~/toast.server";
import {
  getEventBySlug,
  getEventBySlugForIssues,
  getIssues,
  getRedirectPathOnProtectedEventRoute,
  updateEventBySlug,
} from "./settings.server";
import {
  FIRST_PUBLISH_EVENT_INTENT,
  getLinkIssueInfo,
  PUBLISH_EVENT_INTENT,
  PUBLISH_EVENT_MODAL_SEARCH_PARAM,
} from "./settings.shared";
import { Modal } from "~/components-next/Modal";
import Hint from "~/components/next/Hint";
import { insertComponentsIntoLocale } from "~/lib/utils/i18n";

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
  await checkFeatureAbilitiesOrThrow(authClient, ["events"]);

  const language = await detectLanguage(request);
  const locales = languageModuleMap[language]["event/$slug/settings"];

  const event = await getEventBySlug(slug);
  invariantResponse(event !== null, "Event not found", { status: 404 });
  const enhancedEvent = { ...event, hasStarted: event.startTime < new Date() };

  let issues: ReturnType<typeof getIssues> = [];
  if (event.publishIntended) {
    const eventForIssues = await getEventBySlugForIssues(slug);
    issues = getIssues({
      event: eventForIssues,
      locales: languageModuleMap[language]["event/$slug/settings"].route,
    });
  }

  return { locales, event: enhancedEvent, issues };
}

export async function action(args: ActionFunctionArgs) {
  const { request, params } = args;
  invariantResponse(typeof params.slug === "string", "slug is not defined", {
    status: 400,
  });
  const { authClient } = createAuthClient(request);
  await checkFeatureAbilitiesOrThrow(authClient, ["events"]);
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
  const locales = languageModuleMap[language]["event/$slug/settings"];

  const formData = await request.formData();
  const intent = formData.get(INTENT_FIELD_NAME);
  invariantResponse(
    intent === FIRST_PUBLISH_EVENT_INTENT || intent === PUBLISH_EVENT_INTENT,
    locales.route.errors.invalidIntent,
    {
      status: 400,
    }
  );

  const event = await getEventBySlug(params.slug);
  invariantResponse(event !== null, "Event not found", { status: 404 });

  if (event.parentEvent !== null && event.parentEvent.published === false) {
    return redirectWithToast(request.url, {
      id: "publish-error",
      key: `publish-error-${Date.now()}`,
      message: locales.route.parentEventNotPublishedHint,
      level: "negative",
    });
  }

  try {
    if (intent === FIRST_PUBLISH_EVENT_INTENT) {
      await updateEventBySlug(params.slug, {
        publishIntended: true,
      });
      const url = new URL(request.url);
      const location = formData.get("location");
      const searchParams = extendSearchParams(url.searchParams, {
        addOrReplace: { [PUBLISH_EVENT_MODAL_SEARCH_PARAM]: "true" },
      });
      return redirect(`${location}?${searchParams.toString()}`);
    } else if (intent === PUBLISH_EVENT_INTENT) {
      await updateEventBySlug(params.slug, {
        published: true,
      });
    }
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
}

export default function Settings() {
  const loaderData = useLoaderData<typeof loader>();
  const { locales, event, issues } = loaderData;
  const [searchParams] = useSearchParams();

  const deep = searchParams.get(Deep);

  const location = useLocation();
  const leafPathname = location.pathname
    .replace(`/event/${event.slug}/settings/`, "")
    .split("/")[0];
  const links: Array<{
    to: string;
    label: string;
    count?: number;
    disabled?: boolean;
    hint?: string;
    issues?: Array<{ section: string; fields: string[]; message: string }>;
    critical?: boolean;
  }> = [
    {
      to: `participants/list?${Deep}=true`,
      label: locales.route.menu.participants,
      count: event._count.participants,
      disabled: event.published === false || event.external,
      hint:
        event.published === false
          ? locales.route.menuHints.participantsDisabledUntilPublished
          : event.external
            ? locales.route.menuHints.externalEvent
            : event.openForRegistration === false &&
                event._count.participants === 0
              ? locales.route.menuHints.inviteParticipants
              : event._count.waitingList > 0
                ? locales.route.menuHints.waitingListHasMembers
                : undefined,
    },
    {
      to: `time-period?${Deep}=true`,
      label: locales.route.menu.timePeriod,
      disabled: event.hasStarted,
      hint: event.hasStarted
        ? locales.route.menuHints.eventHasStarted
        : undefined,
    },
    {
      to: `registration/access?${Deep}=true`,
      label: locales.route.menu.registration,
      ...getLinkIssueInfo({
        section: "registration",
        issues: loaderData.issues,
        locales: locales.route.menuHints,
      }),
    },
    {
      to: `details/info?${Deep}=true`,
      label: locales.route.menu.details,
      ...getLinkIssueInfo({
        section: "details",
        issues: loaderData.issues,
        locales: locales.route.menuHints,
      }),
    },
    {
      to: `location?${Deep}=true`,
      label: locales.route.menu.location,
      ...getLinkIssueInfo({
        section: "location",
        issues: loaderData.issues,
        locales: locales.route.menuHints,
      }),
    },
    {
      to: `admins/list?${Deep}=true`,
      label: locales.route.menu.admins,
      count: event._count.admins,
    },
    {
      to: `team/list?${Deep}=true`,
      label: locales.route.menu.team,
      count: event._count.teamMembers,
    },
    {
      to:
        event._count.speakers > 0
          ? `speakers/list?${Deep}=true`
          : `speakers/add?${Deep}=true`,
      label: locales.route.menu.speakers,
      count: event._count.speakers,
    },

    {
      to:
        event._count.responsibleOrganizations > 0
          ? `responsible-orgs/list?${Deep}=true`
          : `responsible-orgs/add?${Deep}=true`,
      label: locales.route.menu.responsibleOrgs,
      count: event._count.responsibleOrganizations,
    },
    {
      to:
        event._count.documents > 0
          ? `documents/list?${Deep}=true`
          : `documents/add?${Deep}=true`,
      label: locales.route.menu.documents,
      count: event._count.documents,
    },
    {
      to: `related-events/${event._count.childEvents > 0 ? "child-events" : "parent-event"}?${Deep}=true`,
      label: locales.route.menu.relatedEvents,
      count:
        event._count.childEvents > 0
          ? event._count.childEvents
          : event.parentEventId !== null
            ? 1
            : 0,
    },
    {
      to: `danger-zone/change-url?${Deep}=true`,
      label: locales.route.menu.dangerZone,
      critical: true,
    },
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
                  const toSlug = link.to
                    .replace(`?${Deep}=true`, "")
                    .split("/")[0];
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
              <p className="text-primary-700 text-base font-normal leading-5">
                {`${locales.route.publishHint} ${
                  event.parentEvent !== null &&
                  event.parentEvent.published === false
                    ? locales.route.parentEventNotPublishedHint
                    : ""
                }`.trim()}
              </p>
              {event.publishIntended === false ? (
                <Form method="post" action={location.pathname}>
                  <input
                    type="hidden"
                    name="location"
                    value={location.pathname}
                  />
                  <Button
                    name={INTENT_FIELD_NAME}
                    value={FIRST_PUBLISH_EVENT_INTENT}
                    type="submit"
                    variant="outline"
                    fullSize
                    disabled={
                      event.parentEvent !== null &&
                      event.parentEvent.published === false
                    }
                  >
                    {locales.route.publishCta}
                  </Button>
                </Form>
              ) : (
                <Button
                  as="link"
                  to={`${location.pathname}?${extendSearchParams(searchParams, { addOrReplace: { [PUBLISH_EVENT_MODAL_SEARCH_PARAM]: "true" } })}`}
                  variant="outline"
                  fullSize
                  preventScrollReset
                  disabled={
                    event.parentEvent !== null &&
                    event.parentEvent.published === false
                  }
                >
                  {locales.route.publishCta}
                </Button>
              )}
            </div>
          </SettingsNavigation.MobileActionSection>
        ) : null}
        {event.published === false ? (
          <SettingsNavigation.DesktopActionSection>
            <span>
              {`${locales.route.publishHint} ${
                event.parentEvent !== null &&
                event.parentEvent.published === false
                  ? locales.route.parentEventNotPublishedHint
                  : ""
              }`.trim()}
            </span>
            {event.publishIntended === false ? (
              <Form method="post">
                <input
                  type="hidden"
                  name="location"
                  value={location.pathname}
                />
                <Button
                  name={INTENT_FIELD_NAME}
                  value={FIRST_PUBLISH_EVENT_INTENT}
                  type="submit"
                  variant="outline"
                  fullSize
                  disabled={
                    event.parentEvent !== null &&
                    event.parentEvent.published === false
                  }
                >
                  {locales.route.publishCta}
                </Button>
              </Form>
            ) : (
              <Button
                as="link"
                to={`${location.pathname}?${extendSearchParams(searchParams, { addOrReplace: { [PUBLISH_EVENT_MODAL_SEARCH_PARAM]: "true" } })}`}
                variant="outline"
                preventScrollReset
                disabled={
                  event.parentEvent !== null &&
                  event.parentEvent.published === false
                }
              >
                {locales.route.publishCta}
              </Button>
            )}
          </SettingsNavigation.DesktopActionSection>
        ) : null}
        {links.map((link) => {
          return (
            <SettingsNavigation.Item
              key={link.to}
              active={
                leafPathname ===
                link.to.replace(`?${Deep}=true`, "").split("/")[0]
              }
              critical={link.critical}
            >
              {link.disabled ? (
                <div
                  {...SettingsNavigation.getSettingsNavigationItemStyles({
                    disabled: true,
                  })}
                >
                  <SettingsNavigation.Item.Label>
                    <div className="flex flex-col gap-2">
                      <span>{link.label}</span>
                      {link.hint && (
                        <span className="font-normal text-base text-neutral-700">
                          {link.hint}
                        </span>
                      )}
                    </div>
                    {typeof link.count !== "undefined" && link.count !== 0 ? (
                      <SettingsNavigation.Item.Counter>
                        {link.count}
                      </SettingsNavigation.Item.Counter>
                    ) : null}
                  </SettingsNavigation.Item.Label>
                </div>
              ) : (
                <NavLink
                  to={link.to}
                  prefetch="intent"
                  className={() => {
                    const isActive =
                      leafPathname ===
                      link.to.replace(`?${Deep}=true`, "").split("/")[0];
                    return SettingsNavigation.getSettingsNavigationItemStyles({
                      active: isActive,
                      critical: link.critical,
                    }).className;
                  }}
                >
                  <SettingsNavigation.Item.Label>
                    <div className="flex flex-col gap-2">
                      <span className="flex items-center gap-2">
                        {link.label}
                        {typeof link.count !== "undefined" &&
                        link.count !== 0 ? (
                          <SettingsNavigation.Item.Counter>
                            {link.count}
                          </SettingsNavigation.Item.Counter>
                        ) : null}
                      </span>
                      {link.hint && (
                        <span className="font-normal text-base flex items-center gap-2 text-neutral-700">
                          {link.hint}
                          {Array.isArray(link.issues) &&
                            link.issues.length > 0 && (
                              <span className="rounded-full w-2 h-2 bg-primary-300" />
                            )}
                        </span>
                      )}
                    </div>
                  </SettingsNavigation.Item.Label>
                  <SettingsNavigation.Item.ChevronRightIcon />
                </NavLink>
              )}
            </SettingsNavigation.Item>
          );
        })}
        <SettingsNavigation.Content>
          <Outlet />
        </SettingsNavigation.Content>
      </SettingsNavigation>
      {issues.length > 0 ? (
        <Modal searchParam={PUBLISH_EVENT_MODAL_SEARCH_PARAM}>
          <Modal.Title>
            {locales.route.modal.publishEventModal.withIssues.headline}
          </Modal.Title>
          <Modal.Section>
            {locales.route.modal.publishEventModal.withIssues.description}
            <Hint>
              {insertComponentsIntoLocale(
                locales.route.modal.publishEventModal.hint,
                [<span key="semibold" className="font-semibold" />]
              )}
            </Hint>
            <div className="flex flex-col gap-4">
              {issues.map((issue, index) => {
                return (
                  <div
                    key={`${issue.section}-${issue.fields.join("-")}-${index}`}
                    className="flex flex-col gap-2 border-neutral-200 border rounded-lg p-4 text-neutral-700"
                  >
                    <p className="font-semibold text-lg">
                      {
                        locales.route.menu[
                          issue.section as keyof typeof locales.route.menu
                        ]
                      }
                    </p>
                    <div className="flex gap-2 items-center">
                      <p className="text-sm">{issue.message}</p>
                      <div className="rounded-full w-2 h-2 bg-primary-300" />
                    </div>
                  </div>
                );
              })}
            </div>
          </Modal.Section>
          <Modal.Controls>
            <Button
              as="link"
              to={`${location.pathname}?${extendSearchParams(searchParams, { remove: [PUBLISH_EVENT_MODAL_SEARCH_PARAM] })}`}
              fullSize
            >
              {locales.route.modal.publishEventModal.withIssues.cancel}
            </Button>
            <Form method="post" className="w-full">
              <Button
                type="submit"
                fullSize
                variant="outline"
                name={INTENT_FIELD_NAME}
                value={PUBLISH_EVENT_INTENT}
              >
                {locales.route.modal.publishEventModal.withIssues.submit}
              </Button>
            </Form>
          </Modal.Controls>
        </Modal>
      ) : (
        <Modal searchParam={PUBLISH_EVENT_MODAL_SEARCH_PARAM}>
          <Modal.Title>
            {locales.route.modal.publishEventModal.noIssues.headline}
          </Modal.Title>
          <Modal.Section>
            {locales.route.modal.publishEventModal.noIssues.description}
            <Hint>
              {insertComponentsIntoLocale(
                locales.route.modal.publishEventModal.hint,
                [<span key="semibold" className="font-semibold" />]
              )}
            </Hint>
          </Modal.Section>
          <Modal.Controls>
            <Form method="post" className="w-full">
              <Button
                type="submit"
                fullSize
                name={INTENT_FIELD_NAME}
                value={PUBLISH_EVENT_INTENT}
              >
                {locales.route.modal.publishEventModal.noIssues.submit}
              </Button>
            </Form>
            <Button
              as="link"
              to={`${location.pathname}?${extendSearchParams(searchParams, { remove: [PUBLISH_EVENT_MODAL_SEARCH_PARAM] })}`}
              variant="outline"
              fullSize
            >
              {locales.route.modal.publishEventModal.noIssues.cancel}
            </Button>
          </Modal.Controls>
        </Modal>
      )}
    </BasicStructure>
  );
}
