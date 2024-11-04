import {
  Button,
  TextButton,
  Image,
  Avatar as MVAvatar,
} from "@mint-vernetzt/components";
import type { Profile } from "@prisma/client";
import type { LoaderFunctionArgs, MetaFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import { Form, Link, useLoaderData } from "@remix-run/react";
import { utcToZonedTime } from "date-fns-tz";
import rcSliderStyles from "rc-slider/assets/index.css";
import React from "react";
import { useTranslation } from "react-i18next";
import reactCropStyles from "react-image-crop/dist/ReactCrop.css";
import { createAuthClient, getSessionUser } from "~/auth.server";
import { Chip } from "~/components/Chip/Chip";
import ExternalServiceIcon from "~/components/ExternalService/ExternalServiceIcon";
import { H3 } from "~/components/Heading/Heading";
import ImageCropper from "~/components/ImageCropper/ImageCropper";
import OrganizationCard from "~/components/OrganizationCard/OrganizationCard";
import { RichText } from "~/components/Richtext/RichText";
import type { ExternalService } from "~/components/types";
import i18next from "~/i18next.server";
import {
  addUserParticipationStatus,
  canUserBeAddedToWaitingList,
  canUserParticipate,
} from "~/lib/event/utils";
import { getFullName } from "~/lib/profile/getFullName";
import { getInitials } from "~/lib/profile/getInitials";
import { getInitialsOfName } from "~/lib/string/getInitialsOfName";
import { getFeatureAbilities } from "~/lib/utils/application";
import { getParamValueOrThrow } from "~/lib/utils/routes";
import { removeHtmlTags } from "~/lib/utils/sanitizeUserHtml";
import { getDuration } from "~/lib/utils/time";
import { detectLanguage } from "~/root.server";
import { Modal } from "~/routes/__components";
import { AddParticipantButton } from "~/routes/event/$slug/settings/participants/add-participant";
import { AddToWaitingListButton } from "~/routes/event/$slug/settings/waiting-list/add-to-waiting-list";
import { Mastodon, TikTok } from "~/routes/project/$slug/detail/__components";
import { getProfileByUsername } from "./index.server";
import {
  addImgUrls,
  deriveProfileMode,
  filterProfile,
  sortEvents,
  splitEventsIntoFutureAndPast,
} from "./utils.server";
import { ImageAspects, MaxImageSizes, MinCropSizes } from "~/images.server";

const i18nNS = [
  "routes/profile/index",
  "datasets/offers",
  "datasets/stages",
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

  const locale = detectLanguage(request);
  const t = await i18next.getFixedT(locale, i18nNS);

  const { authClient } = createAuthClient(request);

  const username = getParamValueOrThrow(params, "username");

  const sessionUser = await getSessionUser(authClient);
  const mode = await deriveProfileMode(sessionUser, username);

  const profile = await getProfileByUsername(username, mode);
  if (profile === null) {
    throw json(t("error.profileNotFound"), { status: 404 });
  }

  const abilities = await getFeatureAbilities(authClient, [
    "events",
    "projects",
  ]);

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
    contributedEvents,
    teamMemberOfEvents,
    participatedEvents: [...participatedEvents, ...waitingForEvents],
    administeredEvents,
  };
  // Split events into future and past (Note: The events are already ordered by startTime: descending from the database)
  type Events = typeof events;
  const { futureEvents, pastEvents } =
    splitEventsIntoFutureAndPast<Events>(events);
  // Sorting events (future: startTime "desc", past: startTime "asc")
  let inFuture = true;
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

  return json({
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
  });
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

// TODO: fix any type
function canViewEvents(events: {
  teamMemberOfEvents: any[];
  participatedEvents: any[];
  contributedEvents: any[];
}) {
  return (
    events.teamMemberOfEvents.length > 0 ||
    events.participatedEvents.length > 0 ||
    events.contributedEvents.length > 0
  );
}

export default function Index() {
  const loaderData = useLoaderData<typeof loader>();
  const { t, i18n } = useTranslation(i18nNS);

  const initials = getInitials(loaderData.data);
  const fullName = getFullName(loaderData.data);

  const avatar = loaderData.data.avatar;
  const blurredAvatar = loaderData.data.blurredAvatar;
  const firstName = loaderData.data.firstName;
  const lastName = loaderData.data.lastName;
  const Avatar = React.useCallback(
    () => (
      <div className="h-36 w-36 bg-primary text-white text-6xl flex items-center justify-center overflow-hidden rounded-full border">
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
  const Background = React.useCallback(
    () => (
      <div className="w-full bg-yellow-500 rounded-md overflow-hidden">
        {background !== null ? (
          <Image
            src={background}
            alt={t("images.currentBackground")}
            blurredSrc={blurredBackground}
          />
        ) : (
          <div className="w-[300px] min-h-[108px]" />
        )}
      </div>
    ),
    [background, blurredBackground, t]
  );

  const uploadRedirect = `/profile/${loaderData.data.username}`;

  return (
    <>
      <section className="mv-w-full mv-mx-auto mv-px-4 @sm:mv-max-w-screen-container-sm @md:mv-max-w-screen-container-md @lg:mv-max-w-screen-container-lg @xl:mv-max-w-screen-container-xl @xl:mv-px-6 @2xl:mv-max-w-screen-container-2xl mv-mb-2 @md:mv-mb-4 @md:mv-mt-2">
        <TextButton weight="thin" variant="neutral" arrowLeft>
          <Link to="/explore/profiles" prefetch="intent">
            {t("back")}
          </Link>
        </TextButton>
      </section>
      <section className="hidden @md:mv-block mv-w-full mv-mx-auto mv-px-4 @sm:mv-max-w-screen-container-sm @md:mv-max-w-screen-container-md @lg:mv-max-w-screen-container-lg @xl:mv-max-w-screen-container-xl @xl:mv-px-6 @2xl:mv-max-w-screen-container-2xl">
        <div className="rounded-3xl relative overflow-hidden bg-yellow-500 w-full aspect-[31/10]">
          <div className="w-full h-full">
            {background !== null ? (
              <Image
                src={background}
                alt={fullName}
                blurredSrc={blurredBackground}
              />
            ) : null}
          </div>
          {loaderData.mode === "owner" ? (
            <div className="absolute bottom-6 right-6">
              <Form method="get" preventScrollReset>
                <input hidden name="modal-background" defaultValue="true" />
                <Button type="submit">{t("profile.changeBackground")}</Button>
              </Form>

              <Modal searchParam="modal-background">
                <Modal.Title>
                  {t("profile.changeBackgroundHeadline")}
                </Modal.Title>
                <Modal.Section>
                  <ImageCropper
                    id="modal-background-upload"
                    subject={"user"}
                    slug={loaderData.data.username}
                    uploadKey="background"
                    image={background || undefined}
                    aspect={ImageAspects.Background}
                    minCropWidth={MinCropSizes.Background.width}
                    minCropHeight={MinCropSizes.Background.height}
                    maxTargetWidth={MaxImageSizes.Background.width}
                    maxTargetHeight={MaxImageSizes.Background.height}
                    redirect={uploadRedirect}
                    modalSearchParam="modal-background"
                  >
                    <Background />
                  </ImageCropper>
                </Modal.Section>
              </Modal>
            </div>
          ) : null}
        </div>
      </section>
      <div className="mv-w-full mv-mx-auto mv-px-4 @sm:mv-max-w-screen-container-sm @md:mv-max-w-screen-container-md @lg:mv-max-w-screen-container-lg @xl:mv-max-w-screen-container-xl @xl:mv-px-6 @2xl:mv-max-w-screen-container-2xl relative mv-mb-20">
        <div className="flex flex-col @lg:mv-flex-row -mx-4">
          <div className="flex-gridcol @lg:mv-w-5/12 px-4 pt-10 @lg:mv-pt-0">
            <div className="px-4 py-8 @lg:mv-p-8 pb-15 @md:mv-pb-5 rounded-3xl border border-neutral-400 bg-neutral-200 shadow-lg relative @lg:mv-ml-14 -mv-mt-2 @lg:-mv-mt-44 sticky top-4">
              <div className="flex items-center flex-col">
                <Avatar />
                {loaderData.mode === "owner" ? (
                  <>
                    <Form method="get" preventScrollReset>
                      <input hidden name="modal-logo" defaultValue="true" />
                      <button
                        type="submit"
                        className="appearance-none flex content-center items-center nowrap py-2 cursor-pointer text-primary"
                      >
                        <svg
                          width="17"
                          height="16"
                          viewBox="0 0 17 16"
                          xmlns="http://www.w3.org/2000/svg"
                          className="fill-neutral-600"
                        >
                          <path d="M14.9 3.116a.423.423 0 0 0-.123-.299l-1.093-1.093a.422.422 0 0 0-.598 0l-.882.882 1.691 1.69.882-.882a.423.423 0 0 0 .123-.298Zm-3.293.087 1.69 1.69v.001l-5.759 5.76a.422.422 0 0 1-.166.101l-2.04.68a.211.211 0 0 1-.267-.267l.68-2.04a.423.423 0 0 1 .102-.166l5.76-5.76ZM2.47 14.029a1.266 1.266 0 0 1-.37-.895V3.851a1.266 1.266 0 0 1 1.265-1.266h5.486a.422.422 0 0 1 0 .844H3.366a.422.422 0 0 0-.422.422v9.283a.422.422 0 0 0 .422.422h9.284a.422.422 0 0 0 .421-.422V8.07a.422.422 0 0 1 .845 0v5.064a1.266 1.266 0 0 1-1.267 1.266H3.367c-.336 0-.658-.133-.895-.37Z" />
                        </svg>
                        <span className="ml-2">
                          {t("profile.changeAvatar")}
                        </span>
                      </button>
                    </Form>

                    <Modal searchParam="modal-logo">
                      <Modal.Title>
                        {t("profile.changeAvatarHeadline")}
                      </Modal.Title>
                      <Modal.Section>
                        <ImageCropper
                          id="modal-avatar"
                          subject="user"
                          slug={loaderData.data.username}
                          uploadKey="avatar"
                          image={avatar || undefined}
                          aspect={ImageAspects.AvatarAndLogo}
                          minCropWidth={MinCropSizes.AvatarAndLogo.width}
                          minCropHeight={MinCropSizes.AvatarAndLogo.height}
                          maxTargetWidth={MaxImageSizes.AvatarAndLogo.width}
                          maxTargetHeight={MaxImageSizes.AvatarAndLogo.height}
                          redirect={uploadRedirect}
                          circularCrop={true}
                          modalSearchParam="modal-logo"
                        >
                          <Avatar />
                        </ImageCropper>
                      </Modal.Section>
                    </Modal>
                  </>
                ) : null}

                <h3 className="mt-6 text-5xl mb-1">{fullName}</h3>
                {typeof loaderData.data.position === "string" ? (
                  <p className="font-bold text-sm mb-4">
                    {loaderData.data.position}
                  </p>
                ) : null}
              </div>
              {hasContactInformations(loaderData.data) ||
              hasWebsiteOrSocialService(loaderData.data, ExternalServices) ? (
                <h5 className="font-semibold mb-6 mt-8">
                  {t("profile.contact")}
                </h5>
              ) : null}
              {hasContactInformations(loaderData.data) ? (
                <>
                  {typeof loaderData.data.email === "string" &&
                  loaderData.data.email !== "" ? (
                    <p className="text-mb mb-2">
                      <a
                        href={`mailto:${loaderData.data.email}`}
                        className="flex items-center px-4 py-3 bg-neutral-300 rounded-lg text-neutral-600"
                      >
                        <span className="icon w-6 mr-4">
                          <svg
                            width="24"
                            height="19"
                            viewBox="0 0 24 19"
                            className="fill-current"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path d="M0 3.6a3 3 0 0 1 3-3h18a3 3 0 0 1 3 3v12a3 3 0 0 1-3 3H3a3 3 0 0 1-3-3v-12Zm3-1.5a1.5 1.5 0 0 0-1.5 1.5v.325l10.5 6.3 10.5-6.3V3.6A1.5 1.5 0 0 0 21 2.1H3Zm19.5 3.574-7.062 4.238 7.062 4.345V5.675Zm-.051 10.314-8.46-5.206L12 11.975l-1.989-1.193-8.46 5.205A1.5 1.5 0 0 0 3 17.1h18a1.5 1.5 0 0 0 1.449-1.112ZM1.5 14.258l7.062-4.346L1.5 5.674v8.584Z" />
                          </svg>
                        </span>
                        <span>{loaderData.data.email}</span>
                      </a>
                    </p>
                  ) : null}
                  {typeof loaderData.data.email2 === "string" &&
                  loaderData.data.email2 !== "" ? (
                    <p className="text-mb mb-2">
                      <a
                        href={`mailto:${loaderData.data.email2}`}
                        className="flex items-center px-4 py-3 bg-neutral-300 rounded-lg text-neutral-600"
                      >
                        <span className="icon w-6 mr-4">
                          <svg
                            width="24"
                            height="19"
                            viewBox="0 0 24 19"
                            className="fill-current"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path d="M0 3.6a3 3 0 0 1 3-3h18a3 3 0 0 1 3 3v12a3 3 0 0 1-3 3H3a3 3 0 0 1-3-3v-12Zm3-1.5a1.5 1.5 0 0 0-1.5 1.5v.325l10.5 6.3 10.5-6.3V3.6A1.5 1.5 0 0 0 21 2.1H3Zm19.5 3.574-7.062 4.238 7.062 4.345V5.675Zm-.051 10.314-8.46-5.206L12 11.975l-1.989-1.193-8.46 5.205A1.5 1.5 0 0 0 3 17.1h18a1.5 1.5 0 0 0 1.449-1.112ZM1.5 14.258l7.062-4.346L1.5 5.674v8.584Z" />
                          </svg>
                        </span>
                        <span>{loaderData.data.email2}</span>
                      </a>
                    </p>
                  ) : null}
                  {typeof loaderData.data.phone === "string" &&
                  loaderData.data.phone !== "" ? (
                    <p className="text-md text-neutral-600 mb-2">
                      <a
                        href={`tel:${loaderData.data.phone}`}
                        className="flex items-center px-4 py-3 bg-neutral-300 rounded-lg text-neutral-600"
                      >
                        <span className="icon w-6 mr-4">
                          <svg
                            width="22"
                            height="22"
                            viewBox="0 0 22 22"
                            className="fill-current"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path d="M5.134 1.993a.915.915 0 0 0-1.37-.085L2.367 3.305c-.653.654-.893 1.578-.608 2.39a23.717 23.717 0 0 0 5.627 8.92 23.717 23.717 0 0 0 8.92 5.627c.812.285 1.736.045 2.39-.608l1.396-1.395a.916.916 0 0 0-.086-1.37l-3.114-2.422a.916.916 0 0 0-.783-.165l-2.956.738a2.356 2.356 0 0 1-2.237-.62L7.6 11.085a2.355 2.355 0 0 1-.62-2.237l.74-2.956a.915.915 0 0 0-.166-.783L5.134 1.993ZM2.744.89a2.356 2.356 0 0 1 3.526.22l2.422 3.113c.444.571.6 1.315.425 2.017L8.38 9.197a.915.915 0 0 0 .24.868l3.317 3.317a.915.915 0 0 0 .87.24l2.954-.739a2.354 2.354 0 0 1 2.017.426l3.113 2.421a2.355 2.355 0 0 1 .22 3.525l-1.395 1.396c-1 .999-2.493 1.438-3.884.948a25.156 25.156 0 0 1-9.464-5.967A25.156 25.156 0 0 1 .401 6.17c-.49-1.39-.05-2.885.949-3.884L2.745.89Z" />
                          </svg>
                        </span>
                        <span>{loaderData.data.phone}</span>
                      </a>
                    </p>
                  ) : null}
                </>
              ) : null}

              {/* --- WEBSITE & SOCIAL --- */}
              {hasWebsiteOrSocialService(loaderData.data, ExternalServices) ? (
                <ul className="list-none flex flex-wrap -mx-1 mb-2">
                  {ExternalServices.map((service) => {
                    if (
                      typeof loaderData.data[service] === "string" &&
                      loaderData.data[service] !== ""
                    ) {
                      if (service === "mastodon" || service === "tiktok") {
                        return (
                          <li key={service} className="flex-auto px-1 mb-2">
                            <a
                              href={loaderData.data[service] as string}
                              target="__blank"
                              rel="noopener noreferrer"
                              className="mv-flex-1 mv-flex mv-bg-neutral-100 mv-items-center mv-justify-center mv-px-4 mv-py-2.5 mv-rounded-lg mv-text-neutral-700"
                            >
                              {service === "mastodon" && <Mastodon />}
                              {service === "tiktok" && <TikTok />}
                            </a>
                          </li>
                        );
                      }

                      return (
                        <li key={service} className="flex-auto px-1 mb-2">
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
                  <hr className="divide-y divide-neutral-400 mt-8 mb-6" />

                  <p className="text-xs mb-4 text-center">
                    {t("profile.existsSince", {
                      timestamp: utcToZonedTime(
                        loaderData.data.createdAt,
                        "Europe/Berlin"
                      ).toLocaleDateString("de-De", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      }),
                    })}
                  </p>
                </>
              ) : null}
            </div>
          </div>

          <div className="flex-gridcol @lg:mv-w-7/12 px-4 pt-10 @lg:mv-pt-20 overflow-hidden">
            <div className="flex flex-col-reverse @lg:mv-flex-row flex-nowrap">
              <div className="flex-auto pr-4 mb-6">
                <h1 className="mb-0">
                  {t("profile.introduction", {
                    name: getFullName(loaderData.data, {
                      withAcademicTitle: false,
                    }),
                  })}
                </h1>
              </div>
              {loaderData.mode === "owner" ? (
                <div className="flex-initial @lg:mv-pl-4 pt-3 mb-6">
                  <Link
                    className="btn btn-outline btn-primary"
                    to={`/profile/${loaderData.data.username}/settings`}
                  >
                    {t("profile.editProfile")}
                  </Link>
                </div>
              ) : null}
            </div>
            {typeof loaderData.data.bio === "string" ? (
              <RichText
                html={loaderData.data.bio}
                additionalClassNames="mb-6"
              />
            ) : null}
            {loaderData.data.areas.length > 0 ? (
              <div className="flex mb-6 font-semibold flex-col @lg:mv-flex-row">
                <div className="@lg:mv-basis-32 @lg:mv-shrink-0 @lg:mv-grow-0 text-xs @lg:mv-text-sm leading-4 mb-2 @lg:mv-mb-0 @lg:mv-leading-6">
                  {t("profile.activityAreas")}
                </div>
                <div className="@lg:mv-flex-auto">
                  {loaderData.data.areas
                    .map((relation) => relation.area.name)
                    .join(" / ")}
                </div>
              </div>
            ) : null}
            {loaderData.data.skills.length > 0 ? (
              <div className="flex mb-6 font-semibold flex-col @lg:mv-flex-row">
                <div className="@lg:mv-basis-32 @lg:mv-shrink-0 @lg:mv-grow-0 text-xs @lg:mv-text-sm leading-4 @lg:mv-leading-6 mb-2 @lg:mv-mb-0">
                  {t("profile.competences")}
                </div>

                <div className="flex-auto">
                  {loaderData.data.skills.join(" / ")}
                </div>
              </div>
            ) : null}

            {loaderData.data.interests.length > 0 ? (
              <div className="flex mb-6 font-semibold flex-col @lg:mv-flex-row">
                <div className="@lg:mv-basis-32 @lg:mv-shrink-0 @lg:mv-grow-0 text-xs @lg:mv-text-sm leading-4 @lg:mv-leading-6 mb-2 @lg:mv-mb-0">
                  {t("profile.interests")}
                </div>
                <div className="flex-auto">
                  {loaderData.data.interests.join(" / ")}
                </div>
              </div>
            ) : null}
            {loaderData.data.offers.length > 0 ? (
              <div className="flex mb-6 font-semibold flex-col @lg:mv-flex-row">
                <div className="@lg:mv-basis-32 @lg:mv-shrink-0 @lg:mv-grow-0 text-xs @lg:mv-text-sm leading-4 @lg:mv-leading-6 my-2 @lg:mv-mb-0">
                  {t("profile.offer")}
                </div>
                <div className="flex-auto">
                  {loaderData.data.offers.map((relation) => (
                    <Chip
                      key={`offer_${relation.offer.slug}`}
                      title={t(`${relation.offer.slug}.title`, {
                        ns: "datasets/offers",
                      })}
                      slug=""
                      isEnabled
                    />
                  ))}
                </div>
              </div>
            ) : null}
            {loaderData.data.seekings.length > 0 ? (
              <div className="flex mb-6 font-semibold flex-col @lg:mv-flex-row">
                <div className="@lg:mv-basis-32 @lg:mv-shrink-0 @lg:mv-grow-0 text-xs @lg:mv-text-sm leading-4 @lg:mv-leading-6 my-2 @lg:mv-mb-0">
                  {t("profile.lookingFor")}
                </div>
                <div className="flex-auto">
                  {loaderData.data.seekings.map((relation) => (
                    <Chip
                      key={`seeking_${relation.offer.slug}`}
                      title={t(`${relation.offer.slug}.title`, {
                        ns: "datasets/offers",
                      })}
                      slug=""
                      isEnabled
                    />
                  ))}
                </div>
              </div>
            ) : null}

            {loaderData.data.memberOf.length > 0 ||
            loaderData.mode === "owner" ? (
              <>
                <div
                  id="organizations"
                  className="flex flex-row flex-nowrap mb-6 mt-14 items-center"
                >
                  <div className="flex-auto pr-4">
                    <h3 className="mb-0 font-bold">
                      {t("section.organizations.title")}
                    </h3>
                  </div>
                  {loaderData.mode === "owner" ? (
                    <div className="flex-initial pl-4">
                      <Link
                        to="/organization/create"
                        className="btn btn-outline btn-primary"
                      >
                        {t("section.organizations.create")}
                      </Link>
                    </div>
                  ) : null}
                </div>
                {loaderData.data.memberOf.length > 0 ? (
                  <div className="flex flex-wrap -mx-3 items-stretch">
                    {loaderData.data.memberOf.map((relation) => (
                      <OrganizationCard
                        key={`${relation.organization.slug}`}
                        id={`${relation.organization.slug}`}
                        link={`/organization/${relation.organization.slug}`}
                        name={relation.organization.name}
                        types={relation.organization.types}
                        image={relation.organization.logo}
                        blurredImage={relation.organization.blurredLogo}
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
                  className="flex flex-row flex-nowrap mb-6 mt-14 items-center"
                >
                  <div className="flex-auto pr-4">
                    <h3 className="mb-0 font-bold">
                      {t("section.projects.title")}
                    </h3>
                  </div>
                  {loaderData.mode === "owner" &&
                  loaderData.abilities.projects.hasAccess ? (
                    <div className="flex-initial pl-4">
                      <Link
                        to="/project/create"
                        className="btn btn-outline btn-primary"
                      >
                        {t("section.projects.create")}
                      </Link>
                    </div>
                  ) : null}
                </div>
                {loaderData.data.teamMemberOfProjects.length > 0 ? (
                  <div className="flex flex-wrap -mx-3 items-stretch">
                    {loaderData.data.teamMemberOfProjects.map((relation) => (
                      // TODO: Project Card
                      <div
                        key={relation.project.slug}
                        data-testid="gridcell"
                        className="flex-100 px-3 mb-4"
                      >
                        <Link
                          to={`/project/${relation.project.slug}`}
                          className="flex flex-wrap content-start p-4 rounded-2xl hover:bg-neutral-200 border border-neutral-500"
                        >
                          <div className="w-full flex items-center flex-row items-end">
                            {relation.project.logo !== "" &&
                            relation.project.logo !== null ? (
                              <div className="h-16 w-16 flex flex-initial items-center justify-center relative shrink-0 rounded-full overflow-hidden border">
                                <MVAvatar
                                  logo={relation.project.logo}
                                  blurredLogo={relation.project.blurredLogo}
                                  name={relation.project.name}
                                  size="full"
                                />
                              </div>
                            ) : (
                              <div className="h-16 w-16 bg-primary text-white text-3xl flex items-center justify-center rounded-full overflow-hidden shrink-0 border">
                                {getInitialsOfName(relation.project.name)}
                              </div>
                            )}
                            <div className="pl-4 flex-auto">
                              <H3 like="h4" className="text-xl mb-1">
                                {relation.project.name}
                              </H3>
                              {relation.project.responsibleOrganizations
                                .length > 0 ? (
                                <p className="font-bold text-sm">
                                  {relation.project.responsibleOrganizations
                                    .map(
                                      ({ organization }) => organization.name
                                    )
                                    .join(" / ")}
                                </p>
                              ) : null}
                            </div>
                            <div className="hidden @md:mv-flex items-center flex-initial">
                              <button className="btn btn-primary">
                                {t("section.projects.to")}
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
            {canViewEvents(loaderData.futureEvents) ||
            (loaderData.mode === "owner" &&
              loaderData.abilities.events.hasAccess) ? (
              <>
                <div
                  id="events"
                  className="flex flex-row flex-nowrap mb-6 mt-14 items-center"
                >
                  <div className="flex-auto pr-4">
                    <h3 className="mb-0 font-bold">
                      {t("section.comingEvents.title")}
                    </h3>
                  </div>
                  {loaderData.mode === "owner" &&
                  loaderData.abilities.events.hasAccess ? (
                    <div className="flex-initial pl-4">
                      <Link
                        to="/event/create"
                        className="btn btn-outline btn-primary"
                      >
                        {t("section.comingEvents.create")}
                      </Link>
                    </div>
                  ) : null}
                </div>
                {loaderData.futureEvents.administeredEvents.length > 0 ? (
                  <>
                    <h6 id="admin-future-events" className="mb-4 font-bold">
                      {t("section.event.admin")}
                    </h6>
                    <div className="mb-6">
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
                              className="rounded-lg bg-white shadow-xl border-t border-r border-neutral-300  mb-2 flex items-stretch overflow-hidden"
                            >
                              <Link
                                className="flex"
                                to={`/event/${event.slug}`}
                              >
                                <div className="hidden @xl:mv-block w-36 shrink-0 aspect-[3/2]">
                                  <div className="w-36 h-full relative">
                                    <Image
                                      src={event.background}
                                      alt={event.name}
                                      blurredSrc={event.blurredBackground}
                                    />
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
                                      startTime,
                                      endTime,
                                      i18n.language
                                    )}

                                    {event.participantLimit === null &&
                                      ` | ${t("section.event.unlimitedSeats")}`}
                                    {event.participantLimit !== null &&
                                      event.participantLimit -
                                        event._count.participants >
                                        0 &&
                                      ` | ${
                                        event.participantLimit -
                                        event._count.participants
                                      } / ${event.participantLimit} ${t(
                                        "section.event.seatsFree"
                                      )}`}

                                    {event.participantLimit !== null &&
                                    event.participantLimit -
                                      event._count.participants <=
                                      0 ? (
                                      <>
                                        {" "}
                                        |{" "}
                                        <span>
                                          {event._count.waitingList}{" "}
                                          {t("section.event.onWaitingList")}
                                        </span>
                                      </>
                                    ) : null}
                                  </p>
                                  <h4 className="font-bold text-base m-0 @lg:mv-line-clamp-1">
                                    {event.name}
                                  </h4>
                                  {event.subline !== null ? (
                                    <p className="mv-hidden text-xs mt-1 @lg:mv-line-clamp-1">
                                      {event.subline}
                                    </p>
                                  ) : (
                                    <p className="mv-hidden text-xs mt-1 @lg:mv-line-clamp-1">
                                      {removeHtmlTags(event.description ?? "")}
                                    </p>
                                  )}
                                </div>
                              </Link>

                              {loaderData.mode === "owner" &&
                              !event.canceled ? (
                                <>
                                  {event.published ? (
                                    <div className="flex font-semibold items-center ml-auto border-r-8 border-green-600 pr-4 py-6 text-green-600">
                                      {t("section.event.published")}
                                    </div>
                                  ) : (
                                    <div className="flex font-semibold items-center ml-auto border-r-8 border-blue-300 pr-4 py-6 text-blue-300">
                                      {t("section.event.draft")}
                                    </div>
                                  )}
                                </>
                              ) : null}
                              {event.canceled ? (
                                <div className="flex font-semibold items-center ml-auto border-r-8 border-salmon-500 pr-4 py-6 text-salmon-500">
                                  {t("section.event.cancelled")}
                                </div>
                              ) : null}
                              {event.isParticipant &&
                              !event.canceled &&
                              loaderData.mode !== "owner" ? (
                                <div className="flex font-semibold items-center ml-auto border-r-8 border-green-500 pr-4 py-6 text-green-600">
                                  <p>{t("section.event.registered")}</p>
                                </div>
                              ) : null}
                              {loaderData.mode !== "anon" &&
                              canUserParticipate(event) ? (
                                <div className="flex items-center ml-auto pr-4 py-6">
                                  <AddParticipantButton
                                    action={`/event/${event.slug}/settings/participants/add-participant`}
                                    profileId={loaderData.userId}
                                  />
                                </div>
                              ) : null}
                              {event.isOnWaitingList &&
                              !event.canceled &&
                              loaderData.mode !== "owner" ? (
                                <div className="flex font-semibold items-center ml-auto border-r-8 border-neutral-500 pr-4 py-6">
                                  <p>{t("section.event.waiting")}</p>
                                </div>
                              ) : null}
                              {loaderData.mode !== "anon" &&
                              canUserBeAddedToWaitingList(event) ? (
                                <div className="flex items-center ml-auto pr-4 py-6">
                                  <AddToWaitingListButton
                                    action={`/event/${event.slug}/settings/waiting-list/add-to-waiting-list`}
                                    profileId={loaderData.userId}
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
                                <div className="flex items-center ml-auto pr-4 py-6">
                                  <Link
                                    to={`/event/${event.slug}`}
                                    className="btn btn-primary"
                                  >
                                    {t("section.event.more")}
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
                      className="mb-4 font-bold"
                    >
                      {t("section.event.team")}
                    </h6>
                    <div className="mb-6">
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
                              className="rounded-lg bg-white shadow-xl border-t border-r border-neutral-300  mb-2 flex items-stretch overflow-hidden"
                            >
                              <Link
                                className="flex"
                                to={`/event/${event.slug}`}
                              >
                                <div className="hidden @xl:mv-block w-36 shrink-0 aspect-[3/2]">
                                  <div className="w-36 h-full relative">
                                    <Image
                                      src={event.background}
                                      alt={event.name}
                                      blurredSrc={event.blurredBackground}
                                    />
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
                                      startTime,
                                      endTime,
                                      i18n.language
                                    )}
                                    {event.participantLimit === null &&
                                      ` | ${t("section.event.unlimitedSeats")}`}
                                    {event.participantLimit !== null &&
                                      event.participantLimit -
                                        event._count.participants >
                                        0 &&
                                      ` | ${
                                        event.participantLimit -
                                        event._count.participants
                                      } / ${event.participantLimit} ${t(
                                        "section.event.seatsFree"
                                      )}`}

                                    {event.participantLimit !== null &&
                                    event.participantLimit -
                                      event._count.participants <=
                                      0 ? (
                                      <>
                                        {" "}
                                        |{" "}
                                        <span>
                                          {event._count.waitingList}{" "}
                                          {t("section.event.onWaitingList")}
                                        </span>
                                      </>
                                    ) : null}
                                  </p>
                                  <h4 className="font-bold text-base m-0 @lg:mv-line-clamp-1">
                                    {event.name}
                                  </h4>
                                  {event.subline !== null ? (
                                    <p className="mv-hidden text-xs mt-1 @lg:mv-line-clamp-1">
                                      {event.subline}
                                    </p>
                                  ) : (
                                    <p className="mv-hidden text-xs mt-1 @lg:mv-line-clamp-1">
                                      {removeHtmlTags(event.description ?? "")}
                                    </p>
                                  )}
                                </div>
                              </Link>

                              {event.canceled ? (
                                <div className="flex font-semibold items-center ml-auto border-r-8 border-salmon-500 pr-4 py-6 text-salmon-500">
                                  {t("section.event.cancelled")}
                                </div>
                              ) : null}
                              {event.isParticipant &&
                              !event.canceled &&
                              loaderData.mode !== "owner" ? (
                                <div className="flex font-semibold items-center ml-auto border-r-8 border-green-500 pr-4 py-6 text-green-600">
                                  <p>{t("section.event.registered")}</p>
                                </div>
                              ) : null}
                              {loaderData.mode !== "anon" &&
                              canUserParticipate(event) ? (
                                <div className="flex items-center ml-auto pr-4 py-6">
                                  <AddParticipantButton
                                    action={`/event/${event.slug}/settings/participants/add-participant`}
                                    profileId={loaderData.userId}
                                  />
                                </div>
                              ) : null}
                              {event.isOnWaitingList &&
                              !event.canceled &&
                              loaderData.mode !== "owner" ? (
                                <div className="flex font-semibold items-center ml-auto border-r-8 border-neutral-500 pr-4 py-6">
                                  <p>{t("section.event.waiting")}</p>
                                </div>
                              ) : null}
                              {loaderData.mode !== "anon" &&
                              canUserBeAddedToWaitingList(event) ? (
                                <div className="flex items-center ml-auto pr-4 py-6">
                                  <AddToWaitingListButton
                                    action={`/event/${event.slug}/settings/waiting-list/add-to-waiting-list`}
                                    profileId={loaderData.userId}
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
                                <div className="flex items-center ml-auto pr-4 py-6">
                                  <Link
                                    to={`/event/${event.slug}`}
                                    className="btn btn-primary"
                                  >
                                    {t("section.event.more")}
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
                      className="mb-4 font-bold"
                    >
                      {t("section.event.speaker")}
                    </h6>
                    <div className="mb-6">
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
                              className="rounded-lg bg-white shadow-xl border-t border-r border-neutral-300  mb-2 flex items-stretch overflow-hidden"
                            >
                              <Link
                                className="flex"
                                to={`/event/${event.slug}`}
                              >
                                <div className="hidden @xl:mv-block w-36 shrink-0 aspect-[3/2]">
                                  <div className="w-36 h-full relative">
                                    <Image
                                      src={event.background}
                                      alt={event.name}
                                      blurredSrc={event.blurredBackground}
                                    />
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
                                      startTime,
                                      endTime,
                                      i18n.language
                                    )}
                                    {event.participantLimit === null &&
                                      ` | ${t("section.event.unlimitedSeats")}`}
                                    {event.participantLimit !== null &&
                                      event.participantLimit -
                                        event._count.participants >
                                        0 &&
                                      ` | ${
                                        event.participantLimit -
                                        event._count.participants
                                      } / ${event.participantLimit} ${t(
                                        "section.event.seatsFree"
                                      )}`}

                                    {event.participantLimit !== null &&
                                    event.participantLimit -
                                      event._count.participants <=
                                      0 ? (
                                      <>
                                        {" "}
                                        |{" "}
                                        <span>
                                          {event._count.waitingList}{" "}
                                          {t("section.event.onWaitingList")}
                                        </span>
                                      </>
                                    ) : null}
                                  </p>
                                  <h4 className="font-bold text-base m-0 @lg:mv-line-clamp-1">
                                    {event.name}
                                  </h4>
                                  {event.subline !== null ? (
                                    <p className="mv-hidden text-xs mt-1 @lg:mv-line-clamp-1">
                                      {event.subline}
                                    </p>
                                  ) : (
                                    <p className="mv-hidden text-xs mt-1 @lg:mv-line-clamp-1">
                                      {removeHtmlTags(event.description ?? "")}
                                    </p>
                                  )}
                                </div>
                              </Link>
                              {event.canceled ? (
                                <div className="flex font-semibold items-center ml-auto border-r-8 border-salmon-500 pr-4 py-6 text-salmon-500">
                                  {t("section.event.cancelled")}
                                </div>
                              ) : null}
                              {event.isParticipant && !event.canceled ? (
                                <div className="flex font-semibold items-center ml-auto border-r-8 border-green-500 pr-4 py-6 text-green-600">
                                  <p>{t("section.event.registered")}</p>
                                </div>
                              ) : null}
                              {loaderData.mode !== "anon" &&
                              canUserParticipate(event) ? (
                                <div className="flex items-center ml-auto pr-4 py-6">
                                  <AddParticipantButton
                                    action={`/event/${event.slug}/settings/participants/add-participant`}
                                    profileId={loaderData.userId}
                                  />
                                </div>
                              ) : null}
                              {event.isOnWaitingList && !event.canceled ? (
                                <div className="flex font-semibold items-center ml-auto border-r-8 border-neutral-500 pr-4 py-6">
                                  <p>{t("section.event.waiting")}</p>
                                </div>
                              ) : null}
                              {loaderData.mode !== "anon" &&
                              canUserBeAddedToWaitingList(event) ? (
                                <div className="flex items-center ml-auto pr-4 py-6">
                                  <AddToWaitingListButton
                                    action={`/event/${event.slug}/settings/waiting-list/add-to-waiting-list`}
                                    profileId={loaderData.userId}
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
                                <div className="flex items-center ml-auto pr-4 py-6">
                                  <Link
                                    to={`/event/${event.slug}`}
                                    className="btn btn-primary"
                                  >
                                    {t("section.event.more")}
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
                      className="mb-4 font-bold"
                    >
                      {t("section.event.participation")}
                    </h6>
                    <div className="mb-6">
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
                              className="rounded-lg bg-white shadow-xl border-t border-r border-neutral-300 mb-2 flex items-stretch overflow-hidden"
                            >
                              <Link
                                className="flex"
                                to={`/event/${event.slug}`}
                              >
                                <div className="hidden @xl:mv-block w-36 shrink-0 aspect-[3/2]">
                                  <div className="w-36 h-full relative">
                                    <Image
                                      src={event.background}
                                      alt={event.name}
                                      blurredSrc={event.blurredBackground}
                                    />
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
                                      startTime,
                                      endTime,
                                      i18n.language
                                    )}
                                    {event.participantLimit === null &&
                                      ` | ${t("section.event.unlimitedSeats")}`}
                                    {event.participantLimit !== null &&
                                      event.participantLimit -
                                        event._count.participants >
                                        0 &&
                                      ` | ${
                                        event.participantLimit -
                                        event._count.participants
                                      } / ${event.participantLimit} ${t(
                                        "section.event.seatsFree"
                                      )}`}

                                    {event.participantLimit !== null &&
                                    event.participantLimit -
                                      event._count.participants <=
                                      0 ? (
                                      <>
                                        {" "}
                                        |{" "}
                                        <span>
                                          {event._count.waitingList}{" "}
                                          {t("section.event.onWaitingList")}
                                        </span>
                                      </>
                                    ) : null}
                                  </p>
                                  <h4 className="font-bold text-base m-0 @lg:mv-line-clamp-1">
                                    {event.name}
                                  </h4>
                                  {event.subline !== null ? (
                                    <p className="mv-hidden text-xs mt-1 @lg:mv-line-clamp-1">
                                      {event.subline}
                                    </p>
                                  ) : (
                                    <p className="mv-hidden text-xs mt-1 @lg:mv-line-clamp-1">
                                      {removeHtmlTags(event.description ?? "")}
                                    </p>
                                  )}
                                </div>
                              </Link>
                              {event.canceled ? (
                                <div className="flex font-semibold items-center ml-auto border-r-8 border-salmon-500 pr-4 py-6 text-salmon-500">
                                  {t("section.event.cancelled")}
                                </div>
                              ) : null}
                              {event.isParticipant && !event.canceled ? (
                                <div className="flex font-semibold items-center ml-auto border-r-8 border-green-500 pr-4 py-6 text-green-600">
                                  <p>{t("section.event.registered")}</p>
                                </div>
                              ) : null}
                              {canUserParticipate(event) ? (
                                <div className="flex items-center ml-auto pr-4 py-6">
                                  <AddParticipantButton
                                    action={`/event/${event.slug}/settings/participants/add-participant`}
                                    profileId={loaderData.userId}
                                  />
                                </div>
                              ) : null}
                              {event.isOnWaitingList && !event.canceled ? (
                                <div className="flex font-semibold items-center ml-auto border-r-8 border-neutral-500 pr-4 py-6">
                                  <p>{t("section.event.waiting")}</p>
                                </div>
                              ) : null}
                              {canUserBeAddedToWaitingList(event) ? (
                                <div className="flex items-center ml-auto pr-4 py-6">
                                  <AddToWaitingListButton
                                    action={`/event/${event.slug}/settings/waiting-list/add-to-waiting-list`}
                                    profileId={loaderData.userId}
                                  />
                                </div>
                              ) : null}
                              {!event.isParticipant &&
                              !canUserParticipate(event) &&
                              !event.isOnWaitingList &&
                              !canUserBeAddedToWaitingList(event) &&
                              !event.canceled ? (
                                <div className="flex items-center ml-auto pr-4 py-6">
                                  <Link
                                    to={`/event/${event.slug}`}
                                    className="btn btn-primary"
                                  >
                                    {t("section.event.more")}
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
            {canViewEvents(loaderData.pastEvents) ||
            (loaderData.mode === "owner" &&
              loaderData.abilities.events.hasAccess) ? (
              <>
                <div className="flex flex-row flex-nowrap mb-6 mt-14 items-center">
                  <div className="flex-auto pr-4">
                    <h3 className="mb-0 font-bold">
                      {t("section.pastEvents.title")}
                    </h3>
                  </div>
                </div>
                {loaderData.pastEvents.administeredEvents.length > 0 ? (
                  <>
                    <h6 id="past-admin-events" className="mb-4 font-bold">
                      {t("section.event.admin")}
                    </h6>
                    <div className="mb-6">
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
                              className="rounded-lg bg-white shadow-xl border-t border-r border-neutral-300 mb-2 flex items-stretch overflow-hidden"
                            >
                              <Link
                                className="flex"
                                to={`/event/${event.slug}`}
                              >
                                <div className="hidden @xl:mv-block mv-w-36 shrink-0 aspect-[3/2]">
                                  <div className="w-36 h-full relative">
                                    <Image
                                      src={event.background}
                                      alt={event.name}
                                      blurredSrc={event.blurredBackground}
                                    />
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
                                      startTime,
                                      endTime,
                                      i18n.language
                                    )}
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
                                    <div className="flex font-semibold items-center ml-auto border-r-8 border-green-600 pr-4 py-6 text-green-600">
                                      {t("section.event.published")}
                                    </div>
                                  ) : (
                                    <div className="flex font-semibold items-center ml-auto border-r-8 border-blue-300 pr-4 py-6 text-blue-300">
                                      {t("section.event.draft")}
                                    </div>
                                  )}
                                </>
                              ) : null}
                              {event.canceled ? (
                                <div className="flex font-semibold items-center ml-auto border-r-8 border-salmon-500 pr-4 py-6 text-salmon-500">
                                  {t("section.event.cancelled")}
                                </div>
                              ) : null}
                              {event.isParticipant &&
                              !event.canceled &&
                              loaderData.mode !== "owner" ? (
                                <div className="flex font-semibold items-center ml-auto border-r-8 border-green-500 pr-4 py-6 text-green-600">
                                  <p>{t("section.event.participated")}</p>
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
                                <div className="flex items-center ml-auto pr-4 py-6">
                                  <Link
                                    to={`/event/${event.slug}`}
                                    className="btn btn-primary"
                                  >
                                    {t("section.event.more")}
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
                    <h6 id="past-team-member-events" className="mb-4 font-bold">
                      {t("section.event.team")}
                    </h6>
                    <div className="mb-6">
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
                              className="rounded-lg bg-white shadow-xl border-t border-r border-neutral-300  mb-2 flex items-stretch overflow-hidden"
                            >
                              <Link
                                className="flex"
                                to={`/event/${event.slug}`}
                              >
                                <div className="hidden @xl:mv-block w-36 shrink-0 aspect-[3/2]">
                                  <div className="w-36 h-full relative">
                                    <Image
                                      src={event.background}
                                      alt={event.name}
                                      blurredSrc={event.blurredBackground}
                                    />
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
                                      startTime,
                                      endTime,
                                      i18n.language
                                    )}
                                  </p>
                                  <h4 className="font-bold text-base m-0 @lg:mv-line-clamp-1">
                                    {event.name}
                                  </h4>
                                  {event.subline !== null ? (
                                    <p className="mv-hidden text-xs mt-1 @lg:mv-line-clamp-1">
                                      {event.subline}
                                    </p>
                                  ) : (
                                    <p className="mv-hidden text-xs mt-1 @lg:mv-line-clamp-1">
                                      {removeHtmlTags(event.description ?? "")}
                                    </p>
                                  )}
                                </div>
                              </Link>

                              {event.canceled ? (
                                <div className="flex font-semibold items-center ml-auto border-r-8 border-salmon-500 pr-4 py-6 text-salmon-500">
                                  {t("section.event.cancelled")}
                                </div>
                              ) : null}
                              {event.isParticipant &&
                              !event.canceled &&
                              loaderData.mode !== "owner" ? (
                                <div className="flex font-semibold items-center ml-auto border-r-8 border-green-500 pr-4 py-6 text-green-600">
                                  <p>{t("section.event.participated")}</p>
                                </div>
                              ) : null}
                              {(!event.isParticipant &&
                                !canUserParticipate(event) &&
                                !event.isOnWaitingList &&
                                !canUserBeAddedToWaitingList(event) &&
                                !event.canceled) ||
                              (loaderData.mode === "anon" &&
                                !event.canceled) ? (
                                <div className="flex items-center ml-auto pr-4 py-6">
                                  <Link
                                    to={`/event/${event.slug}`}
                                    className="btn btn-primary"
                                  >
                                    {t("section.event.more")}
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
                    <h6 id="past-contributed-events" className="mb-4 font-bold">
                      {t("section.event.speaker")}
                    </h6>
                    <div className="mb-6">
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
                              className="rounded-lg bg-white shadow-xl border-t border-r border-neutral-300  mb-2 flex items-stretch overflow-hidden"
                            >
                              <Link
                                className="flex"
                                to={`/event/${event.slug}`}
                              >
                                <div className="hidden @xl:mv-block w-36 shrink-0 aspect-[3/2]">
                                  <div className="w-36 h-full relative">
                                    <Image
                                      src={event.background}
                                      alt={event.name}
                                      blurredSrc={event.blurredBackground}
                                    />
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
                                      startTime,
                                      endTime,
                                      i18n.language
                                    )}
                                  </p>
                                  <h4 className="font-bold text-base m-0 @lg:mv-line-clamp-1">
                                    {event.name}
                                  </h4>
                                  {event.subline !== null ? (
                                    <p className="mv-hidden text-xs mt-1 @lg:mv-line-clamp-1">
                                      {event.subline}
                                    </p>
                                  ) : (
                                    <p className="mv-hidden text-xs mt-1 @lg:mv-line-clamp-1">
                                      {removeHtmlTags(event.description ?? "")}
                                    </p>
                                  )}
                                </div>
                              </Link>
                              {event.canceled ? (
                                <div className="flex font-semibold items-center ml-auto border-r-8 border-salmon-500 pr-4 py-6 text-salmon-500">
                                  {t("section.event.wasCancelled")}
                                </div>
                              ) : null}
                              {event.isParticipant && !event.canceled ? (
                                <div className="flex font-semibold items-center ml-auto border-r-8 border-green-500 pr-4 py-6 text-green-600">
                                  <p>{t("section.event.participated")}</p>
                                </div>
                              ) : null}
                              {(!event.isParticipant &&
                                !canUserParticipate(event) &&
                                !event.isOnWaitingList &&
                                !canUserBeAddedToWaitingList(event) &&
                                !event.canceled) ||
                              (loaderData.mode === "anon" &&
                                !event.canceled) ? (
                                <div className="flex items-center ml-auto pr-4 py-6">
                                  <Link
                                    to={`/event/${event.slug}`}
                                    className="btn btn-primary"
                                  >
                                    {t("section.event.more")}
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
                    <h6 id="past-participated-events" className="mb-4font-bold">
                      {t("section.event.participation")}
                    </h6>
                    <div className="mb-6">
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
                              className="rounded-lg bg-white shadow-xl border-t border-r border-neutral-300 mb-2 flex items-stretch overflow-hidden"
                            >
                              <Link
                                className="flex"
                                to={`/event/${event.slug}`}
                              >
                                <div className="hidden @xl:mv-block w-36 shrink-0 aspect-[3/2]">
                                  <div className="w-36 h-full relative">
                                    <Image
                                      src={event.background}
                                      alt={event.name}
                                      blurredSrc={event.blurredBackground}
                                    />
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
                                      startTime,
                                      endTime,
                                      i18n.language
                                    )}
                                  </p>
                                  <h4 className="font-bold text-base m-0 @lg:mv-line-clamp-1">
                                    {event.name}
                                  </h4>
                                  {event.subline !== null ? (
                                    <p className="mv-hidden text-xs mt-1 @lg:mv-line-clamp-1">
                                      {event.subline}
                                    </p>
                                  ) : (
                                    <p className="mv-hidden text-xs mt-1 @lg:mv-line-clamp-1">
                                      {removeHtmlTags(event.description ?? "")}
                                    </p>
                                  )}
                                </div>
                              </Link>
                              {event.canceled ? (
                                <div className="flex font-semibold items-center ml-auto border-r-8 border-salmon-500 pr-4 py-6 text-salmon-500">
                                  {t("section.event.wasCancelled")}
                                </div>
                              ) : null}
                              {event.isParticipant && !event.canceled ? (
                                <div className="flex font-semibold items-center ml-auto border-r-8 border-green-500 pr-4 py-6 text-green-600">
                                  <p>{t("section.event.participated")}</p>
                                </div>
                              ) : null}
                              {!event.isParticipant &&
                              !canUserParticipate(event) &&
                              !event.isOnWaitingList &&
                              !canUserBeAddedToWaitingList(event) &&
                              !event.canceled ? (
                                <div className="flex items-center ml-auto pr-4 py-6">
                                  <Link
                                    to={`/event/${event.slug}`}
                                    className="btn btn-primary"
                                  >
                                    {t("section.event.more")}
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
