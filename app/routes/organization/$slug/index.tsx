import type { Organization } from "@prisma/client";
import type { LoaderFunctionArgs, MetaFunction } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { Link, useLoaderData, Form } from "@remix-run/react";
import { utcToZonedTime } from "date-fns-tz";
import rcSliderStyles from "rc-slider/assets/index.css";
import * as React from "react";
import { useTranslation } from "react-i18next";
import reactCropStyles from "react-image-crop/dist/ReactCrop.css";
import { useHydrated } from "remix-utils/use-hydrated";
import { createAuthClient, getSessionUser } from "~/auth.server";
import ExternalServiceIcon from "~/components/ExternalService/ExternalServiceIcon";
import { H3, H4 } from "~/components/Heading/Heading";
import ImageCropper from "~/components/ImageCropper/ImageCropper";
import OrganizationCard from "~/components/OrganizationCard/OrganizationCard";
import ProfileCard from "~/components/ProfileCard/ProfileCard";
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
import { getParamValueOrThrow } from "~/lib/utils/routes";
import { removeHtmlTags } from "~/lib/utils/sanitizeUserHtml";
import { getDuration } from "~/lib/utils/time";
import { prismaClient } from "~/prisma.server";
import { detectLanguage } from "~/root.server";
import { AddParticipantButton } from "~/routes/event/$slug/settings/participants/add-participant";
import { AddToWaitingListButton } from "~/routes/event/$slug/settings/waiting-list/add-to-waiting-list";
import {
  addImgUrls,
  filterOrganization,
  getOrganizationBySlug,
  sortEvents,
  splitEventsIntoFutureAndPast,
} from "./index.server";
import { deriveOrganizationMode } from "./utils.server";
import { Mastodon, TikTok } from "~/routes/project/$slug/detail/__components";
import { getFeatureAbilities } from "~/lib/utils/application";
import { Modal } from "~/routes/__components";
import { Button } from "@mint-vernetzt/components";

const i18nNS = ["routes/organization/index"];
export const handle = {
  i18n: i18nNS,
};

export function links() {
  return [
    { rel: "stylesheet", href: rcSliderStyles },
    { rel: "stylesheet", href: reactCropStyles },
  ];
}

export const meta: MetaFunction<typeof loader> = ({ data }) => {
  return [
    {
      title: `MINTvernetzt Community Plattform${
        data !== undefined ? ` | ${data.organization.name}` : ""
      }`,
    },
  ];
};

export const loader = async (args: LoaderFunctionArgs) => {
  const { request, params } = args;
  const locale = detectLanguage(request);
  const t = await i18next.getFixedT(locale, i18nNS);
  const { authClient } = createAuthClient(request);
  const slug = getParamValueOrThrow(params, "slug");
  const sessionUser = await getSessionUser(authClient);
  const mode = await deriveOrganizationMode(sessionUser, slug);

  const abilities = await getFeatureAbilities(authClient, ["next_navbar"]);

  if (mode !== "anon" && sessionUser !== null) {
    const userProfile = await prismaClient.profile.findFirst({
      where: { id: sessionUser.id },
      select: { termsAccepted: true },
    });
    if (userProfile !== null && userProfile.termsAccepted === false) {
      return redirect(`/accept-terms?redirect_to=/organization/${slug}`);
    }
  }

  const organization = await getOrganizationBySlug(slug);
  if (organization === null) {
    throw json({ message: t("error.notFound") }, { status: 404 });
  }

  // Filtering by visbility settings
  let filteredOrganization = {
    ...organization,
  };
  if (mode === "anon") {
    filteredOrganization = filterOrganization(organization);
  }
  // Add imgUrls for imgproxy call on client
  const enhancedOrganization = addImgUrls(authClient, filteredOrganization);
  // Split events and profile to handle them seperately
  const { responsibleForEvents, ...organizationWithoutEvents } =
    enhancedOrganization;
  // Split events into future and past (Note: The events are already ordered by startTime: descending from the database)
  type ResponsibleForEvents = typeof responsibleForEvents;
  const { futureEvents, pastEvents } =
    splitEventsIntoFutureAndPast<ResponsibleForEvents>(responsibleForEvents);
  // Sorting events (future: startTime "desc", past: startTime "asc")
  let inFuture = true;
  type FutureEvents = typeof futureEvents;
  const sortedFutureEvents = sortEvents<FutureEvents>(futureEvents, inFuture);
  type PastEvents = typeof pastEvents;
  const sortedPastEvents = sortEvents<PastEvents>(pastEvents, !inFuture);
  // Adding participation status of session user
  type SortedFutureEvents = typeof sortedFutureEvents;
  const enhancedFutureEvents = {
    responsibleForEvents: await addUserParticipationStatus<SortedFutureEvents>(
      sortedFutureEvents,
      sessionUser?.id
    ),
  };
  type SortedPastEvents = typeof sortedPastEvents;
  const enhancedPastEvents = {
    responsibleForEvents: await addUserParticipationStatus<SortedPastEvents>(
      sortedPastEvents,
      sessionUser?.id
    ),
  };

  return json({
    organization: organizationWithoutEvents,
    futureEvents: enhancedFutureEvents,
    pastEvents: enhancedPastEvents,
    userId: sessionUser?.id,
    mode,
    abilities,
  });
};

function hasContactInformations(
  organization: Pick<Organization, "email" | "phone">
) {
  const hasEmail =
    typeof organization.email === "string" && organization.email !== "";
  const hasPhone =
    typeof organization.phone === "string" && organization.phone !== "";
  return hasEmail || hasPhone;
}

function notEmptyData(
  key: ExternalService,
  organization: Pick<Organization, ExternalService>
) {
  if (typeof organization[key] === "string") {
    return organization[key] !== "";
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
  organization: Pick<Organization, ExternalService>,
  externalServices: ExternalService[]
) {
  return externalServices.some((item) => notEmptyData(item, organization));
}

export default function Index() {
  const loaderData = useLoaderData<typeof loader>();
  const initialsOfOrganization = loaderData.organization.name
    ? getInitialsOfName(loaderData.organization.name)
    : "";
  const organizationName = loaderData.organization.name ?? "";
  const { t, i18n } = useTranslation(i18nNS);

  const logo = loaderData.organization.logo;
  const Avatar = React.useCallback(
    () => (
      <>
        <div
          className={`h-36 flex items-center justify-center rounded-full overflow-hidden border ${
            logo ? "w-36" : "w-36 bg-primary text-white text-6xl"
          }`}
        >
          {logo ? (
            <img
              src={logo}
              alt={organizationName}
              className="max-w-full w-auto max-h-36 h-auto"
            />
          ) : (
            initialsOfOrganization
          )}
        </div>
      </>
    ),
    [logo, organizationName, initialsOfOrganization]
  );

  const background = loaderData.organization.background;
  const Background = React.useCallback(
    () => (
      <div className="w-full bg-yellow-500 rounded-md overflow-hidden">
        {background ? (
          <img src={background} alt={t("image.background.alt")} />
        ) : (
          <div className="w-[336px] min-h-[108px]" />
        )}
      </div>
    ),
    [background]
  );

  const uploadRedirect = `/organization/${loaderData.organization.slug}`;

  const isHydrated = useHydrated();

  return (
    <>
      <section className="hidden @md:mv-block mv-container-custom mt-8 @md:mv-mt-10 @lg:mv-mt-20">
        <div className="rounded-3xl relative overflow-hidden bg-yellow-500 w-full aspect-[31/10]">
          <div className="w-full h-full">
            {background ? (
              <img
                src={background}
                alt=""
                className="object-cover w-full h-full"
              />
            ) : null}
          </div>
          {loaderData.mode === "admin" ? (
            <div className="absolute bottom-6 right-6">
              <Form method="get">
                <input hidden name="modal-background" defaultValue="true" />
                <Button type="submit">{t("image.background.change")}</Button>
              </Form>

              <Modal searchParam="modal-background">
                <Modal.Title>{t("image.background.headline")}</Modal.Title>
                <Modal.Section>
                  <ImageCropper
                    subject="organization"
                    id="modal-background-upload"
                    uploadKey="background"
                    image={background || undefined}
                    aspect={31 / 10}
                    minCropWidth={620}
                    minCropHeight={62}
                    maxTargetWidth={1488}
                    maxTargetHeight={480}
                    slug={loaderData.organization.slug}
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
      <div className="mv-container-custom relative pb-44">
        <div className="flex flex-col @lg:mv-flex-row -mx-4">
          <div className="flex-gridcol @lg:mv-w-5/12 px-4 pt-10 @lg:mv-pt-0">
            <div
              className={`sticky ${
                loaderData.abilities.next_navbar.hasAccess ? "top-24" : "top-4"
              }`}
            >
              <div className="px-4 py-8 @lg:mv-p-8 pb-15 @md:mv-pb-5 rounded-3xl border border-neutral-400 bg-neutral-200 shadow-lg relative @lg:mv-ml-14 @lg:-mv-mt-44 ">
                <div className="flex items-center flex-col">
                  <Avatar />
                  {loaderData.mode === "admin" ? (
                    <>
                      <Form method="get">
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
                          <span className="ml-2 mr-4">
                            {t("image.logo.change")}
                          </span>
                        </button>
                      </Form>

                      <Modal searchParam="modal-logo">
                        <Modal.Title>{t("image.logo.headline")}</Modal.Title>
                        <Modal.Section>
                          <ImageCropper
                            id="modal-avatar"
                            subject="organization"
                            slug={loaderData.organization.slug}
                            uploadKey="logo"
                            image={logo || undefined}
                            aspect={1 / 1}
                            minCropWidth={100}
                            minCropHeight={100}
                            maxTargetHeight={1488}
                            maxTargetWidth={1488}
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

                  <h3 className="mt-6 text-5xl mb-1">
                    {loaderData.organization.name}
                  </h3>
                  {loaderData.organization.types.length > 0 ? (
                    <p className="font-bold text-sm mb-4">
                      {loaderData.organization.types
                        .map((relation) => relation.organizationType.title)
                        .join(", ")}
                    </p>
                  ) : null}
                </div>
                {hasContactInformations(loaderData.organization) ||
                hasWebsiteOrSocialService(
                  loaderData.organization,
                  ExternalServices
                ) ? (
                  <h5 className="font-semibold mb-6 mt-8">
                    {t("content.contact")}
                  </h5>
                ) : null}
                {hasContactInformations(loaderData.organization) ? (
                  <>
                    {typeof loaderData.organization.email === "string" &&
                    loaderData.organization.email !== "" ? (
                      <p className="text-mb mb-2">
                        <a
                          href={`mailto:${loaderData.organization.email}`}
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
                          <span>{loaderData.organization.email}</span>
                        </a>
                      </p>
                    ) : null}
                    {typeof loaderData.organization.phone === "string" &&
                    loaderData.organization.phone !== "" ? (
                      <p className="text-md text-neutral-600 mb-2">
                        <a
                          href={`tel:${loaderData.organization.phone}`}
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
                          <span>{loaderData.organization.phone}</span>
                        </a>
                      </p>
                    ) : null}
                  </>
                ) : null}

                {/* --- WEBSITE & SOCIAL --- */}
                {hasWebsiteOrSocialService(
                  loaderData.organization,
                  ExternalServices
                ) ? (
                  <ul className="list-none flex flex-wrap -mx-1 mb-2">
                    {ExternalServices.map((service) => {
                      if (
                        typeof loaderData.organization[service] === "string" &&
                        loaderData.organization[service] !== ""
                      ) {
                        if (service === "mastodon" || service === "tiktok") {
                          return (
                            <li key={service} className="flex-auto px-1 mb-2">
                              <a
                                href={
                                  loaderData.organization[service] as string
                                }
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
                              url={loaderData.organization[service] as string}
                            />
                          </li>
                        );
                      }

                      return false;
                    })}
                  </ul>
                ) : null}

                {(typeof loaderData.organization.street === "string" &&
                  loaderData.organization.street !== "") ||
                (typeof loaderData.organization.streetNumber === "string" &&
                  loaderData.organization.streetNumber !== "") ||
                (typeof loaderData.organization.zipCode === "string" &&
                  loaderData.organization.zipCode !== "") ||
                (typeof loaderData.organization.city === "string" &&
                  loaderData.organization.city !== "") ? (
                  <>
                    <h5 className="font-semibold mb-6 mt-8">
                      {t("content.address")}
                    </h5>
                    <p className="text-md text-neutral-600 mb-2 flex nowrap flex-row items-center px-4 py-3 bg-neutral-300 rounded-lg">
                      <span className="icon w-6 mr-4">
                        <svg
                          width="12"
                          height="20"
                          viewBox="0 0 12 20"
                          className="fill-current"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path d="M6 1.6a3.6 3.6 0 1 0 0 7.2 3.6 3.6 0 0 0 0-7.2ZM1.2 5.2a4.8 4.8 0 1 1 5.4 4.762V16.6a.6.6 0 1 1-1.2 0V9.964a4.8 4.8 0 0 1-4.2-4.766V5.2Zm2.992 10.289a.6.6 0 0 1-.494.69c-.854.141-1.536.354-1.986.591-.165.08-.315.187-.444.318a.363.363 0 0 0-.068.108v.004l.002.01a.174.174 0 0 0 .02.039.74.74 0 0 0 .174.18c.198.156.522.324.975.474.901.3 2.184.497 3.63.497 1.444 0 2.727-.196 3.628-.497.454-.151.778-.318.976-.474a.744.744 0 0 0 .175-.18.18.18 0 0 0 .018-.04l.002-.01v-.004a.362.362 0 0 0-.068-.108 1.58 1.58 0 0 0-.444-.317c-.451-.237-1.132-.45-1.986-.591a.6.6 0 1 1 .197-1.184c.924.153 1.742.394 2.348.713C11.4 16 12 16.48 12 17.2c0 .511-.312.902-.652 1.172-.349.274-.817.496-1.34.67-1.053.351-2.47.558-4.008.558-1.537 0-2.954-.207-4.008-.558-.523-.174-.991-.396-1.34-.67-.34-.27-.652-.66-.652-1.172 0-.719.6-1.2 1.153-1.492.606-.319 1.425-.56 2.349-.713a.6.6 0 0 1 .69.494Z" />
                        </svg>
                      </span>
                      <span>
                        {loaderData.organization.street
                          ? `${loaderData.organization.street} ${loaderData.organization.streetNumber} `
                          : ""}
                        <br />
                        {loaderData.organization.zipCode
                          ? `${loaderData.organization.zipCode} `
                          : ""}
                        {loaderData.organization.city
                          ? loaderData.organization.city
                          : ""}
                      </span>
                    </p>
                  </>
                ) : null}
                <hr className="divide-y divide-neutral-400 mt-8 mb-6" />

                <p className="text-xs mb-4 text-center">
                  {t("since", {
                    timestamp: utcToZonedTime(
                      loaderData.organization.createdAt,
                      "Europe/Berlin"
                    ).toLocaleDateString("de-De", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    }),
                  })}
                </p>
              </div>
              {/** TODO: Styling of quote section */}
              {typeof loaderData.organization.quote === "string" &&
              loaderData.organization.quote !== "" ? (
                <div className="py-8 px-4 pb-15 @md:mv-pb-5 relative @lg:mv-ml-14">
                  <div className="mb-0 text-[72px] leading-none">“</div>
                  <div className="mb-4">"{loaderData.organization.quote}"</div>
                  <div className="text-primary font-bold">
                    {loaderData.organization.quoteAuthor || ""}
                  </div>
                  <div>
                    {loaderData.organization.quoteAuthorInformation || ""}
                  </div>
                </div>
              ) : null}
            </div>
          </div>

          <div className="flex-gridcol @lg:mv-w-7/12 px-4 pt-10 @lg:mv-pt-20">
            {loaderData.mode === "admin" ? (
              <div className="flex flex-col-reverse @lg:mv-flex-row flex-nowrap">
                <div className="flex-auto pr-4 mb-6">
                  <h1 className="mb-0">{loaderData.organization.name}</h1>
                </div>
                <div className="flex-initial @lg:mv-pl-4 pt-3 mb-6">
                  <Link
                    className="btn btn-outline btn-primary"
                    to={`/organization/${loaderData.organization.slug}/settings`}
                  >
                    {t("content.edit")}
                  </Link>
                </div>
              </div>
            ) : null}
            {typeof loaderData.organization.bio === "string" &&
            loaderData.organization.bio !== "" ? (
              <RichText
                html={loaderData.organization.bio}
                additionalClassNames="mb-6"
              />
            ) : null}
            {loaderData.organization.areas.length > 0 ? (
              <div className="flex mb-6 font-semibold flex-col @lg:mv-flex-row">
                <div className="@lg:mv-flex-label text-xs @lg:mv-text-sm leading-4 @lg:mv-leading-6 mb-2 @lg:mv-mb-0">
                  {t("content.activityAreas")}
                </div>
                <div className="@lg:mv-flex-auto">
                  {loaderData.organization.areas
                    .map((relation) => relation.area.name)
                    .join(" / ")}
                </div>
              </div>
            ) : null}
            {loaderData.organization.focuses.length > 0 ? (
              <div className="flex mb-6 font-semibold flex-col @lg:mv-flex-row">
                <div className="@lg:mv-flex-label text-xs @lg:mv-text-sm leading-4 @lg:mv-leading-6 mb-2 @lg:mv-mb-0">
                  {t("content.focuses")}
                </div>

                <div className="flex-auto">
                  {loaderData.organization.focuses
                    .map((relation) => relation.focus.title)
                    .join(" / ")}
                </div>
              </div>
            ) : null}
            {loaderData.organization.supportedBy.length > 0 ? (
              <div className="flex mb-6 font-semibold flex-col @lg:mv-flex-row">
                <div className="@lg:mv-flex-label text-xs @lg:mv-text-sm leading-4 @lg:mv-leading-6 mb-2 @lg:mv-mb-0">
                  {t("content.supportedBy")}
                </div>

                <div className="flex-auto">
                  {loaderData.organization.supportedBy.join(" / ")}
                </div>
              </div>
            ) : null}
            {loaderData.organization.memberOf.length > 0 ? (
              <>
                <h3 className="mb-6 mt-14 font-bold">
                  {t("content.networks")}
                </h3>
                <div className="flex flex-wrap -mx-3 items-stretch">
                  {loaderData.organization.memberOf.map((relation) => (
                    <OrganizationCard
                      id={`organization-${relation.network.slug}`}
                      key={`organization-${relation.network.slug}`}
                      link={`/organization/${relation.network.slug}`}
                      name={relation.network.name}
                      types={relation.network.types}
                      image={relation.network.logo}
                    />
                  ))}
                </div>
              </>
            ) : null}
            {loaderData.organization.networkMembers.length > 0 ? (
              <>
                <h3 className="mb-6 mt-14 font-bold">{t("content.members")}</h3>
                <div className="flex flex-wrap -mx-3 items-stretch">
                  {loaderData.organization.networkMembers.map((relation) => (
                    <OrganizationCard
                      id={`organization-${relation.networkMember.slug}`}
                      key={`organization-${relation.networkMember.slug}`}
                      link={`/organization/${relation.networkMember.slug}`}
                      name={relation.networkMember.name}
                      types={relation.networkMember.types}
                      image={relation.networkMember.logo}
                    />
                  ))}
                </div>
              </>
            ) : null}
            {loaderData.organization.teamMembers.length > 0 ? (
              <>
                <h3 id="team-members" className="mb-6 mt-14 font-bold">
                  {t("content.team")}
                </h3>
                <div className="flex flex-wrap -mx-3 @lg:mv-items-stretch">
                  {loaderData.organization.teamMembers.map((relation) => (
                    <ProfileCard
                      id={`profile-${relation.profile.username}`}
                      key={`profile-${relation.profile.username}`}
                      link={`/profile/${relation.profile.username}`}
                      name={getFullName(relation.profile)}
                      initials={getInitials(relation.profile)}
                      position={relation.profile.position}
                      avatar={relation.profile.avatar}
                    />
                  ))}
                </div>
              </>
            ) : null}
            {loaderData.organization.responsibleForProject.length > 0 ? (
              <>
                <div
                  id="projects"
                  className="flex flex-row flex-nowrap mb-6 mt-14 items-center"
                >
                  <div className="flex-auto pr-4">
                    <h3 className="mb-0 font-bold">{t("content.projects")}</h3>
                  </div>
                </div>

                <div className="flex flex-wrap -mx-3 items-stretch">
                  {loaderData.organization.responsibleForProject.map(
                    (relation) => (
                      // TODO: Project Card
                      <div
                        key={relation.project.slug}
                        data-testid="gridcell"
                        className="flex-100 px-3 mb-4"
                      >
                        <Link
                          to={`/project/${relation.project.slug}`}
                          className="flex flex-wrap content-start items-start p-4 rounded-2xl hover:bg-neutral-200 border border-neutral-500"
                        >
                          <div className="w-full flex items-center flex-row">
                            {relation.project.logo !== "" &&
                            relation.project.logo !== null ? (
                              <div className="h-16 w-16 flex items-center justify-center relative shrink-0 rounded-full overflow-hidden border">
                                <img
                                  className="max-w-full w-auto max-h-16 h-auto"
                                  src={relation.project.logo}
                                  alt={relation.project.name}
                                />
                              </div>
                            ) : (
                              <div className="h-16 w-16 bg-primary text-white text-3xl flex items-center justify-center rounded-full overflow-hidden shrink-0 border">
                                {getInitialsOfName(relation.project.name)}
                              </div>
                            )}
                            <div className="px-4 flex-auto">
                              <H3 like="h4" className="text-xl mb-1">
                                {relation.project.name}
                              </H3>
                              {relation.project.responsibleOrganizations
                                .length > 0 ? (
                                <p className="font-bold text-sm">
                                  {relation.project.responsibleOrganizations
                                    .map(
                                      (relation) => relation.organization.name
                                    )
                                    .join(" / ")}
                                </p>
                              ) : null}
                            </div>
                            {relation.project.awards.length > 0 ? (
                              <div className="@md:mv-pr-4 flex gap-4 -mt-4 flex-initial self-start">
                                {relation.project.awards.map((relation) => {
                                  const date = utcToZonedTime(
                                    relation.award.date,
                                    "Europe/Berlin"
                                  );
                                  return (
                                    <div
                                      key={`award-${relation.award.id}`}
                                      className="mv-awards-bg bg-[url('/images/award_bg.svg')] -mt-0.5 bg-cover bg-no-repeat bg-left-top drop-shadow-lg aspect-[11/17]"
                                    >
                                      <div className="flex flex-col items-center justify-center min-w-[57px] min-h-[88px] h-full pt-2">
                                        <div className="h-8 w-8 flex items-center justify-center relative shrink-0 rounded-full overflow-hidden border">
                                          {relation.award.logo !== "" ? (
                                            <img
                                              src={relation.award.logo}
                                              alt={relation.award.title}
                                            />
                                          ) : (
                                            getInitialsOfName(
                                              relation.award.title
                                            )
                                          )}
                                        </div>
                                        <div className="px-2 mb-4 pt-1">
                                          {relation.award.shortTitle ? (
                                            <H4
                                              like="h4"
                                              className="text-xxs mb-0 text-center text-neutral-600 font-bold leading-none"
                                            >
                                              {relation.award.shortTitle}
                                            </H4>
                                          ) : null}
                                          <p className="text-xxs text-center leading-none">
                                            {date.getFullYear()}
                                          </p>
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            ) : null}
                            <div className="hidden @md:mv-flex items-center flex-initial">
                              <button className="btn btn-primary">
                                {t("content.toProject")}
                              </button>
                            </div>
                          </div>
                        </Link>
                      </div>
                    )
                  )}
                </div>
              </>
            ) : null}
            {loaderData.futureEvents.responsibleForEvents.length > 0 ||
            loaderData.pastEvents.responsibleForEvents.length > 0 ? (
              <>
                <h3 id="organized-events" className="mt-14 mb-6 font-bold">
                  {t("content.organizedEvents")}
                </h3>
                {loaderData.futureEvents.responsibleForEvents.length > 0 ? (
                  <>
                    <h6 id="organized-future-events" className="mb-4 font-bold">
                      {t("content.futureEvents")}
                    </h6>
                    <div className="mb-6">
                      {loaderData.futureEvents.responsibleForEvents.map(
                        (relation) => {
                          const startTime = utcToZonedTime(
                            relation.event.startTime,
                            "Europe/Berlin"
                          );
                          const endTime = utcToZonedTime(
                            relation.event.endTime,
                            "Europe/Berlin"
                          );
                          return (
                            <div
                              key={`future-event-${relation.event.id}`}
                              className="rounded-lg bg-white shadow-xl border-t border-r border-neutral-300  mb-2 flex items-stretch overflow-hidden"
                            >
                              <Link
                                className="flex"
                                to={`/event/${relation.event.slug}`}
                              >
                                <div className="hidden @xl:mv-block w-36 shrink-0 aspect-[3/2]">
                                  <div className="w-36 h-full relative">
                                    <img
                                      src={
                                        relation.event.blurredBackground ||
                                        "/images/default-event-background-blurred.jpg"
                                      }
                                      alt={t("content.background")}
                                      className="w-full h-full object-cover"
                                    />
                                    <img
                                      src={
                                        relation.event.background ||
                                        "/images/default-event-background.jpg"
                                      }
                                      alt={relation.event.name}
                                      className={`w-full h-full object-cover absolute inset-0 ${
                                        isHydrated
                                          ? "opacity-100 transition-opacity duration-200 ease-in"
                                          : "opacity-0 invisible"
                                      }`}
                                    />
                                    <noscript>
                                      <img
                                        src={
                                          relation.event.background ||
                                          "/images/default-event-background.jpg"
                                        }
                                        alt={relation.event.name}
                                        className={`w-full h-full object-cover absolute inset-0`}
                                      />
                                    </noscript>
                                  </div>
                                </div>
                                <div className="px-4 py-4">
                                  <p className="text-xs mb-1">
                                    {/* TODO: Display icons (see figma) */}
                                    {relation.event.stage !== null
                                      ? relation.event.stage.title + " | "
                                      : ""}
                                    {getDuration(
                                      startTime,
                                      endTime,
                                      i18n.language
                                    )}
                                    {relation.event.participantLimit === null &&
                                      ` | ${t("content.unlimitedSeats")}`}
                                    {relation.event.participantLimit !== null &&
                                      relation.event.participantLimit -
                                        relation.event._count.participants >
                                        0 &&
                                      ` | ${
                                        relation.event.participantLimit -
                                        relation.event._count.participants
                                      } / ${
                                        relation.event.participantLimit
                                      } ${t("content.seatsFree")}`}

                                    {relation.event.participantLimit !== null &&
                                    relation.event.participantLimit -
                                      relation.event._count.participants <=
                                      0 ? (
                                      <>
                                        {" "}
                                        |{" "}
                                        <span>
                                          {relation.event._count.waitingList}{" "}
                                          {t("content.waitingList")}
                                        </span>
                                      </>
                                    ) : null}
                                  </p>
                                  <h4 className="font-bold text-base m-0 @lg:mv-line-clamp-1">
                                    {relation.event.name}
                                  </h4>
                                  {relation.event.subline !== null ? (
                                    <p className="hidden @lg:mv-block text-xs mt-1 @lg:mv-line-clamp-2">
                                      {relation.event.subline}
                                    </p>
                                  ) : (
                                    <p className="hidden @lg:mv-block text-xs mt-1 @lg:mv-line-clamp-2">
                                      {removeHtmlTags(
                                        relation.event.description ?? ""
                                      )}
                                    </p>
                                  )}
                                </div>
                              </Link>
                              {relation.event.canceled ? (
                                <div className="flex font-semibold items-center ml-auto border-r-8 border-salmon-500 pr-4 py-6 text-salmon-500">
                                  {t("content.cancelled")}
                                </div>
                              ) : null}
                              {relation.event.isParticipant &&
                              !relation.event.canceled ? (
                                <div className="flex font-semibold items-center ml-auto border-r-8 border-green-500 pr-4 py-6 text-green-600">
                                  <p>{t("content.registered")}</p>
                                </div>
                              ) : null}
                              {loaderData.mode !== "anon" &&
                              canUserParticipate(relation.event) ? (
                                <div className="flex items-center ml-auto pr-4 py-6">
                                  <AddParticipantButton
                                    action={`/event/${relation.event.slug}/settings/participants/add-participant`}
                                    profileId={loaderData.userId}
                                  />
                                </div>
                              ) : null}
                              {relation.event.isOnWaitingList &&
                              !relation.event.canceled ? (
                                <div className="flex font-semibold items-center ml-auto border-r-8 border-neutral-500 pr-4 py-6">
                                  <p>{t("content.waiting")}</p>
                                </div>
                              ) : null}
                              {loaderData.mode !== "anon" &&
                              canUserBeAddedToWaitingList(relation.event) ? (
                                <div className="flex items-center ml-auto pr-4 py-6">
                                  <AddToWaitingListButton
                                    action={`/event/${relation.event.slug}/settings/waiting-list/add-to-waiting-list`}
                                    profileId={loaderData.userId}
                                  />
                                </div>
                              ) : null}
                              {(!relation.event.isParticipant &&
                                !canUserParticipate(relation.event) &&
                                !relation.event.isOnWaitingList &&
                                !canUserBeAddedToWaitingList(relation.event) &&
                                !relation.event.canceled &&
                                loaderData.mode !== "anon") ||
                              (loaderData.mode === "anon" &&
                                !relation.event.canceled) ? (
                                <div className="flex items-center ml-auto pr-4 py-6">
                                  <Link
                                    to={`/event/${relation.event.slug}`}
                                    className="btn btn-primary"
                                  >
                                    {t("content.more")}
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
                {loaderData.pastEvents.responsibleForEvents.length > 0 ? (
                  <>
                    <h6 id="organized-past-events" className="mb-4 font-bold">
                      {t("content.pastEvents")}
                    </h6>
                    <div className="mb-16">
                      {loaderData.pastEvents.responsibleForEvents.map(
                        (relation) => {
                          const startTime = utcToZonedTime(
                            relation.event.startTime,
                            "Europe/Berlin"
                          );
                          const endTime = utcToZonedTime(
                            relation.event.endTime,
                            "Europe/Berlin"
                          );
                          return (
                            <div
                              key={`past-event-${relation.event.id}`}
                              className="rounded-lg bg-white shadow-xl border-t border-r border-neutral-300  mb-2 flex items-stretch overflow-hidden"
                            >
                              <Link
                                className="flex"
                                to={`/event/${relation.event.slug}`}
                              >
                                <div className="hidden @xl:mv-block w-36 shrink-0 aspect-[3/2]">
                                  <div className="w-36 h-full relative">
                                    <img
                                      src={
                                        relation.event.blurredBackground ||
                                        "/images/default-event-background-blurred.jpg"
                                      }
                                      alt={t("content.background")}
                                      className="w-full h-full object-cover"
                                    />
                                    <img
                                      src={
                                        relation.event.background ||
                                        "/images/default-event-background.jpg"
                                      }
                                      alt={relation.event.name}
                                      className={`w-full h-full object-cover absolute inset-0 ${
                                        isHydrated
                                          ? "opacity-100 transition-opacity duration-200 ease-in"
                                          : "opacity-0 invisible"
                                      }`}
                                    />
                                    <noscript>
                                      <img
                                        src={
                                          relation.event.background ||
                                          "/images/default-event-background.jpg"
                                        }
                                        alt={relation.event.name}
                                        className={`w-full h-full object-cover absolute inset-0`}
                                      />
                                    </noscript>
                                  </div>
                                </div>
                                <div className="px-4 py-4">
                                  <p className="text-xs mb-1">
                                    {/* TODO: Display icons (see figma) */}
                                    {relation.event.stage !== null
                                      ? relation.event.stage.title + " | "
                                      : ""}
                                    {getDuration(
                                      startTime,
                                      endTime,
                                      i18n.language
                                    )}
                                  </p>
                                  <h4 className="font-bold text-base m-0 @lg:mv-line-clamp-1">
                                    {relation.event.name}
                                  </h4>
                                  {relation.event.subline !== null ? (
                                    <p className="hidden @lg:mv-block text-xs mt-1 @lg:mv-line-clamp-1">
                                      {relation.event.subline}
                                    </p>
                                  ) : (
                                    <p className="hidden @lg:mv-block text-xs mt-1 @lg:mv-line-clamp-1">
                                      {removeHtmlTags(
                                        relation.event.description ?? ""
                                      )}
                                    </p>
                                  )}
                                </div>
                              </Link>
                              {relation.event.canceled ? (
                                <div className="flex font-semibold items-center ml-auto border-r-8 border-salmon-500 pr-4 py-6 text-salmon-500">
                                  {t("content.wasCancelled")}
                                </div>
                              ) : null}
                              {relation.event.isParticipant &&
                              !relation.event.canceled ? (
                                <div className="flex font-semibold items-center ml-auto border-r-8 border-green-500 pr-4 py-6 text-green-600">
                                  <p>{t("content.participated")}</p>
                                </div>
                              ) : null}

                              {(!relation.event.isParticipant &&
                                !canUserParticipate(relation.event) &&
                                !relation.event.isOnWaitingList &&
                                !canUserBeAddedToWaitingList(relation.event) &&
                                !relation.event.canceled) ||
                              (loaderData.mode === "anon" &&
                                !relation.event.canceled) ? (
                                <div className="flex items-center ml-auto pr-4 py-6">
                                  <Link
                                    to={`/event/${relation.event.slug}`}
                                    className="btn btn-primary"
                                  >
                                    {t("content.more")}
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
