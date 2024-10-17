import { useForm } from "@conform-to/react-v1";
import { parseWithZod } from "@conform-to/zod-v1";
import { Button, Input, TextButton } from "@mint-vernetzt/components";
import type {
  ActionFunctionArgs,
  LoaderFunctionArgs,
  MetaFunction,
} from "@remix-run/node";
import { json } from "@remix-run/node";
import { Form, Link, useActionData, useLoaderData } from "@remix-run/react";
import { utcToZonedTime } from "date-fns-tz";
import { type TFunction } from "i18next";
import rcSliderStyles from "rc-slider/assets/index.css";
import React from "react";
import { Trans, useTranslation } from "react-i18next";
import reactCropStyles from "react-image-crop/dist/ReactCrop.css";
import { useHydrated } from "remix-utils/use-hydrated";
import { z } from "zod";
import {
  createEventAbuseReport,
  sendNewReportMailToSupport,
} from "~/abuse-reporting.server";
import { redirectWithAlert } from "~/alert.server";
import {
  createAuthClient,
  getSessionUser,
  getSessionUserOrThrow,
} from "~/auth.server";
import ImageCropper from "~/components/ImageCropper/ImageCropper";
import { RichText } from "~/components/Richtext/RichText";
import i18next from "~/i18next.server";
import {
  canUserAccessConferenceLink,
  canUserBeAddedToWaitingList,
  canUserParticipate,
} from "~/lib/event/utils";
import { getInitials } from "~/lib/profile/getInitials";
import { getInitialsOfName } from "~/lib/string/getInitialsOfName";
import {
  checkFeatureAbilitiesOrThrow,
  getFeatureAbilities,
} from "~/lib/utils/application";
import { invariantResponse } from "~/lib/utils/response";
import { getParamValueOrThrow } from "~/lib/utils/routes";
import { removeHtmlTags } from "~/lib/utils/sanitizeUserHtml";
import { getDuration } from "~/lib/utils/time";
import { prismaClient } from "~/prisma.server";
import { detectLanguage } from "~/root.server";
import { Modal } from "~/routes/__components";
import { deriveEventMode } from "../utils.server";
import { AddParticipantButton } from "./settings/participants/add-participant";
import { RemoveParticipantButton } from "./settings/participants/remove-participant";
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

const i18nNS = [
  "routes/event/index",
  "datasets/stages",
  "datasets/experienceLevels",
  "datasets/focuses",
  "datasets/eventTypes",
  "datasets/eventTargetGroups",
  "datasets/tags",
  "datasets/eventAbuseReportReasonSuggestions",
  "datasets/organizationTypes",
  "components/image-cropper",
];

export const handle = {
  i18n: i18nNS,
};

export function links() {
  return [
    { rel: "stylesheet", href: rcSliderStyles },
    { rel: "stylesheet", href: reactCropStyles },
  ];
}

export const meta: MetaFunction<typeof loader> = (args) => {
  const { data } = args;

  if (data === undefined) {
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
  if (data.event.description === null && data.event.background === null) {
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

const abuseReportSchema = z.object({
  intent: z.enum(["submit-abuse-report"]),
  reasons: z.array(z.string()),
  otherReason: z.string().optional(),
});

export const loader = async (args: LoaderFunctionArgs) => {
  const { request, params } = args;
  const slug = getParamValueOrThrow(params, "slug");
  const { authClient } = createAuthClient(request);
  const abilities = await getFeatureAbilities(authClient, [
    "events",
    "abuse_report",
  ]);
  const locale = detectLanguage(request);
  const t = await i18next.getFixedT(locale, i18nNS);

  const sessionUser = await getSessionUser(authClient);

  const rawEvent = await getEvent(slug);

  if (rawEvent === null) {
    throw json({ message: t("error.notFound") }, { status: 404 });
  }

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
    throw json({ message: t("error.notPublished") }, { status: 403 });
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
    !canUserAccessConferenceLink(
      // TODO: Fix type issue
      eventWithParticipationStatus,
      isParticipant,
      isSpeaker,
      isTeamMember
    )
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

  return json({
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
  });
};

export const action = async (args: ActionFunctionArgs) => {
  const { request, params } = args;
  const { authClient } = createAuthClient(request);
  const slug = getParamValueOrThrow(params, "slug");
  const sessionUser = await getSessionUserOrThrow(authClient);

  const locale = detectLanguage(request);
  const t = await i18next.getFixedT(locale, i18nNS);

  const formData = await request.formData();
  const submission = parseWithZod(formData, {
    schema: abuseReportSchema.superRefine((data, ctx) => {
      if (data.reasons.length === 0 && typeof data.otherReason !== "string") {
        ctx.addIssue({
          path: ["reasons"],
          code: z.ZodIssueCode.custom,
          message: t("abuseReport.noReasons"),
        });
        return;
      }
      return { ...data };
    }),
  });

  if (submission.status !== "success") {
    return submission.reply();
  }

  await checkFeatureAbilitiesOrThrow(authClient, "abuse_report");
  const mode = await deriveEventMode(sessionUser, slug);
  invariantResponse(
    mode === "authenticated",
    "Anon users and admins of this event cannot send a report",
    { status: 403 }
  );

  const openAbuseReport = await prismaClient.eventAbuseReport.findFirst({
    select: {
      id: true,
    },
    where: {
      event: {
        slug,
      },
      status: "open",
      reporterId: sessionUser.id,
    },
  });
  invariantResponse(
    openAbuseReport === null,
    "You already have sent a report for this event",
    { status: 401 }
  );

  const suggestions =
    await prismaClient.eventAbuseReportReasonSuggestion.findMany({
      where: {
        slug: {
          in: submission.value.reasons,
        },
      },
    });

  let reasons: string[] = [];
  for (const suggestion of suggestions) {
    reasons.push(suggestion.description);
  }
  if (typeof submission.value.otherReason === "string") {
    reasons.push(submission.value.otherReason);
  }

  const report = await createEventAbuseReport({
    reporterId: sessionUser.id,
    slug: slug,
    reasons: reasons,
  });
  await sendNewReportMailToSupport(report);

  return redirectWithAlert(".", {
    message: t("success.abuseReport"),
  });
};

function getCallToActionForm(loaderData: {
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
      <RemoveParticipantButton
        action="./settings/participants/remove-participant"
        profileId={loaderData.userId}
      />
    );
  } else if (isOnWaitingList) {
    return (
      <RemoveFromWaitingListButton
        action="./settings/waiting-list/remove-from-waiting-list"
        profileId={loaderData.userId}
      />
    );
  } else {
    if (participantLimitReached) {
      return (
        <AddToWaitingListButton
          action="./settings/waiting-list/add-to-waiting-list"
          profileId={loaderData.userId}
        />
      );
    } else {
      return (
        <AddParticipantButton
          action="./settings/participants/add-participant"
          profileId={loaderData.userId}
        />
      );
    }
  }
}

function formatDateTime(date: Date, language: string, t: TFunction) {
  return t("content.clock", {
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
  const actionData = useActionData<typeof action>();

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

  const { t, i18n } = useTranslation(i18nNS);

  const beforeParticipationPeriod = now < participationFrom;

  const afterParticipationPeriod = now > participationUntil;

  const laysInThePast = now > endTime;

  const CallToActionForm = getCallToActionForm(loaderData);

  const duration = getDuration(startTime, endTime, i18n.language);

  const background = loaderData.event.background;
  const Background = React.useCallback(
    () => (
      <div className="w-full rounded-md overflow-hidden aspect-[3/2]">
        {background ? (
          <img
            src={background}
            alt={t("content.backgroundImage")}
            className="w-full h-full"
          />
        ) : (
          <img
            src={"/images/default-event-background.jpg"}
            alt={t("content.backgroundImage")}
            className="mv-w-[300px] mv-min-h-[108px]"
          />
        )}
      </div>
    ),
    [background]
  );

  const [abuseReportForm, abuseReportFields] = useForm({
    lastResult: actionData,
  });

  const isHydrated = useHydrated();

  return (
    <>
      <section className="mv-w-full mv-mx-auto mv-px-4 @sm:mv-max-w-screen-container-sm @md:mv-max-w-screen-container-md @lg:mv-max-w-screen-container-lg @xl:mv-max-w-screen-container-xl @xl:mv-px-6 @2xl:mv-max-w-screen-container-2xl mv-mb-2 @md:mv-mb-4 @md:mv-mt-2">
        <div className="font-semi text-neutral-500 flex flex-wrap items-center mv-mb-4">
          {loaderData.event.parentEvent !== null ? (
            <>
              <TextButton weight="thin" variant="neutral" arrowRight>
                <Link to={`/event/${loaderData.event.parentEvent.slug}`}>
                  {loaderData.event.parentEvent.name}
                </Link>
              </TextButton>
              <span className="w-full @md:mv-w-auto mv-text-neutral mv-font-thin">
                {loaderData.event.name}
              </span>
            </>
          ) : (
            <TextButton weight="thin" variant="neutral" arrowLeft>
              <Link to="/explore/events" prefetch="intent">
                {t("content.back")}
              </Link>
            </TextButton>
          )}
        </div>
        {loaderData.abilities.abuse_report.hasAccess &&
          loaderData.mode === "authenticated" &&
          loaderData.alreadyAbuseReported === false && (
            <Form method="get" preventScrollReset>
              <input hidden name="modal-report" defaultValue="true" />
              <button type="submit">{t("content.report")}</button>
            </Form>
          )}
      </section>
      {loaderData.abilities.abuse_report.hasAccess &&
        loaderData.mode === "authenticated" &&
        loaderData.alreadyAbuseReported === false && (
          <Modal searchParam="modal-report">
            <Modal.Title>{t("abuseReport.title")}</Modal.Title>
            <Modal.Section>{t("abuseReport.description")}</Modal.Section>
            <Modal.Section>
              <Form
                id={abuseReportForm.id}
                onSubmit={abuseReportForm.onSubmit}
                method="post"
                preventScrollReset
              >
                <input
                  hidden
                  name="intent"
                  defaultValue="submit-abuse-report"
                />
                <div className="mv-flex mv-flex-col mv-gap-6">
                  {loaderData.abuseReportReasons.map((reason) => {
                    return (
                      <label key={reason.slug} className="mv-flex mv-group">
                        <input
                          name={abuseReportFields.reasons.name}
                          value={reason.slug}
                          type="checkbox"
                          className="mv-h-0 mv-w-0 mv-opacity-0"
                          onChange={(event) => {
                            event.stopPropagation();
                          }}
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
                        <span>
                          {t(`${reason.slug}.description`, {
                            ns: "datasets/eventAbuseReportReasonSuggestions",
                          })}
                        </span>
                      </label>
                    );
                  })}
                  <Input
                    name={abuseReportFields.otherReason.name}
                    maxLength={250}
                  >
                    <Input.Label>{t("abuseReport.otherReason")}</Input.Label>
                  </Input>
                  {abuseReportFields.reasons.errors && (
                    <span>{abuseReportFields.reasons.errors}</span>
                  )}
                </div>
              </Form>
            </Modal.Section>
            <Modal.SubmitButton form={abuseReportForm.id}>
              {t("abuseReport.submit")}
            </Modal.SubmitButton>
            <Modal.CloseButton>{t("abuseReport.abort")}</Modal.CloseButton>
          </Modal>
        )}
      <section className="mv-w-full mv-mx-auto mv-px-4 @sm:mv-max-w-screen-container-sm @md:mv-max-w-screen-container-md @lg:mv-max-w-screen-container-lg @xl:mv-max-w-screen-container-xl @xl:mv-px-6 @2xl:mv-max-w-screen-container-2xl mt-6">
        <div className="@md:mv-rounded-3xl overflow-hidden w-full relative">
          <div className="hidden @md:mv-block">
            <div className="relative overflow-hidden w-full aspect-[31/10]">
              <div className="w-full h-full relative">
                <img
                  src={
                    loaderData.event.blurredBackground ||
                    "/images/default-event-background-blurred.jpg"
                  }
                  alt={t("content.borderOfImage")}
                  className="w-full h-full object-cover"
                />
                <img
                  id="background"
                  src={
                    loaderData.event.background ||
                    "/images/default-event-background.jpg"
                  }
                  alt={loaderData.event.name}
                  className={`w-full h-full object-contain absolute inset-0 ${
                    isHydrated
                      ? "opacity-100 transition-opacity duration-200 ease-in"
                      : "opacity-0 invisible"
                  }`}
                />
                <noscript>
                  <img
                    src={
                      loaderData.event.background ||
                      "/images/default-event-background.jpg"
                    }
                    alt={loaderData.event.name}
                    className={`w-full h-full object-contain absolute inset-0`}
                  />
                </noscript>
              </div>
              {loaderData.mode === "admin" &&
              loaderData.abilities.events.hasAccess ? (
                <div className="absolute bottom-6 right-6">
                  <Form method="get" preventScrollReset>
                    <input hidden name="modal-background" defaultValue="true" />
                    <Button type="submit">{t("content.change")}</Button>
                  </Form>

                  <Modal searchParam="modal-background">
                    <Modal.Title>{t("content.headline")}</Modal.Title>
                    <Modal.Section>
                      <ImageCropper
                        subject="event"
                        id="modal-background-upload"
                        uploadKey="background"
                        image={loaderData.event.background || undefined}
                        aspect={3 / 2}
                        minCropWidth={60}
                        minCropHeight={40}
                        maxTargetWidth={720}
                        maxTargetHeight={480}
                        slug={loaderData.event.slug}
                        redirect={`/event/${loaderData.event.slug}`}
                        modalSearchParam="modal-background"
                      >
                        <Background />
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
                <div className="@md:mv-absolute @md:mv-top-0 @md:mv-inset-x-0 font-semibold text-center bg-salmon-500 p-2 text-white">
                  {t("content.event.cancelled")}
                </div>
              ) : (
                <>
                  {loaderData.event.published ? (
                    <div className="@md:mv-absolute @md:mv-top-0 @md:mv-inset-x-0 font-semibold text-center bg-green-600 p-2 text-white">
                      {t("content.event.published")}
                    </div>
                  ) : (
                    <div className="@md:mv-absolute @md:mv-top-0 @md:mv-inset-x-0 font-semibold text-center bg-blue-300 p-2 text-white">
                      {t("content.event.draft")}
                    </div>
                  )}
                </>
              )}
            </>
          ) : null}

          {loaderData.mode !== "admin" && loaderData.event.canceled ? (
            <div className="@md:mv-absolute @md:mv-top-0 @md:mv-inset-x-0 font-semibold text-center bg-salmon-500 p-2 text-white">
              {t("event.cancelled")}
            </div>
          ) : null}
          {loaderData.mode !== "admin" ? (
            <>
              {beforeParticipationPeriod || afterParticipationPeriod ? (
                <div className="bg-accent-300 p-8">
                  <p className="font-bold text-center">
                    {laysInThePast
                      ? t("content.event.alreadyTakenPlace")
                      : beforeParticipationPeriod
                      ? t("content.event.registrationNotStarted")
                      : t("content.event.registrationExpired")}
                  </p>
                </div>
              ) : (
                <>
                  {loaderData.event.parentEvent !== null &&
                  laysInThePast === false ? (
                    <div className="@md:mv-bg-white @md:mv-border @md:mv-border-neutral-500 @md:mv-rounded-b-3xl @md:mv-py-6">
                      <div className="@md:mv-flex -mx-[17px] items-center">
                        <div className="w-full hidden @lg:mv-flex @lg:mv-shrink-0 @lg:mv-grow-0 @lg:mv-basis-1/4 px-4"></div>
                        <div className="w-full @md:mv-flex-auto px-4">
                          <p className="font-bold @xl:mv-text-center @md:mv-pl-4 @lg:mv-pl-0 pb-4 @md:mv-pb-0">
                            <Trans
                              i18nKey="content.event.context"
                              ns={["routes/event/index"]}
                              values={{
                                name: loaderData.event.parentEvent.name,
                              }}
                              components={[
                                <Link
                                  key={loaderData.event.parentEvent.slug}
                                  className="underline hover:no-underline"
                                  to={`/event/${loaderData.event.parentEvent.slug}`}
                                  reloadDocument
                                >
                                  {t("content.event.context")}
                                </Link>,
                              ]}
                            />
                          </p>
                        </div>
                        <div className="w-full @lg:mv-shrink-0 @lg:mv-grow-0 @lg:mv-basis-1/4 px-4 text-right">
                          <div className="pr-4 @lg:mv-pr-8">
                            <>
                              {loaderData.mode === "anon" &&
                              loaderData.event.canceled === false ? (
                                <Link
                                  className="btn btn-primary"
                                  to={`/login?login_redirect=/event/${loaderData.event.slug}`}
                                >
                                  {t("content.loginToRegister")}
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
                      <div className="@md:mv-flex -mx-[17px] items-center">
                        <div className="w-full hidden @lg:mv-flex @lg:mv-shrink-0 @lg:mv-grow-0 @lg:mv-basis-1/4 px-4"></div>
                        <div className="w-full @md:mv-flex-auto px-4">
                          <p className="font-bold @xl:mv-text-center @md:mv-pl-4 @lg:mv-pl-0 pb-4 @md:mv-pb-0">
                            <Trans
                              i18nKey="content.event.select"
                              ns={["routes/event/index"]}
                              components={[
                                <a
                                  key="to-child-events"
                                  href="#child-events"
                                  className="underline hover:no-underline"
                                >
                                  {t("content.event.select")}
                                </a>,
                              ]}
                            />
                          </p>
                        </div>
                        <div className="w-full @lg:mv-shrink-0 @lg:mv-grow-0 @lg:mv-basis-1/4 px-4 text-right">
                          <div className="pr-4 @lg:mv-pr-8">
                            <>
                              {loaderData.mode === "anon" &&
                              loaderData.event.canceled === false ? (
                                <Link
                                  className="btn btn-primary"
                                  to={`/login?login_redirect=/event/${loaderData.event.slug}`}
                                >
                                  {t("content.event.loginToRegister")}
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
                    <div className="@md:mv-bg-white @md:mv-border @md:mv-border-neutral-500 @md:mv-rounded-b-3xl @md:mv-py-6 @md:mv-text-right pr-4 @lg:mv-pr-8">
                      <>
                        {loaderData.mode === "anon" &&
                        loaderData.event.canceled === false ? (
                          <Link
                            className="btn btn-primary"
                            to={`/login?login_redirect=/event/${loaderData.event.slug}`}
                          >
                            {t("content.event.loginToRegister")}
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
            <div className="bg-accent-white p-8 pb-0">
              <p className="font-bold text-right">
                <Link
                  className="btn btn-outline btn-primary ml-4 mb-2 @md:mv-mb-0"
                  to={`/event/${loaderData.event.slug}/settings`}
                >
                  {t("content.event.edit")}
                </Link>
                <Link
                  className="btn btn-primary ml-4"
                  to={`/event/create/?parent=${loaderData.event.id}`}
                >
                  {t("content.event.createRelated")}
                </Link>
              </p>
            </div>
          </>
        ) : null}
      </section>
      <div className="mv-w-full mv-mx-auto mv-px-4 @sm:mv-max-w-screen-container-sm @md:mv-max-w-screen-container-md @lg:mv-max-w-screen-container-lg @xl:mv-max-w-screen-container-xl @xl:mv-px-6 @2xl:mv-max-w-screen-container-2xl relative pt-8 @lg:mv-pt-16 mv-mb-24">
        <div className="flex -mx-4 justify-center">
          <div className="@lg:mv-shrink-0 @lg:mv-grow-0 @lg:mv-basis-1/2 px-4">
            <p className="font-bold text-xl mb-8">{duration}</p>
            <header className="mb-8">
              <h1 className="m-0">{loaderData.event.name}</h1>
              {loaderData.event.subline !== null ? (
                <p className="font-bold text-xl mt-2">
                  {loaderData.event.subline}
                </p>
              ) : null}
            </header>
            {loaderData.event.description !== null ? (
              <RichText
                html={loaderData.event.description}
                additionalClassNames="mb-6"
              />
            ) : null}

            <div className="grid grid-cols-1 @md:mv-grid-cols-[minmax(100px,_1fr)_4fr] gap-x-4 gap-y-1 @md:mv-gap-y-6">
              {loaderData.event.types.length > 0 ? (
                <>
                  <div className="text-xs leading-6">
                    {t("content.event.type")}
                  </div>
                  <div className="pb-3 @md:mv-pb-0">
                    {loaderData.event.types
                      .map((item) =>
                        t(`${item.eventType.slug}.title`, {
                          ns: "datasets/eventTypes",
                        })
                      )
                      .join(" / ")}
                  </div>
                </>
              ) : null}

              {loaderData.event.venueName !== null ? (
                <>
                  <div className="text-xs leading-6">
                    {t("content.event.location")}
                  </div>
                  <div className="pb-3 @md:mv-pb-0">
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
                  <div className="text-xs leading-6">
                    {t("content.event.conferenceLink")}
                  </div>
                  <div className="pb-3 @md:mv-pb-0">
                    <a
                      href={loaderData.event.conferenceLink}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {loaderData.event.conferenceLink}
                    </a>
                  </div>
                </>
              ) : null}
              {loaderData.event.conferenceCode !== null &&
              loaderData.event.conferenceCode !== "" ? (
                <>
                  <div className="text-xs leading-6">
                    {t("content.event.conferenceCode")}
                  </div>
                  <div className="pb-3 @md:mv-pb-0">
                    {loaderData.event.conferenceCode}
                  </div>
                </>
              ) : null}

              <div className="text-xs leading-6">
                {t("content.event.start")}
              </div>
              <div className="pb-3 @md:mv-pb-0">
                {formatDateTime(startTime, i18n.language, t)}
              </div>

              <div className="text-xs leading-6">{t("content.event.end")}</div>
              <div className="pb-3 @md:mv-pb-0">
                {formatDateTime(endTime, i18n.language, t)}
              </div>

              {participationFrom > now ? (
                <>
                  <div className="text-xs leading-6">
                    {t("content.event.registrationStart")}
                  </div>
                  <div className="pb-3 @md:mv-pb-0">
                    {formatDateTime(participationFrom, i18n.language, t)}
                  </div>
                </>
              ) : null}
              {participationUntil > now ? (
                <>
                  <div className="text-xs leading-6">
                    {t("content.event.registrationEnd")}
                  </div>
                  <div className="pb-3 @md:mv-pb-0">
                    {formatDateTime(participationUntil, i18n.language, t)}
                  </div>
                </>
              ) : null}

              {loaderData.event.participantLimit === null ||
              loaderData.event.participantLimit -
                loaderData.event._count.participants >
                0 ? (
                <>
                  <div className="text-xs leading-6">
                    {t("content.event.numberOfPlaces")}
                  </div>
                  <div className="pb-3 @md:mv-pb-0">
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
                      t("content.event.withoutRestriction")
                    )}
                  </div>
                </>
              ) : null}

              {loaderData.event.participantLimit !== null &&
              loaderData.event.participantLimit -
                loaderData.event._count.participants <=
                0 ? (
                <>
                  <div className="text-xs leading-6">
                    {t("content.event.numberOfWaitingSeats")}
                  </div>
                  <div className="pb-3 @md:mv-pb-0">
                    {loaderData.event._count.waitingList}{" "}
                    {t("content.event.onWaitingList")}
                  </div>
                </>
              ) : null}

              {loaderData.isParticipant === true ||
              loaderData.isSpeaker === true ||
              loaderData.isTeamMember === true ? (
                <>
                  <div className="text-xs leading-6 mt-1">
                    {t("content.event.calenderItem")}
                  </div>
                  <div className="pb-3 @md:mv-pb-0">
                    <Link
                      className="btn btn-outline btn-primary btn-small"
                      to="ics-download"
                      reloadDocument
                    >
                      {t("content.event.download")}
                    </Link>
                  </div>
                </>
              ) : null}

              {loaderData.mode !== "anon" &&
              loaderData.event.documents.length > 0 ? (
                <>
                  <div className="text-xs leading-6">
                    {t("content.event.downloads")}
                  </div>
                  <div className="pb-3 @md:mv-pb-0">
                    {loaderData.event.documents.map((item) => {
                      return (
                        <div key={`document-${item.document.id}`} className="">
                          <Link
                            className="underline hover:no-underline"
                            to={`/event/${loaderData.event.slug}/documents-download?document_id=${item.document.id}`}
                            reloadDocument
                          >
                            {item.document.title || item.document.filename}
                          </Link>
                          {item.document.description ? (
                            <p className="text-sm italic">
                              {item.document.description}
                            </p>
                          ) : null}
                        </div>
                      );
                    })}
                    {loaderData.event.documents.length > 1 ? (
                      <Link
                        className="btn btn-outline btn-primary btn-small mt-4"
                        to={`/event/${loaderData.event.slug}/documents-download`}
                        reloadDocument
                      >
                        {t("content.event.downloadAll")}
                      </Link>
                    ) : null}
                  </div>
                </>
              ) : null}

              {loaderData.event.focuses.length > 0 ? (
                <>
                  <div className="text-xs leading-5 pt-[7px]">
                    {t("content.event.focusAreas")}
                  </div>
                  <div className="event-tags -m-1 pb-3 @md:mv-pb-0">
                    {loaderData.event.focuses.map((item, index) => {
                      return (
                        <div key={`focus-${index}`} className="badge">
                          {t(`${item.focus.slug}.title`, {
                            ns: "datasets/focuses",
                          })}
                        </div>
                      );
                    })}
                  </div>
                </>
              ) : null}

              {loaderData.event.eventTargetGroups.length > 0 ? (
                <>
                  <div className="text-xs leading-5 pt-[7px]">
                    {t("content.event.targetGroups")}
                  </div>
                  <div className="event-tags -m-1 pb-3 @md:mv-pb-0">
                    {loaderData.event.eventTargetGroups.map((item, index) => {
                      return (
                        <div
                          key={`eventTargetGroups-${index}`}
                          className="badge"
                        >
                          {t(`${item.eventTargetGroup.slug}.title`, {
                            ns: "datasets/eventTargetGroups",
                          })}
                        </div>
                      );
                    })}
                  </div>
                </>
              ) : null}

              {loaderData.event.experienceLevel ? (
                <>
                  <div className="text-xs leading-5 pt-[7px]">
                    {t("content.event.experienceLevel")}
                  </div>
                  <div className="event-tags -m-1 pb-3 @md:mv-pb-0">
                    <div className="badge">
                      {t(`${loaderData.event.experienceLevel.slug}.title`, {
                        ns: "datasets/experienceLevels",
                      })}
                    </div>
                  </div>
                </>
              ) : null}

              {loaderData.event.tags.length > 0 ? (
                <>
                  <div className="text-xs leading-5 pt-[7px]">
                    {t("content.event.tags")}
                  </div>
                  <div className="event-tags -m-1 pb-3 @md:mv-pb-0">
                    {loaderData.event.tags.map((item, index) => {
                      return (
                        <div key={`tags-${index}`} className="badge">
                          {t(`${item.tag.slug}.title`, { ns: "datasets/tags" })}
                        </div>
                      );
                    })}
                  </div>
                </>
              ) : null}

              {loaderData.event.areas.length > 0 ? (
                <>
                  <div className="text-xs leading-5 pt-[7px]">
                    {t("content.event.areas")}
                  </div>
                  <div className="event-tags -m-1 pb-3 @md:mv-pb-0">
                    {loaderData.event.areas.map((item, index) => {
                      return (
                        <div key={`areas-${index}`} className="badge">
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
                <h3 className="mt-16 mb-8 font-bold">
                  {t("content.event.speakers")}
                </h3>
                <div className="grid grid-cols-1 @md:mv-grid-cols-2 @xl:mv-grid-cols-3 gap-4 mb-16">
                  {loaderData.event.speakers.map((speaker) => {
                    const { profile } = speaker;
                    return (
                      <div key={profile.username}>
                        <Link
                          className="flex flex-row"
                          to={`/profile/${profile.username}`}
                        >
                          <div className="h-11 w-11 bg-primary text-white text-xl flex items-center justify-center rounded-full overflow-hidden shrink-0 border">
                            {profile.avatar !== null &&
                            profile.avatar !== "" ? (
                              <img
                                src={profile.avatar}
                                alt={`${profile.academicTitle || ""} ${
                                  profile.firstName
                                } ${profile.lastName}`.trimStart()}
                              />
                            ) : (
                              getInitials(profile)
                            )}
                          </div>

                          <div className="pl-4">
                            <h5 className="text-sm m-0 font-bold">
                              {`${profile.academicTitle || ""} ${
                                profile.firstName
                              } ${profile.lastName}`.trimStart()}
                            </h5>
                            <p className="text-sm m-0 mv-line-clamp-2">
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
                <h3 id="child-events" className="mt-16 font-bold">
                  {t("content.event.relatedEvents")}
                </h3>
                <p className="mb-8">
                  {t("content.event.eventContext", {
                    name: loaderData.event.name,
                  })}
                </p>
                <div className="mb-16">
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
                        className="rounded-lg bg-white shadow-xl border-t border-r border-neutral-300  mb-2 flex items-stretch overflow-hidden"
                      >
                        <Link
                          className="flex"
                          to={`/event/${event.slug}`}
                          reloadDocument
                        >
                          <div className="hidden @xl:mv-block w-36 shrink-0 aspect-[3/2]">
                            <div className="w-36 h-full relative">
                              <img
                                src={
                                  event.blurredBackground ||
                                  "/images/default-event-background-blurred.jpg"
                                }
                                alt={t("content.borderOfImage")}
                                className="w-full h-full object-cover"
                              />
                              <img
                                src={
                                  event.background ||
                                  "/images/default-event-background.jpg"
                                }
                                alt={event.name}
                                className={`w-full h-full object-cover absolute inset-0 ${
                                  isHydrated
                                    ? "opacity-100 transition-opacity duration-200 ease-in"
                                    : "opacity-0 invisible"
                                }`}
                              />
                              <noscript>
                                <img
                                  src={
                                    event.background ||
                                    "/images/default-event-background.jpg"
                                  }
                                  alt={event.name}
                                  className={`w-full h-full object-cover absolute inset-0`}
                                />
                              </noscript>
                            </div>
                          </div>
                          <div className="px-4 py-4">
                            <p className="text-xs mb-1">
                              {/* TODO: Display icons (see figma) */}
                              {event.stage !== null
                                ? t(`${event.stage.slug}.title`, {
                                    ns: "datasets/stages",
                                  }) + " | "
                                : ""}
                              {getDuration(
                                eventStartTime,
                                eventEndTime,
                                i18n.language
                              )}
                              {event.participantLimit === null &&
                                t("content.event.unlimitedSeats")}
                              {event.participantLimit !== null &&
                                event.participantLimit -
                                  event._count.participants >
                                  0 &&
                                t("content.event.seatsFree", {
                                  count:
                                    event.participantLimit -
                                    event._count.participants,
                                  total: event.participantLimit,
                                })}

                              {event.participantLimit !== null &&
                              event.participantLimit -
                                event._count.participants <=
                                0 ? (
                                <>
                                  {" "}
                                  |{" "}
                                  <span>
                                    {t("content.event.waitingList", {
                                      count: event._count.waitingList,
                                    })}
                                  </span>
                                </>
                              ) : null}
                            </p>
                            <h4 className="font-bold text-base m-0 @md:mv-line-clamp-1">
                              {event.name}
                            </h4>
                            {event.subline !== null ? (
                              <p className="mv-hidden text-xs mt-1 @md:mv-line-clamp-1">
                                {event.subline}
                              </p>
                            ) : (
                              <p className="mv-hidden text-xs mt-1 @md:mv-line-clamp-1">
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
                              <div className="flex font-semibold items-center ml-auto border-r-8 border-green-600 pr-4 py-6 text-green-600">
                                {t("content.event.published")}
                              </div>
                            ) : (
                              <div className="flex font-semibold items-center ml-auto border-r-8 border-blue-300 pr-4 py-6 text-blue-300">
                                {t("content.event.draft")}
                              </div>
                            )}
                          </>
                        ) : null}
                        {event.canceled ? (
                          <div className="flex font-semibold items-center ml-auto border-r-8 border-salmon-500 pr-4 py-6 text-salmon-500">
                            {t("content.event.cancelled")}
                          </div>
                        ) : null}
                        {event.isParticipant &&
                        !event.canceled &&
                        loaderData.mode !== "admin" ? (
                          <div className="flex font-semibold items-center ml-auto border-r-8 border-green-500 pr-4 py-6 text-green-600">
                            <p>{t("content.event.registered")}</p>
                          </div>
                        ) : null}
                        {canUserParticipate(event) &&
                        loaderData.userId !== undefined ? (
                          <div className="flex items-center ml-auto pr-4 py-6">
                            <AddParticipantButton
                              action={`/event/${event.slug}/settings/participants/add-participant`}
                              profileId={loaderData.userId}
                            />
                          </div>
                        ) : null}
                        {event.isOnWaitingList &&
                        !event.canceled &&
                        loaderData.mode !== "admin" ? (
                          <div className="flex font-semibold items-center ml-auto border-r-8 border-neutral-500 pr-4 py-6">
                            <p>{t("content.event.waiting")}</p>
                          </div>
                        ) : null}
                        {canUserBeAddedToWaitingList(event) &&
                        loaderData.userId !== undefined ? (
                          <div className="flex items-center ml-auto pr-4 py-6">
                            <AddToWaitingListButton
                              action={`/event/${event.slug}/settings/waiting-list/add-to-waiting-list`}
                              profileId={loaderData.userId}
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
                          <div className="flex items-center ml-auto pr-4 py-6">
                            <Link
                              to={`/event/${event.slug}`}
                              className="btn btn-primary"
                            >
                              {t("content.event.more")}
                            </Link>
                          </div>
                        ) : null}
                        {loaderData.mode === "anon" &&
                        event.canceled === false ? (
                          <div className="flex items-center ml-auto pr-4 py-6">
                            <Link
                              className="btn btn-primary"
                              to={`/login?login_redirect=/event/${event.slug}`}
                            >
                              {t("content.event.register")}
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
                <h3 className="mt-16 mb-8 font-bold">
                  {t("content.event.team")}
                </h3>
                <div className="grid grid-cols-1 @md:mv-grid-cols-2 @xl:mv-grid-cols-3 gap-4">
                  {loaderData.event.teamMembers.map((member) => {
                    return (
                      <div key={`team-member-${member.profile.id}`}>
                        <Link
                          className="flex flex-row"
                          to={`/profile/${member.profile.username}`}
                        >
                          <div className="h-11 w-11 bg-primary text-white text-xl flex items-center justify-center rounded-full overflow-hidden shrink-0 border">
                            {member.profile.avatar !== null &&
                            member.profile.avatar !== "" ? (
                              <img
                                src={member.profile.avatar}
                                alt={`${member.profile.academicTitle || ""} ${
                                  member.profile.firstName
                                } ${member.profile.lastName}`.trimStart()}
                              />
                            ) : (
                              getInitials(member.profile)
                            )}
                          </div>

                          <div className="pl-4">
                            <h5 className="text-sm m-0 font-bold">
                              {`${member.profile.academicTitle || ""} ${
                                member.profile.firstName
                              } ${member.profile.lastName}`.trimStart()}
                            </h5>
                            <p className="text-sm m-0 mv-line-clamp-2">
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
                  className="mt-16 mb-8 font-bold"
                >
                  {t("content.event.organizedBy")}
                </h3>
                <div className="grid grid-cols-1 @md:mv-grid-cols-2 @xl:mv-grid-cols-3 gap-4">
                  {loaderData.event.responsibleOrganizations.map((item) => {
                    return (
                      <div key={`organizer-${item.organization.id}`}>
                        <Link
                          className="flex flex-row"
                          to={`/organization/${item.organization.slug}`}
                        >
                          {item.organization.logo !== null &&
                          item.organization.logo !== "" ? (
                            <div className="h-11 w-11 flex items-center justify-center rounded-full overflow-hidden shrink-0 border">
                              <img
                                src={item.organization.logo}
                                alt={item.organization.name}
                              />
                            </div>
                          ) : (
                            <div className="h-11 w-11 bg-primary text-white text-xl flex items-center justify-center rounded-full overflow-hidden shrink-0">
                              {getInitialsOfName(item.organization.name)}
                            </div>
                          )}
                          <div className="pl-4">
                            <h5 className="text-sm m-0 font-bold">
                              {item.organization.name}
                            </h5>

                            <p className="text-sm m-0 mv-line-clamp-2">
                              {item.organization.types
                                .map((item) =>
                                  t(`${item.organizationType.slug}.title`, {
                                    ns: "datasets/organizationTypes",
                                  })
                                )
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
                <h3 className="mt-16 mb-8 font-bold">
                  {t("content.event.participants")}
                </h3>
                <div className="grid grid-cols-1 @md:mv-grid-cols-2 @xl:mv-grid-cols-3 gap-4">
                  {loaderData.event.participants.map((participant) => {
                    const { profile } = participant;
                    return (
                      <div key={profile.username}>
                        <Link
                          className="flex flex-row"
                          to={`/profile/${profile.username}`}
                        >
                          <div className="h-11 w-11 bg-primary text-white text-xl flex items-center justify-center rounded-full overflow-hidden shrink-0 border">
                            {profile.avatar !== null &&
                            profile.avatar !== "" ? (
                              <img
                                src={profile.avatar}
                                alt={`${profile.academicTitle || ""} ${
                                  profile.firstName
                                } ${profile.lastName}`.trimStart()}
                              />
                            ) : (
                              getInitials(profile)
                            )}
                          </div>

                          <div className="pl-4">
                            <h5 className="text-sm m-0 font-bold">
                              {`${profile.academicTitle || ""} ${
                                profile.firstName
                              } ${profile.lastName}`.trimStart()}
                            </h5>
                            <p className="text-sm m-0 mv-line-clamp-2">
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
