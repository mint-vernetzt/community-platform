import { Profile } from "@prisma/client";
import { GravityType } from "imgproxy/dist/types";
import React from "react";
import { json, Link, LoaderFunction, useLoaderData } from "remix";
import { badRequest, notFound } from "remix-utils";
import { getUserByRequest } from "~/auth.server";
import { Chip } from "~/components/Chip/Chip";
import ExternalServiceIcon from "~/components/ExternalService/ExternalServiceIcon";
import { H3 } from "~/components/Heading/Heading";
import ImageCropper from "~/components/ImageCropper/ImageCropper";
import Modal from "~/components/Modal/Modal";
import { ExternalService } from "~/components/types";
import { getImageURL } from "~/images.server";
import { getOrganizationInitials } from "~/lib/organization/getOrganizationInitials";
import { getFullName } from "~/lib/profile/getFullName";
import { getInitials } from "~/lib/profile/getInitials";
import { nl2br } from "~/lib/string/nl2br";
import { getFeatureAbilities } from "~/lib/utils/application";
import { getProfileByUsername } from "~/profile.server";
import { getPublicURL } from "~/storage.server";
import { deriveMode, filterProfileByMode, Mode } from "./utils.server";

import reactCropStyles from "react-image-crop/dist/ReactCrop.css";
import rcSliderStyles from "rc-slider/assets/index.css";

export function links() {
  return [
    { rel: "stylesheet", href: rcSliderStyles },
    { rel: "stylesheet", href: reactCropStyles },
  ];
}

type ProfileLoaderData = {
  mode: Mode;
  data: Partial<NonNullable<Awaited<ReturnType<typeof getProfileByUsername>>>>;
  images: {
    avatar?: string;
    background?: string;
  };
  abilities: Awaited<ReturnType<typeof getFeatureAbilities>>;
};

export const loader: LoaderFunction = async (
  args
): Promise<Response | ProfileLoaderData> => {
  const { request, params } = args;
  const { username } = params;

  if (typeof username !== "string" || username === "") {
    throw badRequest({ message: "Username must be provided" });
  }

  const profile = await getProfileByUsername(username);
  if (profile === null) {
    throw notFound({ message: "Not found" });
  }

  const sessionUser = await getUserByRequest(request);
  const mode = deriveMode(username, sessionUser?.user_metadata?.username);

  const abilities = await getFeatureAbilities(request, "events");

  let images: {
    avatar?: string;
    background?: string;
  } = {};

  if (profile.avatar !== null) {
    const publicURL = getPublicURL(profile.avatar);
    if (publicURL !== null) {
      images.avatar = getImageURL(publicURL, {
        resize: { type: "fill", width: 144, height: 144 },
      });
    }
  }
  if (profile.background !== null) {
    const publicURL = getPublicURL(profile.background);
    if (publicURL !== null) {
      images.background = getImageURL(publicURL, {
        resize: { type: "fit", width: 1488, height: 480 },
      });
    }
  }
  profile.memberOf = profile.memberOf.map((member) => {
    if (member.organization.logo !== null) {
      const publicURL = getPublicURL(member.organization.logo);
      if (publicURL !== null) {
        member.organization.logo = getImageURL(publicURL, {
          resize: { type: "fit", width: 64, height: 64 },
          gravity: GravityType.center,
        });
      }
    }
    return member;
  });

  let data = await filterProfileByMode(profile, mode);

  return json({ mode, data, images, abilities });
};

function hasContactInformations(data: Partial<Profile>) {
  const hasEmail = typeof data.email === "string" && data.email !== "";
  const hasPhone = typeof data.phone === "string" && data.phone !== "";
  return hasEmail || hasPhone;
}

function notEmptyData(key: keyof Profile, data: Partial<Profile>) {
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
];
function hasWebsiteOrSocialService(
  data: Partial<Profile>,
  externalServices: ExternalService[]
) {
  return externalServices.some((item) => notEmptyData(item, data));
}

export default function Index() {
  const loaderData = useLoaderData<ProfileLoaderData>();

  const initials = getInitials(loaderData.data);
  const fullName = getFullName(loaderData.data);

  const avatar = loaderData.images.avatar;
  const Avatar = React.useCallback(
    () => (
      <div className="h-36 w-36 bg-primary text-white text-6xl flex items-center justify-center rounded-md overflow-hidden">
        {avatar !== undefined ? <img src={avatar} alt={fullName} /> : initials}
      </div>
    ),
    [avatar, fullName, initials]
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

  const uploadRedirect = `/profile/${loaderData.data.username}`;
  return (
    <>
      <section className="hidden md:block container mt-8 md:mt-10 lg:mt-20">
        <div className="hero hero-news flex items-end rounded-3xl relative overflow-hidden bg-yellow-500 h-60 lg:h-120">
          <div className="w-full h-full">
            {background !== undefined && (
              <img
                src={background}
                alt={fullName}
                className="object-cover w-full h-full"
              />
            )}
          </div>
          {loaderData.mode === "owner" && (
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
                  id="modal-background-upload"
                  subject={"user"}
                  slug={loaderData.data.username}
                  uploadKey="background"
                  image={background}
                  aspect={31 / 10}
                  minCropWidth={50}
                  minCropHeight={50}
                  maxTargetWidth={1488}
                  maxTargetHeight={480}
                  csrfToken={"034u9nsq0unun"}
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
        <div className="flex flex-col md:flex-row -mx-4">
          <div className="md:flex-1/2 lg:flex-5/12 px-4 pt-10 lg:pt-0">
            <div className="px-4 py-8 lg:p-8 pb-15 md:pb-5 rounded-3xl border border-neutral-400 bg-neutral-200 shadow-lg relative lg:ml-14 lg:-mt-64">
              <div className="flex items-center flex-col">
                <Avatar />
                {loaderData.mode === "owner" && (
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
                      <span className="ml-2 mr-4">Bild ändern</span>
                    </label>

                    <Modal id="modal-avatar">
                      <ImageCropper
                        id="modal-avatar"
                        subject="user"
                        slug={loaderData.data.username}
                        uploadKey="avatar"
                        headline="Profilfoto"
                        image={avatar}
                        aspect={1}
                        minCropWidth={100}
                        minCropHeight={100}
                        maxTargetWidth={288}
                        maxTargetHeight={288}
                        csrfToken={"034u9nsq0unun"}
                        redirect={uploadRedirect}
                      >
                        <Avatar />
                      </ImageCropper>
                    </Modal>
                  </>
                )}

                <h3 className="mt-6 text-5xl mb-1">{fullName}</h3>
                {typeof loaderData.data.position === "string" && (
                  <p className="font-bold text-sm mb-4">
                    {loaderData.data.position}
                  </p>
                )}
              </div>
              {hasContactInformations(loaderData.data) ||
                (hasWebsiteOrSocialService(
                  loaderData.data,
                  ExternalServices
                ) && <h5 className="font-semibold mb-6 mt-8">Kontakt</h5>)}
              {hasContactInformations(loaderData.data) && (
                <>
                  {typeof loaderData.data.email === "string" &&
                    loaderData.data.email !== "" && (
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
                    )}
                  {typeof loaderData.data.phone === "string" &&
                    loaderData.data.phone !== "" && (
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
                    )}
                </>
              )}

              {/* --- WEBSITE & SOCIAL --- */}
              {hasWebsiteOrSocialService(loaderData.data, ExternalServices) && (
                <ul className="list-none flex flex-wrap -mx-1 mb-2">
                  {ExternalServices.map((service) => {
                    if (
                      typeof loaderData.data[service] === "string" &&
                      loaderData.data[service] !== ""
                    ) {
                      return (
                        <li key={service} className="flex-auto px-1 mb-2">
                          <ExternalServiceIcon
                            service={service}
                            url={loaderData.data[service] as string}
                          />
                        </li>
                      );
                    }

                    return false;
                  })}
                </ul>
              )}

              <hr className="divide-y divide-neutral-400 mt-8 mb-6" />

              {loaderData.data.createdAt !== undefined && (
                <p className="text-xs mb-4 text-center">
                  Profil besteht seit dem{" "}
                  {new Date(loaderData.data.createdAt).toLocaleDateString(
                    "de-De",
                    { day: "numeric", month: "long", year: "numeric" }
                  )}
                </p>
              )}
            </div>
          </div>

          <div className="md:flex-1/2 lg:flex-7/12 px-4 pt-10 lg:pt-20 overflow-hidden">
            <div className="flex flex-col-reverse lg:flex-row flex-nowrap">
              <div className="flex-auto pr-4 mb-6">
                <h1 className="mb-0">Hi, ich bin {fullName}</h1>
              </div>
              {loaderData.mode === "owner" && (
                <div className="flex-initial lg:pl-4 pt-3 mb-6">
                  <Link
                    className="btn btn-outline btn-primary"
                    to={`/profile/${loaderData.data.username}/settings`}
                  >
                    Profil bearbeiten
                  </Link>
                </div>
              )}
            </div>
            {typeof loaderData.data.bio === "string" && (
              <p
                className="mb-6"
                dangerouslySetInnerHTML={{
                  __html: nl2br(loaderData.data.bio, true),
                }}
              />
            )}
            {loaderData.data.areas !== undefined &&
              loaderData.data.areas.length > 0 && (
                <div className="flex mb-6 font-semibold flex-col lg:flex-row">
                  <div className="lg:flex-label text-xs lg:text-sm leading-4 mb-2 lg:mb-0 lg:leading-6">
                    Aktivitätsgebiete
                  </div>
                  <div className="lg:flex-auto">
                    {loaderData.data.areas
                      .map(({ area }) => area.name)
                      .join(" / ")}
                  </div>
                </div>
              )}
            {loaderData.data.skills !== undefined &&
              loaderData.data.skills.length > 0 && (
                <div className="flex mb-6 font-semibold flex-col lg:flex-row">
                  <div className="lg:flex-label text-xs lg:text-sm leading-4 lg:leading-6 mb-2 lg:mb-0">
                    Kompetenzen
                  </div>

                  <div className="flex-auto">
                    {loaderData.data.skills.join(" / ")}
                  </div>
                </div>
              )}

            {loaderData.data.interests !== undefined &&
              loaderData.data.interests.length > 0 && (
                <div className="flex mb-6 font-semibold flex-col lg:flex-row">
                  <div className="lg:flex-label text-xs lg:text-sm leading-4 lg:leading-6 mb-2 lg:mb-0">
                    Interessen
                  </div>
                  <div className="flex-auto">
                    {loaderData.data.interests.join(" / ")}
                  </div>
                </div>
              )}
            {loaderData.data.offers !== undefined &&
              loaderData.data.offers.length > 0 && (
                <div className="flex mb-6 font-semibold flex-col lg:flex-row">
                  <div className="lg:flex-label text-xs lg:text-sm leading-4 lg:leading-6 my-2 lg:mb-0">
                    Ich biete
                  </div>
                  <div className="flex-auto">
                    {loaderData.data.offers?.map(({ offer }) => (
                      <Chip
                        key={`offer_${offer.title}`}
                        title={offer.title}
                        slug=""
                        isEnabled
                      />
                    ))}
                  </div>
                </div>
              )}
            {loaderData.data.seekings !== undefined &&
              loaderData.data.seekings.length > 0 && (
                <div className="flex mb-6 font-semibold flex-col lg:flex-row">
                  <div className="lg:flex-label text-xs lg:text-sm leading-4 lg:leading-6 my-2 lg:mb-0">
                    Ich suche
                  </div>
                  <div className="flex-auto">
                    {loaderData.data.seekings?.map(({ offer }) => (
                      <Chip
                        key={`seeking_${offer.title}`}
                        title={offer.title}
                        slug=""
                        isEnabled
                      />
                    ))}
                  </div>
                </div>
              )}

            {loaderData.data.memberOf && loaderData.data.memberOf.length > 0 && (
              <>
                <div className="flex flex-row flex-nowrap mb-6 mt-14 items-center">
                  <div className="flex-auto pr-4">
                    <h3 className="mb-0 font-bold">Organisationen</h3>
                  </div>
                  {loaderData.mode === "owner" && (
                    <div className="flex-initial pl-4">
                      <Link
                        to="/organization/create"
                        className="btn btn-outline btn-primary"
                      >
                        Organisation anlegen
                      </Link>
                    </div>
                  )}
                </div>
                <div className="flex flex-wrap -mx-3 items-stretch">
                  {loaderData.data.memberOf.map(({ organization }, index) => (
                    <div
                      key={`profile-${index}`}
                      data-testid="gridcell"
                      className="flex-100 lg:flex-1/2 px-3 mb-8"
                    >
                      <Link
                        to={`/organization/${organization.slug}`}
                        className="flex flex-wrap content-start items-start p-4 rounded-2xl hover:bg-neutral-200 border border-neutral-500"
                      >
                        <div className="w-full flex items-center flex-row">
                          {organization.logo !== "" &&
                          organization.logo !== null ? (
                            <div className="h-16 w-16 flex items-center justify-center relative">
                              <img
                                className="max-w-full w-auto max-h-16 h-auto"
                                src={organization.logo}
                                alt={organization.name}
                              />
                            </div>
                          ) : (
                            <div className="h-16 w-16 bg-primary text-white text-3xl flex items-center justify-center rounded-md overflow-hidden">
                              {getOrganizationInitials(organization.name)}
                            </div>
                          )}
                          <div className="pl-4">
                            <H3 like="h4" className="text-xl mb-1">
                              {organization.name}
                            </H3>
                            {organization.types &&
                              organization.types.length > 0 && (
                                <p className="font-bold text-sm">
                                  {organization.types
                                    .map(
                                      ({ organizationType }) =>
                                        organizationType.title
                                    )
                                    .join(", ")}
                                </p>
                              )}
                          </div>
                        </div>
                      </Link>
                    </div>
                  ))}
                </div>
              </>
            )}
            {loaderData.abilities.events.hasAccess === true &&
              loaderData.mode !== "anon" && (
                <>
                  <div className="flex flex-row flex-nowrap mb-6 mt-14 items-center">
                    <div className="flex-auto pr-4">
                      <h3 className="mb-0 font-bold">Veranstaltungen</h3>
                    </div>
                    {loaderData.mode === "owner" && (
                      <div className="flex-initial pl-4">
                        <Link
                          to="/event/create"
                          className="btn btn-outline btn-primary"
                        >
                          Veranstaltung anlegen
                        </Link>
                      </div>
                    )}
                  </div>
                  {loaderData.data.participatedEvents &&
                    loaderData.data.participatedEvents.length > 0 && (
                      <>
                        <h6 className="mb-2 font-bold">Teilnehmer bei:</h6>
                        <div className="flex flex-wrap -mx-3 items-stretch">
                          {loaderData.data.participatedEvents.map(
                            ({ event }, index) => (
                              <div
                                key={`profile-${index}`}
                                data-testid="gridcell"
                                className="flex-100 lg:flex-1/2 px-3 mb-8"
                              >
                                <Link
                                  to={`/event/${event.slug}`}
                                  className="flex flex-wrap content-start items-start p-4 rounded-2xl hover:bg-neutral-200 border border-neutral-500"
                                >
                                  <div className="w-full flex items-center flex-row">
                                    <div className="pl-4">
                                      <H3 like="h4" className="text-xl mb-1">
                                        {event.name}
                                      </H3>
                                    </div>
                                  </div>
                                </Link>
                              </div>
                            )
                          )}
                        </div>
                      </>
                    )}
                  {loaderData.data.contributedEvents &&
                    loaderData.data.contributedEvents.length > 0 && (
                      <>
                        <h6 className="mb-2 font-bold">Speaker bei:</h6>
                        <div className="flex flex-wrap -mx-3 items-stretch">
                          {loaderData.data.contributedEvents.map(
                            ({ event }, index) => (
                              <div
                                key={`profile-${index}`}
                                data-testid="gridcell"
                                className="flex-100 lg:flex-1/2 px-3 mb-8"
                              >
                                <Link
                                  to={`/event/${event.slug}`}
                                  className="flex flex-wrap content-start items-start p-4 rounded-2xl hover:bg-neutral-200 border border-neutral-500"
                                >
                                  <div className="w-full flex items-center flex-row">
                                    <div className="pl-4">
                                      <H3 like="h4" className="text-xl mb-1">
                                        {event.name}
                                      </H3>
                                    </div>
                                  </div>
                                </Link>
                              </div>
                            )
                          )}
                        </div>
                      </>
                    )}
                  {loaderData.data.waitingForEvents &&
                    loaderData.data.waitingForEvents.length > 0 && (
                      <>
                        <h6 className="mb-2 font-bold">
                          Auf der Warteliste bei:
                        </h6>
                        <div className="flex flex-wrap -mx-3 items-stretch">
                          {loaderData.data.waitingForEvents.map(
                            ({ event }, index) => (
                              <div
                                key={`profile-${index}`}
                                data-testid="gridcell"
                                className="flex-100 lg:flex-1/2 px-3 mb-8"
                              >
                                <Link
                                  to={`/event/${event.slug}`}
                                  className="flex flex-wrap content-start items-start p-4 rounded-2xl hover:bg-neutral-200 border border-neutral-500"
                                >
                                  <div className="w-full flex items-center flex-row">
                                    <div className="pl-4">
                                      <H3 like="h4" className="text-xl mb-1">
                                        {event.name}
                                      </H3>
                                    </div>
                                  </div>
                                </Link>
                              </div>
                            )
                          )}
                        </div>
                      </>
                    )}
                  {loaderData.data.teamMemberOfEvents &&
                    loaderData.data.teamMemberOfEvents.length > 0 && (
                      <>
                        <h6 className="mb-2 font-bold">Teammitglied bei:</h6>
                        <div className="flex flex-wrap -mx-3 items-stretch">
                          {loaderData.data.teamMemberOfEvents.map(
                            ({ event }, index) => (
                              <div
                                key={`profile-${index}`}
                                data-testid="gridcell"
                                className="flex-100 lg:flex-1/2 px-3 mb-8"
                              >
                                <Link
                                  to={`/event/${event.slug}`}
                                  className="flex flex-wrap content-start items-start p-4 rounded-2xl hover:bg-neutral-200 border border-neutral-500"
                                >
                                  <div className="w-full flex items-center flex-row">
                                    <div className="pl-4">
                                      <H3 like="h4" className="text-xl mb-1">
                                        {event.name}
                                      </H3>
                                    </div>
                                  </div>
                                </Link>
                              </div>
                            )
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
