import { getFormProps, getInputProps, useForm } from "@conform-to/react-v1";
import { getZodConstraint, parseWithZod } from "@conform-to/zod-v1";
import { Avatar } from "@mint-vernetzt/components/src/molecules/Avatar";
import { Button } from "@mint-vernetzt/components/src/molecules/Button";
import { Image } from "@mint-vernetzt/components/src/molecules/Image";
import { Input } from "@mint-vernetzt/components/src/molecules/Input";
import { TextButton } from "@mint-vernetzt/components/src/molecules/TextButton";
import { utcToZonedTime } from "date-fns-tz";
import rcSliderStyles from "rc-slider/assets/index.css?url";
import reactCropStyles from "react-image-crop/dist/ReactCrop.css?url";
import type {
  ActionFunctionArgs,
  LoaderFunctionArgs,
  MetaFunction,
} from "react-router";
import {
  Form,
  Link,
  redirect,
  useActionData,
  useLoaderData,
  useNavigation,
} from "react-router";
import { useHydrated } from "remix-utils/use-hydrated";
import { z } from "zod";
import { createAuthClient, getSessionUser } from "~/auth.server";
import { Modal } from "~/components-next/Modal";
import ImageCropper, {
  IMAGE_CROPPER_DISCONNECT_INTENT_VALUE,
} from "~/components/ImageCropper/ImageCropper";
import { RichText } from "~/components/Richtext/RichText";
import { INTENT_FIELD_NAME } from "~/form-helpers";
import { detectLanguage } from "~/i18n.server";
import { type supportedCookieLanguages } from "~/i18n.shared";
import { ImageAspects, MaxImageSizes, MinCropSizes } from "~/images.shared";
import {
  canUserAccessConferenceLink,
  canUserBeAddedToWaitingList,
  canUserParticipate,
} from "~/lib/event/utils";
import { getInitials } from "~/lib/profile/getInitials";
import { getInitialsOfName } from "~/lib/string/getInitialsOfName";
import {
  insertComponentsIntoLocale,
  insertParametersIntoLocale,
} from "~/lib/utils/i18n";
import { invariantResponse } from "~/lib/utils/response";
import { getParamValueOrThrow } from "~/lib/utils/routes";
import { getDuration } from "~/lib/utils/time";
import { removeHtmlTags } from "~/lib/utils/transformHtml";
import { type ArrayElement } from "~/lib/utils/types";
import { languageModuleMap } from "~/locales/.server";
import { prismaClient } from "~/prisma.server";
import { parseMultipartFormData } from "~/storage.server";
import { UPLOAD_INTENT_VALUE } from "~/storage.shared";
import { redirectWithToast } from "~/toast.server";
import { deriveEventMode } from "../utils.server";
import {
  disconnectBackgroundImage,
  submitEventAbuseReport,
  uploadBackgroundImage,
  type EventDetailLocales,
} from "./index.server";
import { AddParticipantButton } from "./settings/participants/add-participant";
import { RemoveParticipantForm } from "./settings/participants/remove-participant";
import { getRedirectPathOnProtectedEventRoute } from "./settings/utils.server";
import { AddToWaitingListButton } from "./settings/waiting-list/add-to-waiting-list";
import { RemoveFromWaitingListButton } from "./settings/waiting-list/remove-from-waiting-list";
import {
  addImgUrls,
  enhanceChildEventsWithParticipationStatus,
  filterEvent,
  getEvent,
  getEventParticipants,
  getEventSpeakers,
  getFullDepthProfiles,
  getIsOnWaitingList,
  getIsParticipant,
  getIsSpeaker,
  getIsTeamMember,
  type FullDepthProfilesQuery,
  type ParticipantsQuery,
  type SpeakersQuery,
} from "./utils.server";
import {
  checkFeatureAbilitiesOrThrow,
  getFeatureAbilities,
} from "~/routes/feature-access.server";
import { captureException } from "@sentry/node";

export function links() {
  return [
    { rel: "stylesheet", href: rcSliderStyles },
    { rel: "stylesheet", href: reactCropStyles },
  ];
}

export const meta: MetaFunction<typeof loader> = (args) => {
  const { data } = args;

  if (typeof data === "undefined" || data === null) {
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
  if (data.event.description === null) {
    return [
      {
        title: `MINTvernetzt Community Plattform | ${data.event.name}`,
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
        content: data.meta.baseUrl + "/images/default-event-background.jpg",
      },
      {
        property: "og:image:secure_url",
        content: data.meta.baseUrl + "/images/default-event-background.jpg",
      },
      {
        property: "og:url",
        content: data.meta.url,
      },
    ];
  }
  if (data.event.description === null) {
    return [
      {
        title: `MINTvernetzt Community Plattform | ${data.event.name}`,
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
        content: data.event.background,
      },
      {
        property: "og:image:secure_url",
        content: data.event.background,
      },
      {
        property: "og:url",
        content: data.meta.url,
      },
    ];
  }
  if (data.event.background === null) {
    return [
      {
        title: `MINTvernetzt Community Plattform | ${data.event.name}`,
      },
      {
        name: "description",
        property: "og:description",
        content: removeHtmlTags(data.event.description),
      },
      {
        name: "image",
        property: "og:image",
        content: data.meta.baseUrl + "/images/default-event-background.jpg",
      },
      {
        property: "og:image:secure_url",
        content: data.meta.baseUrl + "/images/default-event-background.jpg",
      },
      {
        property: "og:url",
        content: data.meta.url,
      },
    ];
  }
  return [
    {
      title: `MINTvernetzt Community Plattform | ${data.event.name}`,
    },
    {
      name: "description",
      property: "og:description",
      content: removeHtmlTags(data.event.description),
    },
    {
      name: "image",
      property: "og:image",
      content: data.event.background,
    },
    {
      property: "og:image:secure_url",
      content: data.event.background,
    },
    {
      property: "og:url",
      content: data.meta.url,
    },
  ];
};

export const loader = async (args: LoaderFunctionArgs) => {
  const { request, params } = args;
  const slug = getParamValueOrThrow(params, "slug");
  const { authClient } = createAuthClient(request);
  const abilities = await getFeatureAbilities(authClient, [
    "events",
    "abuse_report",
  ]);
  const language = await detectLanguage(request);
  const locales = languageModuleMap[language]["event/$slug/index"];

  const sessionUser = await getSessionUser(authClient);

  const rawEvent = await getEvent(slug);

  invariantResponse(rawEvent !== null, locales.route.error.notFound, {
    status: 404,
  });

  const mode = await deriveEventMode(sessionUser, slug);

  // TODO: Could this be inserted in deriveEventMode? It defines a mode for the session user in this specific context.
  let isParticipant;
  let isOnWaitingList;
  let isSpeaker;
  let isTeamMember;
  if (sessionUser !== null) {
    isParticipant = await getIsParticipant(rawEvent.id, sessionUser.id);
    isOnWaitingList = await getIsOnWaitingList(rawEvent.id, sessionUser.id);
    isSpeaker = await getIsSpeaker(rawEvent.id, sessionUser.id);
    isTeamMember = await getIsTeamMember(rawEvent.id, sessionUser.id);
  } else {
    isParticipant = false;
    isOnWaitingList = false;
    isSpeaker = false;
    isTeamMember = false;
  }

  if (mode !== "admin" && !isTeamMember && rawEvent.published === false) {
    invariantResponse(false, locales.route.error.notPublished, { status: 403 });
  }

  let speakers: SpeakersQuery | FullDepthProfilesQuery = [];
  let participants: ParticipantsQuery | FullDepthProfilesQuery = [];

  // Adding participants and speakers
  if (rawEvent.childEvents.length > 0) {
    speakers = (await getFullDepthProfiles(rawEvent.id, "speakers")) || [];
    participants =
      (await getFullDepthProfiles(rawEvent.id, "participants")) || [];
  } else {
    speakers = await getEventSpeakers(rawEvent.id);
    participants = await getEventParticipants(rawEvent.id);
  }
  let enhancedEvent = {
    ...rawEvent,
    speakers,
    participants,
  };

  // Filtering by publish status
  const filteredChildEvents = [];
  for (const childEvent of enhancedEvent.childEvents) {
    if (childEvent.published) {
      filteredChildEvents.push(childEvent);
    } else {
      if (sessionUser !== null) {
        const childMode = await deriveEventMode(sessionUser, childEvent.slug);
        const isTeamMember = await getIsTeamMember(
          childEvent.id,
          sessionUser.id
        );
        if (childMode === "admin" || isTeamMember) {
          filteredChildEvents.push(childEvent);
        }
      }
    }
  }
  enhancedEvent = { ...enhancedEvent, childEvents: filteredChildEvents };

  // Filtering by visbility settings
  if (mode === "anon") {
    // TODO: Still async as its using the old filter method for speakers and participants because of raw queries
    // When refactoring events use the new filter method
    enhancedEvent = await filterEvent(enhancedEvent);
  }
  // Add imgUrls for imgproxy call on client
  const imageEnhancedEvent = addImgUrls(authClient, enhancedEvent);

  // Adding participation status
  const enhancedChildEvents = await enhanceChildEventsWithParticipationStatus(
    sessionUser,
    imageEnhancedEvent.childEvents
  );
  const eventWithParticipationStatus = {
    ...imageEnhancedEvent,
    childEvents: enhancedChildEvents,
  };

  // Hiding conference link when session user is not participating (participant, speaker, teamMember) or when its not known yet
  if (
    canUserAccessConferenceLink(
      eventWithParticipationStatus,
      isParticipant,
      isSpeaker,
      isTeamMember
    ) === false
  ) {
    eventWithParticipationStatus.conferenceLink = null;
    eventWithParticipationStatus.conferenceCode = null;
  } else {
    // TODO: move decision what to show in link (message) to frontend (allow handling in frontend, do not decide on backend)
    if (
      eventWithParticipationStatus.conferenceLink === null ||
      eventWithParticipationStatus.conferenceLink === ""
    ) {
      eventWithParticipationStatus.conferenceLink = "noch nicht bekannt";
      eventWithParticipationStatus.conferenceCode = null;
    }
  }

  let alreadyAbuseReported;
  if (sessionUser !== null) {
    const openAbuseReport = await prismaClient.eventAbuseReport.findFirst({
      select: {
        id: true,
      },
      where: {
        eventId: eventWithParticipationStatus.id,
        status: "open",
        reporterId: sessionUser.id,
      },
    });
    alreadyAbuseReported = openAbuseReport !== null;
  }

  const abuseReportReasons =
    await prismaClient.eventAbuseReportReasonSuggestion.findMany({
      select: {
        slug: true,
        description: true,
      },
    });

  return {
    mode,
    event: eventWithParticipationStatus,
    userId: sessionUser?.id || undefined,
    isParticipant,
    isOnWaitingList,
    isSpeaker,
    isTeamMember,
    abilities,
    alreadyAbuseReported,
    abuseReportReasons,
    meta: {
      baseUrl: process.env.COMMUNITY_BASE_URL,
      url: request.url,
    },
    locales,
    language,
    currentTimestamp: Date.now(),
  };
};

export const OTHER_ABUSE_REPORT_REASONS_MAX_LENGTH = 250;

export const createAbuseReportSchema = (locales: EventDetailLocales) =>
  z.object({
    [INTENT_FIELD_NAME]: z.enum(["submit-abuse-report"]),
    reasons: z.array(z.string()),
    otherReason: z
      .string()
      .max(
        OTHER_ABUSE_REPORT_REASONS_MAX_LENGTH,
        insertParametersIntoLocale(locales.route.abuseReport.max, {
          max: OTHER_ABUSE_REPORT_REASONS_MAX_LENGTH,
        })
      )
      .optional(),
  });

export const action = async (args: ActionFunctionArgs) => {
  const { request, params } = args;
  const slug = getParamValueOrThrow(params, "slug");
  const { authClient } = createAuthClient(request);
  const sessionUser = await getSessionUser(authClient);
  invariantResponse(sessionUser !== null, "Forbidden", { status: 403 });
  const language = await detectLanguage(request);
  const locales = languageModuleMap[language]["event/$slug/index"];

  const { formData, error } = await parseMultipartFormData(request);
  if (error !== null || formData === null) {
    console.error({ error });
    captureException(error);
    // TODO: How can we add this to the zod ctx?
    return redirectWithToast(request.url, {
      id: "upload-failed",
      key: `${new Date().getTime()}`,
      message: locales.route.error.onStoring,
      level: "negative",
    });
  }

  const intent = formData.get(INTENT_FIELD_NAME);
  let submission;
  let toast;
  let redirectUrl: string | null = request.url;

  if (intent === UPLOAD_INTENT_VALUE) {
    const redirectPath = await getRedirectPathOnProtectedEventRoute({
      request,
      slug,
      sessionUser,
      authClient,
    });
    if (redirectPath !== null) {
      return redirect(redirectPath);
    }
    const result = await uploadBackgroundImage({
      request,
      formData,
      authClient,
      slug,
      locales,
    });
    submission = result.submission;
    toast = result.toast;
    redirectUrl = result.redirectUrl || request.url;
  } else if (intent === IMAGE_CROPPER_DISCONNECT_INTENT_VALUE) {
    const redirectPath = await getRedirectPathOnProtectedEventRoute({
      request,
      slug,
      sessionUser,
      authClient,
    });
    if (redirectPath !== null) {
      return redirect(redirectPath);
    }
    const result = await disconnectBackgroundImage({
      request,
      formData,
      slug,
      locales,
    });
    submission = result.submission;
    toast = result.toast;
    redirectUrl = result.redirectUrl || request.url;
  } else if (intent === "submit-abuse-report") {
    await checkFeatureAbilitiesOrThrow(authClient, "abuse_report");
    const result = await submitEventAbuseReport({
      request,
      formData,
      slug,
      locales,
      authClient,
      sessionUser,
    });
    submission = result.submission;
    toast = result.toast;
    redirectUrl = result.redirectUrl || request.url;
  } else {
    // TODO: How can we add this to the zod ctx?
    return redirectWithToast(request.url, {
      id: "invalid-action",
      key: `${new Date().getTime()}`,
      message: locales.route.error.invalidAction,
      level: "negative",
    });
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
};

function getCallToActionForm(loaderData: {
  locales: EventDetailLocales;
  userId?: string;
  isParticipant: boolean;
  isOnWaitingList: boolean;
  event: {
    id: string;
    participantLimit: number | null;
    _count: {
      participants: number;
    };
  };
}) {
  const isParticipating = loaderData.isParticipant;
  const isOnWaitingList = loaderData.isOnWaitingList;

  const participantLimitReached =
    loaderData.event.participantLimit !== null
      ? loaderData.event.participantLimit <=
        loaderData.event._count.participants
      : false;

  if (isParticipating) {
    return (
      <>
        <Form method="get" preventScrollReset>
          <input hidden name="modal-remove-participant" defaultValue="true" />
          <button
            type="submit"
            className="mv-h-auto mv-min-h-0 mv-whitespace-nowrap mv-py-2 mv-px-6 mv-normal-case mv-leading-6 mv-inline-flex mv-cursor-pointer mv-outline-primary mv-shrink-0 mv-flex-wrap mv-items-center mv-justify-center mv-rounded-lg mv-text-center mv-border-primary mv-text-sm mv-font-semibold mv-border mv-bg-primary mv-text-white"
          >
            {loaderData.locales.route.content.event.removeParticipant.action}
          </button>
        </Form>
        <div className="mv-hidden">
          <RemoveParticipantForm
            id="remove-participant"
            action="./settings/participants/remove-participant"
            profileId={loaderData.userId}
            modalSearchParam="modal-remove-participant"
            locales={loaderData.locales}
          />
        </div>
        <Modal searchParam="modal-remove-participant">
          <Modal.Title>
            {
              loaderData.locales.route.content.event.removeParticipant
                .doubleCheck.title
            }
          </Modal.Title>
          <Modal.Section>
            {
              loaderData.locales.route.content.event.removeParticipant
                .doubleCheck.description
            }
          </Modal.Section>
          <Modal.SubmitButton form="remove-participant">
            {loaderData.locales.route.content.event.removeParticipant.action}
          </Modal.SubmitButton>
          <Modal.CloseButton>
            {
              loaderData.locales.route.content.event.removeParticipant
                .doubleCheck.abort
            }
          </Modal.CloseButton>
        </Modal>
      </>
    );
  } else if (isOnWaitingList) {
    return (
      <RemoveFromWaitingListButton
        action="./settings/waiting-list/remove-from-waiting-list"
        profileId={loaderData.userId}
        locales={loaderData.locales}
      />
    );
  } else {
    if (participantLimitReached) {
      return (
        <AddToWaitingListButton
          action="./settings/waiting-list/add-to-waiting-list"
          profileId={loaderData.userId}
          locales={loaderData.locales}
        />
      );
    } else {
      return (
        <AddParticipantButton
          action="./settings/participants/add-participant"
          profileId={loaderData.userId}
          locales={loaderData.locales}
        />
      );
    }
  }
}

function formatDateTime(
  date: Date,
  language: ArrayElement<typeof supportedCookieLanguages>,
  locales: EventDetailLocales
) {
  return insertParametersIntoLocale(locales.route.content.clock, {
    date: date.toLocaleDateString(language, {
      day: "2-digit",
      month: "long",
      year: "numeric",
    }),
    time: date.toLocaleTimeString(language, {
      hour: "2-digit",
      minute: "2-digit",
    }),
  });
}

function Index() {
  const loaderData = useLoaderData<typeof loader>();
  const { locales, language } = loaderData;
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isHydrated = useHydrated();

  const now = utcToZonedTime(new Date(), "Europe/Berlin");

  const startTime = utcToZonedTime(loaderData.event.startTime, "Europe/Berlin");
  const endTime = utcToZonedTime(loaderData.event.endTime, "Europe/Berlin");
  const participationFrom = utcToZonedTime(
    loaderData.event.participationFrom,
    "Europe/Berlin"
  );
  const participationUntil = utcToZonedTime(
    loaderData.event.participationUntil,
    "Europe/Berlin"
  );

  const beforeParticipationPeriod = now < participationFrom;

  const afterParticipationPeriod = now > participationUntil;

  const laysInThePast = now > endTime;

  const CallToActionForm = getCallToActionForm(loaderData);

  const duration = getDuration(startTime, endTime, language);

  const background = loaderData.event.background;
  const blurredBackground = loaderData.event.blurredBackground;
  const name = loaderData.event.name;

  const [abuseReportForm, abuseReportFields] = useForm({
    id: `abuse-report-form-${
      actionData?.currentTimestamp || loaderData.currentTimestamp
    }`,
    constraint: getZodConstraint(createAbuseReportSchema(locales)),
    defaultValue: {
      [INTENT_FIELD_NAME]: "submit-abuse-report",
    },
    shouldValidate: "onInput",
    shouldRevalidate: "onInput",
    lastResult: navigation.state === "idle" ? actionData?.submission : null,
    onValidate: (args) => {
      const { formData } = args;
      const submission = parseWithZod(formData, {
        schema: createAbuseReportSchema(locales),
      });
      return submission;
    },
  });

  return (
    <>
      <section className="mv-w-full mv-mx-auto mv-px-4 @sm:mv-max-w-screen-container-sm @md:mv-max-w-screen-container-md @lg:mv-max-w-screen-container-lg @xl:mv-max-w-screen-container-xl @xl:mv-px-6 @2xl:mv-max-w-screen-container-2xl mv-mb-2 @md:mv-mb-4 @md:mv-mt-2">
        <div className="mv-font-semibold mv-text-neutral-500 mv-flex mv-flex-wrap mv-items-center mv-mb-4">
          {loaderData.event.parentEvent !== null ? (
            <>
              {/* TODO: I want prefetch intent here but the TextButton cannot be used with a remix Link wrapped inside. */}
              <TextButton
                as="a"
                href={`/event/${loaderData.event.parentEvent.slug}`}
                weight="thin"
                variant="neutral"
                arrowRight
              >
                {loaderData.event.parentEvent.name}
              </TextButton>
              <span className="mv-w-full @md:mv-w-auto mv-text-neutral mv-font-thin">
                {loaderData.event.name}
              </span>
            </>
          ) : (
            // TODO: I want prefetch intent here but the TextButton cannot be used with a remix Link wrapped inside.
            <TextButton
              as="a"
              href="/explore/events"
              weight="thin"
              variant="neutral"
              arrowLeft
            >
              {locales.route.content.back}
            </TextButton>
          )}
        </div>
        {loaderData.abilities.abuse_report.hasAccess &&
          loaderData.mode === "authenticated" &&
          loaderData.alreadyAbuseReported === false && (
            <Form method="get" preventScrollReset>
              <input hidden name="modal-report" defaultValue="true" />
              <button type="submit">{locales.route.content.report}</button>
            </Form>
          )}
      </section>
      {loaderData.abilities.abuse_report.hasAccess &&
        loaderData.mode === "authenticated" &&
        loaderData.alreadyAbuseReported === false && (
          <Modal searchParam="modal-report">
            <Modal.Title>{locales.route.abuseReport.title}</Modal.Title>
            <Modal.Section>
              {locales.route.abuseReport.description}
            </Modal.Section>
            <Modal.Section>
              <Form
                {...getFormProps(abuseReportForm)}
                method="post"
                preventScrollReset
              >
                <input
                  {...getInputProps(abuseReportFields[INTENT_FIELD_NAME], {
                    type: "hidden",
                  })}
                  key="submit-abuse-report"
                />
                <div className="mv-flex mv-flex-col mv-gap-6">
                  {loaderData.abuseReportReasons.map((reason) => {
                    let description;
                    if (
                      reason.slug in locales.eventAbuseReportReasonSuggestions
                    ) {
                      type LocaleKey =
                        keyof typeof locales.eventAbuseReportReasonSuggestions;
                      description =
                        locales.eventAbuseReportReasonSuggestions[
                          reason.slug as LocaleKey
                        ].description;
                    } else {
                      console.error(
                        `Event abuse report reason suggestion ${reason.slug} not found in locales`
                      );
                      description = reason.slug;
                    }
                    return (
                      <label key={reason.slug} className="mv-flex mv-group">
                        <input
                          {...getInputProps(abuseReportFields.reasons, {
                            type: "checkbox",
                            value: reason.slug,
                          })}
                          key={reason.slug}
                          className="mv-h-0 mv-w-0 mv-opacity-0"
                        />
                        <div className="mv-w-5 mv-h-5 mv-relative mv-mr-2">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="20"
                            height="20"
                            fill="none"
                            viewBox="0 0 20 20"
                            className="mv-block group-has-[:checked]:mv-hidden"
                          >
                            <path
                              fill="currentColor"
                              d="M17.5 1.25c.69 0 1.25.56 1.25 1.25v15c0 .69-.56 1.25-1.25 1.25h-15c-.69 0-1.25-.56-1.25-1.25v-15c0-.69.56-1.25 1.25-1.25h15ZM2.5 0A2.5 2.5 0 0 0 0 2.5v15A2.5 2.5 0 0 0 2.5 20h15a2.5 2.5 0 0 0 2.5-2.5v-15A2.5 2.5 0 0 0 17.5 0h-15Z"
                            />
                          </svg>
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="20"
                            height="20"
                            fill="none"
                            viewBox="0 0 20 20"
                            className="mv-hidden group-has-[:checked]:mv-block"
                          >
                            <path
                              fill="currentColor"
                              d="M17.5 1.25c.69 0 1.25.56 1.25 1.25v15c0 .69-.56 1.25-1.25 1.25h-15c-.69 0-1.25-.56-1.25-1.25v-15c0-.69.56-1.25 1.25-1.25h15ZM2.5 0A2.5 2.5 0 0 0 0 2.5v15A2.5 2.5 0 0 0 2.5 20h15a2.5 2.5 0 0 0 2.5-2.5v-15A2.5 2.5 0 0 0 17.5 0h-15Z"
                            />
                            <path
                              fill="currentColor"
                              d="M13.712 6.212a.937.937 0 0 1 1.34 1.312l-4.991 6.238a.938.938 0 0 1-1.349.026L5.404 10.48A.938.938 0 0 1 6.73 9.154l2.617 2.617 4.34-5.53a.3.3 0 0 1 .025-.029Z"
                            />
                          </svg>
                        </div>
                        <span>{description}</span>
                      </label>
                    );
                  })}
                  <Input
                    {...getInputProps(abuseReportFields.otherReason, {
                      type: "text",
                    })}
                    maxLength={OTHER_ABUSE_REPORT_REASONS_MAX_LENGTH}
                  >
                    <Input.Label>
                      {locales.route.abuseReport.otherReason}
                    </Input.Label>
                    {typeof abuseReportFields.reasons.errors !== "undefined" &&
                    abuseReportFields.reasons.errors.length > 0
                      ? abuseReportFields.reasons.errors.map((error) => (
                          <Input.Error
                            id={abuseReportFields.reasons.errorId}
                            key={error}
                          >
                            {error}
                          </Input.Error>
                        ))
                      : null}
                  </Input>
                </div>
              </Form>
            </Modal.Section>
            <Modal.SubmitButton
              form={abuseReportForm.id} // Don't disable button when js is disabled
              disabled={
                isHydrated
                  ? abuseReportForm.dirty === false ||
                    abuseReportForm.valid === false
                  : false
              }
            >
              {locales.route.abuseReport.submit}
            </Modal.SubmitButton>
            <Modal.CloseButton>
              {locales.route.abuseReport.abort}
            </Modal.CloseButton>
          </Modal>
        )}
      <section className="mv-w-full mv-mx-auto mv-px-4 @sm:mv-max-w-screen-container-sm @md:mv-max-w-screen-container-md @lg:mv-max-w-screen-container-lg @xl:mv-max-w-screen-container-xl @xl:mv-px-6 @2xl:mv-max-w-screen-container-2xl mv-mt-6">
        <div className="@md:mv-rounded-3xl mv-overflow-hidden mv-w-full mv-relative">
          <div className="mv-hidden @md:mv-block">
            <div className="mv-relative mv-overflow-hidden mv-w-full mv-aspect-[31/10]">
              <Image
                alt={name}
                src={background}
                blurredSrc={blurredBackground}
                resizeType="fit"
              />
              {loaderData.mode === "admin" &&
              loaderData.abilities.events.hasAccess ? (
                <div className="mv-absolute mv-bottom-6 mv-right-6">
                  <Form method="get" preventScrollReset>
                    <input hidden name="modal-background" defaultValue="true" />
                    <Button type="submit">
                      {locales.route.content.change}
                    </Button>
                  </Form>

                  <Modal searchParam="modal-background">
                    <Modal.Title>{locales.route.content.headline}</Modal.Title>
                    <Modal.Section>
                      <ImageCropper
                        uploadKey="background"
                        image={loaderData.event.background || undefined}
                        aspect={ImageAspects.EventBackground}
                        minCropWidth={MinCropSizes.EventBackground.width}
                        minCropHeight={MinCropSizes.EventBackground.height}
                        maxTargetWidth={MaxImageSizes.EventBackground.width}
                        maxTargetHeight={MaxImageSizes.EventBackground.height}
                        modalSearchParam="modal-background"
                        locales={locales}
                        currentTimestamp={
                          actionData?.currentTimestamp ||
                          loaderData.currentTimestamp
                        }
                      >
                        <div className="mv-w-full mv-rounded-md mv-overflow-hidden mv-aspect-[3/2]">
                          <Image
                            alt={name}
                            src={background}
                            blurredSrc={blurredBackground}
                          />
                        </div>
                      </ImageCropper>
                    </Modal.Section>
                  </Modal>
                </div>
              ) : null}
            </div>
          </div>
          {loaderData.mode === "admin" || loaderData.isTeamMember ? (
            <>
              {loaderData.event.canceled ? (
                <div className="@md:mv-absolute @md:mv-top-0 @md:mv-inset-x-0 mv-font-semibold mv-text-center mv-bg-red-400 mv-p-2 mv-text-white">
                  {locales.route.content.event.cancelled}
                </div>
              ) : (
                <>
                  {loaderData.event.published ? (
                    <div className="@md:mv-absolute @md:mv-top-0 @md:mv-inset-x-0 mv-font-semibold mv-text-center mv-bg-green-600 mv-p-2 mv-text-white">
                      {locales.route.content.event.published}
                    </div>
                  ) : (
                    <div className="@md:mv-absolute @md:mv-top-0 @md:mv-inset-x-0 mv-font-semibold mv-text-center mv-bg-primary mv-p-2 mv-text-white">
                      {locales.route.content.event.draft}
                    </div>
                  )}
                </>
              )}
            </>
          ) : null}

          {loaderData.mode !== "admin" && loaderData.event.canceled ? (
            <div className="@md:mv-absolute @md:mv-top-0 @md:mv-inset-x-0 mv-font-semibold mv-text-center mv-bg-red-400 mv-p-2 mv-text-white">
              {locales.route.content.event.cancelled}
            </div>
          ) : null}
          {loaderData.mode !== "admin" ? (
            <>
              {beforeParticipationPeriod ||
              (afterParticipationPeriod &&
                loaderData.isParticipant === false) ? (
                <div className="mv-bg-accent-300 mv-p-8">
                  <p className="mv-font-bold mv-text-center">
                    {laysInThePast
                      ? locales.route.content.event.alreadyTakenPlace
                      : beforeParticipationPeriod
                      ? locales.route.content.event.registrationNotStarted
                      : locales.route.content.event.registrationExpired}
                  </p>
                </div>
              ) : (
                <>
                  {loaderData.event.parentEvent !== null &&
                  laysInThePast === false ? (
                    <div className="@md:mv-bg-white @md:mv-border @md:mv-border-neutral-500 @md:mv-rounded-b-3xl @md:mv-py-6">
                      <div className="@md:mv-flex mv--mx-[17px] mv-items-center">
                        <div className="mv-w-full mv-hidden @lg:mv-flex @lg:mv-shrink-0 @lg:mv-grow-0 @lg:mv-basis-1/4 mv-px-4"></div>
                        <div className="mv-w-full @md:mv-flex-auto mv-px-4">
                          <p className="mv-font-bold @xl:mv-text-center @md:mv-pl-4 @lg:mv-pl-0 mv-pb-4 @md:mv-pb-0">
                            {insertComponentsIntoLocale(
                              insertParametersIntoLocale(
                                locales.route.content.event.context,
                                {
                                  name: loaderData.event.parentEvent.name,
                                }
                              ),
                              [
                                <Link
                                  key={loaderData.event.parentEvent.slug}
                                  className="mv-underline hover:mv-no-underline"
                                  to={`/event/${loaderData.event.parentEvent.slug}`}
                                  reloadDocument
                                >
                                  {" "}
                                </Link>,
                              ]
                            )}
                          </p>
                        </div>
                        <div className="mv-w-full @lg:mv-shrink-0 @lg:mv-grow-0 @lg:mv-basis-1/4 mv-px-4 mv-text-right">
                          <div className="mv-pr-4 @lg:mv-pr-8">
                            <>
                              {loaderData.mode === "anon" &&
                              loaderData.event.canceled === false ? (
                                <Link
                                  className="mv-h-auto mv-min-h-0 mv-whitespace-nowrap mv-py-2 mv-px-6 mv-normal-case mv-leading-6 mv-inline-flex mv-cursor-pointer mv-outline-primary mv-shrink-0 mv-flex-wrap mv-items-center mv-justify-center mv-rounded-lg mv-text-center mv-border-primary mv-text-sm mv-font-semibold mv-border mv-bg-primary mv-text-white"
                                  to={`/login?login_redirect=/event/${loaderData.event.slug}`}
                                >
                                  {locales.route.content.event.loginToRegister}
                                </Link>
                              ) : null}
                              {loaderData.mode !== "anon" &&
                              loaderData.event.canceled === false ? (
                                <>{CallToActionForm}</>
                              ) : null}
                            </>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : loaderData.event.childEvents.length > 0 &&
                    laysInThePast === false ? (
                    <div className="@md:mv-bg-accent-300 @md:mv-rounded-b-3xl @md:mv-py-6">
                      <div className="@md:mv-flex mv--mx-[17px] mv-items-center">
                        <div className="mv-w-full mv-hidden @lg:mv-flex @lg:mv-shrink-0 @lg:mv-grow-0 @lg:mv-basis-1/4 mv-px-4"></div>
                        <div className="mv-w-full @md:mv-flex-auto mv-px-4">
                          <p className="mv-font-bold @xl:mv-text-center @md:mv-pl-4 @lg:mv-pl-0 mv-pb-4 @md:mv-pb-0">
                            {insertComponentsIntoLocale(
                              locales.route.content.event.select,
                              [
                                <a
                                  key="to-child-events"
                                  href="#child-events"
                                  className="mv-underline hover:mv-no-underline"
                                >
                                  {" "}
                                </a>,
                              ]
                            )}
                          </p>
                        </div>
                        <div className="mv-w-full @lg:mv-shrink-0 @lg:mv-grow-0 @lg:mv-basis-1/4 mv-px-4 mv-text-right">
                          <div className="mv-pr-4 @lg:mv-pr-8">
                            <>
                              {loaderData.mode === "anon" &&
                              loaderData.event.canceled === false ? (
                                <Link
                                  className="mv-h-auto mv-min-h-0 mv-whitespace-nowrap mv-py-2 mv-px-6 mv-normal-case mv-leading-6 mv-inline-flex mv-cursor-pointer mv-outline-primary mv-shrink-0 mv-flex-wrap mv-items-center mv-justify-center mv-rounded-lg mv-text-center mv-border-primary mv-text-sm mv-font-semibold mv-border mv-bg-primary mv-text-white"
                                  to={`/login?login_redirect=/event/${loaderData.event.slug}`}
                                >
                                  {locales.route.content.event.loginToRegister}
                                </Link>
                              ) : null}
                              {loaderData.mode !== "anon" &&
                              loaderData.event.canceled === false ? (
                                <>{CallToActionForm}</>
                              ) : null}
                            </>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : laysInThePast === false ? (
                    <div className="@md:mv-bg-white @md:mv-border @md:mv-border-neutral-500 @md:mv-rounded-b-3xl @md:mv-py-6 @md:mv-text-right mv-pr-4 @lg:mv-pr-8">
                      <>
                        {loaderData.mode === "anon" &&
                        loaderData.event.canceled === false ? (
                          <Link
                            className="mv-h-auto mv-min-h-0 mv-whitespace-nowrap mv-py-2 mv-px-6 mv-normal-case mv-leading-6 mv-inline-flex mv-cursor-pointer mv-outline-primary mv-shrink-0 mv-flex-wrap mv-items-center mv-justify-center mv-rounded-lg mv-text-center mv-border-primary mv-text-sm mv-font-semibold mv-border mv-bg-primary mv-text-white"
                            to={`/login?login_redirect=/event/${loaderData.event.slug}`}
                          >
                            {locales.route.content.event.loginToRegister}
                          </Link>
                        ) : null}
                        {loaderData.mode !== "anon" &&
                        loaderData.event.canceled === false ? (
                          <>{CallToActionForm}</>
                        ) : null}
                      </>
                    </div>
                  ) : null}
                </>
              )}
            </>
          ) : null}
        </div>
        {loaderData.mode === "admin" &&
        loaderData.abilities.events.hasAccess ? (
          <>
            <div className="mv-bg-accent-white mv-p-8 mv-pb-0">
              <p className="mv-font-bold mv-text-right">
                <Link
                  className="mv-ml-4 mv-mb-2 @md:mv-mb-0 mv-border mv-border-primary mv-bg-white mv-text-primary mv-h-auto mv-min-h-0 mv-whitespace-nowrap mv-py-2 mv-px-6 mv-normal-case mv-leading-6 mv-inline-flex mv-cursor-pointer mv-selct-none mv-flex-wrap mv-items-center mv-justify-center mv-rounded-lg mv-text-center mv-font-semibold mv-gap-2 hover:mv-bg-primary hover:mv-text-white"
                  to={`/event/${loaderData.event.slug}/settings`}
                >
                  {locales.route.content.event.edit}
                </Link>
                <Link
                  className="mv-ml-4 mv-h-auto mv-min-h-0 mv-whitespace-nowrap mv-py-2 mv-px-6 mv-normal-case mv-leading-6 mv-inline-flex mv-cursor-pointer mv-outline-primary mv-shrink-0 mv-flex-wrap mv-items-center mv-justify-center mv-rounded-lg mv-text-center mv-border-primary mv-text-sm mv-font-semibold mv-border mv-bg-primary mv-text-white"
                  to={`/event/create/?parent=${loaderData.event.id}`}
                >
                  {locales.route.content.event.createRelated}
                </Link>
              </p>
            </div>
          </>
        ) : null}
      </section>
      <div className="mv-w-full mv-mx-auto mv-px-4 @sm:mv-max-w-screen-container-sm @md:mv-max-w-screen-container-md @lg:mv-max-w-screen-container-lg @xl:mv-max-w-screen-container-xl @xl:mv-px-6 @2xl:mv-max-w-screen-container-2xl mv-relative mv-pt-8 @lg:mv-pt-16 mv-mb-24">
        <div className="mv-flex mv--mx-4 mv-justify-center">
          <div className="mv-w-full @lg:mv-shrink-0 @lg:mv-grow-0 @lg:mv-basis-1/2 mv-px-4">
            <p className="mv-font-bold mv-text-xl mv-mb-8">{duration}</p>
            <header className="mv-mb-8">
              <h1 className="mv-m-0">{loaderData.event.name}</h1>
              {loaderData.event.subline !== null ? (
                <p className="mv-font-bold mv-text-xl mv-mt-2">
                  {loaderData.event.subline}
                </p>
              ) : null}
            </header>
            {loaderData.event.description !== null ? (
              <RichText
                html={loaderData.event.description}
                additionalClassNames="mv-mb-6"
              />
            ) : null}

            <div className="mv-grid mv-grid-cols-1 @md:mv-grid-cols-[minmax(100px,_1fr)_4fr] mv-gap-x-4 mv-gap-y-1 @md:mv-gap-y-6">
              {loaderData.event.types.length > 0 ? (
                <>
                  <div className="mv-text-xs mv-leading-6">
                    {locales.route.content.event.type}
                  </div>
                  <div className="mv-pb-3 @md:mv-pb-0">
                    {loaderData.event.types
                      .map((relation) => {
                        let title;
                        if (relation.eventType.slug in locales.eventTypes) {
                          type LocaleKey = keyof typeof locales.eventTypes;
                          title =
                            locales.eventTypes[
                              relation.eventType.slug as LocaleKey
                            ].title;
                        } else {
                          console.error(
                            `Event type ${relation.eventType.slug} not found in locales`
                          );
                          title = relation.eventType.slug;
                        }
                        return title;
                      })
                      .join(" / ")}
                  </div>
                </>
              ) : null}

              {loaderData.event.venueName !== null ? (
                <>
                  <div className="mv-text-xs mv-leading-6">
                    {locales.route.content.event.location}
                  </div>
                  <div className="mv-pb-3 @md:mv-pb-0">
                    <p>
                      {loaderData.event.venueName},{" "}
                      {loaderData.event.venueStreet}{" "}
                      {loaderData.event.venueStreetNumber},{" "}
                      {loaderData.event.venueZipCode}{" "}
                      {loaderData.event.venueCity}
                    </p>
                  </div>
                </>
              ) : null}

              {loaderData.event.conferenceLink !== null &&
              loaderData.event.conferenceLink !== "" ? (
                <>
                  <div className="mv-text-xs mv-leading-6">
                    {locales.route.content.event.conferenceLink}
                  </div>
                  <div className="mv-pb-3 @md:mv-pb-0">
                    <a
                      href={loaderData.event.conferenceLink}
                      target="_blank"
                      rel="noreferrer noopener"
                    >
                      {loaderData.event.conferenceLink}
                    </a>
                  </div>
                </>
              ) : null}
              {loaderData.event.conferenceCode !== null &&
              loaderData.event.conferenceCode !== "" ? (
                <>
                  <div className="mv-text-xs mv-leading-6">
                    {locales.route.content.event.conferenceCode}
                  </div>
                  <div className="mv-pb-3 @md:mv-pb-0">
                    {loaderData.event.conferenceCode}
                  </div>
                </>
              ) : null}

              <div className="mv-text-xs mv-leading-6">
                {locales.route.content.event.start}
              </div>
              <div className="mv-pb-3 @md:mv-pb-0">
                {formatDateTime(startTime, language, locales)}
              </div>

              <div className="mv-text-xs mv-leading-6">
                {locales.route.content.event.end}
              </div>
              <div className="mv-pb-3 @md:mv-pb-0">
                {formatDateTime(endTime, language, locales)}
              </div>

              {participationFrom > now ? (
                <>
                  <div className="mv-text-xs mv-leading-6">
                    {locales.route.content.event.registrationStart}
                  </div>
                  <div className="mv-pb-3 @md:mv-pb-0">
                    {formatDateTime(participationFrom, language, locales)}
                  </div>
                </>
              ) : null}
              {participationUntil > now ? (
                <>
                  <div className="mv-text-xs mv-leading-6">
                    {locales.route.content.event.registrationEnd}
                  </div>
                  <div className="mv-pb-3 @md:mv-pb-0">
                    {formatDateTime(participationUntil, language, locales)}
                  </div>
                </>
              ) : null}

              {loaderData.event.participantLimit === null ||
              loaderData.event.participantLimit -
                loaderData.event._count.participants >
                0 ? (
                <>
                  <div className="mv-text-xs mv-leading-6">
                    {locales.route.content.event.numberOfPlaces}
                  </div>
                  <div className="mv-pb-3 @md:mv-pb-0">
                    {loaderData.event.participantLimit !== null &&
                    loaderData.event.participantLimit -
                      loaderData.event._count.participants >
                      0 ? (
                      <>
                        {loaderData.event.participantLimit -
                          loaderData.event._count.participants}{" "}
                        / {loaderData.event.participantLimit}
                      </>
                    ) : (
                      locales.route.content.event.withoutRestriction
                    )}
                  </div>
                </>
              ) : null}

              {loaderData.event.participantLimit !== null &&
              loaderData.event.participantLimit -
                loaderData.event._count.participants <=
                0 ? (
                <>
                  <div className="mv-text-xs mv-leading-6">
                    {locales.route.content.event.numberOfWaitingSeats}
                  </div>
                  <div className="mv-pb-3 @md:mv-pb-0">
                    {loaderData.event._count.waitingList}{" "}
                    {locales.route.content.event.onWaitingList}
                  </div>
                </>
              ) : null}

              {loaderData.isParticipant === true ||
              loaderData.isSpeaker === true ||
              loaderData.isTeamMember === true ? (
                <>
                  <div className="mv-text-xs mv-leading-6 mv-mt-1">
                    {locales.route.content.event.calenderItem}
                  </div>
                  <div className="mv-pb-3 @md:mv-pb-0">
                    <Link
                      className="mv-border mv-border-primary mv-bg-white mv-text-primary mv-h-auto mv-min-h-0 mv-whitespace-nowrap mv-py-[.375rem] mv-px-6 mv-normal-case mv-leading-[1.125rem] mv-inline-flex mv-cursor-pointer mv-selct-none mv-flex-wrap mv-items-center mv-justify-center mv-rounded-lg mv-text-center mv-text-sm mv-font-semibold mv-gap-2 hover:mv-bg-primary hover:mv-text-white"
                      to="ics-download"
                      reloadDocument
                    >
                      {locales.route.content.event.download}
                    </Link>
                  </div>
                </>
              ) : null}

              {loaderData.mode !== "anon" &&
              loaderData.event.documents.length > 0 ? (
                <>
                  <div className="mv-text-xs mv-leading-6">
                    {locales.route.content.event.downloads}
                  </div>
                  <div className="mv-pb-3 @md:mv-pb-0">
                    {loaderData.event.documents.map((item) => {
                      return (
                        <div key={`document-${item.document.id}`} className="">
                          <Link
                            className="mv-underline hover:mv-no-underline"
                            to={`/event/${loaderData.event.slug}/documents-download?document_id=${item.document.id}`}
                            reloadDocument
                          >
                            {item.document.title || item.document.filename}
                          </Link>
                          {item.document.description ? (
                            <p className="mv-text-sm mv-italic">
                              {item.document.description}
                            </p>
                          ) : null}
                        </div>
                      );
                    })}
                    {loaderData.event.documents.length > 1 ? (
                      <Link
                        className="mv-mt-4 mv-border mv-border-primary mv-bg-white mv-text-primary mv-h-auto mv-min-h-0 mv-whitespace-nowrap mv-py-[.375rem] mv-px-6 mv-normal-case mv-leading-[1.125rem] mv-inline-flex mv-cursor-pointer mv-selct-none mv-flex-wrap mv-items-center mv-justify-center mv-rounded-lg mv-text-center mv-text-sm mv-font-semibold mv-gap-2 hover:mv-bg-primary hover:mv-text-white"
                        to={`/event/${loaderData.event.slug}/documents-download`}
                        reloadDocument
                      >
                        {locales.route.content.event.downloadAll}
                      </Link>
                    ) : null}
                  </div>
                </>
              ) : null}

              {loaderData.event.focuses.length > 0 ? (
                <>
                  <div className="mv-text-xs mv-leading-5 mv-pt-[7px]">
                    {locales.route.content.event.focusAreas}
                  </div>
                  <div className="mv-flex mv-flex-wrap mv--m-1 mv-pb-3 @md:mv-pb-0">
                    {loaderData.event.focuses.map((relation, index) => {
                      let title;
                      if (relation.focus.slug in locales.focuses) {
                        type LocaleKey = keyof typeof locales.focuses;
                        title =
                          locales.focuses[relation.focus.slug as LocaleKey]
                            .title;
                      } else {
                        console.error(
                          `Focus ${relation.focus.slug} not found in locales`
                        );
                        title = relation.focus.slug;
                      }
                      return (
                        <div
                          key={`focus-${index}`}
                          className="mv-m-1 mv-px-3 mv-py-1.5 mv-h-auto mv-rounded-lg mv-border mv-border-secondary mv-text-sm mv-font-semibold mv-whitespace-nowrap mv-text-secondary mv-bg-white mv-w-fit"
                        >
                          {title}
                        </div>
                      );
                    })}
                  </div>
                </>
              ) : null}

              {loaderData.event.eventTargetGroups.length > 0 ? (
                <>
                  <div className="mv-text-xs mv-leading-5 mv-pt-[7px]">
                    {locales.route.content.event.targetGroups}
                  </div>
                  <div className="mv-flex mv-flex-wrap mv--m-1 mv-pb-3 @md:mv-pb-0">
                    {loaderData.event.eventTargetGroups.map(
                      (relation, index) => {
                        let title;
                        if (
                          relation.eventTargetGroup.slug in
                          locales.eventTargetGroups
                        ) {
                          type LocaleKey =
                            keyof typeof locales.eventTargetGroups;
                          title =
                            locales.eventTargetGroups[
                              relation.eventTargetGroup.slug as LocaleKey
                            ].title;
                        } else {
                          console.error(
                            `Event target group ${relation.eventTargetGroup.slug} not found in locales`
                          );
                          title = relation.eventTargetGroup.slug;
                        }
                        return (
                          <div
                            key={`eventTargetGroups-${index}`}
                            className="mv-m-1 mv-px-3 mv-py-1.5 mv-h-auto mv-rounded-lg mv-border mv-border-secondary mv-text-sm mv-font-semibold mv-whitespace-nowrap mv-text-secondary mv-bg-white mv-w-fit"
                          >
                            {title}
                          </div>
                        );
                      }
                    )}
                  </div>
                </>
              ) : null}

              {loaderData.event.experienceLevel ? (
                <>
                  <div className="mv-text-xs mv-leading-5 mv-pt-[7px]">
                    {locales.route.content.event.experienceLevel}
                  </div>
                  <div className="mv--m-1 mv-pb-3 @md:mv-pb-0">
                    <div className="mv-m-1 mv-px-3 mv-py-1.5 mv-h-auto mv-rounded-lg mv-border mv-border-secondary mv-text-sm mv-font-semibold mv-whitespace-nowrap mv-text-secondary mv-bg-white mv-w-fit">
                      {(() => {
                        let title;
                        if (
                          loaderData.event.experienceLevel.slug in
                          locales.experienceLevels
                        ) {
                          type LocaleKey =
                            keyof typeof locales.experienceLevels;
                          title =
                            locales.experienceLevels[
                              loaderData.event.experienceLevel.slug as LocaleKey
                            ].title;
                        } else {
                          console.error(
                            `Focus ${loaderData.event.experienceLevel.slug} not found in locales`
                          );
                          title = loaderData.event.experienceLevel.slug;
                        }
                        return title;
                      })()}
                    </div>
                  </div>
                </>
              ) : null}

              {loaderData.event.tags.length > 0 ? (
                <>
                  <div className="mv-text-xs mv-leading-5 mv-pt-[7px]">
                    {locales.route.content.event.tags}
                  </div>
                  <div className="mv-flex mv-flex-wrap mv--m-1 mv-pb-3 @md:mv-pb-0">
                    {loaderData.event.tags.map((relation, index) => {
                      let title;
                      if (relation.tag.slug in locales.tags) {
                        type LocaleKey = keyof typeof locales.tags;
                        title =
                          locales.tags[relation.tag.slug as LocaleKey].title;
                      } else {
                        console.error(
                          `Tag ${relation.tag.slug} not found in locales`
                        );
                        title = relation.tag.slug;
                      }
                      return (
                        <div
                          key={`tags-${index}`}
                          className="mv-m-1 mv-px-3 mv-py-1.5 mv-h-auto mv-rounded-lg mv-border mv-border-secondary mv-text-sm mv-font-semibold mv-whitespace-nowrap mv-text-secondary mv-bg-white mv-w-fit"
                        >
                          {title}
                        </div>
                      );
                    })}
                  </div>
                </>
              ) : null}

              {loaderData.event.areas.length > 0 ? (
                <>
                  <div className="mv-text-xs mv-leading-5 mv-pt-[7px]">
                    {locales.route.content.event.areas}
                  </div>
                  <div className="mv-flex mv-flex-wrap mv--m-1 mv-pb-3 @md:mv-pb-0">
                    {loaderData.event.areas.map((item, index) => {
                      return (
                        <div
                          key={`areas-${index}`}
                          className="mv-m-1 mv-px-3 mv-py-1.5 mv-h-auto mv-rounded-lg mv-border mv-border-secondary mv-text-sm mv-font-semibold mv-whitespace-nowrap mv-text-secondary mv-bg-white mv-w-fit"
                        >
                          {item.area.name}
                        </div>
                      );
                    })}
                  </div>
                </>
              ) : null}
            </div>

            {loaderData.event.speakers !== null &&
            loaderData.event.speakers.length > 0 ? (
              <>
                <h3 className="mv-mt-16 mv-mb-8 mv-font-bold">
                  {locales.route.content.event.speakers}
                </h3>
                <div className="mv-grid mv-grid-cols-1 @md:mv-grid-cols-2 @xl:mv-grid-cols-3 mv-gap-4 mv-mb-16">
                  {loaderData.event.speakers.map((speaker) => {
                    const { profile } = speaker;
                    return (
                      <div key={profile.username}>
                        <Link
                          className="mv-flex mv-flex-row"
                          to={`/profile/${profile.username}`}
                        >
                          <div className="mv-h-11 mv-w-11 mv-bg-primary mv-text-white mv-text-xl mv-flex mv-items-center mv-justify-center mv-rounded-full mv-overflow-hidden mv-shrink-0 mv-border">
                            {profile.avatar !== null &&
                            profile.avatar !== "" ? (
                              <Avatar
                                size="full"
                                firstName={profile.firstName}
                                lastName={profile.lastName}
                                avatar={profile.avatar}
                                blurredAvatar={profile.blurredAvatar}
                              />
                            ) : (
                              getInitials(profile)
                            )}
                          </div>

                          <div className="mv-pl-4">
                            <h5 className="mv-text-sm mv-m-0 mv-font-bold">
                              {`${profile.academicTitle || ""} ${
                                profile.firstName
                              } ${profile.lastName}`.trimStart()}
                            </h5>
                            <p className="mv-text-sm mv-m-0 mv-line-clamp-2">
                              {profile.position}
                            </p>
                          </div>
                        </Link>
                      </div>
                    );
                  })}
                </div>
              </>
            ) : null}
            {loaderData.event.childEvents.length > 0 ? (
              <>
                <h3 id="child-events" className="mv-mt-16 mv-font-bold">
                  {locales.route.content.event.relatedEvents}
                </h3>
                <p className="mv-mb-8">
                  {insertParametersIntoLocale(
                    locales.route.content.event.eventContext,
                    {
                      name: loaderData.event.name,
                    }
                  )}
                </p>
                <div className="mv-mb-16">
                  {loaderData.event.childEvents.map((event) => {
                    const eventStartTime = utcToZonedTime(
                      event.startTime,
                      "Europe/Berlin"
                    );
                    const eventEndTime = utcToZonedTime(
                      event.endTime,
                      "Europe/Berlin"
                    );
                    return (
                      <div
                        key={`child-event-${event.id}`}
                        className="mv-rounded-lg mv-bg-white mv-shadow-xl mv-border-t mv-border-r mv-border-neutral-300 mv-mb-2 mv-flex mv-items-stretch mv-overflow-hidden"
                      >
                        <Link
                          className="mv-flex"
                          to={`/event/${event.slug}`}
                          reloadDocument
                        >
                          <div className="mv-hidden @xl:mv-block mv-w-36 mv-shrink-0 mv-aspect-[3/2]">
                            <div className="mv-w-36 mv-h-full mv-relative">
                              <Image
                                alt={event.name}
                                src={event.background}
                                blurredSrc={event.blurredBackground}
                              />
                            </div>
                          </div>
                          <div className="mv-px-4 mv-py-4">
                            <p className="mv-text-xs mv-mb-1">
                              {/* TODO: Display icons (see figma) */}
                              {event.stage !== null
                                ? (() => {
                                    let title;
                                    if (event.stage.slug in locales.stages) {
                                      type LocaleKey =
                                        keyof typeof locales.stages;
                                      title =
                                        locales.stages[
                                          event.stage.slug as LocaleKey
                                        ].title;
                                    } else {
                                      console.error(
                                        `Event stage ${event.stage.slug} not found in locales`
                                      );
                                      title = event.stage.slug;
                                    }
                                    return title;
                                  })() + " | "
                                : ""}
                              {getDuration(
                                eventStartTime,
                                eventEndTime,
                                language
                              )}
                              {event.participantLimit === null &&
                                locales.route.content.event.unlimitedSeats}
                              {event.participantLimit !== null &&
                                event.participantLimit -
                                  event._count.participants >
                                  0 &&
                                insertParametersIntoLocale(
                                  locales.route.content.event.seatsFree,
                                  {
                                    count:
                                      event.participantLimit -
                                      event._count.participants,
                                    total: event.participantLimit,
                                  }
                                )}

                              {event.participantLimit !== null &&
                              event.participantLimit -
                                event._count.participants <=
                                0 ? (
                                <>
                                  {" "}
                                  |{" "}
                                  <span>
                                    {insertParametersIntoLocale(
                                      locales.route.content.event.waitingList,
                                      {
                                        count: event._count.waitingList,
                                      }
                                    )}
                                  </span>
                                </>
                              ) : null}
                            </p>
                            <h4 className="mv-font-bold mv-text-base mv-m-0 @md:mv-line-clamp-1">
                              {event.name}
                            </h4>
                            {event.subline !== null ? (
                              <p className="mv-hidden mv-text-xs mv-mt-1 @md:mv-line-clamp-1">
                                {event.subline}
                              </p>
                            ) : (
                              <p className="mv-hidden mv-text-xs mv-mt-1 @md:mv-line-clamp-1">
                                {removeHtmlTags(event.description ?? "")}
                              </p>
                            )}
                          </div>
                        </Link>

                        {(loaderData.mode === "admin" ||
                          loaderData.isTeamMember) &&
                        !event.canceled ? (
                          <>
                            {event.published ? (
                              <div className="mv-flex mv-font-semibold mv-items-center mv-ml-auto mv-border-r-8 mv-border-green-600 mv-pr-4 mv-py-6 mv-text-green-600">
                                {locales.route.content.event.published}
                              </div>
                            ) : (
                              <div className="mv-flex mv-font-semibold mv-items-center mv-ml-auto mv-border-r-8 mv-border-primary mv-pr-4 mv-py-6 mv-text-primary">
                                {locales.route.content.event.draft}
                              </div>
                            )}
                          </>
                        ) : null}
                        {event.canceled ? (
                          <div className="mv-flex mv-font-semibold mv-items-center mv-ml-auto mv-border-r-8 mv-border-red-400 mv-pr-4 mv-py-6 mv-text-red-400">
                            {locales.route.content.event.cancelled}
                          </div>
                        ) : null}
                        {event.isParticipant &&
                        !event.canceled &&
                        loaderData.mode !== "admin" ? (
                          <div className="mv-flex mv-font-semibold mv-items-center mv-ml-auto mv-border-r-8 mv-border-green-500 mv-pr-4 mv-py-6 mv-text-green-600">
                            <p>{locales.route.content.event.registered}</p>
                          </div>
                        ) : null}
                        {canUserParticipate(event) &&
                        loaderData.userId !== undefined ? (
                          <div className="mv-flex mv-items-center mv-ml-auto mv-pr-4 mv-py-6">
                            <AddParticipantButton
                              action={`/event/${event.slug}/settings/participants/add-participant`}
                              profileId={loaderData.userId}
                              locales={locales}
                            />
                          </div>
                        ) : null}
                        {event.isOnWaitingList &&
                        !event.canceled &&
                        loaderData.mode !== "admin" ? (
                          <div className="mv-flex mv-font-semibold mv-items-center mv-ml-auto mv-border-r-8 mv-border-neutral-500 mv-pr-4 mv-py-6">
                            <p>{locales.route.content.event.waiting}</p>
                          </div>
                        ) : null}
                        {canUserBeAddedToWaitingList(event) &&
                        loaderData.userId !== undefined ? (
                          <div className="mv-flex mv-items-center mv-ml-auto mv-pr-4 mv-py-6">
                            <AddToWaitingListButton
                              action={`/event/${event.slug}/settings/waiting-list/add-to-waiting-list`}
                              profileId={loaderData.userId}
                              locales={locales}
                            />
                          </div>
                        ) : null}
                        {event.published &&
                        !event.isParticipant &&
                        loaderData.mode !== "admin" &&
                        !loaderData.isTeamMember &&
                        !canUserParticipate(event) &&
                        !event.isOnWaitingList &&
                        !canUserBeAddedToWaitingList(event) &&
                        !event.canceled &&
                        loaderData.mode === "authenticated" ? (
                          <div className="mv-flex mv-items-center mv-ml-auto mv-pr-4 mv-py-6">
                            <Link
                              to={`/event/${event.slug}`}
                              className="mv-h-auto mv-min-h-0 mv-whitespace-nowrap mv-py-2 mv-px-6 mv-normal-case mv-leading-6 mv-inline-flex mv-cursor-pointer mv-outline-primary mv-shrink-0 mv-flex-wrap mv-items-center mv-justify-center mv-rounded-lg mv-text-center mv-border-primary mv-text-sm mv-font-semibold mv-border mv-bg-primary mv-text-white"
                            >
                              {locales.route.content.event.more}
                            </Link>
                          </div>
                        ) : null}
                        {loaderData.mode === "anon" &&
                        event.canceled === false ? (
                          <div className="mv-flex mv-items-center mv-ml-auto mv-pr-4 mv-py-6">
                            <Link
                              className="mv-h-auto mv-min-h-0 mv-whitespace-nowrap mv-py-2 mv-px-6 mv-normal-case mv-leading-6 mv-inline-flex mv-cursor-pointer mv-outline-primary mv-shrink-0 mv-flex-wrap mv-items-center mv-justify-center mv-rounded-lg mv-text-center mv-border-primary mv-text-sm mv-font-semibold mv-border mv-bg-primary mv-text-white"
                              to={`/login?login_redirect=/event/${event.slug}`}
                            >
                              {locales.route.content.event.register}
                            </Link>
                          </div>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              </>
            ) : null}

            {loaderData.event.teamMembers.length > 0 ? (
              <>
                <h3 className="mv-mt-16 mv-mb-8 mv-font-bold">
                  {locales.route.content.event.team}
                </h3>
                <div className="mv-grid mv-grid-cols-1 @md:mv-grid-cols-2 @xl:mv-grid-cols-3 mv-gap-4">
                  {loaderData.event.teamMembers.map((member) => {
                    return (
                      <div key={`team-member-${member.profile.id}`}>
                        <Link
                          className="mv-flex mv-flex-row"
                          to={`/profile/${member.profile.username}`}
                        >
                          <div className="mv-h-11 mv-w-11 mv-bg-primary mv-text-white mv-text-xl mv-flex mv-items-center mv-justify-center mv-rounded-full mv-overflow-hidden mv-shrink-0 mv-border">
                            {member.profile.avatar !== null &&
                            member.profile.avatar !== "" ? (
                              <Avatar
                                size="full"
                                firstName={member.profile.firstName}
                                lastName={member.profile.lastName}
                                avatar={member.profile.avatar}
                                blurredAvatar={member.profile.blurredAvatar}
                              />
                            ) : (
                              getInitials(member.profile)
                            )}
                          </div>

                          <div className="mv-pl-4">
                            <h5 className="mv-text-sm mv-m-0 mv-font-bold">
                              {`${member.profile.academicTitle || ""} ${
                                member.profile.firstName
                              } ${member.profile.lastName}`.trimStart()}
                            </h5>
                            <p className="mv-text-sm mv-m-0 mv-line-clamp-2">
                              {member.profile.position}
                            </p>
                          </div>
                        </Link>
                      </div>
                    );
                  })}
                </div>
              </>
            ) : null}
            {loaderData.event.responsibleOrganizations.length > 0 ? (
              <>
                <h3
                  id="responsible-organizations"
                  className="mv-mt-16 mv-mb-8 mv-font-bold"
                >
                  {locales.route.content.event.organizedBy}
                </h3>
                <div className="mv-grid mv-grid-cols-1 @md:mv-grid-cols-2 @xl:mv-grid-cols-3 mv-gap-4">
                  {loaderData.event.responsibleOrganizations.map((item) => {
                    return (
                      <div key={`organizer-${item.organization.id}`}>
                        <Link
                          className="mv-flex mv-flex-row"
                          to={`/organization/${item.organization.slug}`}
                        >
                          {item.organization.logo !== null &&
                          item.organization.logo !== "" ? (
                            <div className="mv-h-11 mv-w-11 mv-flex mv-items-center mv-justify-center mv-rounded-full mv-overflow-hidden mv-shrink-0 mv-border">
                              <Avatar
                                size="full"
                                name={item.organization.name}
                                logo={item.organization.logo}
                                blurredLogo={item.organization.blurredLogo}
                              />
                            </div>
                          ) : (
                            <div className="mv-h-11 mv-w-11 mv-bg-primary mv-text-white mv-text-xl mv-flex mv-items-center mv-justify-center mv-rounded-full mv-overflow-hidden mv-shrink-0">
                              {getInitialsOfName(item.organization.name)}
                            </div>
                          )}
                          <div className="mv-pl-4">
                            <h5 className="mv-text-sm mv-m-0 mv-font-bold">
                              {item.organization.name}
                            </h5>

                            <p className="mv-text-sm mv-m-0 mv-line-clamp-2">
                              {item.organization.types
                                .map((relation) => {
                                  let title;
                                  if (
                                    relation.organizationType.slug in
                                    locales.organizationTypes
                                  ) {
                                    type LocaleKey =
                                      keyof typeof locales.organizationTypes;
                                    title =
                                      locales.organizationTypes[
                                        relation.organizationType
                                          .slug as LocaleKey
                                      ].title;
                                  } else {
                                    console.error(
                                      `Organization type ${relation.organizationType.slug} not found in locales`
                                    );
                                    title = relation.organizationType.slug;
                                  }
                                  return title;
                                })
                                .join(", ")}
                            </p>
                          </div>
                        </Link>
                      </div>
                    );
                  })}
                </div>
              </>
            ) : null}

            {loaderData.event.participants !== null &&
            loaderData.event.participants.length > 0 ? (
              <>
                <h3 className="mv-mt-16 mv-mb-8 mv-font-bold">
                  {locales.route.content.event.participants}
                </h3>
                <div className="mv-grid mv-grid-cols-1 @md:mv-grid-cols-2 @xl:mv-grid-cols-3 mv-gap-4">
                  {loaderData.event.participants.map((participant) => {
                    const { profile } = participant;
                    return (
                      <div key={profile.username}>
                        <Link
                          className="mv-flex mv-flex-row"
                          to={`/profile/${profile.username}`}
                        >
                          <div className="mv-h-11 mv-w-11 mv-bg-primary mv-text-white mv-text-xl mv-flex mv-items-center mv-justify-center mv-rounded-full mv-overflow-hidden mv-shrink-0 mv-border">
                            {profile.avatar !== null &&
                            profile.avatar !== "" ? (
                              <Avatar
                                size="full"
                                firstName={profile.firstName}
                                lastName={profile.lastName}
                                avatar={profile.avatar}
                                blurredAvatar={profile.blurredAvatar}
                              />
                            ) : (
                              getInitials(profile)
                            )}
                          </div>

                          <div className="mv-pl-4">
                            <h5 className="mv-text-sm mv-m-0 mv-font-bold">
                              {`${profile.academicTitle || ""} ${
                                profile.firstName
                              } ${profile.lastName}`.trimStart()}
                            </h5>
                            <p className="mv-text-sm mv-m-0 mv-line-clamp-2">
                              {profile.position}
                            </p>
                          </div>
                        </Link>
                      </div>
                    );
                  })}
                </div>
              </>
            ) : null}
          </div>
        </div>
      </div>
    </>
  );
}

export default Index;
