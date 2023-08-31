import type { Project } from "@prisma/client";
import type { LoaderArgs, MetaFunction } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";
import { utcToZonedTime } from "date-fns-tz";
import rcSliderStyles from "rc-slider/assets/index.css";
import React from "react";
import reactCropStyles from "react-image-crop/dist/ReactCrop.css";
import { createAuthClient, getSessionUser } from "~/auth.server";
import ExternalServiceIcon from "~/components/ExternalService/ExternalServiceIcon";
import { H4 } from "~/components/Heading/Heading";
import ImageCropper from "~/components/ImageCropper/ImageCropper";
import Modal from "~/components/Modal/Modal";
import OrganizationCard from "~/components/OrganizationCard/OrganizationCard";
import ProfileCard from "~/components/ProfileCard/ProfileCard";
import { RichText } from "~/components/Richtext/RichText";
import type { ExternalService } from "~/components/types";
import { getImageURL } from "~/images.server";
import { getInitials } from "~/lib/profile/getInitials";
import { getInitialsOfName } from "~/lib/string/getInitialsOfName";
import { getParamValueOrThrow } from "~/lib/utils/routes";
import { prismaClient } from "~/prisma.server";
import {
  filterOrganizationByVisibility,
  filterProfileByVisibility,
  filterProjectByVisibility,
} from "~/public-fields-filtering.server";
import { getPublicURL } from "~/storage.server";
import { deriveMode, getProjectBySlugOrThrow } from "./utils.server";

export function links() {
  return [
    { rel: "stylesheet", href: rcSliderStyles },
    { rel: "stylesheet", href: reactCropStyles },
  ];
}

export const meta: MetaFunction = (args) => {
  return {
    title: `MINTvernetzt Community Plattform | ${args.data.project.name}`,
  };
};

function hasContactInformations(project: Pick<Project, "email" | "phone">) {
  const hasEmail = typeof project.email === "string" && project.email !== "";
  const hasPhone = typeof project.phone === "string" && project.phone !== "";
  return hasEmail || hasPhone;
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

function notEmptyData(
  key: ExternalService,
  project: Pick<Project, ExternalService>
) {
  if (typeof project[key] === "string") {
    return project[key] !== "";
  }
  return false;
}

function hasWebsiteOrSocialService(
  project: Pick<Project, ExternalService>,
  externalServices: ExternalService[]
) {
  return externalServices.some((item) => notEmptyData(item, project));
}

export const loader = async (args: LoaderArgs) => {
  const { request, params } = args;
  const response = new Response();

  const authClient = createAuthClient(request, response);

  const slug = getParamValueOrThrow(params, "slug");

  const project = await getProjectBySlugOrThrow(slug);

  const sessionUser = await getSessionUser(authClient);

  if (sessionUser !== null) {
    const userProfile = await prismaClient.profile.findFirst({
      where: { id: sessionUser.id },
      select: { termsAccepted: true },
    });
    if (userProfile !== null && userProfile.termsAccepted === false) {
      return redirect(`/accept-terms?redirect_to=/project/${slug}`, {
        headers: response.headers,
      });
    }
  }

  const mode = await deriveMode(project, sessionUser);

  let enhancedProject = {
    ...project,
  };

  // Filtering by visbility settings
  if (sessionUser === null) {
    // Filter project
    enhancedProject = await filterProjectByVisibility<typeof enhancedProject>(
      enhancedProject
    );
    // Filter team members
    enhancedProject.teamMembers = await Promise.all(
      enhancedProject.teamMembers.map(async (relation) => {
        const filteredProfile = await filterProfileByVisibility<
          typeof relation.profile
        >(relation.profile);
        return { ...relation, profile: filteredProfile };
      })
    );
    // Filter responsible organizations
    enhancedProject.responsibleOrganizations = await Promise.all(
      enhancedProject.responsibleOrganizations.map(async (relation) => {
        const filteredOrganization = await filterOrganizationByVisibility<
          typeof relation.organization
        >(relation.organization);
        return { ...relation, organization: filteredOrganization };
      })
    );
  }

  // Adding images from imgproxy
  if (enhancedProject.logo !== null) {
    const publicURL = getPublicURL(authClient, enhancedProject.logo);
    enhancedProject.logo = getImageURL(publicURL, {
      resize: { type: "fit", width: 144, height: 144 },
    });
  }

  if (enhancedProject.background !== null) {
    const publicURL = getPublicURL(authClient, enhancedProject.background);
    enhancedProject.background = getImageURL(publicURL, {
      resize: { type: "fit", width: 1488, height: 480 },
    });
  }

  enhancedProject.teamMembers = enhancedProject.teamMembers.map((relation) => {
    let avatar = relation.profile.avatar;
    if (avatar !== null) {
      const publicURL = getPublicURL(authClient, avatar);
      avatar = getImageURL(publicURL, {
        resize: { type: "fit", width: 64, height: 64 },
      });
    }
    return { ...relation, profile: { ...relation.profile, avatar } };
  });

  enhancedProject.responsibleOrganizations =
    enhancedProject.responsibleOrganizations.map((relation) => {
      let logo = relation.organization.logo;
      if (logo !== null) {
        const publicURL = getPublicURL(authClient, logo);
        logo = getImageURL(publicURL, {
          resize: { type: "fit", width: 64, height: 64 },
        });
      }
      return { ...relation, organization: { ...relation.organization, logo } };
    });

  enhancedProject.awards = enhancedProject.awards.map((relation) => {
    let logo = relation.award.logo;
    if (logo !== null) {
      const publicURL = getPublicURL(authClient, logo);
      logo = getImageURL(publicURL, {
        resize: { type: "fit", width: 64, height: 64 },
      });
    }
    return { ...relation, award: { ...relation.award, logo } };
  });

  return json(
    { mode, project: enhancedProject },
    { headers: response.headers }
  );
};

function Index() {
  const loaderData = useLoaderData<typeof loader>();

  const Background = React.useCallback(
    () => (
      <div className="w-full bg-yellow-500 rounded-md overflow-hidden">
        {loaderData.project.background ? (
          <img
            src={loaderData.project.background}
            alt={`Aktuelles Hintergrundbild`}
          />
        ) : (
          <div className="w-[336px] min-h-[108px]" />
        )}
      </div>
    ),
    [loaderData.project.background]
  );

  const initialsOfOrganization = getInitialsOfName(loaderData.project.name);

  const Logo = React.useCallback(
    () => (
      <>
        <div className="h-36 w-36 bg-primary text-white text-6xl flex items-center justify-center overflow-hidden rounded-full border">
          {loaderData.project.logo ? (
            <img
              src={loaderData.project.logo}
              alt={initialsOfOrganization}
              className="max-w-full w-auto max-h-36 h-auto"
            />
          ) : (
            initialsOfOrganization
          )}
        </div>
      </>
    ),
    [loaderData.project.logo, initialsOfOrganization]
  );

  return (
    <>
      <section className="container mt-8 md:mt-10 lg:mt-20 relative px-0 sm:px-4 lg:px-6">
        <div className="rounded-t-2xl lg:rounded-3xl relative overflow-hidden bg-yellow-500 w-full aspect-[31/10]">
          <div className="w-full h-full">
            <img
              src={
                loaderData.project.background ||
                "/images/default-project-background.jpg"
              }
              alt={loaderData.project.name}
            />
          </div>
          {loaderData.mode === "owner" ? (
            <div className="absolute bottom-2 right-2 lg:bottom-6 lg:right-6">
              <label
                htmlFor="modal-background-upload"
                className="btn btn-primary btn-small modal-button"
              >
                Bild ändern
              </label>

              <Modal id="modal-background-upload">
                <ImageCropper
                  headline="Hintergrundbild"
                  subject="project"
                  id="modal-background-upload"
                  uploadKey="background"
                  image={loaderData.project.background || undefined}
                  aspect={31 / 10}
                  minCropWidth={620}
                  minCropHeight={62}
                  maxTargetWidth={1488}
                  maxTargetHeight={480}
                  slug={loaderData.project.slug}
                  redirect={`/project/${loaderData.project.slug}`}
                >
                  <Background />
                </ImageCropper>
              </Modal>
            </div>
          ) : null}
        </div>
        {loaderData.project.awards.length > 0 ? (
          <div className="mv-awards absolute -top-0.5 right-4 sm: right-8 md:right-14 flex gap-4">
            {loaderData.project.awards.map((item) => {
              const date = utcToZonedTime(item.award.date, "Europe/Berlin");
              return (
                <div
                  key={`award-${item.awardId}`}
                  className="mv-awards-bg bg-[url('/images/award_bg.svg')] -mt-px bg-cover bg-no-repeat bg-left-top drop-shadow-lg aspect-[11/17]"
                >
                  <div className="flex flex-col items-center justify-center min-w-[57px] min-h-[88px] h-full pt-2 md:min-w-[77px] md:min-h-[109px] md:pt-3">
                    <div className="h-8 w-8 md:h-12 md:w-12 flex items-center justify-center relative shrink-0 rounded-full overflow-hidden border">
                      {item.award.logo !== "" ? (
                        <img src={item.award.logo} alt={item.award.title} />
                      ) : (
                        getInitialsOfName(item.award.title)
                      )}
                    </div>
                    <div className="px-2 mb-4 md:px-3 pt-1">
                      {item.award.shortTitle ? (
                        <H4
                          like="h4"
                          className="text-xxs lg:text-sm mb-0 text-center text-neutral-600 font-bold leading-none"
                        >
                          {item.award.shortTitle}
                        </H4>
                      ) : null}
                      <p className="text-xxs lg:text-sm text-center leading-none">
                        {date.getFullYear()}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : null}
      </section>

      <div className="container relative pb-44">
        <div className="flex flex-col lg:flex-row -mx-4">
          <div className="flex-gridcol lg:w-5/12 px-4 mt-[-72px] lg:mt-0 lg:pt-0">
            <div className="lg:rounded-3xl lg:border lg:border-neutral-400 lg:bg-neutral-200 lg:shadow-lg relative lg:ml-14 lg:-mt-44 sticky top-4 overflow-hidden">
              <div className="lg:p-8 pb-15 md:pb-5">
                <div className="flex items-center flex-col">
                  <Logo />
                  {loaderData.mode === "owner" ? (
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
                          subject="project"
                          slug={loaderData.project.slug}
                          uploadKey="logo"
                          headline="Logo"
                          image={loaderData.project.logo || undefined}
                          aspect={1 / 1}
                          minCropWidth={100}
                          minCropHeight={100}
                          maxTargetHeight={1488}
                          maxTargetWidth={1488}
                          redirect={`/project/${loaderData.project.slug}`}
                          circularCrop={true}
                        >
                          <Logo />
                        </ImageCropper>
                      </Modal>
                    </>
                  ) : null}

                  <h3 className="mt-6 text-5xl mb-1 font-bold">
                    {loaderData.project.name}
                  </h3>
                  <div className="mb-8">
                    {loaderData.project.responsibleOrganizations.length > 0 ? (
                      <p className="font-bold text-sm mb-0">
                        {loaderData.project.responsibleOrganizations.map(
                          (relation, index) => {
                            return (
                              <Link
                                key={relation.organization.id}
                                className="inline-block"
                                to={`/organization/${relation.organization.slug}`}
                              >
                                {index !== 0 ? "/ " : ""}
                                {relation.organization.name}
                                {index !==
                                loaderData.project.responsibleOrganizations
                                  .length -
                                  1
                                  ? " /"
                                  : ""}
                              </Link>
                            );
                          }
                        )}
                      </p>
                    ) : null}
                  </div>
                  {loaderData.project.teamMembers.length > 0 ? (
                    <div className="text-4xl text-primary font-semibold text-center mb-6">
                      {loaderData.project.teamMembers.map((relation, index) => {
                        return (
                          <Link
                            key={relation.profile.id}
                            to={`/profile/${relation.profile.username}`}
                            className="inline-block mx-1"
                          >
                            {relation.profile.firstName +
                              " " +
                              relation.profile.lastName}
                            {index !== loaderData.project.teamMembers.length - 1
                              ? ", "
                              : ""}
                          </Link>
                        );
                      })}
                    </div>
                  ) : null}
                </div>

                {hasContactInformations(loaderData.project) ||
                hasWebsiteOrSocialService(
                  loaderData.project,
                  ExternalServices
                ) ? (
                  <h5 className="font-semibold mb-6 mt-8">Kontakt</h5>
                ) : null}
                {hasContactInformations(loaderData.project) ? (
                  <>
                    {typeof loaderData.project.email === "string" &&
                    loaderData.project.email !== "" ? (
                      <p className="text-mb mb-2">
                        <a
                          href={`mailto:${loaderData.project.email}`}
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
                          <span>{loaderData.project.email}</span>
                        </a>
                      </p>
                    ) : null}
                    {typeof loaderData.project.phone === "string" &&
                    loaderData.project.phone !== "" ? (
                      <p className="text-md text-neutral-600 mb-2">
                        <a
                          href={`tel:${loaderData.project.phone}`}
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
                          <span>{loaderData.project.phone}</span>
                        </a>
                      </p>
                    ) : null}
                  </>
                ) : null}

                {hasWebsiteOrSocialService(
                  loaderData.project,
                  ExternalServices
                ) ? (
                  <ul className="list-none flex flex-wrap -mx-1 mb-2">
                    {ExternalServices.map((service) => {
                      if (
                        typeof loaderData.project[service] === "string" &&
                        loaderData.project[service] !== ""
                      ) {
                        return (
                          <li key={service} className="flex-auto px-1 mb-2">
                            <ExternalServiceIcon
                              service={service}
                              url={loaderData.project[service] as string}
                            />
                          </li>
                        );
                      }
                      return false;
                    })}
                  </ul>
                ) : null}

                {(typeof loaderData.project.street === "string" &&
                  loaderData.project.street !== "") ||
                (typeof loaderData.project.streetNumber === "string" &&
                  loaderData.project.streetNumber !== "") ||
                (typeof loaderData.project.zipCode === "string" &&
                  loaderData.project.zipCode !== "") ||
                (typeof loaderData.project.city === "string" &&
                  loaderData.project.city !== "") ? (
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
                        {loaderData.project.street
                          ? `${loaderData.project.street} ${loaderData.project.streetNumber} `
                          : ""}
                        <br />
                        {loaderData.project.zipCode
                          ? `${loaderData.project.zipCode} `
                          : ""}
                        {loaderData.project.city ? loaderData.project.city : ""}
                      </span>
                    </p>
                  </>
                ) : null}
              </div>
            </div>
          </div>

          <div className="flex-gridcol lg:w-7/12 p-4 pt-10 lg:pt-20 overflow-hidden">
            <div className="flex flex-col-reverse lg:flex-row flex-nowrap">
              <div className="flex-auto pr-4 mb-6">
                <h1 className="mb-0">
                  {loaderData.project.headline || loaderData.project.name}
                </h1>
              </div>
              {loaderData.mode === "owner" ? (
                <div className="flex-initial lg:pl-4 pt-3 mb-6">
                  <Link
                    className="btn btn-outline btn-primary"
                    to={`/project/${loaderData.project.slug}/settings`}
                  >
                    Projekt bearbeiten
                  </Link>
                </div>
              ) : null}
            </div>

            {loaderData.project.excerpt !== null &&
            loaderData.project.excerpt !== "" ? (
              // <p
              //   className="mb-8"
              //   dangerouslySetInnerHTML={{
              //     __html: nl2br(loaderData.project.excerpt, true),
              //   }}
              // />
              <p className="mb-8">{loaderData.project.excerpt}</p>
            ) : null}

            {loaderData.project.targetGroups.length > 0 ? (
              <>
                <H4 className="font-bold mb-4">Zielgruppe</H4>
                <div className="event-tags -m-1 pb-8">
                  {loaderData.project.targetGroups.map((item) => {
                    return (
                      <div
                        key={`targetGroups-${item.targetGroupId}`}
                        className="badge"
                      >
                        {item.targetGroup.title}
                      </div>
                    );
                  })}
                </div>
              </>
            ) : null}

            {loaderData.project.disciplines.length > 0 ? (
              <>
                <H4 className="font-bold mb-4">Disziplin</H4>
                <div className="event-tags -m-1 pb-8">
                  {loaderData.project.disciplines.map((item) => {
                    return (
                      <div
                        key={`discipline-${item.disciplineId}`}
                        className="badge"
                      >
                        {item.discipline.title}
                      </div>
                    );
                  })}
                </div>
              </>
            ) : null}

            {loaderData.project.description !== null &&
            loaderData.project.description !== "" ? (
              <>
                <H4 className="font-bold mb-4">Beschreibung</H4>
                <RichText
                  html={loaderData.project.description}
                  additionalClassNames="mb-6"
                />
              </>
            ) : null}

            {loaderData.project.awards.length > 0 ? (
              <>
                <H4 className="font-bold mb-4 mt-8 lg:mt-16">Auszeichnungen</H4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {loaderData.project.awards.map((item) => {
                    const date = utcToZonedTime(
                      item.award.date,
                      "Europe/Berlin"
                    );
                    return (
                      <div
                        key={`award-${item.awardId}`}
                        className="w-full flex flex-row"
                      >
                        <div
                          key={`award-${item.awardId}`}
                          className="mv-awards-bg bg-[url('/images/award_bg.svg')] bg-cover bg-no-repeat bg-left-top drop-shadow-lg aspect-[11/17]"
                        >
                          <div className="flex flex-col min-w-[57px] h-full min-h-[88px] items-center justify-center pt-2">
                            <div className="h-8 w-8 flex items-center justify-center relative shrink-0 rounded-full overflow-hidden border">
                              {item.award.logo !== "" ? (
                                <img
                                  src={item.award.logo}
                                  alt={item.award.title}
                                />
                              ) : (
                                getInitialsOfName(item.award.title)
                              )}
                            </div>
                            <div className="px-2 mb-4 pt-1">
                              {item.award.shortTitle ? (
                                <H4
                                  like="h4"
                                  className="text-xxs mb-0 text-center text-neutral-600 font-bold leading-none"
                                >
                                  {item.award.shortTitle}
                                </H4>
                              ) : null}
                              <p className="text-xxs text-center leading-none">
                                {date.getFullYear()}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="pl-4">
                          <H4
                            like="h4"
                            className="text-xl mb-0 text-neutral-primary font-semibold"
                          >
                            {item.award.title}
                          </H4>
                          <p className="">{item.award.subline}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            ) : null}

            {loaderData.project.responsibleOrganizations.length > 0 ? (
              <>
                <H4 className="font-bold mb-4 mt-8 lg:mt-16">
                  Ein Projekt von
                </H4>
                <div className="flex flex-wrap -mx-3 items-stretch">
                  {loaderData.project.responsibleOrganizations.map((item) => {
                    return (
                      <>
                        <OrganizationCard
                          key={`${item.organization.slug}`}
                          id={`${item.organization.slug}`}
                          link={`/organization/${item.organization.slug}`}
                          name={item.organization.name}
                          types={item.organization.types}
                          image={item.organization.logo}
                        />
                      </>
                    );
                  })}
                </div>
              </>
            ) : null}

            {loaderData.project.teamMembers.length > 0 ? (
              <>
                <H4 className="font-bold mb-4 mt-4 lg:mt-12">Das Team</H4>
                <div className="flex flex-wrap -mx-3 lg:items-stretch">
                  {loaderData.project.teamMembers.map((item) => {
                    return (
                      <ProfileCard
                        id={`profile-${item.profile.username}`}
                        key={`profile-${item.profile.username}`}
                        link={`/profile/${item.profile.username}`}
                        name={
                          item.profile.firstName + " " + item.profile.lastName
                        }
                        initials={getInitials(item.profile)}
                        position={item.profile.position}
                        avatar={item.profile.avatar}
                      />
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
