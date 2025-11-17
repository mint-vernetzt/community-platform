import { parseWithZod } from "@conform-to/zod-v1";
import {
  type ActionFunctionArgs,
  Link,
  type LoaderFunctionArgs,
  type MetaArgs,
  Outlet,
  redirect,
  useActionData,
  useLoaderData,
  useLocation,
  useNavigate,
  useNavigation,
} from "react-router";
import { createAuthClient, getSessionUser } from "~/auth.server";
import { detectLanguage } from "~/i18n.server";
import { invariantResponse } from "~/lib/utils/response";
import { languageModuleMap } from "~/locales/.server";
import {
  checkFeatureAbilitiesOrThrow,
  getFeatureAbilities,
} from "~/routes/feature-access.server";
import {
  addProfileToParticipants,
  addProfileToWaitingList,
  deriveModeForEvent,
  disconnectBackgroundImage,
  getAbuseReportReasons,
  getEventBySlug,
  getEventIdBySlug,
  getHasUserReportedEvent,
  getIsMember,
  isAdminOfEvent,
  removeProfileFromParticipants,
  removeProfileFromWaitingList,
  reportEvent,
  uploadBackgroundImage,
} from "./detail.server";

import { utcToZonedTime } from "date-fns-tz";
import { z } from "zod";
import BackButton from "~/components/next/BackButton";
import BasicStructure from "~/components/next/BasicStructure";
import BreadCrump from "~/components/next/BreadCrump";
import EventsOverview from "~/components/next/EventsOverview";
import TabBar from "~/components/next/TabBar";
import { INTENT_FIELD_NAME } from "~/form-helpers";
import { BlurFactor, getImageURL, ImageSizes } from "~/images.server";
import { DefaultImages } from "~/images.shared";
import { getPublicURL, parseMultipartFormData } from "~/storage.server";
import { redirectWithToast } from "~/toast.server";
import { ABUSE_REPORT_INTENT, createAbuseReportSchema } from "./details.shared";
import { formatDateTime } from "./index.shared";

import { captureException } from "@sentry/node";
import rcSliderStyles from "rc-slider/assets/index.css?url";
import reactCropStyles from "react-image-crop/dist/ReactCrop.css?url";
import { IMAGE_CROPPER_DISCONNECT_INTENT_VALUE } from "~/components/legacy/ImageCropper/ImageCropper";
import { insertParametersIntoLocale } from "~/lib/utils/i18n";
import { removeHtmlTags } from "~/lib/utils/transformHtml";
import { type loader as rootLoader } from "~/root";
import { UPLOAD_INTENT_VALUE } from "~/storage.shared";
import { usePreviousLocation } from "~/components/next/PreviousLocationContext";
import { getFullDepthParticipantIds } from "./detail/participants.server";
import { filterEventConferenceLink } from "./utils.server";

export function links() {
  return [
    { rel: "stylesheet", href: rcSliderStyles },
    { rel: "stylesheet", href: reactCropStyles },
  ];
}

export function meta(
  args: MetaArgs<typeof loader, { root: typeof rootLoader }>
) {
  const { loaderData, matches } = args;

  const rootLoaderData = matches.find((match) => {
    return match.id === "root";
  });

  if (
    typeof loaderData === "undefined" ||
    loaderData === null ||
    typeof rootLoaderData === "undefined" ||
    rootLoaderData === null
  ) {
    return [
      { title: "MINTvernetzt Community Plattform" },
      {
        name: "description",
        property: "og:description",
        content:
          "Entdecke auf der MINTvernetzt Community-Plattform andere MINT-Akteur:innen, Organisationen und MINT-Veranstaltungen und lass Dich für Deine Arbeit inspirieren.",
      },
    ];
  }

  const {
    meta: { url },
  } = rootLoaderData.loaderData;

  if (loaderData.event.description === null) {
    return [
      {
        title: `MINTvernetzt Community Plattform | ${loaderData.event.name}`,
      },
      {
        name: "description",
        property: "og:description",
        content:
          "Entdecke auf der MINTvernetzt Community-Plattform andere MINT-Akteur:innen, Organisationen und MINT-Veranstaltungen und lass Dich für Deine Arbeit inspirieren.",
      },
      {
        name: "image",
        property: "og:image",
        content:
          loaderData.meta.baseUrl + "/images/default-event-background.jpg",
      },
      {
        property: "og:image:secure_url",
        content:
          loaderData.meta.baseUrl + "/images/default-event-background.jpg",
      },
      {
        property: "og:url",
        content: url,
      },
    ];
  }
  if (loaderData.event.description === null) {
    return [
      {
        title: `MINTvernetzt Community Plattform | ${loaderData.event.name}`,
      },
      {
        name: "description",
        property: "og:description",
        content:
          "Entdecke auf der MINTvernetzt Community-Plattform andere MINT-Akteur:innen, Organisationen und MINT-Veranstaltungen und lass Dich für Deine Arbeit inspirieren.",
      },
      {
        name: "image",
        property: "og:image",
        content: loaderData.event.background,
      },
      {
        property: "og:image:secure_url",
        content: loaderData.event.background,
      },
      {
        property: "og:url",
        content: url,
      },
    ];
  }
  if (loaderData.event.background === null) {
    return [
      {
        title: `MINTvernetzt Community Plattform | ${loaderData.event.name}`,
      },
      {
        name: "description",
        property: "og:description",
        content: removeHtmlTags(loaderData.event.description),
      },
      {
        name: "image",
        property: "og:image",
        content:
          loaderData.meta.baseUrl + "/images/default-event-background.jpg",
      },
      {
        property: "og:image:secure_url",
        content:
          loaderData.meta.baseUrl + "/images/default-event-background.jpg",
      },
      {
        property: "og:url",
        content: url,
      },
    ];
  }
  return [
    {
      title: `MINTvernetzt Community Plattform | ${loaderData.event.name}`,
    },
    {
      name: "description",
      property: "og:description",
      content: removeHtmlTags(loaderData.event.description),
    },
    {
      name: "image",
      property: "og:image",
      content: loaderData.event.background,
    },
    {
      property: "og:image:secure_url",
      content: loaderData.event.background,
    },
    {
      property: "og:url",
      content: url,
    },
  ];
}

function createParticipationSchema(locales: { invalidProfileId: string }) {
  const schema = z.object({
    profileId: z.string().uuid(locales.invalidProfileId),
  });
  return schema;
}

export async function loader(args: LoaderFunctionArgs) {
  const { request, params } = args;
  const { authClient } = createAuthClient(request);
  const sessionUser = await getSessionUser(authClient);

  const abilities = await getFeatureAbilities(authClient, "next_event");
  if (abilities.next_event.hasAccess === false) {
    return redirect("/");
  }

  const language = await detectLanguage(request);
  const locales = languageModuleMap[language]["event/$slug/detail"];

  invariantResponse(typeof params.slug !== "undefined", "slug not found", {
    status: 400,
  });

  const event = await getEventBySlug(params.slug);

  invariantResponse(event !== null, "event not found", { status: 404 });

  const now = utcToZonedTime(new Date(), "Europe/Berlin");

  const startTime = utcToZonedTime(event.startTime, "Europe/Berlin");
  const endTime = utcToZonedTime(event.endTime, "Europe/Berlin");
  const participationFrom = utcToZonedTime(
    event.participationFrom,
    "Europe/Berlin"
  );
  const participationUntil = utcToZonedTime(
    event.participationUntil,
    "Europe/Berlin"
  );

  const beforeParticipationPeriod = now < participationFrom;
  const afterParticipationPeriod = now > participationUntil;
  const inPast = now > endTime;

  const mode = await deriveModeForEvent(sessionUser, {
    ...event,
    participantCount: event._count.participants,
    beforeParticipationPeriod,
    afterParticipationPeriod,
    inPast,
  });

  // No right to access unpublished events
  const isMember = await getIsMember(sessionUser, event);
  invariantResponse(event.published || isMember, "event not found", {
    status: 404,
  });

  let blurredBackground;
  let background = event.background;
  if (background !== null) {
    const publicURL = getPublicURL(authClient, background);
    if (publicURL) {
      background = getImageURL(publicURL, {
        resize: {
          type: "fill",
          width: ImageSizes.Event.Detail.Background.width,
          height: ImageSizes.Event.Detail.Background.height,
        },
      });
      blurredBackground = getImageURL(publicURL, {
        resize: {
          type: "fill",
          width: ImageSizes.Event.Detail.BlurredBackground.width,
          height: ImageSizes.Event.Detail.BlurredBackground.height,
        },
        blur: BlurFactor,
      });
    }
  } else {
    background = DefaultImages.Event.Background;
    blurredBackground = DefaultImages.Event.BlurredBackground;
  }

  const responsibleOrganizations = event.responsibleOrganizations.map(
    (relation) => {
      let logo = relation.organization.logo;
      let blurredLogo;
      if (logo !== null) {
        const publicURL = getPublicURL(authClient, logo);
        if (publicURL !== null) {
          logo = getImageURL(publicURL, {
            resize: {
              type: "fill",
              ...ImageSizes.Organization.EventDetailResponsibleOrganization
                .Logo,
            },
          });
          blurredLogo = getImageURL(publicURL, {
            resize: {
              type: "fill",
              ...ImageSizes.Organization.EventDetailResponsibleOrganization
                .BlurredLogo,
            },
            blur: BlurFactor,
          });
        }
      }
      return {
        ...relation.organization,
        logo,
        blurredLogo,
      };
    }
  );

  const hasUserReportedEvent = await getHasUserReportedEvent(
    sessionUser,
    event.id
  );

  const abuseReportReasons = await getAbuseReportReasons();

  let participantsCount;
  if (event._count.childEvents > 0) {
    const participantIds = await getFullDepthParticipantIds(params.slug);
    participantsCount = participantIds.length;
  } else {
    participantsCount = event._count.participants;
  }

  const { conferenceLink, conferenceCode, conferenceLinkToBeAnnounced } =
    await filterEventConferenceLink({
      event,
      mode,
      isMember,
      inPast,
    });

  const enhancedEvent = {
    ...event,
    startTime,
    endTime,
    participationFrom,
    participationUntil,
    background,
    blurredBackground,
    responsibleOrganizations,
    conferenceLink,
    conferenceCode,
    conferenceLinkToBeAnnounced,
    _count: {
      ...event._count,
      participants: participantsCount,
    },
  };

  return {
    event: enhancedEvent,
    locales,
    language,
    meta: {
      baseUrl: process.env.COMMUNITY_BASE_URL,
    },
    beforeParticipationPeriod,
    afterParticipationPeriod,
    inPast,
    mode,
    profileId: sessionUser !== null ? sessionUser.id : undefined,
    hasUserReportedEvent,
    abuseReportReasons,
  };
}

export async function action(args: ActionFunctionArgs) {
  const { request, params } = args;
  const { authClient } = createAuthClient(request);
  const sessionUser = await getSessionUser(authClient);
  if (sessionUser === null) {
    const url = new URL(request.url);
    const pathname = url.pathname;
    return redirect(`/login?login_redirect=${encodeURIComponent(pathname)}`);
  }

  const abilities = await getFeatureAbilities(authClient, "next_event");
  if (abilities.next_event.hasAccess === false) {
    return redirect("/");
  }

  invariantResponse(typeof params.slug !== "undefined", "slug not found", {
    status: 400,
  });

  const language = await detectLanguage(request);
  const locales = languageModuleMap[language]["event/$slug/detail"];

  const eventId = await getEventIdBySlug(params.slug!);
  invariantResponse(eventId !== null, "event not found", { status: 404 });

  const { formData, error } = await parseMultipartFormData(request);
  if (error !== null || formData === null) {
    console.error({ error });
    captureException(error);
    // TODO: How can we add this to the zod ctx?
    return redirectWithToast(request.url, {
      id: "upload-failed",
      key: `${new Date().getTime()}`,
      message: locales.route.errors.background.upload,
      level: "negative",
    });
  }

  const intent = formData.get(INTENT_FIELD_NAME);

  invariantResponse(
    intent === "participate" ||
      intent === "withdrawParticipation" ||
      intent === "joinWaitingList" ||
      intent === "leaveWaitingList" ||
      intent === ABUSE_REPORT_INTENT ||
      intent === UPLOAD_INTENT_VALUE ||
      intent === IMAGE_CROPPER_DISCONNECT_INTENT_VALUE,
    "Invalid intent",
    {
      status: 400,
    }
  );

  const event = {
    id: eventId,
    slug: params.slug,
  };

  if (
    intent === UPLOAD_INTENT_VALUE ||
    intent === IMAGE_CROPPER_DISCONNECT_INTENT_VALUE
  ) {
    let submission;
    let toast;
    let redirectUrl: string | null = request.url;
    if (intent === UPLOAD_INTENT_VALUE) {
      const isAdmin = await isAdminOfEvent(sessionUser, event);
      invariantResponse(isAdmin, "Not authorized", { status: 403 });
      const result = await uploadBackgroundImage({
        request,
        formData,
        authClient,
        slug: event.slug,
        locales: {
          ...locales.route.changeBackground,
          errors: locales.route.errors,
        },
      });
      submission = result.submission;
      toast = result.toast;
      redirectUrl = result.redirectUrl || request.url;
    } else {
      const result = await disconnectBackgroundImage({
        request,
        formData,
        slug: event.slug,
        locales: {
          ...locales.route.changeBackground,
          errors: locales.route.errors,
        },
      });
      submission = result.submission;
      toast = result.toast;
      redirectUrl = result.redirectUrl || request.url;
    }
    if (submission !== null) {
      return {
        submission: submission.reply(),
        currentTimestamp: Date.now(),
      };
    }
    if (toast === null) {
      return redirect(redirectUrl);
    }
    return redirectWithToast(redirectUrl, toast);
  }

  if (intent === ABUSE_REPORT_INTENT) {
    await checkFeatureAbilitiesOrThrow(authClient, "abuse_report");
    const submission = await parseWithZod(formData, {
      schema: createAbuseReportSchema(locales.route.abuseReport).transform(
        async (data, ctx) => {
          const { reasons, otherReason } = data;
          if (
            data.reasons.length === 0 &&
            typeof data.otherReason !== "string"
          ) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: locales.route.errors.abuseReport.reasons.required,
            });
            return z.NEVER;
          }
          const { error } = await reportEvent({
            sessionUser,
            event,
            reasons,
            otherReason,
            locales: locales.route.abuseReport,
          });
          if (typeof error !== "undefined") {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: locales.route.errors.abuseReport.submit,
            });
            return z.NEVER;
          }
          return { ...data };
        }
      ),
      async: true,
    });

    if (submission.status !== "success") {
      return {
        submission: submission.reply(),
        currentTimestamp: Date.now(),
      };
    }

    return redirectWithToast(request.url, {
      id: "abuse-report-submitted-toast",
      key: `${new Date().getTime()}`,
      message: locales.route.success.abuseReport,
    });
  }

  const submission = await parseWithZod(formData, {
    schema: createParticipationSchema(locales.route.errors).transform(
      async (data, ctx) => {
        let result: { error?: unknown } = {};
        if (intent === "participate") {
          result = await addProfileToParticipants(sessionUser.id, eventId);
        } else if (intent === "withdrawParticipation") {
          result = await removeProfileFromParticipants(sessionUser.id, eventId);
        } else if (intent === "joinWaitingList") {
          result = await addProfileToWaitingList(sessionUser.id, eventId);
        } else {
          result = await removeProfileFromWaitingList(sessionUser.id, eventId);
        }
        if (typeof result.error !== "undefined") {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: locales.route.errors[intent],
          });
          return z.NEVER;
        }
        return data;
      }
    ),
    async: true,
  });

  if (submission.status !== "success") {
    return {
      submission: submission.reply(),
      currentTimestamp: Date.now(),
    };
  }

  return redirectWithToast(request.url, {
    id: "update-participation-toast",
    key: `${new Date().getTime()}`,
    message: locales.route.success[intent],
  });
}

function Detail() {
  const loaderData = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const location = useLocation();
  const { pathname } = location;

  const previousLocation = usePreviousLocation();
  const navigate = useNavigate();

  return (
    <BasicStructure>
      {loaderData.event.parentEvent !== null ? (
        <BreadCrump>
          <BreadCrump.Link
            to={`/event/${loaderData.event.parentEvent.slug}/detail/about`}
            prefetch="intent"
          >
            {loaderData.event.parentEvent.name}
          </BreadCrump.Link>
          <BreadCrump.Current>{loaderData.event.name}</BreadCrump.Current>
        </BreadCrump>
      ) : (
        <BackButton
          to={
            previousLocation !== null &&
            previousLocation.pathname === "/explore/events"
              ? `${previousLocation.pathname}${previousLocation.search}`
              : "/explore/events"
          }
          onClick={(event) => {
            if (
              previousLocation !== null &&
              previousLocation.pathname === "/explore/events"
            ) {
              event.preventDefault();
              navigate(-1);
            }
          }}
          prefetch="intent"
        >
          {loaderData.locales.route.content.back}
        </BackButton>
      )}
      <EventsOverview>
        <EventsOverview.Image
          alt={loaderData.event.name}
          src={loaderData.event.background}
          blurredSrc={loaderData.event.blurredBackground}
        />
        {loaderData.mode === "admin" && (
          <>
            <EventsOverview.EditBackground
              locales={loaderData.locales.route.content}
            />
            <EventsOverview.EditBackgroundModal
              background={loaderData.event.background}
              blurredBackground={loaderData.event.blurredBackground}
              locales={{
                ...loaderData.locales.route.changeBackground,
                alt: insertParametersIntoLocale(
                  loaderData.locales.route.changeBackground.alt,
                  { eventName: loaderData.event.name }
                ),
              }}
            />
          </>
        )}
        {loaderData.event.published === false && (
          <EventsOverview.StateFlag>
            {loaderData.locales.route.content.draft}
          </EventsOverview.StateFlag>
        )}
        {loaderData.event.canceled && loaderData.event.published && (
          <EventsOverview.StateFlag tint="negative">
            {loaderData.locales.route.content.canceled}
          </EventsOverview.StateFlag>
        )}
        {loaderData.beforeParticipationPeriod && (
          <EventsOverview.State>
            {formatDateTime(
              loaderData.event.participationFrom,
              loaderData.language,
              loaderData.locales.route.content.beforeParticipationPeriod
            )}
          </EventsOverview.State>
        )}
        {loaderData.afterParticipationPeriod && loaderData.inPast === false && (
          <EventsOverview.State>
            {loaderData.locales.route.content.afterParticipationPeriod}
          </EventsOverview.State>
        )}
        {loaderData.inPast && (
          <EventsOverview.State tint="neutral">
            {loaderData.locales.route.content.inPast}
          </EventsOverview.State>
        )}
        <EventsOverview.Container>
          <EventsOverview.EventName>
            {loaderData.event.name}
          </EventsOverview.EventName>

          <EventsOverview.InfoContainer>
            <EventsOverview.ResponsibleOrganizations
              organizations={loaderData.event.responsibleOrganizations}
              locales={loaderData.locales}
            />
            <EventsOverview.PeriodOfTime
              slug={loaderData.event.slug}
              startTime={loaderData.event.startTime}
              endTime={loaderData.event.endTime}
              language={loaderData.language}
            />
            {loaderData.event.stage !== null && (
              <EventsOverview.Stage
                slug={loaderData.event.slug}
                venueName={loaderData.event.venueName}
                venueStreet={loaderData.event.venueStreet}
                venueStreetNumber={loaderData.event.venueStreetNumber}
                venueZipCode={loaderData.event.venueZipCode}
                venueCity={loaderData.event.venueCity}
                stage={
                  loaderData.event.stage
                    .slug as keyof typeof loaderData.locales.stages
                }
                conferenceLink={loaderData.event.conferenceLink}
                conferenceLinkToBeAnnounced={
                  loaderData.event.conferenceLinkToBeAnnounced
                }
                locales={loaderData.locales}
              />
            )}
            <EventsOverview.FreeSeats
              participantLimit={loaderData.event.participantLimit}
              participantsCount={loaderData.event._count.participants}
              locales={loaderData.locales}
            />
          </EventsOverview.InfoContainer>
          <EventsOverview.ButtonStates>
            <EventsOverview.OverlayMenu
              baseUrl={loaderData.meta.baseUrl}
              overlayMenuId="event-overview-more"
              locales={loaderData.locales.route.content}
            >
              <EventsOverview.OverlayMenu.CopyURLToClipboard // naming?
                locales={loaderData.locales.route.content}
              />
              <EventsOverview.OverlayMenu.ReportEvent
                modalName="modal-report-event"
                alreadyReported={loaderData.hasUserReportedEvent}
                locales={loaderData.locales.route.content}
              />
            </EventsOverview.OverlayMenu>
            <EventsOverview.AbuseReportModal
              modalName="modal-report-event"
              locales={{
                ...loaderData.locales.route.abuseReport,
                eventAbuseReportReasonSuggestions:
                  loaderData.locales.eventAbuseReportReasonSuggestions,
              }}
              reasons={loaderData.abuseReportReasons}
              lastResult={
                navigation.state !== "idle" && typeof actionData !== "undefined"
                  ? actionData.submission
                  : null
              }
            />
            {loaderData.mode === "admin" && (
              <EventsOverview.Edit slug={loaderData.event.slug}>
                {loaderData.locales.route.content.edit}
              </EventsOverview.Edit>
            )}
            {loaderData.mode === "anon" && (
              <EventsOverview.Login pathname={pathname}>
                {loaderData.locales.route.content.login}
              </EventsOverview.Login>
            )}
            {loaderData.mode === "canParticipate" && (
              <EventsOverview.Participate profileId={loaderData.profileId}>
                {loaderData.locales.route.content.participate}
              </EventsOverview.Participate>
            )}
            {loaderData.mode === "participating" && (
              <EventsOverview.WithdrawParticipation
                profileId={loaderData.profileId}
              >
                {loaderData.locales.route.content.withdrawParticipation}
              </EventsOverview.WithdrawParticipation>
            )}
            {loaderData.mode === "canWait" && (
              <EventsOverview.JoinWaitingList profileId={loaderData.profileId}>
                {loaderData.locales.route.content.joinWaitingList}
              </EventsOverview.JoinWaitingList>
            )}
            {loaderData.mode === "waiting" && (
              <EventsOverview.LeaveWaitingList profileId={loaderData.profileId}>
                {loaderData.locales.route.content.leaveWaitingList}
              </EventsOverview.LeaveWaitingList>
            )}
          </EventsOverview.ButtonStates>
        </EventsOverview.Container>
      </EventsOverview>
      <BasicStructure.Container>
        <TabBar>
          <TabBar.Item active={pathname.endsWith("/about")}>
            <Link to="./about" preventScrollReset>
              <TabBar.Item.Title>
                {loaderData.locales.route.content.details}
              </TabBar.Item.Title>
            </Link>
          </TabBar.Item>
          {loaderData.event._count.participants > 0 &&
            loaderData.mode !== "anon" && (
              <TabBar.Item active={pathname.endsWith("/participants")}>
                <Link
                  to="./participants"
                  preventScrollReset
                  {...TabBar.getItemElementsContainerClasses()}
                >
                  <TabBar.Item.Title>
                    {loaderData.locales.route.content.participants}
                  </TabBar.Item.Title>
                  <TabBar.Item.Counter>
                    {loaderData.event._count.participants}
                  </TabBar.Item.Counter>
                </Link>
              </TabBar.Item>
            )}
          {loaderData.event._count.childEvents > 0 && (
            <TabBar.Item active={pathname.endsWith("/child-events")}>
              <Link
                to="./child-events"
                preventScrollReset
                {...TabBar.getItemElementsContainerClasses()}
              >
                <TabBar.Item.Title>
                  {loaderData.locales.route.content.childEvents}
                </TabBar.Item.Title>
                <TabBar.Item.Counter>
                  {loaderData.event._count.childEvents}
                </TabBar.Item.Counter>
              </Link>
            </TabBar.Item>
          )}
        </TabBar>
        <Outlet />
      </BasicStructure.Container>
    </BasicStructure>
  );
}

export default Detail;
