import { getFormProps, getInputProps, useForm } from "@conform-to/react-v1";
import { getZodConstraint, parseWithZod } from "@conform-to/zod-v1";
import { Avatar } from "@mint-vernetzt/components/src/molecules/Avatar";
import { Button } from "@mint-vernetzt/components/src/molecules/Button";
import { Image } from "@mint-vernetzt/components/src/molecules/Image";
import { Input } from "@mint-vernetzt/components/src/molecules/Input";
import { captureException } from "@sentry/node";
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
  useLocation,
  useNavigation,
} from "react-router";
import { useHydrated } from "remix-utils/use-hydrated";
import { createAuthClient, getSessionUser } from "~/auth.server";
import { BreadCrump } from "~/components-next/BreadCrump";
import { Modal } from "~/components-next/Modal";
import ImageCropper, {
  IMAGE_CROPPER_DISCONNECT_INTENT_VALUE,
} from "~/components/legacy/ImageCropper/ImageCropper";
import { RichText } from "~/components/legacy/Richtext/RichText";
import { INTENT_FIELD_NAME } from "~/form-helpers";
import { detectLanguage } from "~/i18n.server";
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
import { languageModuleMap } from "~/locales/.server";
import { prismaClient } from "~/prisma.server";
import {
  checkFeatureAbilitiesOrThrow,
  getFeatureAbilities,
} from "~/routes/feature-access.server";
import { parseMultipartFormData } from "~/storage.server";
import { UPLOAD_INTENT_VALUE } from "~/storage.shared";
import { redirectWithToast } from "~/toast.server";
import { deriveEventMode } from "../utils.server";
import {
  disconnectBackgroundImage,
  submitEventAbuseReport,
  uploadBackgroundImage,
} from "./index.server";
import {
  createAbuseReportSchema,
  formatDateTime,
  getCallToActionForm,
  OTHER_ABUSE_REPORT_REASONS_MAX_LENGTH,
} from "./index.shared";
import { AddParticipantButton } from "./settings/participants/add-participant";
import { getRedirectPathOnProtectedEventRoute } from "./settings/utils.server";
import { AddToWaitingListButton } from "./settings/waiting-list/add-to-waiting-list";
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
import { BackButton } from "~/components-next/BackButton";
import { useState } from "react";
import { OverlayMenu } from "~/components/next/OverlayMenu";
import { copyToClipboard } from "~/lib/utils/clipboard";
import { CircleButton } from "@mint-vernetzt/components/src/molecules/CircleButton";
import { usePreviousLocation } from "~/components/next/PreviousLocationContext";

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

function Index() {
  const loaderData = useLoaderData<typeof loader>();
  const { locales, language } = loaderData;
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const location = useLocation();
  const isHydrated = useHydrated();
  const [hasCopied, setHasCopied] = useState(false);

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
    shouldValidate: "onBlur",
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

  const previousLocation = usePreviousLocation();

  return (
    <>
      <section className="w-full mx-auto px-4 @sm:max-w-screen-container-sm @md:max-w-screen-container-md @lg:max-w-screen-container-lg @xl:max-w-screen-container-xl @xl:px-6 @2xl:max-w-screen-container-2xl mb-2 @md:mb-4 @md:mt-2">
        <div className="font-semibold text-neutral-500 flex flex-wrap items-center mb-4">
          {loaderData.event.parentEvent !== null ? (
            <BreadCrump>
              <BreadCrump.Link
                to={`/event/${loaderData.event.parentEvent.slug}`}
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
              prefetch="intent"
            >
              {locales.route.content.back}
            </BackButton>
          )}
        </div>
        {loaderData.abilities.abuse_report.hasAccess ? (
          <div className="w-full flex justify-end">
            <OverlayMenu
              searchParam="overlay-menu-abuse-report"
              locales={locales.route.overlayMenu}
            >
              {isHydrated ? (
                <OverlayMenu.ListItem>
                  <button
                    {...OverlayMenu.getListChildrenStyles()}
                    {...OverlayMenu.getIdToFocusWhenOpening()}
                    onClick={async () => {
                      await copyToClipboard(
                        `${loaderData.meta.baseUrl}${location.pathname}${location.search}${location.hash}`
                      );
                      setHasCopied(true);
                      setTimeout(() => {
                        setHasCopied(false);
                      }, 2000);
                    }}
                  >
                    <span className="p-1">
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 16 16"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M3.68849 6.83637L1.88774 8.63712C1.14925 9.37561 0.734375 10.3772 0.734375 11.4216C0.734375 12.466 1.14925 13.4676 1.88774 14.2061C2.62623 14.9445 3.62783 15.3594 4.67221 15.3594C5.71659 15.3594 6.71819 14.9445 7.45668 14.2061L9.85593 11.8055C10.3013 11.3601 10.6332 10.8144 10.824 10.2142C11.0148 9.61392 11.0588 8.97667 10.9523 8.3559C10.8459 7.73514 10.5921 7.14897 10.2122 6.64659C9.8323 6.14422 9.33746 5.74031 8.76918 5.46875L8.00005 6.23787C7.92197 6.3161 7.85406 6.40385 7.79793 6.49906C8.23699 6.62528 8.63552 6.86391 8.9541 7.19135C9.27268 7.51879 9.50029 7.92371 9.61443 8.36607C9.72856 8.80843 9.72528 9.27292 9.60489 9.71362C9.4845 10.1543 9.25118 10.556 8.92799 10.8789L6.53005 13.2781C6.0375 13.7707 5.36945 14.0474 4.67286 14.0474C3.97628 14.0474 3.30823 13.7707 2.81568 13.2781C2.32312 12.7856 2.0464 12.1175 2.0464 11.4209C2.0464 10.7244 2.32312 10.0563 2.81568 9.56375L3.85649 8.52425C3.70964 7.97395 3.65291 7.40481 3.68849 6.83637Z"
                          fill="#4D5970"
                        />
                        <path
                          d="M6.14404 4.38199C5.69871 4.82738 5.36673 5.3731 5.17595 5.97334C4.98517 6.57358 4.94116 7.21082 5.04763 7.83159C5.15409 8.45235 5.40791 9.03852 5.78778 9.5409C6.16766 10.0433 6.66251 10.4472 7.23079 10.7187L8.24797 9.70024C7.80297 9.58088 7.39722 9.34649 7.07149 9.02063C6.74577 8.69477 6.51155 8.28893 6.39238 7.84387C6.2732 7.39881 6.27326 6.93023 6.39255 6.4852C6.51184 6.04018 6.74617 5.63439 7.07197 5.30862L9.46991 2.90937C9.96247 2.41681 10.6305 2.14009 11.3271 2.14009C12.0237 2.14009 12.6917 2.41681 13.1843 2.90937C13.6768 3.40192 13.9536 4.06997 13.9536 4.76655C13.9536 5.46313 13.6768 6.13118 13.1843 6.62374L12.1435 7.66324C12.2905 8.21449 12.3469 8.78543 12.3115 9.35243L14.1122 7.55168C14.8507 6.81319 15.2656 5.81159 15.2656 4.76721C15.2656 3.72283 14.8507 2.72123 14.1122 1.98274C13.3737 1.24425 12.3721 0.829376 11.3278 0.829376C10.2834 0.829376 9.28177 1.24425 8.54329 1.98274L6.14404 4.38199Z"
                          fill="#4D5970"
                        />
                      </svg>
                    </span>
                    <span>
                      {hasCopied === false
                        ? locales.route.content.copy
                        : locales.route.content.copied}
                    </span>
                  </button>
                </OverlayMenu.ListItem>
              ) : null}
              {loaderData.mode === "authenticated" ? (
                <OverlayMenu.HiddenItem>
                  <Form id="abuse-report" method="get" preventScrollReset>
                    <input
                      hidden
                      name="modal-report"
                      defaultValue="true"
                      aria-label={locales.route.content.report}
                      aria-hidden="true"
                    />
                  </Form>
                </OverlayMenu.HiddenItem>
              ) : null}
              {loaderData.mode === "authenticated" ? (
                <OverlayMenu.ListItem
                  disabled={loaderData.alreadyAbuseReported === true}
                >
                  <button
                    {...OverlayMenu.getListChildrenStyles()}
                    type="submit"
                    form="abuse-report"
                    disabled={loaderData.alreadyAbuseReported === true}
                  >
                    {loaderData.alreadyAbuseReported === false ? (
                      <span className="p-0.5">
                        <svg
                          width="20"
                          height="20"
                          viewBox="0 0 20 20"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M18.4731 0.10593C18.6462 0.221985 18.75 0.416642 18.75 0.625V10C18.75 10.2556 18.5944 10.4854 18.3571 10.5803L18.125 10C18.3571 10.5803 18.3572 10.5803 18.3571 10.5803L18.3539 10.5816L18.3462 10.5846L18.3176 10.5959C18.2929 10.6056 18.257 10.6196 18.2109 10.6373C18.1187 10.6726 17.9859 10.7227 17.821 10.7827C17.4916 10.9025 17.0321 11.0623 16.5119 11.2224C15.4927 11.536 14.1644 11.875 13.125 11.875C12.0666 11.875 11.1896 11.5241 10.4277 11.2192L10.3929 11.2053C9.60032 10.8883 8.92543 10.625 8.125 10.625C7.24981 10.625 6.07698 10.9116 5.07819 11.2219C4.58838 11.374 4.15731 11.5264 3.84886 11.6407C3.81431 11.6535 3.78133 11.6659 3.75 11.6776V19.375C3.75 19.7202 3.47018 20 3.125 20C2.77982 20 2.5 19.7202 2.5 19.375V0.625C2.5 0.279822 2.77982 0 3.125 0C3.47018 0 3.75 0.279822 3.75 0.625V0.977815C4.03263 0.878926 4.37015 0.765844 4.73807 0.652638C5.75727 0.339038 7.08564 0 8.125 0C9.17594 0 10.0299 0.346159 10.7762 0.648704C10.7944 0.656068 10.8125 0.663406 10.8305 0.670712C11.6073 0.985329 12.2848 1.25 13.125 1.25C14.0002 1.25 15.173 0.963423 16.1718 0.653138C16.6616 0.500975 17.0927 0.34858 17.4011 0.234265C17.5552 0.177178 17.6782 0.129766 17.762 0.0968685C17.8039 0.0804242 17.8361 0.0676203 17.8574 0.0590629L17.8811 0.0494923L17.8866 0.0472411L17.8878 0.0467559M17.5 1.52804C17.2255 1.62545 16.8992 1.7361 16.5427 1.84686C15.5296 2.16158 14.2024 2.5 13.125 2.5C12.0172 2.5 11.1349 2.14262 10.3707 1.83311L10.3613 1.82929C9.57736 1.51179 8.92348 1.25 8.125 1.25C7.28936 1.25 6.11773 1.53596 5.10568 1.84736C4.61026 1.9998 4.17125 2.15248 3.85617 2.26706C3.81899 2.28058 3.78356 2.29356 3.75 2.30593V10.347C4.0245 10.2495 4.35082 10.1389 4.70735 10.0281C5.7204 9.71342 7.04757 9.375 8.125 9.375C9.1834 9.375 10.0604 9.72593 10.8223 10.0308L10.8571 10.0447C11.6497 10.3617 12.3246 10.625 13.125 10.625C13.9606 10.625 15.1323 10.339 16.1443 10.0276C16.6397 9.8752 17.0788 9.72252 17.3938 9.60794C17.431 9.59442 17.4664 9.58144 17.5 9.56907V1.52804Z"
                            fill="#4D5970"
                          />
                        </svg>
                      </span>
                    ) : (
                      // TODO: Link to specific faq section/question
                      <CircleButton
                        as="link"
                        to="/help#events-iReportedAnEvent"
                        target="_blank"
                        size="x-small"
                        variant="outline"
                        aria-label={locales.route.content.reportFaq}
                        prefetch="intent"
                      >
                        <div
                          aria-hidden="true"
                          className="flex flex-col gap-[1px]"
                        >
                          <div className="w-0.5 h-0.5 bg-primary rounded-lg" />
                          <div className="w-0.5 h-2 bg-primary rounded-lg" />
                        </div>
                      </CircleButton>
                    )}
                    <span>
                      {loaderData.alreadyAbuseReported === false
                        ? locales.route.content.report
                        : locales.route.content.reported}
                    </span>
                  </button>
                </OverlayMenu.ListItem>
              ) : null}
            </OverlayMenu>
            <Modal searchParam="modal-report">
              <Modal.Title>
                <span className="text-5xl leading-9">
                  {locales.route.abuseReport.title}
                </span>
              </Modal.Title>
              <Modal.Section>
                {locales.route.abuseReport.description}
                <RichText html={locales.route.abuseReport.faq} />
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
                    aria-label={locales.route.abuseReport.submit}
                    aria-hidden="true"
                  />
                  <div className="flex flex-col gap-6">
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
                        <label key={reason.slug} className="flex group">
                          <input
                            {...getInputProps(abuseReportFields.reasons, {
                              type: "checkbox",
                              value: reason.slug,
                            })}
                            key={reason.slug}
                            className="h-0 w-0 opacity-0"
                          />
                          <div className="w-5 h-5 relative mr-2">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="20"
                              height="20"
                              fill="none"
                              viewBox="0 0 20 20"
                              className="block group-has-[:checked]:hidden"
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
                              className="hidden group-has-[:checked]:block"
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
                          <span className="font-semibold">{description}</span>
                        </label>
                      );
                    })}
                    <Input
                      {...getInputProps(abuseReportFields.otherReason, {
                        type: "text",
                      })}
                      maxLength={OTHER_ABUSE_REPORT_REASONS_MAX_LENGTH}
                    >
                      <Input.Label htmlFor={abuseReportFields.otherReason.id}>
                        {locales.route.abuseReport.otherReason}
                      </Input.Label>
                      {typeof abuseReportFields.reasons.errors !==
                        "undefined" &&
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
          </div>
        ) : null}
      </section>
      <section className="w-full mx-auto px-4 @sm:max-w-screen-container-sm @md:max-w-screen-container-md @lg:max-w-screen-container-lg @xl:max-w-screen-container-xl @xl:px-6 @2xl:max-w-screen-container-2xl mt-6">
        <div className="@md:rounded-3xl overflow-hidden w-full relative">
          <div className="hidden @md:block">
            <div className="relative overflow-hidden w-full aspect-[31/10]">
              <Image
                alt={name}
                src={background}
                blurredSrc={blurredBackground}
                resizeType="fit"
              />
              {loaderData.mode === "admin" &&
              loaderData.abilities.events.hasAccess ? (
                <div className="absolute bottom-6 right-6">
                  <Form method="get" preventScrollReset>
                    <input
                      hidden
                      name="modal-background"
                      defaultValue="true"
                      aria-hidden="true"
                      aria-label={locales.route.content.change}
                    />
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
                        <div className="w-full rounded-md overflow-hidden aspect-[3/2]">
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
                <div className="@md:absolute @md:top-0 @md:inset-x-0 font-semibold text-center bg-red-400 p-2 text-white">
                  {locales.route.content.event.cancelled}
                </div>
              ) : (
                <>
                  {loaderData.event.published ? (
                    <div className="@md:absolute @md:top-0 @md:inset-x-0 font-semibold text-center bg-green-600 p-2 text-white">
                      {locales.route.content.event.published}
                    </div>
                  ) : (
                    <div className="@md:absolute @md:top-0 @md:inset-x-0 font-semibold text-center bg-primary p-2 text-white">
                      {locales.route.content.event.draft}
                    </div>
                  )}
                </>
              )}
            </>
          ) : null}

          {loaderData.mode !== "admin" && loaderData.event.canceled ? (
            <div className="@md:absolute @md:top-0 @md:inset-x-0 font-semibold text-center bg-red-400 p-2 text-white">
              {locales.route.content.event.cancelled}
            </div>
          ) : null}
          {loaderData.mode !== "admin" ? (
            <>
              {beforeParticipationPeriod ||
              (afterParticipationPeriod &&
                loaderData.isParticipant === false) ? (
                <div className="bg-accent-300 p-8">
                  <p className="font-bold text-center">
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
                    <div className="@md:bg-white @md:border @md:border-neutral-500 @md:rounded-b-3xl @md:py-6">
                      <div className="@md:flex -mx-[17px] items-center">
                        <div className="w-full hidden @lg:flex @lg:shrink-0 @lg:grow-0 @lg:basis-1/4 px-4"></div>
                        <div className="w-full @md:flex-auto px-4">
                          <p className="font-bold @xl:text-center @md:pl-4 @lg:pl-0 pb-4 @md:pb-0">
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
                                  className="underline hover:no-underline"
                                  to={`/event/${loaderData.event.parentEvent.slug}`}
                                  prefetch="intent"
                                >
                                  {" "}
                                </Link>,
                              ]
                            )}
                          </p>
                        </div>
                        <div className="w-full @lg:shrink-0 @lg:grow-0 @lg:basis-1/4 px-4 text-right">
                          <div className="pr-4 @lg:pr-8">
                            <>
                              {loaderData.mode === "anon" &&
                              loaderData.event.canceled === false ? (
                                <Link
                                  className="h-auto min-h-0 whitespace-nowrap py-2 px-6 normal-case leading-6 inline-flex cursor-pointer outline-primary shrink-0 flex-wrap items-center justify-center rounded-lg text-center border-primary text-sm font-semibold border bg-primary text-white"
                                  to={`/login?login_redirect=/event/${loaderData.event.slug}`}
                                  prefetch="intent"
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
                    <div className="@md:bg-accent-300 @md:rounded-b-3xl @md:py-6">
                      <div className="@md:flex -mx-[17px] items-center">
                        <div className="w-full hidden @lg:flex @lg:shrink-0 @lg:grow-0 @lg:basis-1/4 px-4"></div>
                        <div className="w-full @md:flex-auto px-4">
                          <p className="font-bold @xl:text-center @md:pl-4 @lg:pl-0 pb-4 @md:pb-0">
                            {insertComponentsIntoLocale(
                              locales.route.content.event.select,
                              [
                                <Link
                                  key="to-child-events"
                                  to="#child-events"
                                  className="underline hover:no-underline"
                                >
                                  {" "}
                                </Link>,
                              ]
                            )}
                          </p>
                        </div>
                        <div className="w-full @lg:shrink-0 @lg:grow-0 @lg:basis-1/4 px-4 text-right">
                          <div className="pr-4 @lg:pr-8">
                            <>
                              {loaderData.mode === "anon" &&
                              loaderData.event.canceled === false ? (
                                <Link
                                  className="h-auto min-h-0 whitespace-nowrap py-2 px-6 normal-case leading-6 inline-flex cursor-pointer outline-primary shrink-0 flex-wrap items-center justify-center rounded-lg text-center border-primary text-sm font-semibold border bg-primary text-white"
                                  to={`/login?login_redirect=/event/${loaderData.event.slug}`}
                                  prefetch="intent"
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
                    <div className="@md:bg-white @md:border @md:border-neutral-500 @md:rounded-b-3xl @md:py-6 @md:text-right pr-4 @lg:pr-8">
                      <>
                        {loaderData.mode === "anon" &&
                        loaderData.event.canceled === false ? (
                          <Link
                            className="h-auto min-h-0 whitespace-nowrap py-2 px-6 normal-case leading-6 inline-flex cursor-pointer outline-primary shrink-0 flex-wrap items-center justify-center rounded-lg text-center border-primary text-sm font-semibold border bg-primary text-white"
                            to={`/login?login_redirect=/event/${loaderData.event.slug}`}
                            prefetch="intent"
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
            <div className="bg-accent-white p-8 pb-0">
              <p className="font-bold text-right">
                <Link
                  className="ml-4 mb-2 @md:mb-0 border border-primary bg-white text-primary h-auto min-h-0 whitespace-nowrap py-2 px-6 normal-case leading-6 inline-flex cursor-pointer selct-none flex-wrap items-center justify-center rounded-lg text-center font-semibold gap-2 hover:bg-primary hover:text-white"
                  to={`/event/${loaderData.event.slug}/settings/general`}
                  prefetch="intent"
                >
                  {locales.route.content.event.edit}
                </Link>
                <Link
                  className="ml-4 h-auto min-h-0 whitespace-nowrap py-2 px-6 normal-case leading-6 inline-flex cursor-pointer outline-primary shrink-0 flex-wrap items-center justify-center rounded-lg text-center border-primary text-sm font-semibold border bg-primary text-white"
                  to={`/event/create/?parent=${loaderData.event.id}`}
                  prefetch="intent"
                >
                  {locales.route.content.event.createRelated}
                </Link>
              </p>
            </div>
          </>
        ) : null}
      </section>
      <div className="w-full mx-auto px-4 @sm:max-w-screen-container-sm @md:max-w-screen-container-md @lg:max-w-screen-container-lg @xl:max-w-screen-container-xl @xl:px-6 @2xl:max-w-screen-container-2xl relative pt-8 @lg:pt-16 mb-24">
        <div className="flex -mx-4 justify-center">
          <div className="w-full @lg:shrink-0 @lg:grow-0 @lg:basis-1/2 px-4">
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

            <div className="grid grid-cols-1 @md:grid-cols-[minmax(100px,_1fr)_4fr] gap-x-4 gap-y-1 @md:gap-y-6">
              {loaderData.event.types.length > 0 ? (
                <>
                  <div className="text-xs leading-6">
                    {locales.route.content.event.type}
                  </div>
                  <div className="pb-3 @md:pb-0">
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
                  <div className="text-xs leading-6">
                    {locales.route.content.event.location}
                  </div>
                  <div className="pb-3 @md:pb-0">
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
                    {locales.route.content.event.conferenceLink}
                  </div>
                  <div className="pb-3 @md:pb-0">
                    <Link
                      to={loaderData.event.conferenceLink}
                      target="_blank"
                      rel="noreferrer noopener"
                    >
                      {loaderData.event.conferenceLink}
                    </Link>
                  </div>
                </>
              ) : null}
              {loaderData.event.conferenceCode !== null &&
              loaderData.event.conferenceCode !== "" ? (
                <>
                  <div className="text-xs leading-6">
                    {locales.route.content.event.conferenceCode}
                  </div>
                  <div className="pb-3 @md:pb-0">
                    {loaderData.event.conferenceCode}
                  </div>
                </>
              ) : null}

              <div className="text-xs leading-6">
                {locales.route.content.event.start}
              </div>
              <div className="pb-3 @md:pb-0">
                {formatDateTime(startTime, language, locales)}
              </div>

              <div className="text-xs leading-6">
                {locales.route.content.event.end}
              </div>
              <div className="pb-3 @md:pb-0">
                {formatDateTime(endTime, language, locales)}
              </div>

              {participationFrom > now ? (
                <>
                  <div className="text-xs leading-6">
                    {locales.route.content.event.registrationStart}
                  </div>
                  <div className="pb-3 @md:pb-0">
                    {formatDateTime(participationFrom, language, locales)}
                  </div>
                </>
              ) : null}
              {participationUntil > now ? (
                <>
                  <div className="text-xs leading-6">
                    {locales.route.content.event.registrationEnd}
                  </div>
                  <div className="pb-3 @md:pb-0">
                    {formatDateTime(participationUntil, language, locales)}
                  </div>
                </>
              ) : null}

              {loaderData.event.participantLimit === null ||
              loaderData.event.participantLimit -
                loaderData.event._count.participants >
                0 ? (
                <>
                  <div className="text-xs leading-6">
                    {locales.route.content.event.numberOfPlaces}
                  </div>
                  <div className="pb-3 @md:pb-0">
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
                  <div className="text-xs leading-6">
                    {locales.route.content.event.numberOfWaitingSeats}
                  </div>
                  <div className="pb-3 @md:pb-0">
                    {loaderData.event._count.waitingList}{" "}
                    {locales.route.content.event.onWaitingList}
                  </div>
                </>
              ) : null}

              {loaderData.isParticipant === true ||
              loaderData.isSpeaker === true ||
              loaderData.isTeamMember === true ? (
                <>
                  <div className="text-xs leading-6 mt-1">
                    {locales.route.content.event.calenderItem}
                  </div>
                  <div className="pb-3 @md:pb-0">
                    <Link
                      className="border border-primary bg-white text-primary h-auto min-h-0 whitespace-nowrap py-[.375rem] px-6 normal-case leading-[1.125rem] inline-flex cursor-pointer selct-none flex-wrap items-center justify-center rounded-lg text-center text-sm font-semibold gap-2 hover:bg-primary hover:text-white"
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
                  <div className="text-xs leading-6">
                    {locales.route.content.event.downloads}
                  </div>
                  <div className="pb-3 @md:pb-0">
                    {loaderData.event.documents.map((item) => {
                      return (
                        <div key={`document-${item.document.id}`}>
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
                        className="mt-4 border border-primary bg-white text-primary h-auto min-h-0 whitespace-nowrap py-[.375rem] px-6 normal-case leading-[1.125rem] inline-flex cursor-pointer selct-none flex-wrap items-center justify-center rounded-lg text-center text-sm font-semibold gap-2 hover:bg-primary hover:text-white"
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
                  <div className="text-xs leading-5 pt-[7px]">
                    {locales.route.content.event.focusAreas}
                  </div>
                  <div className="flex flex-wrap -m-1 pb-3 @md:pb-0">
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
                          className="m-1 px-3 py-1.5 h-auto rounded-lg border border-secondary text-sm font-semibold whitespace-nowrap text-secondary bg-white w-fit"
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
                  <div className="text-xs leading-5 pt-[7px]">
                    {locales.route.content.event.targetGroups}
                  </div>
                  <div className="flex flex-wrap -m-1 pb-3 @md:pb-0">
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
                            className="m-1 px-3 py-1.5 h-auto rounded-lg border border-secondary text-sm font-semibold whitespace-nowrap text-secondary bg-white w-fit"
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
                  <div className="text-xs leading-5 pt-[7px]">
                    {locales.route.content.event.experienceLevel}
                  </div>
                  <div className="-m-1 pb-3 @md:pb-0">
                    <div className="m-1 px-3 py-1.5 h-auto rounded-lg border border-secondary text-sm font-semibold whitespace-nowrap text-secondary bg-white w-fit">
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
                  <div className="text-xs leading-5 pt-[7px]">
                    {locales.route.content.event.tags}
                  </div>
                  <div className="flex flex-wrap -m-1 pb-3 @md:pb-0">
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
                          className="m-1 px-3 py-1.5 h-auto rounded-lg border border-secondary text-sm font-semibold whitespace-nowrap text-secondary bg-white w-fit"
                        >
                          {title}
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
                <h2 className="mt-16 mb-8 font-bold">
                  {locales.route.content.event.speakers}
                </h2>
                <a
                  id="speaker-start"
                  href="#speaker-end"
                  className="fixed w-0 h-0 opacity-0 focus:relative focus:block focus:w-fit focus:h-fit focus:opacity-100 mb-2 px-1"
                >
                  {locales.route.content.event.skipSpeakers}
                </a>
                <div className="grid grid-cols-1 @md:grid-cols-2 @xl:grid-cols-3 gap-4 mb-16">
                  {loaderData.event.speakers.map((speaker) => {
                    const { profile } = speaker;
                    return (
                      <div key={profile.username}>
                        <Link
                          className="flex flex-row"
                          to={`/profile/${profile.username}`}
                          prefetch="intent"
                        >
                          <div className="h-11 w-11 bg-primary text-white text-xl flex items-center justify-center rounded-full overflow-hidden shrink-0">
                            {profile.avatar !== null &&
                            profile.avatar !== "" ? (
                              <Avatar
                                size="full"
                                firstName={profile.firstName}
                                lastName={profile.lastName}
                                avatar={profile.avatar}
                                blurredAvatar={profile.blurredAvatar}
                                altSuffix={locales.route.content.event.speaker}
                              />
                            ) : (
                              getInitials(profile)
                            )}
                          </div>

                          <div className="pl-4">
                            <h3 className="text-sm m-0 font-bold">
                              {`${profile.academicTitle || ""} ${
                                profile.firstName
                              } ${profile.lastName}`.trimStart()}
                            </h3>
                            <p className="text-sm m-0 line-clamp-2">
                              {profile.position}
                            </p>
                          </div>
                        </Link>
                      </div>
                    );
                  })}
                </div>
                <a
                  id="speaker-end"
                  href="#speaker-start"
                  className="fixed w-0 h-0 opacity-0 focus:relative focus:block focus:w-fit focus:h-fit focus:opacity-100 mt-2 px-1"
                >
                  {locales.route.content.event.backToSpeakers}
                </a>
              </>
            ) : null}
            {loaderData.event.childEvents.length > 0 ? (
              <div className="relative">
                <div
                  id="child-events"
                  className="absolute -top-[76px] xl:-top-20"
                />
                <h2 className="mt-16 font-bold">
                  {locales.route.content.event.relatedEvents}
                </h2>
                <p className="mb-8">
                  {insertParametersIntoLocale(
                    locales.route.content.event.eventContext,
                    {
                      name: loaderData.event.name,
                    }
                  )}
                </p>
                <a
                  id="child-events-start"
                  href="#child-events-end"
                  className="fixed w-0 h-0 opacity-0 focus:relative focus:block focus:w-fit focus:h-fit focus:opacity-100 mb-2 px-1"
                >
                  {locales.route.content.event.skipRelatedEvents}
                </a>
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
                        className="rounded-lg bg-white shadow-xl border-t border-r border-neutral-300 mb-2 flex items-stretch overflow-hidden focus-within:ring-2 focus-within:ring-primary-200"
                      >
                        <Link
                          className="flex focus:outline-hidden"
                          to={`/event/${event.slug}`}
                          prefetch="intent"
                        >
                          <div className="hidden @xl:block w-36 shrink-0 aspect-[3/2]">
                            <div className="w-36 h-full relative">
                              <Image
                                alt={event.name}
                                src={event.background}
                                blurredSrc={event.blurredBackground}
                              />
                            </div>
                          </div>
                          <div className="px-4 py-4">
                            <p className="text-xs mb-1">
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
                            <h3 className="font-bold text-base m-0 @md:line-clamp-1">
                              {event.name}
                            </h3>
                            {event.subline !== null ? (
                              <p className="text-xs mt-1 @md:line-clamp-1">
                                {event.subline}
                              </p>
                            ) : (
                              <p className="text-xs mt-1 @md:line-clamp-1">
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
                                {locales.route.content.event.published}
                              </div>
                            ) : (
                              <div className="flex font-semibold items-center ml-auto border-r-8 border-primary pr-4 py-6 text-primary">
                                {locales.route.content.event.draft}
                              </div>
                            )}
                          </>
                        ) : null}
                        {event.canceled ? (
                          <div className="flex font-semibold items-center ml-auto border-r-8 border-red-400 pr-4 py-6 text-red-400">
                            {locales.route.content.event.cancelled}
                          </div>
                        ) : null}
                        {event.isParticipant &&
                        !event.canceled &&
                        loaderData.mode !== "admin" ? (
                          <div className="flex font-semibold items-center ml-auto border-r-8 border-green-500 pr-4 py-6 text-green-600">
                            <p>{locales.route.content.event.registered}</p>
                          </div>
                        ) : null}
                        {canUserParticipate(event) &&
                        loaderData.userId !== undefined ? (
                          <div className="flex items-center ml-auto pr-4 py-6">
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
                          <div className="flex font-semibold items-center ml-auto border-r-8 border-neutral-500 pr-4 py-6">
                            <p>{locales.route.content.event.waiting}</p>
                          </div>
                        ) : null}
                        {canUserBeAddedToWaitingList(event) &&
                        loaderData.userId !== undefined ? (
                          <div className="flex items-center ml-auto pr-4 py-6">
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
                          <div className="flex items-center ml-auto pr-4 py-6">
                            <Link
                              to={`/event/${event.slug}`}
                              className="h-auto min-h-0 whitespace-nowrap py-2 px-6 normal-case leading-6 inline-flex cursor-pointer outline-primary shrink-0 flex-wrap items-center justify-center rounded-lg text-center border-primary text-sm font-semibold border bg-primary text-white"
                              prefetch="intent"
                            >
                              {locales.route.content.event.more}
                            </Link>
                          </div>
                        ) : null}
                        {loaderData.mode === "anon" &&
                        event.canceled === false ? (
                          <div className="flex items-center ml-auto pr-4 py-6">
                            <Link
                              className="h-auto min-h-0 whitespace-nowrap py-2 px-6 normal-case leading-6 inline-flex cursor-pointer outline-primary shrink-0 flex-wrap items-center justify-center rounded-lg text-center border-primary text-sm font-semibold border bg-primary text-white"
                              to={`/login?login_redirect=/event/${event.slug}`}
                              prefetch="intent"
                            >
                              {locales.route.content.event.register}
                            </Link>
                          </div>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
                <a
                  id="child-events-end"
                  href="#child-events-start"
                  className="fixed w-0 h-0 opacity-0 focus:relative focus:block focus:w-fit focus:h-fit focus:opacity-100 mt-2 px-1"
                >
                  {locales.route.content.event.backToRelatedEvents}
                </a>
              </div>
            ) : null}

            {loaderData.event.teamMembers.length > 0 ? (
              <>
                <h2 className="mt-16 mb-8 font-bold">
                  {locales.route.content.event.team}
                </h2>
                <a
                  id="team-members-start"
                  href="#team-members-end"
                  className="fixed w-0 h-0 opacity-0 focus:relative focus:block focus:w-fit focus:h-fit focus:opacity-100 mb-2 px-1"
                >
                  {locales.route.content.event.skipTeam}
                </a>
                <div className="grid grid-cols-1 @md:grid-cols-2 @xl:grid-cols-3 gap-4">
                  {loaderData.event.teamMembers.map((member) => {
                    return (
                      <div key={`team-member-${member.profile.id}`}>
                        <Link
                          className="flex flex-row"
                          to={`/profile/${member.profile.username}`}
                          prefetch="intent"
                        >
                          <div className="h-11 w-11 bg-primary text-white text-xl flex items-center justify-center rounded-full overflow-hidden shrink-0">
                            {member.profile.avatar !== null &&
                            member.profile.avatar !== "" ? (
                              <Avatar
                                size="full"
                                firstName={member.profile.firstName}
                                lastName={member.profile.lastName}
                                avatar={member.profile.avatar}
                                blurredAvatar={member.profile.blurredAvatar}
                                altSuffix={
                                  locales.route.content.event.teamMember
                                }
                              />
                            ) : (
                              getInitials(member.profile)
                            )}
                          </div>

                          <div className="pl-4">
                            <h3 className="text-sm m-0 font-bold">
                              {`${member.profile.academicTitle || ""} ${
                                member.profile.firstName
                              } ${member.profile.lastName}`.trimStart()}
                            </h3>
                            <p className="text-sm m-0 line-clamp-2">
                              {member.profile.position}
                            </p>
                          </div>
                        </Link>
                      </div>
                    );
                  })}
                </div>
                <a
                  id="team-members-end"
                  href="#team-members-start"
                  className="fixed w-0 h-0 opacity-0 focus:relative focus:block focus:w-fit focus:h-fit focus:opacity-100 mt-2 px-1"
                >
                  {locales.route.content.event.backToTeam}
                </a>
              </>
            ) : null}
            {loaderData.event.responsibleOrganizations.length > 0 ? (
              <div className="relative">
                <div
                  id="responsible-organizations"
                  className="absolute -top-[76px] xl:-top-20"
                />
                <h2 className="mt-16 mb-8 font-bold">
                  {locales.route.content.event.organizedBy}
                </h2>
                <a
                  id="responsible-organizations-start"
                  href="#responsible-organizations-end"
                  className="fixed w-0 h-0 opacity-0 focus:relative focus:block focus:w-fit focus:h-fit focus:opacity-100 mb-2 px-1"
                >
                  {locales.route.content.event.skipOrganizedBy}
                </a>
                <div className="grid grid-cols-1 @md:grid-cols-2 @xl:grid-cols-3 gap-4">
                  {loaderData.event.responsibleOrganizations.map((item) => {
                    return (
                      <div key={`organizer-${item.organization.id}`}>
                        <Link
                          className="flex flex-row"
                          to={`/organization/${item.organization.slug}/detail/about`}
                          prefetch="intent"
                        >
                          {item.organization.logo !== null &&
                          item.organization.logo !== "" ? (
                            <div className="h-11 w-11 flex items-center justify-center rounded-full overflow-hidden shrink-0">
                              <Avatar
                                size="full"
                                name={item.organization.name}
                                logo={item.organization.logo}
                                blurredLogo={item.organization.blurredLogo}
                                altSuffix={
                                  locales.route.content.event.organizer
                                }
                              />
                            </div>
                          ) : (
                            <div className="h-11 w-11 bg-primary text-white text-xl flex items-center justify-center rounded-full overflow-hidden shrink-0">
                              {getInitialsOfName(item.organization.name)}
                            </div>
                          )}
                          <div className="pl-4">
                            <h3 className="text-sm m-0 font-bold">
                              {item.organization.name}
                            </h3>

                            <p className="text-sm m-0 line-clamp-2">
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
                <a
                  id="responsible-organizations-end"
                  href="#responsible-organizations-start"
                  className="fixed w-0 h-0 opacity-0 focus:relative focus:block focus:w-fit focus:h-fit focus:opacity-100 mt-2 px-1"
                >
                  {locales.route.content.event.backToOrganizedBy}
                </a>
              </div>
            ) : null}

            {loaderData.event.participants !== null &&
            loaderData.event.participants.length > 0 ? (
              <>
                <h2 className="mt-16 mb-8 font-bold">
                  {locales.route.content.event.participants}
                </h2>
                <a
                  id="participants-start"
                  href="#participants-end"
                  className="fixed w-0 h-0 opacity-0 focus:relative focus:block focus:w-fit focus:h-fit focus:opacity-100 mb-2 px-1"
                >
                  {locales.route.content.event.skipParticipants}
                </a>
                <div className="grid grid-cols-1 @md:grid-cols-2 @xl:grid-cols-3 gap-4">
                  {loaderData.event.participants.map((participant) => {
                    const { profile } = participant;
                    return (
                      <div key={profile.username}>
                        <Link
                          className="flex flex-row"
                          to={`/profile/${profile.username}`}
                          prefetch="intent"
                        >
                          <div className="h-11 w-11 bg-primary text-white text-xl flex items-center justify-center rounded-full overflow-hidden shrink-0">
                            {profile.avatar !== null &&
                            profile.avatar !== "" ? (
                              <Avatar
                                size="full"
                                firstName={profile.firstName}
                                lastName={profile.lastName}
                                avatar={profile.avatar}
                                blurredAvatar={profile.blurredAvatar}
                                altSuffix={
                                  locales.route.content.event.participant
                                }
                              />
                            ) : (
                              getInitials(profile)
                            )}
                          </div>

                          <div className="pl-4">
                            <h3 className="text-sm m-0 font-bold">
                              {`${profile.academicTitle || ""} ${
                                profile.firstName
                              } ${profile.lastName}`.trimStart()}
                            </h3>
                            <p className="text-sm m-0 line-clamp-2">
                              {profile.position}
                            </p>
                          </div>
                        </Link>
                      </div>
                    );
                  })}
                </div>
                <a
                  id="participants-end"
                  href="#participants-start"
                  className="fixed w-0 h-0 opacity-0 focus:relative focus:block focus:w-fit focus:h-fit focus:opacity-100 mt-2 px-1"
                >
                  {locales.route.content.event.backToParticipants}
                </a>
              </>
            ) : null}
          </div>
        </div>
      </div>
    </>
  );
}

export default Index;
