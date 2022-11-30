import { GravityType } from "imgproxy/dist/types";
import rcSliderStyles from "rc-slider/assets/index.css";
import * as React from "react";
import reactCropStyles from "react-image-crop/dist/ReactCrop.css";
import { Link, LoaderFunction, useLoaderData } from "remix";
import { badRequest, notFound } from "remix-utils";
import { getUser } from "~/auth.server";
import ExternalServiceIcon from "~/components/ExternalService/ExternalServiceIcon";
import { H3, H4 } from "~/components/Heading/Heading";
import ImageCropper from "~/components/ImageCropper/ImageCropper";
import Modal from "~/components/Modal/Modal";
import OrganizationCard from "~/components/OrganizationCard/OrganizationCard";
import ProfileCard from "~/components/ProfileCard/ProfileCard";
import { ExternalService } from "~/components/types";
import { getImageURL } from "~/images.server";
import {
  canUserBeAddedToWaitingList,
  canUserParticipate,
} from "~/lib/event/utils";
import { getFullName } from "~/lib/profile/getFullName";
import { getInitials } from "~/lib/profile/getInitials";
import { getInitialsOfName } from "~/lib/string/getInitialsOfName";
import { nl2br } from "~/lib/string/nl2br";
import { getDuration } from "~/lib/utils/time";
import {
  getOrganizationBySlug,
  OrganizationWithRelations,
  prepareOrganizationEvents,
} from "~/organization.server";
import { AddParticipantButton } from "~/routes/event/$slug/settings/participants/add-participant";
import { AddToWaitingListButton } from "~/routes/event/$slug/settings/participants/add-to-waiting-list";
import { getPublicURL } from "~/storage.server";
import { deriveMode, Mode } from "./utils.server";

export function links() {
  return [
    { rel: "stylesheet", href: rcSliderStyles },
    { rel: "stylesheet", href: reactCropStyles },
  ];
}

type LoaderData = {
  organization: Partial<
    NonNullable<Awaited<ReturnType<typeof getOrganizationBySlug>>>
  >;
  userIsPrivileged: boolean;
  images: {
    logo?: string;
    background?: string;
  };
  futureEvents: Awaited<ReturnType<typeof prepareOrganizationEvents>>;
  pastEvents: Awaited<ReturnType<typeof prepareOrganizationEvents>>;
  userId?: string;
  userEmail?: string;
  mode: Mode;
};

export const loader: LoaderFunction = async (args) => {
  const { request, params } = args;
  const { slug } = params;
  if (slug === undefined || slug === "") {
    throw badRequest({ message: "organization slug must be provided" });
  }
  const sessionUser = await getUser(request);

  const unfilteredOrganization = await getOrganizationBySlug(slug);
  if (unfilteredOrganization === null) {
    throw notFound({ message: "Not found" });
  }

  let organization: Partial<
    NonNullable<Awaited<ReturnType<typeof getOrganizationBySlug>>>
  > = {};
  let userIsPrivileged;

  let images: {
    logo?: string;
    background?: string;
  } = {};
  if (unfilteredOrganization.logo) {
    const publicURL = getPublicURL(unfilteredOrganization.logo);
    if (publicURL) {
      images.logo = getImageURL(publicURL, {
        resize: { type: "fit", width: 144, height: 144 },
      });
    }
  }
  if (unfilteredOrganization.background) {
    const publicURL = getPublicURL(unfilteredOrganization.background);
    if (publicURL) {
      images.background = getImageURL(publicURL, {
        resize: { type: "fit", width: 1488, height: 480 },
      });
    }
  }
  unfilteredOrganization.memberOf = unfilteredOrganization.memberOf.map(
    (member) => {
      if (member.network.logo !== null) {
        const publicURL = getPublicURL(member.network.logo);

        if (publicURL !== null) {
          const logo = getImageURL(publicURL, {
            resize: { type: "fit", width: 64, height: 64 },
          });
          member.network.logo = logo;
        }
      }
      return member;
    }
  );

  unfilteredOrganization.networkMembers =
    unfilteredOrganization.networkMembers.map((member) => {
      if (member.networkMember.logo !== null) {
        const publicURL = getPublicURL(member.networkMember.logo);

        if (publicURL !== null) {
          const logo = getImageURL(publicURL, {
            resize: { type: "fit", width: 64, height: 64 },
          });
          member.networkMember.logo = logo;
        }
      }
      return member;
    });

  unfilteredOrganization.teamMembers = unfilteredOrganization.teamMembers.map(
    (teamMember) => {
      if (teamMember.profile.avatar !== null) {
        const publicURL = getPublicURL(teamMember.profile.avatar);
        if (publicURL !== null) {
          const avatar = getImageURL(publicURL, {
            resize: { type: "fill", width: 64, height: 64 },
            gravity: GravityType.center,
          });
          teamMember.profile.avatar = avatar;
        }
      }
      return teamMember;
    }
  );

  unfilteredOrganization.responsibleForProject =
    unfilteredOrganization.responsibleForProject.map((relation) => {
      if (relation.project.logo !== null) {
        const publicURL = getPublicURL(relation.project.logo);
        if (publicURL !== null) {
          relation.project.logo = getImageURL(publicURL, {
            resize: { type: "fit", width: 64, height: 64 },
            gravity: GravityType.center,
          });
        }
      }
      relation.project.awards = relation.project.awards.map((relation) => {
        if (relation.award.logo !== null) {
          const publicURL = getPublicURL(relation.award.logo);
          if (publicURL !== null) {
            relation.award.logo = getImageURL(publicURL, {
              resize: { type: "fit", width: 64, height: 64 },
              gravity: GravityType.center,
            });
          }
        }
        return relation;
      });

      return relation;
    });

  if (sessionUser === null) {
    let key: keyof Partial<
      NonNullable<Awaited<ReturnType<typeof getOrganizationBySlug>>>
    >;
    const publicFields = [
      "name",
      "slug",
      "street",
      "streetNumber",
      "zipCode",
      "city",
      "logo",
      "background",
      "types",
      "supportedBy",
      "publicFields",
      "teamMembers",
      "memberOf",
      "networkMembers",
      "createdAt",
      "areas",
      "responsibleForEvents",
      "responsibleForProject",
      ...unfilteredOrganization.publicFields,
    ];
    for (key in unfilteredOrganization) {
      if (publicFields.includes(key)) {
        // @ts-ignore
        organization[key] = unfilteredOrganization[key];
      }
    }
    userIsPrivileged = false;
  } else {
    organization = unfilteredOrganization;
    userIsPrivileged = unfilteredOrganization.teamMembers.some(
      (member) => member.profileId === sessionUser.id && member.isPrivileged
    );
  }

  const mode: Mode = deriveMode(sessionUser, userIsPrivileged);

  const inFuture = true;
  const organizationFutureEvents = await prepareOrganizationEvents(
    slug,
    sessionUser,
    inFuture
  );
  const organizationPastEvents = await prepareOrganizationEvents(
    slug,
    sessionUser,
    !inFuture
  );

  return {
    organization,
    userIsPrivileged,
    images,
    futureEvents: organizationFutureEvents,
    pastEvents: organizationPastEvents,
    userId: sessionUser?.id,
    userEmail: sessionUser?.email,
    mode,
  };
};

function hasContactInformations(
  organization: Partial<OrganizationWithRelations>
) {
  const hasEmail =
    typeof organization.email === "string" && organization.email !== "";
  const hasPhone =
    typeof organization.phone === "string" && organization.phone !== "";
  return hasEmail || hasPhone;
}

function notEmptyData(
  key: keyof OrganizationWithRelations,
  organization: Partial<OrganizationWithRelations>
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
  organization: Partial<OrganizationWithRelations>,
  externalServices: ExternalService[]
) {
  return externalServices.some((item) => notEmptyData(item, organization));
}

export default function Index() {
  const loaderData = useLoaderData<LoaderData>();
  const initialsOfOrganization = loaderData.organization.name
    ? getInitialsOfName(loaderData.organization.name)
    : "";
  const organisationName = loaderData.organization.name ?? "";

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
              alt={organisationName}
              className="max-w-full w-auto max-h-36 h-auto"
            />
          ) : (
            initialsOfOrganization
          )}
        </div>
      </>
    ),
    [logo, organisationName, initialsOfOrganization]
  );

  const background = loaderData.images.background;
  const Background = React.useCallback(
    () => (
      <div className="w-full bg-yellow-500 rounded-md overflow-hidden">
        {background ? (
          <img src={background} alt={`Aktuelles Hintergrundbild`} />
        ) : (
          <div className="w-[336px] min-h-[108px]" />
        )}
      </div>
    ),
    [background]
  );

  const uploadRedirect = `/organization/${loaderData.organization.slug}`;

  return (
    <>
      <section className="hidden md:block container mt-8 md:mt-10 lg:mt-20">
        <div className="rounded-3xl relative overflow-hidden bg-yellow-500 w-full aspect-[31/10]">
          <div className="w-full h-full">
            {background && (
              <img
                src={background}
                alt=""
                className="object-cover w-full h-full"
              />
            )}
          </div>
          {loaderData.userIsPrivileged && (
            <div className="absolute bottom-6 right-6">
              <label
                htmlFor="modal-background-upload"
                className="btn btn-primary modal-button"
              >
                Bild ändern
              </label>

              <Modal id="modal-background-upload">
                <ImageCropper
                  headline="Hintergrundbild"
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
          )}
        </div>
      </section>
      <div className="container relative pb-44">
        <div className="flex flex-col lg:flex-row -mx-4">
          <div className="flex-gridcol lg:w-5/12 px-4 pt-10 lg:pt-0">
            <div className="sticky top-4">
              <div className="px-4 py-8 lg:p-8 pb-15 md:pb-5 rounded-3xl border border-neutral-400 bg-neutral-200 shadow-lg relative lg:ml-14 lg:-mt-44 ">
                <div className="flex items-center flex-col">
                  <Avatar />
                  {loaderData.userIsPrivileged && (
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
                        <span className="ml-2 mr-4">Logo ändern</span>
                      </label>
                      <Modal id="modal-avatar">
                        <ImageCropper
                          id="modal-avatar"
                          subject="organization"
                          slug={loaderData.organization.slug}
                          uploadKey="logo"
                          headline="Logo"
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
                  )}

                  <h3 className="mt-6 text-5xl mb-1">
                    {loaderData.organization.name || ""}
                  </h3>
                  {loaderData.organization.types &&
                    loaderData.organization.types.length > 0 && (
                      <p className="font-bold text-sm mb-4">
                        {loaderData.organization.types
                          .map(({ organizationType }) => organizationType.title)
                          .join(", ")}
                      </p>
                    )}
                </div>
                {hasContactInformations(loaderData.organization) ||
                  (hasWebsiteOrSocialService(
                    loaderData.organization,
                    ExternalServices
                  ) && <h5 className="font-semibold mb-6 mt-8">Kontakt</h5>)}
                {hasContactInformations(loaderData.organization) && (
                  <>
                    {typeof loaderData.organization.email === "string" &&
                      loaderData.organization.email !== "" && (
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
                      )}
                    {typeof loaderData.organization.phone === "string" &&
                      loaderData.organization.phone !== "" && (
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
                      )}
                  </>
                )}

                {/* --- WEBSITE & SOCIAL --- */}
                {hasWebsiteOrSocialService(
                  loaderData.organization,
                  ExternalServices
                ) && (
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
                              url={loaderData.organization[service] as string}
                            />
                          </li>
                        );
                      }

                      return false;
                    })}
                  </ul>
                )}

                {typeof loaderData.organization.street === "string" &&
                  loaderData.organization.street !== "" && (
                    <>
                      <h5 className="font-semibold mb-6 mt-8">Anschrift</h5>
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
                          {loaderData.organization.street}{" "}
                          {loaderData.organization.streetNumber}
                          <br />
                          {loaderData.organization.zipCode}{" "}
                          {loaderData.organization.city}
                        </span>
                      </p>
                    </>
                  )}
                <hr className="divide-y divide-neutral-400 mt-8 mb-6" />

                {loaderData.organization.createdAt && (
                  <p className="text-xs mb-4 text-center">
                    Profil besteht seit dem{" "}
                    {new Date(
                      loaderData.organization.createdAt
                    ).toLocaleDateString("de-De", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                )}
              </div>
              {/** TODO: Styling of quote section */}
              {typeof loaderData.organization.quote === "string" &&
                loaderData.organization.quote !== "" && (
                  <div className="py-8 px-4 pb-15 md:pb-5 relative lg:ml-14">
                    <div className="mb-0 text-[72px] leading-none">“</div>
                    <div className="mb-4">
                      "{loaderData.organization.quote}"
                    </div>
                    <div className="text-primary font-bold">
                      {loaderData.organization.quoteAuthor || ""}
                    </div>
                    <div>
                      {loaderData.organization.quoteAuthorInformation || ""}
                    </div>
                  </div>
                )}
            </div>
          </div>

          <div className="flex-gridcol lg:w-7/12 px-4 pt-10 lg:pt-20">
            <div className="flex flex-col-reverse lg:flex-row flex-nowrap">
              <div className="flex-auto pr-4 mb-6">
                <h1 className="mb-0">{loaderData.organization.name || ""}</h1>
              </div>
              {loaderData.userIsPrivileged && loaderData.organization.slug && (
                <div className="flex-initial lg:pl-4 pt-3 mb-6">
                  <Link
                    className="btn btn-outline btn-primary"
                    to={`/organization/${loaderData.organization.slug}/settings`}
                  >
                    Organisation bearbeiten
                  </Link>
                </div>
              )}
            </div>
            {typeof loaderData.organization.bio === "string" &&
              loaderData.organization.bio !== "" && (
                <p
                  className="mb-6"
                  dangerouslySetInnerHTML={{
                    __html: nl2br(loaderData.organization.bio, true),
                  }}
                />
              )}
            {loaderData.organization.areas &&
              loaderData.organization.areas.length > 0 && (
                <div className="flex mb-6 font-semibold flex-col lg:flex-row">
                  <div className="lg:flex-label text-xs lg:text-sm leading-4 lg:leading-6 mb-2 lg:mb-0">
                    Aktivitätsgebiete
                  </div>
                  <div className="lg:flex-auto">
                    {loaderData.organization.areas
                      .map(({ area }) => area.name)
                      .join(" / ")}
                  </div>
                </div>
              )}
            {loaderData.organization.focuses &&
              loaderData.organization.focuses.length > 0 && (
                <div className="flex mb-6 font-semibold flex-col lg:flex-row">
                  <div className="lg:flex-label text-xs lg:text-sm leading-4 lg:leading-6 mb-2 lg:mb-0">
                    MINT-Schwerpunkte
                  </div>

                  <div className="flex-auto">
                    {loaderData.organization.focuses
                      .map(({ focus }) => focus.title)
                      .join(" / ")}
                  </div>
                </div>
              )}
            {loaderData.organization.supportedBy &&
              loaderData.organization.supportedBy.length > 0 && (
                <div className="flex mb-6 font-semibold flex-col lg:flex-row">
                  <div className="lg:flex-label text-xs lg:text-sm leading-4 lg:leading-6 mb-2 lg:mb-0">
                    Unterstützt und gefördert von
                  </div>

                  <div className="flex-auto">
                    {loaderData.organization.supportedBy.join(" / ")}
                  </div>
                </div>
              )}
            {loaderData.organization.memberOf &&
              loaderData.organization.memberOf.length > 0 && (
                <>
                  <h3 className="mb-6 mt-14 font-bold">Teil des Netzwerks</h3>
                  <div className="flex flex-wrap -mx-3 items-stretch">
                    {loaderData.organization.memberOf &&
                      loaderData.organization.memberOf.length > 0 &&
                      loaderData.organization.memberOf.map(({ network }) => (
                        <OrganizationCard
                          id={`organization-${network.slug}`}
                          key={`organization-${network.slug}`}
                          link={`/organization/${network.slug}`}
                          name={network.name}
                          types={network.types}
                          image={network.logo}
                        />
                      ))}
                  </div>
                </>
              )}
            {loaderData.organization.networkMembers &&
              loaderData.organization.networkMembers.length > 0 && (
                <>
                  <h3 className="mb-6 mt-14 font-bold">
                    Mitgliedsorganisationen
                  </h3>
                  <div className="flex flex-wrap -mx-3 items-stretch">
                    {loaderData.organization.networkMembers &&
                      loaderData.organization.networkMembers.length > 0 &&
                      loaderData.organization.networkMembers.map(
                        ({ networkMember }) => (
                          <OrganizationCard
                            id={`organization-${networkMember.slug}`}
                            key={`organization-${networkMember.slug}`}
                            link={`/organization/${networkMember.slug}`}
                            name={networkMember.name}
                            types={networkMember.types}
                            image={networkMember.logo}
                          />
                        )
                      )}
                  </div>
                </>
              )}
            {loaderData.organization.teamMembers &&
              loaderData.organization.teamMembers.length > 0 && (
                <>
                  <h3 className="mb-6 mt-14 font-bold">Das Team</h3>
                  <div className="flex flex-wrap -mx-3 lg:items-stretch">
                    {loaderData.organization.teamMembers.map(({ profile }) => (
                      <ProfileCard
                        id={`profile-${profile.username}`}
                        key={`profile-${profile.username}`}
                        link={`/profile/${profile.username}`}
                        name={getFullName(profile)}
                        initials={getInitials(profile)}
                        position={profile.position}
                        avatar={profile.avatar}
                      />
                    ))}
                  </div>
                </>
              )}
            {loaderData.organization.responsibleForProject &&
              loaderData.organization.responsibleForProject.length > 0 && (
                <>
                  <div
                    id="projects"
                    className="flex flex-row flex-nowrap mb-6 mt-14 items-center"
                  >
                    <div className="flex-auto pr-4">
                      <h3 className="mb-0 font-bold">Projekte</h3>
                    </div>
                  </div>
                  {loaderData.organization.responsibleForProject &&
                    loaderData.organization.responsibleForProject.length >
                      0 && (
                      <div className="flex flex-wrap -mx-3 items-stretch">
                        {loaderData.organization.responsibleForProject.map(
                          ({ project }) => (
                            // TODO: Project Card
                            <div
                              key={project.slug}
                              data-testid="gridcell"
                              className="flex-100 px-3 mb-4"
                            >
                              <Link
                                to={`/project/${project.slug}`}
                                className="flex flex-wrap content-start items-start p-4 rounded-2xl hover:bg-neutral-200 border border-neutral-500"
                              >
                                <div className="w-full flex items-center flex-row">
                                  {project.logo !== "" &&
                                  project.logo !== null ? (
                                    <div className="h-16 w-16 flex items-center justify-center relative shrink-0 rounded-full overflow-hidden border">
                                      <img
                                        className="max-w-full w-auto max-h-16 h-auto"
                                        src={project.logo}
                                        alt={project.name}
                                      />
                                    </div>
                                  ) : (
                                    <div className="h-16 w-16 bg-primary text-white text-3xl flex items-center justify-center rounded-full overflow-hidden shrink-0 border">
                                      {getInitialsOfName(project.name)}
                                    </div>
                                  )}
                                  <div className="px-4 flex-auto">
                                    <H3 like="h4" className="text-xl mb-1">
                                      {project.name}
                                    </H3>
                                    {project.responsibleOrganizations &&
                                      project.responsibleOrganizations.length >
                                        0 && (
                                        <p className="font-bold text-sm">
                                          {project.responsibleOrganizations
                                            .map(
                                              ({ organization }) =>
                                                organization.name
                                            )
                                            .join(" / ")}
                                        </p>
                                      )}
                                  </div>
                                  {project.awards && project.awards.length > 0 && (
                                    <div className="md:pr-4 flex gap-4 -mt-4 flex-initial self-start">
                                      {project.awards.map(({ award }) => {
                                        award.date = new Date(award.date);
                                        return (
                                          <div
                                            key={`award-${award.id}`}
                                            className="mv-awards-bg bg-[url('/images/award_bg.svg')] -mt-0.5 bg-cover bg-no-repeat bg-left-top drop-shadow-lg aspect-[11/17]"
                                          >
                                            <div className="flex flex-col items-center justify-center min-w-[57px] min-h-[88px] h-full pt-2">
                                              <div className="h-8 w-8 flex items-center justify-center relative shrink-0 rounded-full overflow-hidden border">
                                                {award.logo !== null &&
                                                award.logo !== "" ? (
                                                  <img
                                                    src={award.logo}
                                                    alt={award.title}
                                                  />
                                                ) : (
                                                  getInitialsOfName(award.title)
                                                )}
                                              </div>
                                              <div className="px-2 mb-4 pt-1">
                                                <H4
                                                  like="h4"
                                                  className="text-xxs mb-0 text-center text-neutral-600 font-bold leading-none"
                                                >
                                                  {award.shortTitle}
                                                </H4>
                                                <p className="text-xxs text-center leading-none">
                                                  {award.date.getFullYear()}
                                                </p>
                                              </div>
                                            </div>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  )}
                                  <div className="hidden md:flex items-center flex-initial">
                                    <Link
                                      to={`/project/${project.slug}`}
                                      className="btn btn-primary"
                                    >
                                      Zum Projekt
                                    </Link>
                                  </div>
                                </div>
                              </Link>
                            </div>
                          )
                        )}
                      </div>
                    )}
                </>
              )}
            {(loaderData.futureEvents.responsibleForEvents.length > 0 ||
              loaderData.pastEvents.responsibleForEvents.length > 0) && (
              <>
                <h3 id="organized-events" className="mt-14 mb-6 font-bold">
                  Organisierte Veranstaltungen
                </h3>
                {loaderData.futureEvents.responsibleForEvents.length > 0 && (
                  <>
                    <h6 id="organized-future-events" className="mb-4 font-bold">
                      Anstehende Veranstaltungen
                    </h6>
                    <div className="mb-6">
                      {loaderData.futureEvents.responsibleForEvents.map(
                        ({ event }) => {
                          const startTime = new Date(event.startTime);
                          const endTime = new Date(event.endTime);
                          return (
                            <div
                              key={`future-event-${event.id}`}
                              className="rounded-lg bg-white shadow-xl border-t border-r border-neutral-300  mb-2 flex items-stretch overflow-hidden"
                            >
                              <Link
                                className="flex"
                                to={`/event/${event.slug}`}
                              >
                                <div className="hidden xl:block w-40 shrink-0">
                                  {event.background !== undefined && (
                                    <img
                                      src={
                                        event.background ||
                                        "/images/default-event-background.jpg"
                                      }
                                      alt={event.name}
                                      className="object-cover w-full h-full"
                                    />
                                  )}
                                </div>
                                <div className="px-4 py-6">
                                  <p className="text-xs mb-1">
                                    {/* TODO: Display icons (see figma) */}
                                    {event.stage !== null &&
                                      event.stage.title + " | "}
                                    {getDuration(startTime, endTime)}
                                    {event._count.childEvents === 0 && (
                                      <>
                                        {event.participantLimit === null
                                          ? " | Unbegrenzte Plätze"
                                          : ` | ${
                                              event.participantLimit -
                                              event._count.participants
                                            } / ${
                                              event.participantLimit
                                            } Plätzen frei`}
                                      </>
                                    )}
                                    {event.participantLimit !== null &&
                                      event._count.participants >=
                                        event.participantLimit && (
                                        <>
                                          {" "}
                                          |{" "}
                                          <span>
                                            {event._count.waitingList} auf der
                                            Warteliste
                                          </span>
                                        </>
                                      )}
                                  </p>
                                  <h4 className="font-bold text-base m-0 lg:line-clamp-1">
                                    {event.name}
                                  </h4>
                                  {event.subline !== null ? (
                                    <p className="hidden lg:block text-xs mt-1 lg:line-clamp-2">
                                      {event.subline}
                                    </p>
                                  ) : (
                                    <p className="hidden lg:block text-xs mt-1 lg:line-clamp-2">
                                      {event.description}
                                    </p>
                                  )}
                                </div>
                              </Link>
                              {event.canceled && (
                                <div className="flex font-semibold items-center ml-auto border-r-8 border-salmon-500 pr-4 py-6 text-salmon-500">
                                  Abgesagt
                                </div>
                              )}
                              {event.isParticipant && !event.canceled && (
                                <div className="flex font-semibold items-center ml-auto border-r-8 border-green-500 pr-4 py-6 text-green-600">
                                  <p>Angemeldet</p>
                                </div>
                              )}
                              {loaderData.mode !== "anon" &&
                                canUserParticipate(event) && (
                                  <div className="flex items-center ml-auto pr-4 py-6">
                                    <AddParticipantButton
                                      action={`/event/${event.slug}/settings/participants/add-participant`}
                                      userId={loaderData.userId}
                                      eventId={event.id}
                                      email={loaderData.userEmail}
                                    />
                                  </div>
                                )}
                              {event.isOnWaitingList && !event.canceled && (
                                <div className="flex font-semibold items-center ml-auto border-r-8 border-neutral-500 pr-4 py-6">
                                  <p>Wartend</p>
                                </div>
                              )}
                              {loaderData.mode !== "anon" &&
                                canUserBeAddedToWaitingList(event) && (
                                  <div className="flex items-center ml-auto pr-4 py-6">
                                    <AddToWaitingListButton
                                      action={`/event/${event.slug}/settings/participants/add-to-waiting-list`}
                                      userId={loaderData.userId}
                                      eventId={event.id}
                                      email={loaderData.userEmail}
                                    />
                                  </div>
                                )}
                              {!event.isParticipant &&
                                !canUserParticipate(event) &&
                                !event.isOnWaitingList &&
                                !canUserBeAddedToWaitingList(event) &&
                                !event.canceled && (
                                  <div className="flex items-center ml-auto pr-4 py-6">
                                    <Link
                                      to={`/event/${event.slug}`}
                                      className="btn btn-primary"
                                    >
                                      Mehr erfahren
                                    </Link>
                                  </div>
                                )}
                              {loaderData.mode === "anon" &&
                                event.canceled === false &&
                                event._count.childEvents === 0 && (
                                  <div className="flex items-center ml-auto pr-4 py-6">
                                    <Link
                                      className="btn btn-primary"
                                      to={`/login?event_slug=${event.slug}`}
                                    >
                                      Anmelden
                                    </Link>
                                  </div>
                                )}
                            </div>
                          );
                        }
                      )}
                    </div>
                  </>
                )}
                {loaderData.pastEvents.responsibleForEvents.length > 0 && (
                  <>
                    <h6 id="organized-past-events" className="mb-4 font-bold">
                      Vergangene Veranstaltungen
                    </h6>
                    <div className="mb-16">
                      {loaderData.pastEvents.responsibleForEvents.map(
                        ({ event }) => {
                          const startTime = new Date(event.startTime);
                          const endTime = new Date(event.endTime);
                          return (
                            <div
                              key={`past-event-${event.id}`}
                              className="rounded-lg bg-white shadow-xl border-t border-r border-neutral-300  mb-2 flex items-stretch overflow-hidden"
                            >
                              <Link
                                className="flex"
                                to={`/event/${event.slug}`}
                              >
                                <div className="hidden xl:block w-40 shrink-0">
                                  {event.background !== undefined && (
                                    <img
                                      src={
                                        event.background ||
                                        "/images/default-event-background.jpg"
                                      }
                                      alt={event.name}
                                      className="object-cover w-full h-full"
                                    />
                                  )}
                                </div>
                                <div className="px-4 py-6">
                                  <p className="text-xs mb-1">
                                    {/* TODO: Display icons (see figma) */}
                                    {event.stage !== null &&
                                      event.stage.title + " | "}
                                    {getDuration(startTime, endTime)}
                                  </p>
                                  <h4 className="font-bold text-base m-0 lg:line-clamp-1">
                                    {event.name}
                                  </h4>
                                  {event.subline !== null ? (
                                    <p className="hidden lg:block text-xs mt-1 lg:line-clamp-2">
                                      {event.subline}
                                    </p>
                                  ) : (
                                    <p className="hidden lg:block text-xs mt-1 lg:line-clamp-2">
                                      {event.description}
                                    </p>
                                  )}
                                </div>
                              </Link>
                              {event.canceled && (
                                <div className="flex font-semibold items-center ml-auto border-r-8 border-salmon-500 pr-4 py-6 text-salmon-500">
                                  Wurde abgesagt
                                </div>
                              )}
                              {event.isParticipant && !event.canceled && (
                                <div className="flex font-semibold items-center ml-auto border-r-8 border-green-500 pr-4 py-6 text-green-600">
                                  <p>Teilgenommen</p>
                                </div>
                              )}

                              {!event.isParticipant &&
                                !canUserParticipate(event) &&
                                !event.isOnWaitingList &&
                                !canUserBeAddedToWaitingList(event) &&
                                !event.canceled && (
                                  <div className="flex items-center ml-auto pr-4 py-6">
                                    <Link
                                      to={`/event/${event.slug}`}
                                      className="btn btn-primary"
                                    >
                                      Mehr erfahren
                                    </Link>
                                  </div>
                                )}
                            </div>
                          );
                        }
                      )}
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
