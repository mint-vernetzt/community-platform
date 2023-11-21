import type { Organization } from "@prisma/client";
import type { LoaderArgs, MetaFunction } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";
import { utcToZonedTime } from "date-fns-tz";
import { GravityType } from "imgproxy/dist/types";
import rcSliderStyles from "rc-slider/assets/index.css";
import * as React from "react";
import reactCropStyles from "react-image-crop/dist/ReactCrop.css";
import { notFound, useHydrated } from "remix-utils";
import { createAuthClient, getSessionUser } from "~/auth.server";
import ExternalServiceIcon from "~/components/ExternalService/ExternalServiceIcon";
import { H3, H4 } from "~/components/Heading/Heading";
import ImageCropper from "~/components/ImageCropper/ImageCropper";
import Modal from "~/components/Modal/Modal";
import OrganizationCard from "~/components/OrganizationCard/OrganizationCard";
import ProfileCard from "~/components/ProfileCard/ProfileCard";
import { RichText } from "~/components/Richtext/RichText";
import type { ExternalService } from "~/components/types";
import { getImageURL } from "~/images.server";
import {
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
import {
  filterOrganizationByVisibility,
  filterProfileByVisibility,
  filterProjectByVisibility,
} from "~/public-fields-filtering.server";
import { AddParticipantButton } from "~/routes/event/$slug/settings/participants/add-participant";
import { AddToWaitingListButton } from "~/routes/event/$slug/settings/waiting-list/add-to-waiting-list";
import { getPublicURL } from "~/storage.server";
import {
  getOrganizationBySlug,
  prepareOrganizationEvents,
} from "./index.server";
import { deriveOrganizationMode } from "./utils.server";
import i18next from "~/i18next.server";
import { useTranslation } from "react-i18next";

export function links() {
  return [
    { rel: "stylesheet", href: rcSliderStyles },
    { rel: "stylesheet", href: reactCropStyles },
  ];
}

export const meta: MetaFunction = (args) => {
  return {
    title: `MINTvernetzt Community Plattform | ${args.data.organization.name}`,
  };
};

export const loader = async (args: LoaderArgs) => {
  const { request, params } = args;
  const response = new Response();

  const t = await i18next.getFixedT(request, ["routes/organization/index"]);
  const authClient = createAuthClient(request, response);
  const slug = getParamValueOrThrow(params, "slug");
  const sessionUser = await getSessionUser(authClient);
  const mode = await deriveOrganizationMode(sessionUser, slug);

  if (mode !== "anon" && sessionUser !== null) {
    const userProfile = await prismaClient.profile.findFirst({
      where: { id: sessionUser.id },
      select: { termsAccepted: true },
    });
    if (userProfile !== null && userProfile.termsAccepted === false) {
      return redirect(`/accept-terms?redirect_to=/organization/${slug}`, {
        headers: response.headers,
      });
    }
  }

  const organization = await getOrganizationBySlug(slug);
  if (organization === null) {
    throw notFound({ message: t("error.notFound") });
  }

  let enhancedOrganization = {
    ...organization,
  };

  // Filtering by visbility settings
  if (mode === "anon") {
    // Filter organization
    enhancedOrganization = await filterOrganizationByVisibility<
      typeof enhancedOrganization
    >(enhancedOrganization);
    // Filter networks where this organization is member of
    enhancedOrganization.memberOf = await Promise.all(
      enhancedOrganization.memberOf.map(async (relation) => {
        const filteredNetwork = await filterOrganizationByVisibility<
          typeof relation.network
        >(relation.network);
        return { ...relation, network: filteredNetwork };
      })
    );
    // Filter network members of this organization
    enhancedOrganization.networkMembers = await Promise.all(
      enhancedOrganization.networkMembers.map(async (relation) => {
        const filteredNetworkMember = await filterOrganizationByVisibility<
          typeof relation.networkMember
        >(relation.networkMember);
        return { ...relation, networkMember: filteredNetworkMember };
      })
    );
    // Filter team members
    enhancedOrganization.teamMembers = await Promise.all(
      enhancedOrganization.teamMembers.map(async (relation) => {
        const filteredProfile = await filterProfileByVisibility<
          typeof relation.profile
        >(relation.profile);
        return { ...relation, profile: filteredProfile };
      })
    );
    // Filter projects where this organization is responsible for
    enhancedOrganization.responsibleForProject = await Promise.all(
      enhancedOrganization.responsibleForProject.map(async (relation) => {
        const filteredProject = await filterProjectByVisibility<
          typeof relation.project
        >(relation.project);
        return { ...relation, project: filteredProject };
      })
    );
    // Filter responsible organizations of projects where this organization is responsible for
    enhancedOrganization.responsibleForProject = await Promise.all(
      enhancedOrganization.responsibleForProject.map(
        async (projectRelation) => {
          const responsibleOrganizations = await Promise.all(
            projectRelation.project.responsibleOrganizations.map(
              async (organizationRelation) => {
                const filteredOrganization =
                  await filterOrganizationByVisibility<
                    typeof organizationRelation.organization
                  >(organizationRelation.organization);
                return {
                  ...organizationRelation,
                  organization: filteredOrganization,
                };
              }
            )
          );
          return {
            ...projectRelation,
            project: { ...projectRelation.project, responsibleOrganizations },
          };
        }
      )
    );
  }

  // Get images from image proxy
  let images: {
    logo?: string;
    background?: string;
  } = {};
  if (enhancedOrganization.logo !== null) {
    const publicURL = getPublicURL(authClient, enhancedOrganization.logo);
    if (publicURL) {
      images.logo = getImageURL(publicURL, {
        resize: { type: "fit", width: 144, height: 144 },
      });
    }
  }
  if (enhancedOrganization.background !== null) {
    const publicURL = getPublicURL(authClient, enhancedOrganization.background);
    if (publicURL) {
      images.background = getImageURL(publicURL, {
        resize: { type: "fit", width: 1488, height: 480 },
      });
    }
  }

  enhancedOrganization.memberOf = enhancedOrganization.memberOf.map(
    (relation) => {
      let logo = relation.network.logo;
      if (logo !== null) {
        const publicURL = getPublicURL(authClient, logo);
        if (publicURL !== null) {
          logo = getImageURL(publicURL, {
            resize: { type: "fit", width: 64, height: 64 },
          });
        }
      }
      return { ...relation, network: { ...relation.network, logo } };
    }
  );

  enhancedOrganization.networkMembers = enhancedOrganization.networkMembers.map(
    (relation) => {
      let logo = relation.networkMember.logo;
      if (logo !== null) {
        const publicURL = getPublicURL(authClient, logo);
        if (publicURL !== null) {
          logo = getImageURL(publicURL, {
            resize: { type: "fit", width: 64, height: 64 },
          });
        }
      }
      return {
        ...relation,
        networkMember: { ...relation.networkMember, logo },
      };
    }
  );

  enhancedOrganization.teamMembers = enhancedOrganization.teamMembers.map(
    (relation) => {
      let avatar = relation.profile.avatar;
      if (avatar !== null) {
        const publicURL = getPublicURL(authClient, avatar);
        if (publicURL !== null) {
          avatar = getImageURL(publicURL, {
            resize: { type: "fill", width: 64, height: 64 },
            gravity: GravityType.center,
          });
        }
      }
      return { ...relation, profile: { ...relation.profile, avatar } };
    }
  );

  enhancedOrganization.responsibleForProject =
    enhancedOrganization.responsibleForProject.map((projectRelation) => {
      let projectLogo = projectRelation.project.logo;
      if (projectLogo !== null) {
        const publicURL = getPublicURL(authClient, projectLogo);
        if (publicURL !== null) {
          projectLogo = getImageURL(publicURL, {
            resize: { type: "fit", width: 64, height: 64 },
            gravity: GravityType.center,
          });
        }
      }
      const awards = projectRelation.project.awards.map((awardRelation) => {
        let awardLogo = awardRelation.award.logo;
        if (awardLogo !== null) {
          const publicURL = getPublicURL(authClient, awardLogo);
          if (publicURL !== null) {
            awardLogo = getImageURL(publicURL, {
              resize: { type: "fit", width: 64, height: 64 },
              gravity: GravityType.center,
            });
          }
        }
        return {
          ...awardRelation,
          award: { ...awardRelation.award, logo: awardLogo },
        };
      });
      return {
        ...projectRelation,
        project: { ...projectRelation.project, awards, logo: projectLogo },
      };
    });

  // Get events, filter them by visibility settings and add participation status of session user
  const inFuture = true;
  const organizationFutureEvents = await prepareOrganizationEvents(
    authClient,
    slug,
    sessionUser,
    inFuture
  );
  const organizationPastEvents = await prepareOrganizationEvents(
    authClient,
    slug,
    sessionUser,
    !inFuture
  );

  return json(
    {
      organization: enhancedOrganization,
      images,
      futureEvents: organizationFutureEvents,
      pastEvents: organizationPastEvents,
      userId: sessionUser?.id,
      mode,
    },
    { headers: response.headers }
  );
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
  const { t } = useTranslation(["routes/organization/index"]);

  const logo = loaderData.images.logo;
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

  const background = loaderData.images.background;
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
      <section className="hidden md:block container mt-8 md:mt-10 lg:mt-20">
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
              <label
                htmlFor="modal-background-upload"
                className="btn btn-primary modal-button"
              >
                {t("image.background.change")}
              </label>

              <Modal id="modal-background-upload">
                <ImageCropper
                  headline={t("image.background.headline")}
                  subject="organization"
                  id="modal-background-upload"
                  uploadKey="background"
                  image={background}
                  aspect={31 / 10}
                  minCropWidth={620}
                  minCropHeight={62}
                  maxTargetWidth={1488}
                  maxTargetHeight={480}
                  slug={loaderData.organization.slug}
                  redirect={uploadRedirect}
                >
                  <Background />
                </ImageCropper>
              </Modal>
            </div>
          ) : null}
        </div>
      </section>
      <div className="container relative pb-44">
        <div className="flex flex-col lg:flex-row -mx-4">
          <div className="flex-gridcol lg:w-5/12 px-4 pt-10 lg:pt-0">
            <div className="sticky top-4">
              <div className="px-4 py-8 lg:p-8 pb-15 md:pb-5 rounded-3xl border border-neutral-400 bg-neutral-200 shadow-lg relative lg:ml-14 lg:-mt-44 ">
                <div className="flex items-center flex-col">
                  <Avatar />
                  {loaderData.mode === "admin" ? (
                    <>
                      <label
                        htmlFor="modal-avatar"
                        className="flex content-center items-center nowrap py-2 cursor-pointer text-primary"
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
                      </label>
                      <Modal id="modal-avatar">
                        <ImageCropper
                          id="modal-avatar"
                          subject="organization"
                          slug={loaderData.organization.slug}
                          uploadKey="logo"
                          headline={t("image.logo.headline")}
                          image={logo}
                          aspect={1 / 1}
                          minCropWidth={100}
                          minCropHeight={100}
                          maxTargetHeight={1488}
                          maxTargetWidth={1488}
                          redirect={uploadRedirect}
                          circularCrop={true}
                        >
                          <Avatar />
                        </ImageCropper>
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
                <div className="py-8 px-4 pb-15 md:pb-5 relative lg:ml-14">
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

          <div className="flex-gridcol lg:w-7/12 px-4 pt-10 lg:pt-20">
            {loaderData.mode === "admin" ? (
              <div className="flex flex-col-reverse lg:flex-row flex-nowrap">
                <div className="flex-auto pr-4 mb-6">
                  <h1 className="mb-0">{loaderData.organization.name}</h1>
                </div>
                <div className="flex-initial lg:pl-4 pt-3 mb-6">
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
              <div className="flex mb-6 font-semibold flex-col lg:flex-row">
                <div className="lg:flex-label text-xs lg:text-sm leading-4 lg:leading-6 mb-2 lg:mb-0">
                  {t("content.activityAreas")}
                </div>
                <div className="lg:flex-auto">
                  {loaderData.organization.areas
                    .map((relation) => relation.area.name)
                    .join(" / ")}
                </div>
              </div>
            ) : null}
            {loaderData.organization.focuses.length > 0 ? (
              <div className="flex mb-6 font-semibold flex-col lg:flex-row">
                <div className="lg:flex-label text-xs lg:text-sm leading-4 lg:leading-6 mb-2 lg:mb-0">
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
              <div className="flex mb-6 font-semibold flex-col lg:flex-row">
                <div className="lg:flex-label text-xs lg:text-sm leading-4 lg:leading-6 mb-2 lg:mb-0">
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
                <div className="flex flex-wrap -mx-3 lg:items-stretch">
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
                              <div className="md:pr-4 flex gap-4 -mt-4 flex-initial self-start">
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
                            <div className="hidden md:flex items-center flex-initial">
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
                  Organisierte Veranstaltungen
                </h3>
                {loaderData.futureEvents.responsibleForEvents.length > 0 ? (
                  <>
                    <h6 id="organized-future-events" className="mb-4 font-bold">
                      Anstehende Veranstaltungen
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
                                <div className="hidden xl:block w-36 shrink-0 aspect-[3/2]">
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
                                    {getDuration(startTime, endTime)}
                                    {relation.event.participantLimit === null
                                      ? t("content.unlimitedPlaces")
                                      : ` | ${
                                          relation.event.participantLimit -
                                          relation.event._count.participants
                                        } / ${
                                          relation.event.participantLimit
                                        } Plätzen frei`}
                                    {relation.event.participantLimit !== null &&
                                    relation.event._count.participants >=
                                      relation.event.participantLimit ? (
                                      <>
                                        {" "}
                                        |{" "}
                                        <span>
                                          {relation.event._count.waitingList}{" "}
                                          {t("content.waitingList")}
                                        </span>
                                      </>
                                    ) : (
                                      ""
                                    )}
                                  </p>
                                  <h4 className="font-bold text-base m-0 lg:line-clamp-1">
                                    {relation.event.name}
                                  </h4>
                                  {relation.event.subline !== null ? (
                                    <p className="hidden lg:block text-xs mt-1 lg:line-clamp-2">
                                      {relation.event.subline}
                                    </p>
                                  ) : (
                                    <p className="hidden lg:block text-xs mt-1 lg:line-clamp-2">
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
                                <div className="hidden xl:block w-36 shrink-0 aspect-[3/2]">
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
                                    {getDuration(startTime, endTime)}
                                  </p>
                                  <h4 className="font-bold text-base m-0 lg:line-clamp-1">
                                    {relation.event.name}
                                  </h4>
                                  {relation.event.subline !== null ? (
                                    <p className="hidden lg:block text-xs mt-1 lg:line-clamp-1">
                                      {relation.event.subline}
                                    </p>
                                  ) : (
                                    <p className="hidden lg:block text-xs mt-1 lg:line-clamp-1">
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
