import { Avatar as MVAvatar } from "@mint-vernetzt/components/src/molecules/Avatar";
import { Button } from "@mint-vernetzt/components/src/molecules/Button";
import { Chip } from "@mint-vernetzt/components/src/molecules/Chip";
import { Image } from "@mint-vernetzt/components/src/molecules/Image";
import type { Profile } from "@prisma/client";
import { captureException } from "@sentry/node";
import { utcToZonedTime } from "date-fns-tz";
import rcSliderStyles from "rc-slider/assets/index.css?url";
import { useCallback } from "react";
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
} from "react-router";
import { createAuthClient, getSessionUser } from "~/auth.server";
import { BackButton } from "~/components-next/BackButton";
import { Mastodon } from "~/components-next/icons/Mastodon";
import { TikTok } from "~/components-next/icons/TikTok";
import { Modal } from "~/components-next/Modal";
import ExternalServiceIcon from "~/components/ExternalService/ExternalServiceIcon";
import { H3 } from "~/components/Heading/Heading";
import ImageCropper, {
  IMAGE_CROPPER_DISCONNECT_INTENT_VALUE,
} from "~/components/ImageCropper/ImageCropper";
import OrganizationCard from "~/components/OrganizationCard/OrganizationCard";
import { RichText } from "~/components/Richtext/RichText";
import type { ExternalService } from "~/components/types";
import { INTENT_FIELD_NAME } from "~/form-helpers";
import { detectLanguage } from "~/i18n.server";
import { ImageAspects, MaxImageSizes, MinCropSizes } from "~/images.shared";
import {
  canUserBeAddedToWaitingList,
  canUserParticipate,
} from "~/lib/event/utils";
import { getFullName } from "~/lib/profile/getFullName";
import { getInitials } from "~/lib/profile/getInitials";
import { getInitialsOfName } from "~/lib/string/getInitialsOfName";
import { insertParametersIntoLocale } from "~/lib/utils/i18n";
import { invariantResponse } from "~/lib/utils/response";
import { getParamValueOrThrow } from "~/lib/utils/routes";
import { getDuration } from "~/lib/utils/time";
import { removeHtmlTags } from "~/lib/utils/transformHtml";
import { languageModuleMap } from "~/locales/.server";
import { AddParticipantButton } from "~/routes/event/$slug/settings/participants/add-participant";
import { AddToWaitingListButton } from "~/routes/event/$slug/settings/waiting-list/add-to-waiting-list";
import { addUserParticipationStatus } from "~/routes/event/$slug/utils.server";
import { getFeatureAbilities } from "~/routes/feature-access.server";
import { parseMultipartFormData } from "~/storage.server";
import { UPLOAD_INTENT_VALUE } from "~/storage.shared";
import { redirectWithToast } from "~/toast.server";
import {
  disconnectImage,
  getProfileByUsername,
  uploadImage,
} from "./index.server";
import {
  addImgUrls,
  deriveProfileMode,
  filterProfile,
  getRedirectPathOnProtectedProfileRoute,
  sortEvents,
  splitEventsIntoFutureAndPast,
} from "./utils.server";

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
  if (data.data.bio === null && data.data.background === null) {
    return [
      {
        title: `MINTvernetzt Community Plattform | ${
          data.data.academicTitle ? `${data.data.academicTitle} ` : ""
        }${data.data.firstName} ${data.data.lastName}`,
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
  if (data.data.bio === null) {
    return [
      {
        title: `MINTvernetzt Community Plattform | ${
          data.data.academicTitle ? `${data.data.academicTitle} ` : ""
        }${data.data.firstName} ${data.data.lastName}`,
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
        content: data.data.background,
      },
      {
        property: "og:image:secure_url",
        content: data.data.background,
      },
      {
        property: "og:url",
        content: data.meta.url,
      },
    ];
  }
  if (data.data.background === null) {
    return [
      {
        title: `MINTvernetzt Community Plattform | ${
          data.data.academicTitle ? `${data.data.academicTitle} ` : ""
        }${data.data.firstName} ${data.data.lastName}`,
      },
      {
        name: "description",
        property: "og:description",
        content: removeHtmlTags(data.data.bio),
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
      title: `MINTvernetzt Community Plattform | ${
        data.data.academicTitle ? `${data.data.academicTitle} ` : ""
      }${data.data.firstName} ${data.data.lastName}`,
    },
    {
      name: "description",
      property: "og:description",
      content: removeHtmlTags(data.data.bio),
    },
    {
      name: "image",
      property: "og:image",
      content: data.data.background,
    },
    {
      property: "og:image:secure_url",
      content: data.data.background,
    },
    {
      property: "og:url",
      content: data.meta.url,
    },
  ];
};

export const loader = async (args: LoaderFunctionArgs) => {
  const { request, params } = args;

  const language = await detectLanguage(request);
  const locales = languageModuleMap[language]["profile/$username/index"];

  const { authClient } = createAuthClient(request);

  const username = getParamValueOrThrow(params, "username");

  const sessionUser = await getSessionUser(authClient);
  const mode = await deriveProfileMode(sessionUser, username);

  const profile = await getProfileByUsername(username);
  if (profile === null) {
    invariantResponse(false, locales.route.error.profileNotFound, {
      status: 404,
    });
  }

  const abilities = await getFeatureAbilities(authClient, ["events"]);

  // Overwrite administeredeEvents on mode !== "owner" with empty array
  let filteredProfile = {
    ...profile,
    administeredEvents: mode !== "owner" ? [] : profile.administeredEvents,
  };
  // Filtering by visbility settings
  if (mode === "anon") {
    filteredProfile = filterProfile(profile);
  }
  // Add imgUrls for imgproxy call on client
  const enhancedProfile = addImgUrls(authClient, filteredProfile);
  // Split events and profile to handle them seperately
  const {
    contributedEvents,
    teamMemberOfEvents,
    participatedEvents,
    waitingForEvents,
    administeredEvents,
    ...profileWithoutEvents
  } = enhancedProfile;
  // Combine participated and waiting events to show them both in one list in the frontend

  const events = {
    contributedEvents: contributedEvents,
    teamMemberOfEvents,
    participatedEvents: mode !== "anon" ? participatedEvents : [],
    administeredEvents: mode === "owner" ? administeredEvents : [],
  };

  if (mode === "owner") {
    events.participatedEvents.concat(waitingForEvents);
  }

  // Split events into future and past (Note: The events are already ordered by startTime: descending from the database)
  type Events = typeof events;
  const { futureEvents, pastEvents } =
    splitEventsIntoFutureAndPast<Events>(events);
  // Sorting events (future: startTime "desc", past: startTime "asc")
  const inFuture = true;
  type FutureEvents = typeof futureEvents;
  const sortedFutureEvents = sortEvents<FutureEvents>(futureEvents, inFuture);
  type PastEvents = typeof pastEvents;
  const sortedPastEvents = sortEvents<PastEvents>(pastEvents, !inFuture);
  // Adding participation status of session user
  type TeamMemberFutureEvents = typeof sortedFutureEvents.teamMemberOfEvents;
  type ContributedFutureEvents = typeof sortedFutureEvents.contributedEvents;
  type ParticipatedFutureEvents = typeof sortedFutureEvents.participatedEvents;
  type AdministeredFutureEvents = typeof sortedFutureEvents.administeredEvents;
  const enhancedFutureEvents = {
    teamMemberOfEvents:
      await addUserParticipationStatus<TeamMemberFutureEvents>(
        sortedFutureEvents.teamMemberOfEvents,
        sessionUser?.id
      ),
    contributedEvents:
      await addUserParticipationStatus<ContributedFutureEvents>(
        sortedFutureEvents.contributedEvents,
        sessionUser?.id
      ),
    participatedEvents:
      await addUserParticipationStatus<ParticipatedFutureEvents>(
        sortedFutureEvents.participatedEvents,
        sessionUser?.id
      ),
    administeredEvents:
      await addUserParticipationStatus<AdministeredFutureEvents>(
        sortedFutureEvents.administeredEvents,
        sessionUser?.id
      ),
  };
  type TeamMemberPastEvents = typeof sortedPastEvents.teamMemberOfEvents;
  type ContributedPastEvents = typeof sortedPastEvents.contributedEvents;
  type ParticipatedPastEvents = typeof sortedPastEvents.participatedEvents;
  type AdministeredPastEvents = typeof sortedPastEvents.administeredEvents;
  const enhancedPastEvents = {
    teamMemberOfEvents: await addUserParticipationStatus<TeamMemberPastEvents>(
      sortedPastEvents.teamMemberOfEvents,
      sessionUser?.id
    ),
    contributedEvents: await addUserParticipationStatus<ContributedPastEvents>(
      sortedPastEvents.contributedEvents,
      sessionUser?.id
    ),
    participatedEvents:
      await addUserParticipationStatus<ParticipatedPastEvents>(
        sortedPastEvents.participatedEvents,
        sessionUser?.id
      ),
    administeredEvents:
      await addUserParticipationStatus<AdministeredPastEvents>(
        sortedPastEvents.administeredEvents,
        sessionUser?.id
      ),
  };

  return {
    mode,
    data: profileWithoutEvents,
    abilities,
    futureEvents: enhancedFutureEvents,
    pastEvents: enhancedPastEvents,
    userId: sessionUser?.id,
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
  const username = getParamValueOrThrow(params, "username");
  const { authClient } = createAuthClient(request);
  const sessionUser = await getSessionUser(authClient);
  const redirectPath = await getRedirectPathOnProtectedProfileRoute({
    request,
    username,
    sessionUser,
    authClient,
  });
  if (redirectPath !== null) {
    return redirect(redirectPath);
  }
  invariantResponse(sessionUser !== null, "Forbidden", { status: 403 });
  const language = await detectLanguage(request);
  const locales = languageModuleMap[language]["profile/$username/index"];

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
    const result = await uploadImage({
      request,
      formData,
      authClient,
      username,
      locales,
    });
    submission = result.submission;
    toast = result.toast;
    redirectUrl = result.redirectUrl || request.url;
  } else if (intent === IMAGE_CROPPER_DISCONNECT_INTENT_VALUE) {
    const result = await disconnectImage({
      request,
      formData,
      username,
      locales,
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

function hasContactInformations(
  data: Pick<Profile, "email" | "email2" | "phone">
) {
  const hasEmail = typeof data.email === "string" && data.email !== "";
  const hasEmail2 = typeof data.email2 === "string" && data.email2 !== "";
  const hasPhone = typeof data.phone === "string" && data.phone !== "";
  return hasEmail || hasEmail2 || hasPhone;
}

function notEmptyData(
  key: ExternalService,
  data: Pick<Profile, ExternalService>
) {
  if (typeof data[key] === "string") {
    return data[key] !== "";
  }
  return false;
}

const ExternalServices: ExternalService[] = [
  "website",
  "linkedin",
  "facebook",
  "twitter",
  "youtube",
  "instagram",
  "xing",
  "mastodon",
  "tiktok",
];

function hasWebsiteOrSocialService(
  data: Pick<Profile, ExternalService>,
  externalServices: ExternalService[]
) {
  return externalServices.some((item) => notEmptyData(item, data));
}

export default function Index() {
  const loaderData = useLoaderData<typeof loader>();
  const { locales, language } = loaderData;
  const actionData = useActionData<typeof action>();

  const initials = getInitials(loaderData.data);
  const fullName = getFullName(loaderData.data);

  const avatar = loaderData.data.avatar;
  const blurredAvatar = loaderData.data.blurredAvatar;
  const firstName = loaderData.data.firstName;
  const lastName = loaderData.data.lastName;
  const Avatar = useCallback(
    () => (
      <div className="mv-h-36 mv-w-36 mv-bg-neutral-600 mv-text-white mv-text-6xl mv-flex mv-items-center mv-justify-center mv-overflow-hidden mv-rounded-full mv-border">
        {avatar !== null ? (
          <MVAvatar
            avatar={avatar}
            blurredAvatar={blurredAvatar}
            firstName={firstName}
            lastName={lastName}
            size="full"
            textSize="xl"
          />
        ) : (
          initials
        )}
      </div>
    ),
    [avatar, blurredAvatar, firstName, lastName, initials]
  );

  const background = loaderData.data.background;
  const blurredBackground = loaderData.data.blurredBackground;
  const Background = useCallback(
    () => (
      <div className="mv-w-full mv-bg-yellow-100 mv-rounded-md mv-overflow-hidden">
        {background !== null ? (
          <Image
            src={background}
            alt={locales.route.images.currentBackground}
            blurredSrc={blurredBackground}
          />
        ) : (
          <div className="mv-w-[300px] mv-min-h-[108px]" />
        )}
      </div>
    ),
    [background, blurredBackground, locales]
  );

  const hasFutureEvents =
    loaderData.futureEvents.teamMemberOfEvents.length > 0 ||
    loaderData.futureEvents.contributedEvents.length > 0 ||
    loaderData.futureEvents.participatedEvents.length > 0 ||
    loaderData.futureEvents.administeredEvents.length > 0;
  const hasPastEvents =
    loaderData.pastEvents.teamMemberOfEvents.length > 0 ||
    loaderData.pastEvents.contributedEvents.length > 0 ||
    loaderData.pastEvents.participatedEvents.length > 0 ||
    loaderData.pastEvents.administeredEvents.length > 0;

  return (
    <>
      <section className="mv-w-full mv-mx-auto mv-px-4 @sm:mv-max-w-screen-container-sm @md:mv-max-w-screen-container-md @lg:mv-max-w-screen-container-lg @xl:mv-max-w-screen-container-xl @xl:mv-px-6 @2xl:mv-max-w-screen-container-2xl mv-mb-2 @md:mv-mb-4 @md:mv-mt-2">
        <BackButton to="/explore/profiles">{locales.route.back}</BackButton>
      </section>
      <section className="mv-hidden @md:mv-block mv-w-full mv-mx-auto mv-px-4 @sm:mv-max-w-screen-container-sm @md:mv-max-w-screen-container-md @lg:mv-max-w-screen-container-lg @xl:mv-max-w-screen-container-xl @xl:mv-px-6 @2xl:mv-max-w-screen-container-2xl">
        <div className="mv-rounded-3xl mv-relative mv-overflow-hidden mv-bg-yellow-100 mv-w-full mv-aspect-[31/10]">
          <div className="mv-w-full mv-h-full">
            {background !== null ? (
              <Image
                src={background}
                alt={fullName}
                blurredSrc={blurredBackground}
              />
            ) : null}
          </div>
          {loaderData.mode === "owner" ? (
            <div className="mv-absolute mv-bottom-6 mv-right-6">
              <Form method="get" preventScrollReset>
                <input hidden name="modal-background" defaultValue="true" />
                <Button type="submit">
                  {locales.route.profile.changeBackground}
                </Button>
              </Form>

              <Modal searchParam="modal-background">
                <Modal.Title>
                  {locales.route.profile.changeBackgroundHeadline}
                </Modal.Title>
                <Modal.Section>
                  <ImageCropper
                    uploadKey="background"
                    image={loaderData.data.background || undefined}
                    aspect={ImageAspects.Background}
                    minCropWidth={MinCropSizes.Background.width}
                    minCropHeight={MinCropSizes.Background.height}
                    maxTargetWidth={MaxImageSizes.Background.width}
                    maxTargetHeight={MaxImageSizes.Background.height}
                    modalSearchParam="modal-background"
                    locales={locales}
                    currentTimestamp={
                      actionData?.currentTimestamp ||
                      loaderData.currentTimestamp
                    }
                  >
                    <Background />
                  </ImageCropper>
                </Modal.Section>
              </Modal>
            </div>
          ) : null}
        </div>
      </section>
      <div className="mv-w-full mv-mx-auto mv-px-4 @sm:mv-max-w-screen-container-sm @md:mv-max-w-screen-container-md @lg:mv-max-w-screen-container-lg @xl:mv-max-w-screen-container-xl @xl:mv-px-6 @2xl:mv-max-w-screen-container-2xl mv-relative mv-mb-20">
        <div className="mv-flex mv-flex-col @lg:mv-flex-row mv--mx-4">
          <div className="mv-flex-gridcol @lg:mv-w-5/12 mv-px-4 mv-pt-10 @lg:mv-pt-0">
            <div className="mv-px-4 mv-py-8 @lg:mv-p-8 mv-pb-15 @md:mv-pb-5 mv-rounded-3xl mv-border mv-border-neutral-100 mv-bg-neutral-50 mv-shadow-lg @lg:mv-ml-14 -mv-mt-2 @lg:-mv-mt-44 mv-sticky mv-top-24">
              <div className="mv-flex mv-items-center mv-flex-col">
                <Avatar />
                {loaderData.mode === "owner" ? (
                  <>
                    <Form method="get" preventScrollReset>
                      <input hidden name="modal-avatar" defaultValue="true" />
                      <button
                        type="submit"
                        className="mv-appearance-none mv-flex mv-content-center mv-items-center mv-text-nowrap mv-py-2 mv-cursor-pointer mv-text-primary"
                      >
                        <svg
                          width="17"
                          height="16"
                          viewBox="0 0 17 16"
                          xmlns="http://www.w3.org/2000/svg"
                          className="mv-fill-neutral-600"
                        >
                          <path d="M14.9 3.116a.423.423 0 0 0-.123-.299l-1.093-1.093a.422.422 0 0 0-.598 0l-.882.882 1.691 1.69.882-.882a.423.423 0 0 0 .123-.298Zm-3.293.087 1.69 1.69v.001l-5.759 5.76a.422.422 0 0 1-.166.101l-2.04.68a.211.211 0 0 1-.267-.267l.68-2.04a.423.423 0 0 1 .102-.166l5.76-5.76ZM2.47 14.029a1.266 1.266 0 0 1-.37-.895V3.851a1.266 1.266 0 0 1 1.265-1.266h5.486a.422.422 0 0 1 0 .844H3.366a.422.422 0 0 0-.422.422v9.283a.422.422 0 0 0 .422.422h9.284a.422.422 0 0 0 .421-.422V8.07a.422.422 0 0 1 .845 0v5.064a1.266 1.266 0 0 1-1.267 1.266H3.367c-.336 0-.658-.133-.895-.37Z" />
                        </svg>
                        <span className="mv-ml-2">
                          {locales.route.profile.changeAvatar}
                        </span>
                      </button>
                    </Form>

                    <Modal searchParam="modal-avatar">
                      <Modal.Title>
                        {locales.route.profile.changeAvatarHeadline}
                      </Modal.Title>
                      <Modal.Section>
                        <ImageCropper
                          uploadKey="avatar"
                          circularCrop
                          image={loaderData.data.avatar || undefined}
                          aspect={ImageAspects.AvatarAndLogo}
                          minCropWidth={MinCropSizes.AvatarAndLogo.width}
                          minCropHeight={MinCropSizes.AvatarAndLogo.height}
                          maxTargetWidth={MaxImageSizes.AvatarAndLogo.width}
                          maxTargetHeight={MaxImageSizes.AvatarAndLogo.height}
                          modalSearchParam="modal-avatar"
                          locales={locales}
                          currentTimestamp={
                            actionData?.currentTimestamp ||
                            loaderData.currentTimestamp
                          }
                        >
                          <Avatar />
                        </ImageCropper>
                      </Modal.Section>
                    </Modal>
                  </>
                ) : null}

                <h3 className="mv-mt-6 mv-text-5xl mv-mb-1">{fullName}</h3>
                {typeof loaderData.data.position === "string" ? (
                  <p className="mv-font-bold mv-text-sm mv-mb-4">
                    {loaderData.data.position}
                  </p>
                ) : null}
              </div>
              {hasContactInformations(loaderData.data) ||
              hasWebsiteOrSocialService(loaderData.data, ExternalServices) ? (
                <h5 className="mv-font-semibold mv-mb-6 mv-mt-8">
                  {locales.route.profile.contact}
                </h5>
              ) : null}
              {hasContactInformations(loaderData.data) ? (
                <>
                  {typeof loaderData.data.email === "string" &&
                  loaderData.data.email !== "" ? (
                    <p className="mv-text-mb mv-mb-2">
                      <Link
                        to={`mailto:${loaderData.data.email}`}
                        className="mv-flex mv-items-center mv-px-4 mv-py-3 mv-bg-neutral-100 mv-rounded-lg mv-text-neutral-600"
                      >
                        <span className="mv-w-6 mv-mr-4">
                          <svg
                            width="24"
                            height="19"
                            viewBox="0 0 24 19"
                            className="mv-fill-current"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path d="M0 3.6a3 3 0 0 1 3-3h18a3 3 0 0 1 3 3v12a3 3 0 0 1-3 3H3a3 3 0 0 1-3-3v-12Zm3-1.5a1.5 1.5 0 0 0-1.5 1.5v.325l10.5 6.3 10.5-6.3V3.6A1.5 1.5 0 0 0 21 2.1H3Zm19.5 3.574-7.062 4.238 7.062 4.345V5.675Zm-.051 10.314-8.46-5.206L12 11.975l-1.989-1.193-8.46 5.205A1.5 1.5 0 0 0 3 17.1h18a1.5 1.5 0 0 0 1.449-1.112ZM1.5 14.258l7.062-4.346L1.5 5.674v8.584Z" />
                          </svg>
                        </span>
                        <span className="mv-line-clamp-1">
                          {loaderData.data.email}
                        </span>
                      </Link>
                    </p>
                  ) : null}
                  {typeof loaderData.data.email2 === "string" &&
                  loaderData.data.email2 !== "" ? (
                    <p className="mv-text-mb mv-mb-2">
                      <Link
                        to={`mailto:${loaderData.data.email2}`}
                        className="mv-flex mv-items-center mv-px-4 mv-py-3 mv-bg-neutral-100 mv-rounded-lg mv-text-neutral-600"
                      >
                        <span className="mv-w-6 mv-mr-4">
                          <svg
                            width="24"
                            height="19"
                            viewBox="0 0 24 19"
                            className="mv-fill-current"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path d="M0 3.6a3 3 0 0 1 3-3h18a3 3 0 0 1 3 3v12a3 3 0 0 1-3 3H3a3 3 0 0 1-3-3v-12Zm3-1.5a1.5 1.5 0 0 0-1.5 1.5v.325l10.5 6.3 10.5-6.3V3.6A1.5 1.5 0 0 0 21 2.1H3Zm19.5 3.574-7.062 4.238 7.062 4.345V5.675Zm-.051 10.314-8.46-5.206L12 11.975l-1.989-1.193-8.46 5.205A1.5 1.5 0 0 0 3 17.1h18a1.5 1.5 0 0 0 1.449-1.112ZM1.5 14.258l7.062-4.346L1.5 5.674v8.584Z" />
                          </svg>
                        </span>
                        <span className="mv-line-clamp-1">
                          {loaderData.data.email2}
                        </span>
                      </Link>
                    </p>
                  ) : null}
                  {typeof loaderData.data.phone === "string" &&
                  loaderData.data.phone !== "" ? (
                    <p className="mv-text-md mv-text-neutral-600 mv-mb-2">
                      <Link
                        to={`tel:${loaderData.data.phone}`}
                        className="mv-flex mv-items-center mv-px-4 mv-py-3 mv-bg-neutral-100 mv-rounded-lg mv-text-neutral-600"
                      >
                        <span className="mv-w-6 mv-mr-4">
                          <svg
                            width="22"
                            height="22"
                            viewBox="0 0 22 22"
                            className="mv-fill-current"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path d="M5.134 1.993a.915.915 0 0 0-1.37-.085L2.367 3.305c-.653.654-.893 1.578-.608 2.39a23.717 23.717 0 0 0 5.627 8.92 23.717 23.717 0 0 0 8.92 5.627c.812.285 1.736.045 2.39-.608l1.396-1.395a.916.916 0 0 0-.086-1.37l-3.114-2.422a.916.916 0 0 0-.783-.165l-2.956.738a2.356 2.356 0 0 1-2.237-.62L7.6 11.085a2.355 2.355 0 0 1-.62-2.237l.74-2.956a.915.915 0 0 0-.166-.783L5.134 1.993ZM2.744.89a2.356 2.356 0 0 1 3.526.22l2.422 3.113c.444.571.6 1.315.425 2.017L8.38 9.197a.915.915 0 0 0 .24.868l3.317 3.317a.915.915 0 0 0 .87.24l2.954-.739a2.354 2.354 0 0 1 2.017.426l3.113 2.421a2.355 2.355 0 0 1 .22 3.525l-1.395 1.396c-1 .999-2.493 1.438-3.884.948a25.156 25.156 0 0 1-9.464-5.967A25.156 25.156 0 0 1 .401 6.17c-.49-1.39-.05-2.885.949-3.884L2.745.89Z" />
                          </svg>
                        </span>
                        <span className="mv-line-clamp-1">
                          {loaderData.data.phone}
                        </span>
                      </Link>
                    </p>
                  ) : null}
                </>
              ) : null}

              {/* --- WEBSITE & SOCIAL --- */}
              {hasWebsiteOrSocialService(loaderData.data, ExternalServices) ? (
                <ul className="mv-list-none mv-flex mv-flex-wrap mv--mx-1 mv-mb-2">
                  {ExternalServices.map((service) => {
                    if (
                      typeof loaderData.data[service] === "string" &&
                      loaderData.data[service] !== ""
                    ) {
                      if (service === "mastodon" || service === "tiktok") {
                        return (
                          <li
                            key={service}
                            className="mv-flex-auto mv-px-1 mv-mb-2"
                          >
                            <Link
                              to={loaderData.data[service] as string}
                              target="__blank"
                              rel="noopener noreferrer"
                              className="mv-flex-1 mv-flex mv-bg-neutral-100 mv-items-center mv-justify-center mv-px-4 mv-py-2.5 mv-rounded-lg mv-text-neutral-700"
                            >
                              {service === "mastodon" && <Mastodon />}
                              {service === "tiktok" && <TikTok />}
                            </Link>
                          </li>
                        );
                      }

                      return (
                        <li
                          key={service}
                          className="mv-flex-auto mv-px-1 mv-mb-2"
                        >
                          <ExternalServiceIcon
                            service={service}
                            // TODO: can this type assertion be removed and proofen by code?
                            url={loaderData.data[service] as string}
                          />
                        </li>
                      );
                    }

                    return false;
                  })}
                </ul>
              ) : null}

              {loaderData.data.createdAt !== undefined ? (
                <>
                  <hr className="mv-divide-y mv-divide-neutral-400 mv-mt-8 mv-mb-6" />

                  <p className="mv-text-xs mv-mb-4 mv-text-center">
                    {insertParametersIntoLocale(
                      locales.route.profile.existsSince,
                      {
                        timestamp: utcToZonedTime(
                          loaderData.data.createdAt,
                          "Europe/Berlin"
                        ).toLocaleDateString("de-De", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        }),
                      }
                    )}
                  </p>
                </>
              ) : null}
            </div>
          </div>

          <div className="mv-flex-col @lg:mv-w-7/12 mv-px-4 mv-pt-10 @lg:mv-pt-20 mv-overflow-hidden">
            <div className="mv-flex mv-flex-col-reverse @lg:mv-flex-row mv-flex-nowrap">
              <div className="mv-flex-auto mv-pr-4 mv-mb-6">
                <h1 className="mv-mb-0">
                  {insertParametersIntoLocale(
                    locales.route.profile.introduction,
                    {
                      name: getFullName(loaderData.data, {
                        withAcademicTitle: false,
                      }),
                    }
                  )}
                </h1>
              </div>
              {loaderData.mode === "owner" ? (
                <div className="mv-flex-initial @lg:mv-pl-4 mv-pt-3 mv-mb-6">
                  <Link
                    className="mv-border mv-border-primary mv-bg-white mv-text-primary mv-h-auto mv-min-h-0 mv-whitespace-nowrap mv-py-2 mv-px-6 mv-normal-case mv-leading-6 mv-inline-flex mv-cursor-pointer mv-selct-none mv-flex-wrap mv-items-center mv-justify-center mv-rounded-lg mv-text-center mv-font-semibold mv-gap-2 hover:mv-bg-primary hover:mv-text-white"
                    to={`/profile/${loaderData.data.username}/settings`}
                  >
                    {locales.route.profile.editProfile}
                  </Link>
                </div>
              ) : null}
            </div>
            {typeof loaderData.data.bio === "string" ? (
              <RichText
                html={loaderData.data.bio}
                additionalClassNames="mv-mb-6"
              />
            ) : null}
            {loaderData.data.areas.length > 0 ? (
              <div className="mv-flex mv-mb-6 mv-font-semibold mv-flex-col @lg:mv-flex-row">
                <div className="@lg:mv-basis-32 @lg:mv-shrink-0 @lg:mv-grow-0 mv-text-xs @lg:mv-text-sm mv-leading-4 mv-mb-2 @lg:mv-mb-0 @lg:mv-leading-6">
                  {locales.route.profile.activityAreas}
                </div>
                <div className="@lg:mv-flex-auto">
                  {loaderData.data.areas
                    .map((relation) => relation.area.name)
                    .join(" / ")}
                </div>
              </div>
            ) : null}
            {loaderData.data.skills.length > 0 ? (
              <div className="mv-flex mv-mb-6 mv-font-semibold mv-flex-col @lg:mv-flex-row">
                <div className="@lg:mv-basis-32 @lg:mv-shrink-0 @lg:mv-grow-0 mv-text-xs @lg:mv-text-sm mv-leading-4 @lg:mv-leading-6 mv-mb-2 @lg:mv-mb-0">
                  {locales.route.profile.competences}
                </div>

                <div className="mv-flex-auto">
                  {loaderData.data.skills.join(" / ")}
                </div>
              </div>
            ) : null}

            {loaderData.data.interests.length > 0 ? (
              <div className="mv-flex mv-mb-6 mv-font-semibold mv-flex-col @lg:mv-flex-row">
                <div className="@lg:mv-basis-32 @lg:mv-shrink-0 @lg:mv-grow-0 mv-text-xs @lg:mv-text-sm mv-leading-4 @lg:mv-leading-6 mv-mb-2 @lg:mv-mb-0">
                  {locales.route.profile.interests}
                </div>
                <div className="mv-flex-auto">
                  {loaderData.data.interests.join(" / ")}
                </div>
              </div>
            ) : null}
            {loaderData.data.offers.length > 0 ? (
              <div className="mv-flex mv-mb-6 mv-font-semibold mv-flex-col @lg:mv-flex-row">
                <div className="@lg:mv-basis-32 @lg:mv-shrink-0 @lg:mv-grow-0 mv-text-xs @lg:mv-text-sm mv-leading-4 @lg:mv-leading-6 mv-my-2 @lg:mv-mb-0">
                  {locales.route.profile.offer}
                </div>
                <Chip.Container>
                  {loaderData.data.offers.map((relation) => {
                    let title;
                    if (relation.offer.slug in locales.offers) {
                      type LocaleKey = keyof typeof locales.offers;
                      title =
                        locales.offers[relation.offer.slug as LocaleKey].title;
                    } else {
                      console.error(
                        `Offer ${relation.offer.slug} not found in locales`
                      );
                      title = relation.offer.slug;
                    }
                    return (
                      <Chip
                        key={`offer_${relation.offer.slug}`}
                        color="secondary"
                      >
                        {title}
                      </Chip>
                    );
                  })}
                </Chip.Container>
              </div>
            ) : null}
            {loaderData.data.seekings.length > 0 ? (
              <div className="mv-flex mv-mb-6 mv-font-semibold mv-flex-col @lg:mv-flex-row">
                <div className="@lg:mv-basis-32 @lg:mv-shrink-0 @lg:mv-grow-0 mv-text-xs @lg:mv-text-sm mv-leading-4 @lg:mv-leading-6 mv-my-2 @lg:mv-mb-0">
                  {locales.route.profile.lookingFor}
                </div>
                <Chip.Container>
                  {loaderData.data.seekings.map((relation) => {
                    let title;
                    if (relation.offer.slug in locales.offers) {
                      type LocaleKey = keyof typeof locales.offers;
                      title =
                        locales.offers[relation.offer.slug as LocaleKey].title;
                    } else {
                      console.error(
                        `Focus ${relation.offer.slug} not found in locales`
                      );
                      title = relation.offer.slug;
                    }
                    return (
                      <Chip
                        key={`seeking_${relation.offer.slug}`}
                        color="secondary"
                      >
                        {title}
                      </Chip>
                    );
                  })}
                </Chip.Container>
              </div>
            ) : null}

            {loaderData.data.memberOf.length > 0 ||
            loaderData.mode === "owner" ? (
              <>
                <div className="mv-flex mv-flex-row mv-flex-nowrap mv-mb-6 mv-mt-14 mv-items-center mv-relative">
                  <div
                    id="organizations"
                    className="mv-absolute -mv-top-[76px] xl:-mv-top-20"
                  />
                  <div className="mv-flex-auto mv-pr-4">
                    <h3 className="mv-mb-0 mv-font-bold">
                      {locales.route.section.organizations.title}
                    </h3>
                  </div>
                  {loaderData.mode === "owner" ? (
                    <div className="mv-flex-initial mv-pl-4">
                      <Link
                        to="/organization/create"
                        className="mv-border mv-border-primary mv-bg-white mv-text-primary mv-h-auto mv-min-h-0 mv-whitespace-nowrap mv-py-2 mv-px-6 mv-normal-case mv-leading-6 mv-inline-flex mv-cursor-pointer mv-selct-none mv-flex-wrap mv-items-center mv-justify-center mv-rounded-lg mv-text-center mv-font-semibold mv-gap-2 hover:mv-bg-primary hover:mv-text-white"
                      >
                        {locales.route.section.organizations.create}
                      </Link>
                    </div>
                  ) : null}
                </div>
                {loaderData.data.memberOf.length > 0 ? (
                  <div className="mv-flex mv-flex-wrap mv--mx-3 mv-items-stretch">
                    {loaderData.data.memberOf.map((relation) => (
                      <OrganizationCard
                        key={`${relation.organization.slug}`}
                        id={`${relation.organization.slug}`}
                        link={`/organization/${relation.organization.slug}`}
                        name={relation.organization.name}
                        types={relation.organization.types}
                        image={relation.organization.logo}
                        blurredImage={relation.organization.blurredLogo}
                        locales={locales}
                      />
                    ))}
                  </div>
                ) : null}
              </>
            ) : null}
            {loaderData.data.teamMemberOfProjects.length > 0 ||
            loaderData.mode === "owner" ? (
              <>
                <div
                  id="projects"
                  className="mv-flex mv-flex-row mv-flex-nowrap mv-mb-6 mv-mt-14 mv-items-center"
                >
                  <div className="mv-flex-auto mv-pr-4">
                    <h3 className="mv-mb-0 mv-font-bold">
                      {locales.route.section.projects.title}
                    </h3>
                  </div>
                  {loaderData.mode === "owner" ? (
                    <div className="mv-flex-initial mv-pl-4">
                      <Link
                        to="/project/create"
                        className="mv-border mv-border-primary mv-bg-white mv-text-primary mv-h-auto mv-min-h-0 mv-whitespace-nowrap mv-py-2 mv-px-6 mv-normal-case mv-leading-6 mv-inline-flex mv-cursor-pointer mv-selct-none mv-flex-wrap mv-items-center mv-justify-center mv-rounded-lg mv-text-center mv-font-semibold mv-gap-2 hover:mv-bg-primary hover:mv-text-white"
                      >
                        {locales.route.section.projects.create}
                      </Link>
                    </div>
                  ) : null}
                </div>
                {loaderData.data.teamMemberOfProjects.length > 0 ? (
                  <div className="mv-flex mv-flex-wrap mv--mx-3 mv-items-stretch">
                    {loaderData.data.teamMemberOfProjects.map((relation) => (
                      // TODO: Project Card
                      <div
                        key={relation.project.slug}
                        data-testid="gridcell"
                        className="mv-w-full mv-px-3 mv-mb-4"
                      >
                        <Link
                          to={`/project/${relation.project.slug}`}
                          className="mv-flex mv-flex-wrap mv-content-start mv-p-4 mv-rounded-2xl hover:mv-bg-neutral-200 mv-border mv-border-neutral-500"
                        >
                          <div className="mv-w-full mv-flex mv-items-center mv-flex-row">
                            {relation.project.logo !== "" &&
                            relation.project.logo !== null ? (
                              <div className="mv-h-16 mv-w-16 mv-flex mv-flex-initial mv-items-center mv-justify-center mv-relative mv-shrink-0 mv-rounded-full mv-overflow-hidden mv-border">
                                <MVAvatar
                                  logo={relation.project.logo}
                                  blurredLogo={relation.project.blurredLogo}
                                  name={relation.project.name}
                                  size="full"
                                />
                              </div>
                            ) : (
                              <div className="mv-h-16 mv-w-16 mv-bg-neutral-600 mv-text-white mv-text-3xl mv-flex mv-items-center mv-justify-center mv-rounded-full mv-overflow-hidden mv-shrink-0 mv-border">
                                {getInitialsOfName(relation.project.name)}
                              </div>
                            )}
                            <div className="mv-pl-4 mv-flex-auto">
                              <H3 like="h4" className="mv-text-xl mv-mb-1">
                                {relation.project.name}
                              </H3>
                              {relation.project.responsibleOrganizations
                                .length > 0 ? (
                                <p className="mv-font-bold mv-text-sm">
                                  {relation.project.responsibleOrganizations
                                    .map(
                                      ({ organization }) => organization.name
                                    )
                                    .join(" / ")}
                                </p>
                              ) : null}
                            </div>
                            <div className="mv-hidden @md:mv-flex mv-items-center mv-flex-initial">
                              <button className="mv-h-auto mv-min-h-0 mv-whitespace-nowrap mv-py-2 mv-px-6 mv-normal-case mv-leading-6 mv-inline-flex mv-cursor-pointer mv-outline-primary mv-shrink-0 mv-flex-wrap mv-items-center mv-justify-center mv-rounded-lg mv-text-center mv-border-primary mv-text-sm mv-font-semibold mv-border mv-bg-primary mv-text-white">
                                {locales.route.section.projects.to}
                              </button>
                            </div>
                          </div>
                        </Link>
                      </div>
                    ))}
                  </div>
                ) : null}
              </>
            ) : null}
            {hasFutureEvents ? (
              <>
                <div
                  id="events"
                  className="mv-flex mv-flex-row mv-flex-nowrap mv-mb-6 mv-mt-14 mv-items-center"
                >
                  <div className="mv-flex-auto mv-pr-4">
                    <h3 className="mv-mb-0 mv-font-bold">
                      {locales.route.section.comingEvents.title}
                    </h3>
                  </div>
                  {loaderData.mode === "owner" &&
                  loaderData.abilities.events.hasAccess ? (
                    <div className="mv-flex-initial mv-pl-4">
                      <Link
                        to="/event/create"
                        className="mv-border mv-border-primary mv-bg-white mv-text-primary mv-h-auto mv-min-h-0 mv-whitespace-nowrap mv-py-2 mv-px-6 mv-normal-case mv-leading-6 mv-inline-flex mv-cursor-pointer mv-selct-none mv-flex-wrap mv-items-center mv-justify-center mv-rounded-lg mv-text-center mv-font-semibold mv-gap-2 hover:mv-bg-primary hover:mv-text-white"
                      >
                        {locales.route.section.comingEvents.create}
                      </Link>
                    </div>
                  ) : null}
                </div>
                {loaderData.futureEvents.administeredEvents.length > 0 ? (
                  <>
                    <h6
                      id="admin-future-events"
                      className="mv-mb-4 mv-font-bold"
                    >
                      {locales.route.section.event.admin}
                    </h6>
                    <div className="mv-mb-6">
                      {loaderData.futureEvents.administeredEvents.map(
                        ({ event }) => {
                          const startTime = utcToZonedTime(
                            event.startTime,
                            "Europe/Berlin"
                          );
                          const endTime = utcToZonedTime(
                            event.endTime,
                            "Europe/Berlin"
                          );
                          return (
                            <div
                              key={`future-admin-event-${event.id}`}
                              className="mv-rounded-lg mv-bg-white mv-shadow-xl mv-border-t mv-border-r mv-border-neutral-300  mv-mb-2 mv-flex mv-items-stretch mv-overflow-hidden"
                            >
                              <Link
                                className="mv-flex"
                                to={`/event/${event.slug}`}
                              >
                                <div className="mv-hidden @xl:mv-block mv-w-36 mv-shrink-0 mv-aspect-[3/2]">
                                  <div className="mv-w-36 mv-h-full mv-relative">
                                    <Image
                                      src={event.background}
                                      alt={event.name}
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
                                          if (
                                            event.stage.slug in locales.stages
                                          ) {
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
                                    {getDuration(startTime, endTime, language)}

                                    {event.participantLimit === null &&
                                      ` | ${locales.route.section.event.unlimitedSeats}`}
                                    {event.participantLimit !== null &&
                                      event.participantLimit -
                                        event._count.participants >
                                        0 &&
                                      ` | ${
                                        event.participantLimit -
                                        event._count.participants
                                      } / ${event.participantLimit} ${
                                        locales.route.section.event.seatsFree
                                      }`}

                                    {event.participantLimit !== null &&
                                    event.participantLimit -
                                      event._count.participants <=
                                      0 ? (
                                      <>
                                        {" "}
                                        |{" "}
                                        <span>
                                          {event._count.waitingList}{" "}
                                          {
                                            locales.route.section.event
                                              .onWaitingList
                                          }
                                        </span>
                                      </>
                                    ) : null}
                                  </p>
                                  <h4 className="mv-font-bold mv-text-base mv-m-0 @lg:mv-line-clamp-1">
                                    {event.name}
                                  </h4>
                                  {event.subline !== null ? (
                                    <p className="mv-hidden mv-text-xs mv-mt-1 @lg:mv-line-clamp-1">
                                      {event.subline}
                                    </p>
                                  ) : (
                                    <p className="mv-hidden mv-text-xs mv-mt-1 @lg:mv-line-clamp-1">
                                      {removeHtmlTags(event.description ?? "")}
                                    </p>
                                  )}
                                </div>
                              </Link>

                              {loaderData.mode === "owner" &&
                              !event.canceled ? (
                                <>
                                  {event.published ? (
                                    <div className="mv-flex mv-font-semibold mv-items-center mv-ml-auto mv-border-r-8 mv-border-green-600 mv-pr-4 mv-py-6 mv-text-green-600">
                                      {locales.route.section.event.published}
                                    </div>
                                  ) : (
                                    <div className="mv-flex mv-font-semibold mv-items-center mv-ml-auto mv-border-r-8 mv-border-primary mv-pr-4 mv-py-6 mv-text-primary">
                                      {locales.route.section.event.draft}
                                    </div>
                                  )}
                                </>
                              ) : null}
                              {event.canceled ? (
                                <div className="mv-flex mv-font-semibold mv-items-centermv-ml-auto mv-border-r-8 mv-border-red-400 mv-pr-4 mv-py-6 mv-text-red-400">
                                  {locales.route.section.event.cancelled}
                                </div>
                              ) : null}
                              {event.isParticipant &&
                              !event.canceled &&
                              loaderData.mode !== "owner" ? (
                                <div className="mv-flex mv-font-semibold mv-items-center mv-ml-auto mv-border-r-8 mv-border-green-500 mv-pr-4 mv-py-6 mv-text-green-600">
                                  <p>
                                    {locales.route.section.event.registered}
                                  </p>
                                </div>
                              ) : null}
                              {loaderData.mode !== "anon" &&
                              canUserParticipate(event) ? (
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
                              loaderData.mode !== "owner" ? (
                                <div className="mv-flex mv-font-semibold mv-items-center mv-ml-auto mv-border-r-8 mv-border-neutral-500 mv-pr-4 mv-py-6">
                                  <p>{locales.route.section.event.waiting}</p>
                                </div>
                              ) : null}
                              {loaderData.mode !== "anon" &&
                              canUserBeAddedToWaitingList(event) ? (
                                <div className="mv-flex mv-items-center mv-ml-auto mv-pr-4 mv-py-6">
                                  <AddToWaitingListButton
                                    action={`/event/${event.slug}/settings/waiting-list/add-to-waiting-list`}
                                    profileId={loaderData.userId}
                                    locales={locales}
                                  />
                                </div>
                              ) : null}
                              {(loaderData.mode !== "owner" &&
                                !event.isParticipant &&
                                !canUserParticipate(event) &&
                                !event.isOnWaitingList &&
                                !canUserBeAddedToWaitingList(event) &&
                                !event.canceled &&
                                loaderData.mode !== "anon") ||
                              (loaderData.mode === "anon" &&
                                !event.canceled) ? (
                                <div className="mv-flex mv-items-center mv-ml-auto mv-pr-4 mv-py-6">
                                  <Link
                                    to={`/event/${event.slug}`}
                                    className="mv-h-auto mv-min-h-0 mv-whitespace-nowrap mv-py-2 mv-px-6 mv-normal-case mv-leading-6 mv-inline-flex mv-cursor-pointer mv-outline-primary mv-shrink-0 mv-flex-wrap mv-items-center mv-justify-center mv-rounded-lg mv-text-center mv-border-primary mv-text-sm mv-font-semibold mv-border mv-bg-primary mv-text-white"
                                  >
                                    {locales.route.section.event.more}
                                  </Link>
                                </div>
                              ) : null}
                            </div>
                          );
                        }
                      )}
                    </div>
                  </>
                ) : null}
                {loaderData.futureEvents.teamMemberOfEvents.length > 0 ? (
                  <>
                    <h6
                      id="team-member-future-events"
                      className="mv-mb-4 mv-font-bold"
                    >
                      {locales.route.section.event.team}
                    </h6>
                    <div className="mv-mb-6">
                      {loaderData.futureEvents.teamMemberOfEvents.map(
                        ({ event }) => {
                          const startTime = utcToZonedTime(
                            event.startTime,
                            "Europe/Berlin"
                          );
                          const endTime = utcToZonedTime(
                            event.endTime,
                            "Europe/Berlin"
                          );
                          return (
                            <div
                              key={`future-team-member-event-${event.id}`}
                              className="mv-rounded-lg mv-bg-white mv-shadow-xl mv-border-t mv-border-r mv-border-neutral-300  mv-mb-2 mv-flex mv-items-stretch mv-overflow-hidden"
                            >
                              <Link
                                className="mv-flex"
                                to={`/event/${event.slug}`}
                              >
                                <div className="mv-hidden @xl:mv-block mv-w-36 mv-shrink-0 mv-aspect-[3/2]">
                                  <div className="mv-w-36 mv-h-full mv-relative">
                                    <Image
                                      src={event.background}
                                      alt={event.name}
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
                                          if (
                                            event.stage.slug in locales.stages
                                          ) {
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
                                    {getDuration(startTime, endTime, language)}
                                    {event.participantLimit === null &&
                                      ` | ${locales.route.section.event.unlimitedSeats}`}
                                    {event.participantLimit !== null &&
                                      event.participantLimit -
                                        event._count.participants >
                                        0 &&
                                      ` | ${
                                        event.participantLimit -
                                        event._count.participants
                                      } / ${event.participantLimit} ${
                                        locales.route.section.event.seatsFree
                                      }`}

                                    {event.participantLimit !== null &&
                                    event.participantLimit -
                                      event._count.participants <=
                                      0 ? (
                                      <>
                                        {" "}
                                        |{" "}
                                        <span>
                                          {event._count.waitingList}{" "}
                                          {
                                            locales.route.section.event
                                              .onWaitingList
                                          }
                                        </span>
                                      </>
                                    ) : null}
                                  </p>
                                  <h4 className="mv-font-bold mv-text-base mv-m-0 @lg:mv-line-clamp-1">
                                    {event.name}
                                  </h4>
                                  {event.subline !== null ? (
                                    <p className="mv-hidden mv-text-xs mv-mt-1 @lg:mv-line-clamp-1">
                                      {event.subline}
                                    </p>
                                  ) : (
                                    <p className="mv-hidden mv-text-xs mv-mt-1 @lg:mv-line-clamp-1">
                                      {removeHtmlTags(event.description ?? "")}
                                    </p>
                                  )}
                                </div>
                              </Link>

                              {event.canceled ? (
                                <div className="mv-flex mv-font-semibold mv-items-center mv-ml-auto mv-border-r-8 mv-border-red-400 mv-pr-4 mv-py-6 mv-text-red-400">
                                  {locales.route.section.event.cancelled}
                                </div>
                              ) : null}
                              {event.isParticipant &&
                              !event.canceled &&
                              loaderData.mode !== "owner" ? (
                                <div className="mv-flex mv-font-semibold mv-items-center mv-ml-auto mv-border-r-8 mv-border-green-500 mv-pr-4 mv-py-6 mv-text-green-600">
                                  <p>
                                    {locales.route.section.event.registered}
                                  </p>
                                </div>
                              ) : null}
                              {loaderData.mode !== "anon" &&
                              canUserParticipate(event) ? (
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
                              loaderData.mode !== "owner" ? (
                                <div className="mv-flex mv-font-semibold mv-items-center mv-ml-auto mv-border-r-8 mv-border-neutral-500 mv-pr-4 mv-py-6">
                                  <p>{locales.route.section.event.waiting}</p>
                                </div>
                              ) : null}
                              {loaderData.mode !== "anon" &&
                              canUserBeAddedToWaitingList(event) ? (
                                <div className="mv-flex mv-items-center mv-ml-auto mv-pr-4 mv-py-6">
                                  <AddToWaitingListButton
                                    action={`/event/${event.slug}/settings/waiting-list/add-to-waiting-list`}
                                    profileId={loaderData.userId}
                                    locales={locales}
                                  />
                                </div>
                              ) : null}
                              {(!event.isParticipant &&
                                !canUserParticipate(event) &&
                                !event.isOnWaitingList &&
                                !canUserBeAddedToWaitingList(event) &&
                                !event.canceled &&
                                loaderData.mode !== "anon") ||
                              (loaderData.mode === "anon" &&
                                !event.canceled) ? (
                                <div className="mv-flex mv-items-center mv-ml-auto mv-pr-4 mv-py-6">
                                  <Link
                                    to={`/event/${event.slug}`}
                                    className="mv-h-auto mv-min-h-0 mv-whitespace-nowrap mv-py-2 mv-px-6 mv-normal-case mv-leading-6 mv-inline-flex mv-cursor-pointer mv-outline-primary mv-shrink-0 mv-flex-wrap mv-items-center mv-justify-center mv-rounded-lg mv-text-center mv-border-primary mv-text-sm mv-font-semibold mv-border mv-bg-primary mv-text-white"
                                  >
                                    {locales.route.section.event.more}
                                  </Link>
                                </div>
                              ) : null}
                            </div>
                          );
                        }
                      )}
                    </div>
                  </>
                ) : null}

                {loaderData.futureEvents.contributedEvents.length > 0 ? (
                  <>
                    <h6
                      id="future-contributed-events"
                      className="mv-mb-4 mv-font-bold"
                    >
                      {locales.route.section.event.speaker}
                    </h6>
                    <div className="mv-mb-6">
                      {loaderData.futureEvents.contributedEvents.map(
                        ({ event }) => {
                          const startTime = utcToZonedTime(
                            event.startTime,
                            "Europe/Berlin"
                          );
                          const endTime = utcToZonedTime(
                            event.endTime,
                            "Europe/Berlin"
                          );
                          return (
                            <div
                              key={`future-contributed-event-${event.id}`}
                              className="mv-rounded-lg mv-bg-white mv-shadow-xl mv-border-t mv-border-r mv-border-neutral-300  mv-mb-2 mv-flex mv-items-stretch mv-overflow-hidden"
                            >
                              <Link
                                className="mv-flex"
                                to={`/event/${event.slug}`}
                              >
                                <div className="mv-hidden @xl:mv-block mv-w-36 mv-shrink-0 mv-aspect-[3/2]">
                                  <div className="mv-w-36 mv-h-full mv-relative">
                                    <Image
                                      src={event.background}
                                      alt={event.name}
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
                                          if (
                                            event.stage.slug in locales.stages
                                          ) {
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
                                    {getDuration(startTime, endTime, language)}
                                    {event.participantLimit === null &&
                                      ` | ${locales.route.section.event.unlimitedSeats}`}
                                    {event.participantLimit !== null &&
                                      event.participantLimit -
                                        event._count.participants >
                                        0 &&
                                      ` | ${
                                        event.participantLimit -
                                        event._count.participants
                                      } / ${event.participantLimit} ${
                                        locales.route.section.event.seatsFree
                                      }`}

                                    {event.participantLimit !== null &&
                                    event.participantLimit -
                                      event._count.participants <=
                                      0 ? (
                                      <>
                                        {" "}
                                        |{" "}
                                        <span>
                                          {event._count.waitingList}{" "}
                                          {
                                            locales.route.section.event
                                              .onWaitingList
                                          }
                                        </span>
                                      </>
                                    ) : null}
                                  </p>
                                  <h4 className="mv-font-bold mv-text-base mv-m-0 @lg:mv-line-clamp-1">
                                    {event.name}
                                  </h4>
                                  {event.subline !== null ? (
                                    <p className="mv-hidden mv-text-xs mv-mt-1 @lg:mv-line-clamp-1">
                                      {event.subline}
                                    </p>
                                  ) : (
                                    <p className="mv-hidden mv-text-xs mv-mt-1 @lg:mv-line-clamp-1">
                                      {removeHtmlTags(event.description ?? "")}
                                    </p>
                                  )}
                                </div>
                              </Link>
                              {event.canceled ? (
                                <div className="mv-flex mv-font-semibold mv-items-center mv-ml-auto mv-border-r-8 mv-border-red-400 mv-pr-4 mv-py-6 mv-text-red-400">
                                  {locales.route.section.event.cancelled}
                                </div>
                              ) : null}
                              {event.isParticipant && !event.canceled ? (
                                <div className="mv-flex mv-font-semibold mv-items-center mv-ml-auto mv-border-r-8 mv-border-green-500 mv-pr-4 mv-py-6 mv-text-green-600">
                                  <p>
                                    {locales.route.section.event.registered}
                                  </p>
                                </div>
                              ) : null}
                              {loaderData.mode !== "anon" &&
                              canUserParticipate(event) ? (
                                <div className="mv-flex mv-items-center mv-ml-auto mv-pr-4 mv-py-6">
                                  <AddParticipantButton
                                    action={`/event/${event.slug}/settings/participants/add-participant`}
                                    profileId={loaderData.userId}
                                    locales={locales}
                                  />
                                </div>
                              ) : null}
                              {event.isOnWaitingList && !event.canceled ? (
                                <div className="mv-flex mv-font-semibold mv-items-center mv-ml-auto mv-border-r-8 mv-border-neutral-500 mv-pr-4 mv-py-6">
                                  <p>{locales.route.section.event.waiting}</p>
                                </div>
                              ) : null}
                              {loaderData.mode !== "anon" &&
                              canUserBeAddedToWaitingList(event) ? (
                                <div className="mv-flex mv-items-center mv-ml-auto mv-pr-4 mv-py-6">
                                  <AddToWaitingListButton
                                    action={`/event/${event.slug}/settings/waiting-list/add-to-waiting-list`}
                                    profileId={loaderData.userId}
                                    locales={locales}
                                  />
                                </div>
                              ) : null}
                              {(!event.isParticipant &&
                                !canUserParticipate(event) &&
                                !event.isOnWaitingList &&
                                !canUserBeAddedToWaitingList(event) &&
                                !event.canceled &&
                                loaderData.mode !== "anon") ||
                              (loaderData.mode === "anon" &&
                                !event.canceled) ? (
                                <div className="mv-flex mv-items-center mv-ml-auto mv-pr-4 mv-py-6">
                                  <Link
                                    to={`/event/${event.slug}`}
                                    className="mv-h-auto mv-min-h-0 mv-whitespace-nowrap mv-py-2 mv-px-6 mv-normal-case mv-leading-6 mv-inline-flex mv-cursor-pointer mv-outline-primary mv-shrink-0 mv-flex-wrap mv-items-center mv-justify-center mv-rounded-lg mv-text-center mv-border-primary mv-text-sm mv-font-semibold mv-border mv-bg-primary mv-text-white"
                                  >
                                    {locales.route.section.event.more}
                                  </Link>
                                </div>
                              ) : null}
                            </div>
                          );
                        }
                      )}
                    </div>
                  </>
                ) : null}
                {loaderData.futureEvents.participatedEvents.length > 0 ? (
                  <>
                    <h6
                      id="future-participated-events"
                      className="mv-mb-4 mv-font-bold"
                    >
                      {locales.route.section.event.participation}
                    </h6>
                    <div className="mv-mb-6">
                      {loaderData.futureEvents.participatedEvents.map(
                        ({ event }) => {
                          const startTime = utcToZonedTime(
                            event.startTime,
                            "Europe/Berlin"
                          );
                          const endTime = utcToZonedTime(
                            event.endTime,
                            "Europe/Berlin"
                          );
                          return (
                            <div
                              key={`future-participated-event-${event.id}`}
                              className="mv-rounded-lg mv-bg-white mv-shadow-xl mv-border-t mv-border-r mv-border-neutral-300 mv-mb-2 mv-flex mv-items-stretch mv-overflow-hidden"
                            >
                              <Link
                                className="mv-flex"
                                to={`/event/${event.slug}`}
                              >
                                <div className="mv-hidden @xl:mv-block mv-w-36 mv-shrink-0 mv-aspect-[3/2]">
                                  <div className="mv-w-36 mv-h-full mv-relative">
                                    <Image
                                      src={event.background}
                                      alt={event.name}
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
                                          if (
                                            event.stage.slug in locales.stages
                                          ) {
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
                                    {getDuration(startTime, endTime, language)}
                                    {event.participantLimit === null &&
                                      ` | ${locales.route.section.event.unlimitedSeats}`}
                                    {event.participantLimit !== null &&
                                      event.participantLimit -
                                        event._count.participants >
                                        0 &&
                                      ` | ${
                                        event.participantLimit -
                                        event._count.participants
                                      } / ${event.participantLimit} ${
                                        locales.route.section.event.seatsFree
                                      }`}

                                    {event.participantLimit !== null &&
                                    event.participantLimit -
                                      event._count.participants <=
                                      0 ? (
                                      <>
                                        {" "}
                                        |{" "}
                                        <span>
                                          {event._count.waitingList}{" "}
                                          {
                                            locales.route.section.event
                                              .onWaitingList
                                          }
                                        </span>
                                      </>
                                    ) : null}
                                  </p>
                                  <h4 className="mv-font-bold mv-text-base mv-m-0 @lg:mv-line-clamp-1">
                                    {event.name}
                                  </h4>
                                  {event.subline !== null ? (
                                    <p className="mv-hidden mv-text-xs mv-mt-1 @lg:mv-line-clamp-1">
                                      {event.subline}
                                    </p>
                                  ) : (
                                    <p className="mv-hidden mv-text-xs mv-mt-1 @lg:mv-line-clamp-1">
                                      {removeHtmlTags(event.description ?? "")}
                                    </p>
                                  )}
                                </div>
                              </Link>
                              {event.canceled ? (
                                <div className="mv-flex mv-font-semibold mv-items-center mv-ml-auto mv-border-r-8 mv-border-red-400 mv-pr-4 mv-py-6 mv-text-red-400">
                                  {locales.route.section.event.cancelled}
                                </div>
                              ) : null}
                              {event.isParticipant && !event.canceled ? (
                                <div className="mv-flex mv-font-semibold mv-items-center mv-ml-auto mv-border-r-8 mv-border-green-500 mv-pr-4 mv-py-6 mv-text-green-600">
                                  <p>
                                    {locales.route.section.event.registered}
                                  </p>
                                </div>
                              ) : null}
                              {canUserParticipate(event) ? (
                                <div className="mv-flex mv-items-center mv-ml-auto mv-pr-4 mv-py-6">
                                  <AddParticipantButton
                                    action={`/event/${event.slug}/settings/participants/add-participant`}
                                    profileId={loaderData.userId}
                                    locales={locales}
                                  />
                                </div>
                              ) : null}
                              {event.isOnWaitingList && !event.canceled ? (
                                <div className="mv-flex mv-font-semibold mv-items-center mv-ml-auto mv-border-r-8 mv-border-neutral-500 mv-pr-4 mv-py-6">
                                  <p>{locales.route.section.event.waiting}</p>
                                </div>
                              ) : null}
                              {canUserBeAddedToWaitingList(event) ? (
                                <div className="mv-flex mv-items-center mv-ml-auto mv-pr-4 mv-py-6">
                                  <AddToWaitingListButton
                                    action={`/event/${event.slug}/settings/waiting-list/add-to-waiting-list`}
                                    profileId={loaderData.userId}
                                    locales={locales}
                                  />
                                </div>
                              ) : null}
                              {!event.isParticipant &&
                              !canUserParticipate(event) &&
                              !event.isOnWaitingList &&
                              !canUserBeAddedToWaitingList(event) &&
                              !event.canceled ? (
                                <div className="mv-flex mv-items-center mv-ml-auto mv-pr-4 mv-py-6">
                                  <Link
                                    to={`/event/${event.slug}`}
                                    className="mv-h-auto mv-min-h-0 mv-whitespace-nowrap mv-py-2 mv-px-6 mv-normal-case mv-leading-6 mv-inline-flex mv-cursor-pointer mv-outline-primary mv-shrink-0 mv-flex-wrap mv-items-center mv-justify-center mv-rounded-lg mv-text-center mv-border-primary mv-text-sm mv-font-semibold mv-border mv-bg-primary mv-text-white"
                                  >
                                    {locales.route.section.event.more}
                                  </Link>
                                </div>
                              ) : null}
                            </div>
                          );
                        }
                      )}
                    </div>
                  </>
                ) : null}
              </>
            ) : null}
            {hasPastEvents ? (
              <>
                <div className="mv-flex mv-flex-row mv-flex-nowrap mv-mb-6 mv-mt-14 mv-items-center">
                  <div className="mv-flex-auto mv-pr-4">
                    <h3 className="mv-mb-0 mv-font-bold">
                      {locales.route.section.pastEvents.title}
                    </h3>
                  </div>
                </div>
                {loaderData.pastEvents.administeredEvents.length > 0 ? (
                  <>
                    <h6 id="past-admin-events" className="mv-mb-4 mv-font-bold">
                      {locales.route.section.event.admin}
                    </h6>
                    <div className="mv-mb-6">
                      {loaderData.pastEvents.administeredEvents.map(
                        ({ event }) => {
                          const startTime = utcToZonedTime(
                            event.startTime,
                            "Europe/Berlin"
                          );
                          const endTime = utcToZonedTime(
                            event.endTime,
                            "Europe/Berlin"
                          );
                          return (
                            <div
                              key={`past-admin-event-${event.id}`}
                              className="mv-rounded-lg mv-bg-white mv-shadow-xl mv-border-t mv-border-r mv-border-neutral-300 mv-mb-2 mv-flex mv-items-stretch mv-overflow-hidden"
                            >
                              <Link
                                className="mv-flex"
                                to={`/event/${event.slug}`}
                              >
                                <div className="mv-hidden @xl:mv-block mv-w-36 mv-shrink-0 mv-aspect-[3/2]">
                                  <div className="mv-w-36 mv-h-full mv-relative">
                                    <Image
                                      src={event.background}
                                      alt={event.name}
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
                                          if (
                                            event.stage.slug in locales.stages
                                          ) {
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
                                    {getDuration(startTime, endTime, language)}
                                  </p>
                                  <h4 className="mv-line-clamp-1 mv-font-bold mv-text-base mv-m-0">
                                    {event.name}
                                  </h4>
                                  {event.subline !== null ? (
                                    <p className=" mv-hidden @lg:mv-line-clamp-1 mv-text-xs mv-mt-1">
                                      {event.subline}
                                    </p>
                                  ) : (
                                    <p className=" mv-hidden @lg:mv-line-clamp-1 mv-text-xs mv-mt-1">
                                      {removeHtmlTags(event.description ?? "")}
                                    </p>
                                  )}
                                </div>
                              </Link>

                              {loaderData.mode === "owner" &&
                              !event.canceled ? (
                                <>
                                  {event.published ? (
                                    <div className="mv-flex mv-font-semibold mv-items-center mv-ml-auto mv-border-r-8 mv-border-green-600 mv-pr-4 mv-py-6 mv-text-green-600">
                                      {locales.route.section.event.published}
                                    </div>
                                  ) : (
                                    <div className="mv-flex mv-font-semibold mv-items-center mv-ml-auto mv-border-r-8 mv-border-primary mv-pr-4 mv-py-6 mv-text-primary">
                                      {locales.route.section.event.draft}
                                    </div>
                                  )}
                                </>
                              ) : null}
                              {event.canceled ? (
                                <div className="mv-flex mv-font-semibold mv-items-center mv-ml-auto mv-border-r-8 mv-border-red-400 mv-pr-4 mv-py-6 mv-text-red-400">
                                  {locales.route.section.event.cancelled}
                                </div>
                              ) : null}
                              {event.isParticipant &&
                              !event.canceled &&
                              loaderData.mode !== "owner" ? (
                                <div className="mv-flex mv-font-semibold mv-items-center mv-ml-auto mv-border-r-8 mv-border-green-500 mv-pr-4 mv-py-6 mv-text-green-600">
                                  <p>
                                    {locales.route.section.event.participated}
                                  </p>
                                </div>
                              ) : null}
                              {(loaderData.mode !== "owner" &&
                                !event.isParticipant &&
                                !canUserParticipate(event) &&
                                !event.isOnWaitingList &&
                                !canUserBeAddedToWaitingList(event) &&
                                !event.canceled) ||
                              (loaderData.mode === "anon" &&
                                !event.canceled) ? (
                                <div className="mv-flex mv-items-center mv-ml-auto mv-pr-4 mv-py-6">
                                  <Link
                                    to={`/event/${event.slug}`}
                                    className="mv-h-auto mv-min-h-0 mv-whitespace-nowrap mv-py-2 mv-px-6 mv-normal-case mv-leading-6 mv-inline-flex mv-cursor-pointer mv-outline-primary mv-shrink-0 mv-flex-wrap mv-items-center mv-justify-center mv-rounded-lg mv-text-center mv-border-primary mv-text-sm mv-font-semibold mv-border mv-bg-primary mv-text-white"
                                  >
                                    {locales.route.section.event.more}
                                  </Link>
                                </div>
                              ) : null}
                            </div>
                          );
                        }
                      )}
                    </div>
                  </>
                ) : null}

                {loaderData.pastEvents.teamMemberOfEvents.length > 0 ? (
                  <>
                    <h6
                      id="past-team-member-events"
                      className="mv-mb-4 mv-font-bold"
                    >
                      {locales.route.section.event.team}
                    </h6>
                    <div className="mv-mb-6">
                      {loaderData.pastEvents.teamMemberOfEvents.map(
                        ({ event }) => {
                          const startTime = utcToZonedTime(
                            event.startTime,
                            "Europe/Berlin"
                          );
                          const endTime = utcToZonedTime(
                            event.endTime,
                            "Europe/Berlin"
                          );
                          return (
                            <div
                              key={`past-team-member-event-${event.id}`}
                              className="mv-rounded-lg mv-bg-white mv-shadow-xl mv-border-t mv-border-r mv-border-neutral-300  mv-mb-2 mv-flex mv-items-stretch mv-overflow-hidden"
                            >
                              <Link
                                className="mv-flex"
                                to={`/event/${event.slug}`}
                              >
                                <div className="mv-hidden @xl:mv-block mv-w-36 mv-shrink-0 mv-aspect-[3/2]">
                                  <div className="mv-w-36 mv-h-full mv-relative">
                                    <Image
                                      src={event.background}
                                      alt={event.name}
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
                                          if (
                                            event.stage.slug in locales.stages
                                          ) {
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
                                    {getDuration(startTime, endTime, language)}
                                  </p>
                                  <h4 className="mv-font-bold mv-text-base mv-m-0 @lg:mv-line-clamp-1">
                                    {event.name}
                                  </h4>
                                  {event.subline !== null ? (
                                    <p className="mv-hidden mv-text-xs mv-mt-1 @lg:mv-line-clamp-1">
                                      {event.subline}
                                    </p>
                                  ) : (
                                    <p className="mv-hidden mv-text-xs mv-mt-1 @lg:mv-line-clamp-1">
                                      {removeHtmlTags(event.description ?? "")}
                                    </p>
                                  )}
                                </div>
                              </Link>

                              {event.canceled ? (
                                <div className="mv-flex mv-font-semibold mv-items-center mv-ml-auto mv-border-r-8 mv-border-red-400 mv-pr-4 mv-py-6 mv-text-red-400">
                                  {locales.route.section.event.cancelled}
                                </div>
                              ) : null}
                              {event.isParticipant &&
                              !event.canceled &&
                              loaderData.mode !== "owner" ? (
                                <div className="mv-flex mv-font-semibold mv-items-center mv-ml-auto mv-border-r-8 mv-border-green-500 mv-pr-4 mv-py-6 mv-text-green-600">
                                  <p>
                                    {locales.route.section.event.participated}
                                  </p>
                                </div>
                              ) : null}
                              {(!event.isParticipant &&
                                !canUserParticipate(event) &&
                                !event.isOnWaitingList &&
                                !canUserBeAddedToWaitingList(event) &&
                                !event.canceled) ||
                              (loaderData.mode === "anon" &&
                                !event.canceled) ? (
                                <div className="mv-flex mv-items-center mv-ml-auto mv-pr-4 mv-py-6">
                                  <Link
                                    to={`/event/${event.slug}`}
                                    className="mv-h-auto mv-min-h-0 mv-whitespace-nowrap mv-py-2 mv-px-6 mv-normal-case mv-leading-6 mv-inline-flex mv-cursor-pointer mv-outline-primary mv-shrink-0 mv-flex-wrap mv-items-center mv-justify-center mv-rounded-lg mv-text-center mv-border-primary mv-text-sm mv-font-semibold mv-border mv-bg-primary mv-text-white"
                                  >
                                    {locales.route.section.event.more}
                                  </Link>
                                </div>
                              ) : null}
                            </div>
                          );
                        }
                      )}
                    </div>
                  </>
                ) : null}

                {loaderData.pastEvents.contributedEvents.length > 0 ? (
                  <>
                    <h6
                      id="past-contributed-events"
                      className="mv-mb-4 mv-font-bold"
                    >
                      {locales.route.section.event.speaker}
                    </h6>
                    <div className="mv-mb-6">
                      {loaderData.pastEvents.contributedEvents.map(
                        ({ event }) => {
                          const startTime = utcToZonedTime(
                            event.startTime,
                            "Europe/Berlin"
                          );
                          const endTime = utcToZonedTime(
                            event.endTime,
                            "Europe/Berlin"
                          );
                          return (
                            <div
                              key={`past-contributed-event-${event.id}`}
                              className="mv-rounded-lg mv-bg-white mv-shadow-xl mv-border-t mv-border-r mv-border-neutral-300  mv-mb-2 mv-flex mv-items-stretch mv-overflow-hidden"
                            >
                              <Link
                                className="mv-flex"
                                to={`/event/${event.slug}`}
                              >
                                <div className="mv-hidden @xl:mv-block mv-w-36 mv-shrink-0 mv-aspect-[3/2]">
                                  <div className="mv-w-36 mv-h-full mv-relative">
                                    <Image
                                      src={event.background}
                                      alt={event.name}
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
                                          if (
                                            event.stage.slug in locales.stages
                                          ) {
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
                                    {getDuration(startTime, endTime, language)}
                                  </p>
                                  <h4 className="mv-font-bold mv-text-base mv-m-0 @lg:mv-line-clamp-1">
                                    {event.name}
                                  </h4>
                                  {event.subline !== null ? (
                                    <p className="mv-hidden mv-text-xs mv-mt-1 @lg:mv-line-clamp-1">
                                      {event.subline}
                                    </p>
                                  ) : (
                                    <p className="mv-hidden mv-text-xs mv-mt-1 @lg:mv-line-clamp-1">
                                      {removeHtmlTags(event.description ?? "")}
                                    </p>
                                  )}
                                </div>
                              </Link>
                              {event.canceled ? (
                                <div className="mv-flex mv-font-semibold mv-items-center mv-ml-auto mv-border-r-8 mv-border-red-400 mv-pr-4 mv-py-6 mv-text-red-400">
                                  {locales.route.section.event.wasCancelled}
                                </div>
                              ) : null}
                              {event.isParticipant && !event.canceled ? (
                                <div className="mv-flex mv-font-semibold mv-items-center mv-ml-auto mv-border-r-8 mv-border-green-500 mv-pr-4 mv-py-6 mv-text-green-600">
                                  <p>
                                    {locales.route.section.event.participated}
                                  </p>
                                </div>
                              ) : null}
                              {(!event.isParticipant &&
                                !canUserParticipate(event) &&
                                !event.isOnWaitingList &&
                                !canUserBeAddedToWaitingList(event) &&
                                !event.canceled) ||
                              (loaderData.mode === "anon" &&
                                !event.canceled) ? (
                                <div className="mv-flex mv-items-center mv-ml-auto mv-pr-4 mv-py-6">
                                  <Link
                                    to={`/event/${event.slug}`}
                                    className="mv-h-auto mv-min-h-0 mv-whitespace-nowrap mv-py-2 mv-px-6 mv-normal-case mv-leading-6 mv-inline-flex mv-cursor-pointer mv-outline-primary mv-shrink-0 mv-flex-wrap mv-items-center mv-justify-center mv-rounded-lg mv-text-center mv-border-primary mv-text-sm mv-font-semibold mv-border mv-bg-primary mv-text-white"
                                  >
                                    {locales.route.section.event.more}
                                  </Link>
                                </div>
                              ) : null}
                            </div>
                          );
                        }
                      )}
                    </div>
                  </>
                ) : null}
                {loaderData.pastEvents.participatedEvents.length > 0 ? (
                  <>
                    <h6
                      id="past-participated-events"
                      className="mv-mb-4 mv-font-bold"
                    >
                      {locales.route.section.event.participation}
                    </h6>
                    <div className="mv-mb-6">
                      {loaderData.pastEvents.participatedEvents.map(
                        ({ event }) => {
                          const startTime = utcToZonedTime(
                            event.startTime,
                            "Europe/Berlin"
                          );
                          const endTime = utcToZonedTime(
                            event.endTime,
                            "Europe/Berlin"
                          );
                          return (
                            <div
                              key={`past-participated-event-${event.id}`}
                              className="mv-rounded-lg mv-bg-white mv-shadow-xl mv-border-t mv-border-r mv-border-neutral-300 mv-mb-2 mv-flex mv-items-stretch mv-overflow-hidden"
                            >
                              <Link
                                className="mv-flex"
                                to={`/event/${event.slug}`}
                              >
                                <div className="mv-hidden @xl:mv-block mv-w-36 mv-shrink-0 mv-aspect-[3/2]">
                                  <div className="mv-w-36 mv-h-full mv-relative">
                                    <Image
                                      src={event.background}
                                      alt={event.name}
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
                                          if (
                                            event.stage.slug in locales.stages
                                          ) {
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
                                    {getDuration(startTime, endTime, language)}
                                  </p>
                                  <h4 className="mv-font-bold mv-text-base mv-m-0 @lg:mv-line-clamp-1">
                                    {event.name}
                                  </h4>
                                  {event.subline !== null ? (
                                    <p className="mv-hidden mv-text-xs mv-mt-1 @lg:mv-line-clamp-1">
                                      {event.subline}
                                    </p>
                                  ) : (
                                    <p className="mv-hidden mv-text-xs mv-mt-1 @lg:mv-line-clamp-1">
                                      {removeHtmlTags(event.description ?? "")}
                                    </p>
                                  )}
                                </div>
                              </Link>
                              {event.canceled ? (
                                <div className="mv-flex mv-font-semibold mv-items-center mv-ml-auto mv-border-r-8 mv-border-red-400 mv-pr-4 mv-py-6 mv-text-red-400">
                                  {locales.route.section.event.wasCancelled}
                                </div>
                              ) : null}
                              {event.isParticipant && !event.canceled ? (
                                <div className="mv-flex mv-font-semibold mv-items-center mv-ml-auto mv-border-r-8 mv-border-green-500 mv-pr-4 mv-py-6 mv-text-green-600">
                                  <p>
                                    {locales.route.section.event.participated}
                                  </p>
                                </div>
                              ) : null}
                              {!event.isParticipant &&
                              !canUserParticipate(event) &&
                              !event.isOnWaitingList &&
                              !canUserBeAddedToWaitingList(event) &&
                              !event.canceled ? (
                                <div className="mv-flex mv-items-center mv-ml-auto mv-pr-4 mv-py-6">
                                  <Link
                                    to={`/event/${event.slug}`}
                                    className="mv-h-auto mv-min-h-0 mv-whitespace-nowrap mv-py-2 mv-px-6 mv-normal-case mv-leading-6 mv-inline-flex mv-cursor-pointer mv-outline-primary mv-shrink-0 mv-flex-wrap mv-items-center mv-justify-center mv-rounded-lg mv-text-center mv-border-primary mv-text-sm mv-font-semibold mv-border mv-bg-primary mv-text-white"
                                  >
                                    {locales.route.section.event.more}
                                  </Link>
                                </div>
                              ) : null}
                            </div>
                          );
                        }
                      )}
                    </div>
                  </>
                ) : null}
              </>
            ) : null}
          </div>
        </div>
      </div>
    </>
  );
}
