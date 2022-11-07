import React from "react";
import { Link, LoaderFunction, useLoaderData } from "remix";
import { badRequest, notFound } from "remix-utils";
import { getUserByRequest } from "~/auth.server";
import ExternalServiceIcon from "~/components/ExternalService/ExternalServiceIcon";
import { H1 } from "~/components/Heading/Heading";
import ImageCropper from "~/components/ImageCropper/ImageCropper";
import Modal from "~/components/Modal/Modal";
import { ExternalService } from "~/components/types";
import { getImageURL } from "~/images.server";
import { getOrganizationInitials } from "~/lib/organization/getOrganizationInitials";
import { getInitials } from "~/lib/profile/getInitials";
import { checkFeatureAbilitiesOrThrow } from "~/lib/utils/application";
import { getPublicURL } from "~/storage.server";
import { deriveMode, getProjectBySlugOrThrow } from "./utils.server";

function hasContactInformations(
  project: NonNullable<Awaited<ReturnType<typeof getProjectBySlugOrThrow>>>
) {
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
  key: keyof NonNullable<Awaited<ReturnType<typeof getProjectBySlugOrThrow>>>,
  project: NonNullable<Awaited<ReturnType<typeof getProjectBySlugOrThrow>>>
) {
  if (typeof project[key] === "string") {
    return project[key] !== "";
  }
  return false;
}

function hasWebsiteOrSocialService(
  project: NonNullable<Awaited<ReturnType<typeof getProjectBySlugOrThrow>>>,
  externalServices: ExternalService[]
) {
  return externalServices.some((item) => notEmptyData(item, project));
}

type LoaderData = {
  mode: Awaited<ReturnType<typeof deriveMode>>;
  project: NonNullable<Awaited<ReturnType<typeof getProjectBySlugOrThrow>>>;
  abilities: Awaited<ReturnType<typeof checkFeatureAbilitiesOrThrow>>;
};

export const loader: LoaderFunction = async (args) => {
  const { request, params } = args;
  const { slug } = params;

  if (slug === undefined || typeof slug !== "string") {
    throw badRequest({ message: '"slug" missing' });
  }

  const project = await getProjectBySlugOrThrow(slug);

  if (project === null) {
    throw notFound({ message: `Project not found` });
  }

  const currentUser = await getUserByRequest(request);

  const mode = await deriveMode(project, currentUser);

  const abilities = await checkFeatureAbilitiesOrThrow(request, "projects");

  if (project.logo !== null) {
    const publicURL = getPublicURL(project.logo);
    project.logo = getImageURL(publicURL, {
      resize: { type: "fit", width: 144, height: 144 },
    });
  }

  if (project.background !== null) {
    const publicURL = getPublicURL(project.background);
    project.background = getImageURL(publicURL, {
      resize: { type: "fit", width: 1488, height: 480 },
    });
  }

  project.teamMembers = project.teamMembers.map((item) => {
    if (item.profile.avatar !== null) {
      const publicURL = getPublicURL(item.profile.avatar);
      item.profile.avatar = getImageURL(publicURL, {
        resize: { type: "fit", width: 64, height: 64 },
      });
    }
    return item;
  });

  project.responsibleOrganizations = project.responsibleOrganizations.map(
    (item) => {
      if (item.organization.logo !== null) {
        const publicURL = getPublicURL(item.organization.logo);
        item.organization.logo = getImageURL(publicURL, {
          resize: { type: "fit", width: 64, height: 64 },
        });
      }
      return item;
    }
  );

  project.awards = project.awards.map((item) => {
    if (item.award.logo !== null) {
      const publicURL = getPublicURL(item.award.logo);
      item.award.logo = getImageURL(publicURL, {
        resize: { type: "fit", width: 64, height: 64 },
      });
    }
    return item;
  });

  return { mode, slug, project, abilities };
};

function Index() {
  const loaderData = useLoaderData<LoaderData>();

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

  const initialsOfOrganization = getOrganizationInitials(
    loaderData.project.name
  );

  const Logo = React.useCallback(
    () => (
      <>
        <div
          className={`h-36 flex items-center justify-center rounded-full overflow-hidden border ${
            loaderData.project.logo
              ? "w-36"
              : "w-36 bg-primary text-white text-6xl"
          }`}
        >
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
      <H1>Background</H1>
      <section className="container mt-6">
        <div className="rounded-3xl overflow-hidden w-full relative">
          <div className="hidden md:block">
            <div className="relative overflow-hidden bg-yellow-500 w-full aspect-[31/10]">
              <div className="w-full h-full">
                {loaderData.project.background !== undefined && (
                  <img
                    src={
                      loaderData.project.background ||
                      "/images/default-project-background.jpg"
                    }
                    alt={loaderData.project.name}
                  />
                )}
              </div>
              {loaderData.mode === "owner" &&
                loaderData.abilities.projects.hasAccess && (
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
                        subject="event"
                        id="modal-background-upload"
                        uploadKey="background"
                        image={loaderData.project.background || undefined}
                        aspect={31 / 10}
                        minCropWidth={620}
                        minCropHeight={62}
                        maxTargetWidth={1488}
                        maxTargetHeight={480}
                        slug={loaderData.project.slug}
                        csrfToken={"92014sijdaf02"}
                        redirect={`/project/${loaderData.project.slug}`}
                      >
                        <Background />
                      </ImageCropper>
                    </Modal>
                  </div>
                )}
            </div>
          </div>
        </div>
      </section>
      <H1>Logo</H1>
      <Logo />
      {loaderData.mode === "owner" && loaderData.abilities.projects.hasAccess && (
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
              slug={loaderData.project.slug}
              uploadKey="logo"
              headline="Logo"
              image={loaderData.project.logo || undefined}
              aspect={1 / 1}
              minCropWidth={100}
              minCropHeight={100}
              maxTargetHeight={1488}
              maxTargetWidth={1488}
              csrfToken={"034u9nsq0unun"}
              redirect={`/project/${loaderData.project.slug}`}
              circularCrop={true}
            >
              <Logo />
            </ImageCropper>
          </Modal>
        </>
      )}
      <H1 like="h0">{loaderData.project.name}</H1>
      {loaderData.mode === "owner" && loaderData.abilities.projects.hasAccess && (
        <div className="bg-accent-white p-8 pb-0">
          <p className="font-bold text-right">
            <Link
              className="btn btn-outline btn-primary ml-4"
              to={`/project/${loaderData.project.slug}/settings`}
            >
              Projekt bearbeiten
            </Link>
          </p>
        </div>
      )}
      {loaderData.project.teamMembers.length > 0 && (
        <>
          <h3 className="mt-16 mb-8 font-bold">Team</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {loaderData.project.teamMembers.map((item) => {
              return (
                <div key={`team-member-${item.profile.username}`}>
                  <Link
                    className="flex flex-row"
                    to={`/profile/${item.profile.username}`}
                  >
                    <div className="h-11 w-11 bg-primary text-white text-xl flex items-center justify-center rounded-full overflow-hidden shrink-0 border">
                      {item.profile.avatar !== null &&
                      item.profile.avatar !== "" ? (
                        <img
                          src={item.profile.avatar}
                          alt={
                            item.profile.firstName + " " + item.profile.lastName
                          }
                        />
                      ) : (
                        getInitials(item.profile)
                      )}
                    </div>

                    <div className="pl-4">
                      <h5 className="text-sm m-0 font-bold">
                        {item.profile.firstName + " " + item.profile.lastName}
                      </h5>
                      <p className="text-sm m-0 line-clamp-2">
                        {item.profile.position}
                      </p>
                    </div>
                  </Link>
                </div>
              );
            })}
          </div>
        </>
      )}
      {loaderData.project.responsibleOrganizations.length > 0 ? (
        <>
          <h3 className="mt-16 mb-8 font-bold">Veranstaltet von</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {loaderData.project.responsibleOrganizations.map((item) => {
              return (
                <div key={`organizer-${item.organization.slug}`}>
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
                        {getOrganizationInitials(item.organization.name)}
                      </div>
                    )}
                    <div className="pl-4">
                      <h5 className="text-sm m-0 font-bold">
                        {item.organization.name}
                      </h5>

                      <p className="text-sm m-0 line-clamp-2">
                        {item.organization.types
                          .map((item) => item.organizationType.title)
                          .join(", ")}
                      </p>
                    </div>
                  </Link>
                </div>
              );
            })}
          </div>
        </>
      ) : (
        <p>no responsible organization</p>
      )}

      {hasContactInformations(loaderData.project) ||
        (hasWebsiteOrSocialService(loaderData.project, ExternalServices) && (
          <h5 className="font-semibold mb-6 mt-8">Kontakt</h5>
        ))}
      {hasContactInformations(loaderData.project) && (
        <>
          {typeof loaderData.project.email === "string" &&
            loaderData.project.email !== "" && (
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
            )}
          {typeof loaderData.project.phone === "string" &&
            loaderData.project.phone !== "" && (
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
            )}
        </>
      )}

      {hasWebsiteOrSocialService(loaderData.project, ExternalServices) && (
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
      )}

      {typeof loaderData.project.street === "string" &&
      loaderData.project.street !== "" ? (
        <p>
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
              {loaderData.project.street} {loaderData.project.streetNumber}
              <br />
              {loaderData.project.zipCode} {loaderData.project.city}
            </span>
          </p>
        </p>
      ) : (
        <p>no address</p>
      )}
      <H1>headline</H1>
      <p>{loaderData.project.headline || "no headline"}</p>
      <H1>excerpt</H1>
      <p>{loaderData.project.excerpt || "no excerpt"}</p>
      <H1>description</H1>
      <p>{loaderData.project.description || "no description"}</p>
    </>
  );
}

export default Index;
