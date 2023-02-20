import type { LoaderArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { Form, Link, useLoaderData, useSearchParams } from "@remix-run/react";
import { isSameDay } from "date-fns";
import { utcToZonedTime } from "date-fns-tz";
import { GravityType } from "imgproxy/dist/types";
import { FocusEvent } from "react";
import { createAuthClient, getSessionUserOrThrow } from "~/auth.server";
import InputText from "~/components/FormElements/InputText/InputText";
import { H1, H3, H4 } from "~/components/Heading/Heading";
import { getImageURL } from "~/images.server";
import {
  canUserBeAddedToWaitingList,
  canUserParticipate,
} from "~/lib/event/utils";
import { useInfiniteItems } from "~/lib/hooks/useInfiniteItems";
import { getFullName } from "~/lib/profile/getFullName";
import { getInitials } from "~/lib/profile/getInitials";
import { getInitialsOfName } from "~/lib/string/getInitialsOfName";
import { getDateDuration, getTimeDuration } from "~/lib/utils/time";
import { getPublicURL } from "~/storage.server";
import { AddParticipantButton } from "../event/$slug/settings/participants/add-participant";
import { AddToWaitingListButton } from "../event/$slug/settings/participants/add-to-waiting-list";
import {
  enhanceEventsWithParticipationStatus,
  getPaginationValues,
} from "../explore/utils.server";
import {
  countSearchedEvents,
  countSearchedOrganizations,
  countSearchedProfiles,
  countSearchedProjects,
  getQueryValue,
  getTypeValue,
  searchEventsViaLike,
  searchOrganizationsViaLike,
  searchProfilesViaLike,
  searchProjectsViaLike,
} from "./utils.server";

export const loader = async ({ request }: LoaderArgs) => {
  const response = new Response();
  const authClient = createAuthClient(request, response);
  const sessionUser = await getSessionUserOrThrow(authClient);

  const searchQuery = getQueryValue(request);
  const type = getTypeValue(request);
  const paginationValues = getPaginationValues(request);

  //console.time("Overall time");
  let searchData: {
    profiles: Awaited<ReturnType<typeof searchProfilesViaLike>>;
    organizations: Awaited<ReturnType<typeof searchOrganizationsViaLike>>;
    events: Awaited<ReturnType<typeof searchEventsViaLike>>;
    projects: Awaited<ReturnType<typeof searchProjectsViaLike>>;
  } = {
    profiles: [],
    organizations: [],
    events: [],
    projects: [],
  };
  let countData = {
    profiles: 0,
    organizations: 0,
    events: 0,
    projects: 0,
  };
  if (type !== null) {
    const [profilesCount, organizationsCount, eventsCount, projectsCount] =
      await Promise.all([
        countSearchedProfiles(searchQuery),
        countSearchedOrganizations(searchQuery),
        countSearchedEvents(searchQuery),
        countSearchedProjects(searchQuery),
      ]);
    countData.profiles = profilesCount;
    countData.organizations = organizationsCount;
    countData.events = eventsCount;
    countData.projects = projectsCount;
    if (type === "profiles") {
      const rawProfiles = await searchProfilesViaLike(
        searchQuery,
        paginationValues.skip,
        paginationValues.take
      );
      const enhancedProfiles = rawProfiles.map((profile) => {
        const { avatar, ...otherFields } = profile;
        let avatarImage: string | null = null;
        if (avatar !== null) {
          const publicURL = getPublicURL(authClient, avatar);
          if (publicURL !== null) {
            avatarImage = getImageURL(publicURL, {
              resize: { type: "fill", width: 64, height: 64 },
              gravity: GravityType.center,
            });
          }
        }
        return { ...otherFields, avatar: avatarImage };
      });
      searchData.profiles = enhancedProfiles;
    } else if (type === "organizations") {
      const rawOrganizations = await searchOrganizationsViaLike(
        searchQuery,
        paginationValues.skip,
        paginationValues.take
      );
      const enhancedOrganizations = rawOrganizations.map((organization) => {
        const { logo, ...otherFields } = organization;
        let logoImage: string | null = null;
        if (logo !== null) {
          const publicURL = getPublicURL(authClient, logo);
          if (publicURL !== null) {
            logoImage = getImageURL(publicURL, {
              resize: { type: "fill", width: 64, height: 64 },
              gravity: GravityType.center,
            });
          }
        }
        return { ...otherFields, logo: logoImage };
      });
      searchData.organizations = enhancedOrganizations;
    } else if (type === "events") {
      const rawEvents = await searchEventsViaLike(
        searchQuery,
        paginationValues.skip,
        paginationValues.take
      );
      const enhancedEvents = rawEvents.map((event) => {
        if (event.background !== null) {
          const publicURL = getPublicURL(authClient, event.background);
          if (publicURL) {
            event.background = getImageURL(publicURL, {
              resize: { type: "fit", width: 400, height: 280 },
            });
          }
        }
        if (event.responsibleOrganizations.length > 0) {
          event.responsibleOrganizations = event.responsibleOrganizations.map(
            (item) => {
              if (item.organization.logo !== null) {
                const publicURL = getPublicURL(
                  authClient,
                  item.organization.logo
                );
                if (publicURL) {
                  item.organization.logo = getImageURL(publicURL, {
                    resize: { type: "fit", width: 144, height: 144 },
                  });
                }
              }
              return item;
            }
          );
        }
        return event;
      });
      searchData.events = await enhanceEventsWithParticipationStatus(
        sessionUser.id,
        enhancedEvents
      );
    } else if (type === "projects") {
      const rawProjects = await searchProjectsViaLike(
        searchQuery,
        paginationValues.skip,
        paginationValues.take
      );
      const enhancedProjects = rawProjects.map((project) => {
        let enhancedProject = project;
        if (enhancedProject.background !== null) {
          const publicURL = getPublicURL(
            authClient,
            enhancedProject.background
          );
          if (publicURL) {
            enhancedProject.background = getImageURL(publicURL, {
              resize: { type: "fit", width: 400, height: 280 },
            });
          }
        }
        if (enhancedProject.logo !== null) {
          const publicURL = getPublicURL(authClient, enhancedProject.logo);
          if (publicURL) {
            enhancedProject.logo = getImageURL(publicURL, {
              resize: { type: "fit", width: 144, height: 144 },
            });
          }
        }
        enhancedProject.awards = enhancedProject.awards.map((relation) => {
          if (relation.award.logo !== null) {
            const publicURL = getPublicURL(authClient, relation.award.logo);
            if (publicURL !== null) {
              relation.award.logo = getImageURL(publicURL, {
                resize: { type: "fit", width: 64, height: 64 },
                gravity: GravityType.center,
              });
            }
          }
          return relation;
        });
        return enhancedProject;
      });
      searchData.projects = enhancedProjects;
    } else {
      // search parameter type is unknown
    }
  } else {
    // No type given, nothing to search?
  }

  //console.log("\n-------------------------------------------\n");
  //console.timeEnd("Overall time");
  //console.log("\n-------------------------------------------\n");

  // TODO:
  // - Define search fields on entities -> Prepare proposal
  // - Styling with Sirko (Navbar Icon, Header, Button, Tabs)
  // - poc: trgm index
  // - type issues
  // - Accessibilty of tabs
  // - Tests

  return json(
    {
      profiles: searchData.profiles,
      profilesCount: countData.profiles,
      organizations: searchData.organizations,
      organizationsCount: countData.organizations,
      events: searchData.events,
      eventsCount: countData.events,
      userId: sessionUser?.id || undefined,
      email: sessionUser?.email || undefined,
      projects: searchData.projects,
      projectsCount: countData.projects,
    },
    { headers: response.headers }
  );
};

export default function SearchView() {
  const loaderData = useLoaderData<typeof loader>();
  const [searchParams] = useSearchParams();
  const query = searchParams.get("query");
  // TODO: Type issue
  let type: "profiles" | "organizations" | "events" | "projects" =
    searchParams.get("type") || "profiles";
  const {
    items,
    refCallback,
  }: {
    items: typeof loaderData[typeof type];
    refCallback: (node: HTMLDivElement) => void;
  } = useInfiniteItems(loaderData[type], "/search?index&", type, searchParams);

  const getClassName = (active: boolean) =>
    `block text-3xl ${
      active
        ? "text-primary border-b-primary"
        : "text-neutral-500 border-transparent"
    }  hover:text-primary py-3 border-y hover:border-b-primary cursor-pointer`;
  return (
    <>
      <section className="container mt-8 md:mt-10 lg:mt-20 text-center">
        <H1 like="h0">Suche</H1>
        <Form method="get" reloadDocument>
          <InputText
            id="query"
            label=""
            defaultValue={query || undefined}
            placeholder="Suche mit min. zwei Buchstaben"
            centered={true}
            // TODO: auto select input value
            autoFocus={true}
          />
          <input hidden name="page" defaultValue={1} readOnly />
          <input hidden name="type" defaultValue={"profiles"} readOnly />
          <button
            id="submitButton"
            type="submit"
            className="btn btn-primary mt-2"
          >
            Suchen
          </button>
        </Form>
      </section>
      {query !== null ? (
        <>
          <section className="container my-8 md:my-10" id="search-results">
            <ul
              className="flex flex-col md:flex-row flex-wrap justify-around text-center"
              id="search-result-tablist"
            >
              <Link
                id="profile-tab"
                className={`
              ${type === "profiles" ? getClassName(true) : getClassName(false)}
            `}
                to={`/search?index&page=1&query=${query}&type=profiles`}
                reloadDocument
              >
                Profile (<>{loaderData.profilesCount}</>)
              </Link>
              <Link
                id="organization-tab"
                className={`
              ${
                type === "organizations"
                  ? getClassName(true)
                  : getClassName(false)
              }
            `}
                to={`/search?index&page=1&query=${query}&type=organizations`}
                reloadDocument
              >
                Organisationen (<>{loaderData.organizationsCount}</>)
              </Link>
              <Link
                id="event-tab"
                className={`
              ${type === "events" ? getClassName(true) : getClassName(false)}
            `}
                to={`/search?index&page=1&query=${query}&type=events`}
                reloadDocument
              >
                Veranstaltungen (<>{loaderData.eventsCount}</>)
              </Link>
              <Link
                id="project-tab"
                className={`
              ${type === "projects" ? getClassName(true) : getClassName(false)}
            `}
                to={`/search?index&page=1&query=${query}&type=projects`}
                reloadDocument
              >
                Projekte (<>{loaderData.projectsCount}</>)
              </Link>
            </ul>
          </section>
          {type === "profiles" ? (
            <section
              ref={refCallback}
              className="container my-8 md:my-10"
              id="search-results-profiles"
            >
              <div
                data-testid="grid"
                className="flex flex-wrap justify-center -mx-4 items-stretch"
              >
                {items.length > 0 ? (
                  items.map((profile) => {
                    if ("username" in profile) {
                      let slug, image, initials, name, subtitle;
                      slug = `/profile/${profile.username}`;
                      image = profile.avatar;
                      initials = getInitials(profile);
                      name = getFullName(profile);
                      subtitle = profile.position;
                      return (
                        <div
                          key={`profile-${profile.id}`}
                          data-testid="gridcell"
                          className="flex-100 md:flex-1/2 lg:flex-1/3 px-4 lg:px-4 mb-8"
                        >
                          <Link
                            to={slug}
                            className="flex flex-wrap content-start items-start px-4 pt-4 lg:p-6 pb-8 rounded-3xl shadow h-full bg-neutral-200 hover:bg-neutral-400"
                          >
                            <div className="w-full flex flex-row">
                              <div className="h-16 w-16 bg-primary text-white text-3xl flex items-center justify-center rounded-full overflow-hidden shrink-0 border">
                                {image !== null ? (
                                  <img src={image} alt="" />
                                ) : (
                                  initials
                                )}
                              </div>
                              <div className="pl-4">
                                <H3 like="h4" className="text-xl mb-1">
                                  {name}
                                </H3>
                                {subtitle !== null ? (
                                  <p className="font-bold text-sm">
                                    {subtitle}
                                  </p>
                                ) : null}
                              </div>
                            </div>

                            {profile.bio !== undefined ? (
                              <p className="mt-3 line-clamp-2">{profile.bio}</p>
                            ) : null}

                            {profile.areas.length > 0 ? (
                              <div className="flex font-semibold flex-col lg:flex-row w-full mt-3">
                                <div className="lg:flex-label text-xs lg:text-sm leading-4 lg:leading-6 mb-2 lg:mb-0">
                                  Aktivitätsgebiete
                                </div>
                                <div className="flex-auto line-clamp-3">
                                  <span>
                                    {profile.areas
                                      .map(({ area }) => area.name)
                                      .join(" / ")}
                                  </span>
                                </div>
                              </div>
                            ) : null}
                          </Link>
                        </div>
                      );
                    } else {
                      return null;
                    }
                  })
                ) : (
                  <p>
                    Für Deine Suche konnten leider keine Profile gefunden
                    werden.
                  </p>
                )}
              </div>
            </section>
          ) : null}

          {type === "organizations" ? (
            <section
              className="container my-8 md:my-10"
              id="search-results-organizations"
            >
              <div
                ref={refCallback}
                data-testid="grid"
                className="flex flex-wrap justify-center -mx-4 items-stretch"
              >
                {/* TODO: Type issue */}
                {/* TODO: Type issue */}
                {items.length > 0 ? (
                  items.map((organization) => {
                    let slug, image, initials, name, subtitle;
                    slug = `/organization/${organization.slug}`;
                    image = organization.logo;
                    initials = getInitialsOfName(organization.name);
                    name = organization.name;
                    subtitle = organization.types
                      .map(({ organizationType }) => organizationType.title)
                      .join(" / ");

                    return (
                      <div
                        key={`organization-${organization.id}`}
                        data-testid="gridcell"
                        className="flex-100 md:flex-1/2 lg:flex-1/3 px-4 lg:px-4 mb-8"
                      >
                        <Link
                          to={slug}
                          className="flex flex-wrap content-start items-start px-4 pt-4 lg:p-6 pb-8 rounded-3xl shadow h-full bg-neutral-200 hover:bg-neutral-400"
                        >
                          <div className="w-full flex flex-row">
                            {image !== null ? (
                              <div className="w-16 h-16 rounded-full shrink-0 overflow-hidden flex items-center justify-center border">
                                <img
                                  className="max-w-full w-auto max-h-16 h-auto"
                                  src={image}
                                  alt={name}
                                />
                              </div>
                            ) : (
                              <div className="h-16 w-16 bg-primary text-white text-3xl flex items-center justify-center rounded-full overflow-hidden shrink-0">
                                {initials}
                              </div>
                            )}
                            <div className="pl-4">
                              <H3 like="h4" className="text-xl mb-1">
                                {name}
                              </H3>
                              {subtitle !== null ? (
                                <p className="font-bold text-sm">{subtitle}</p>
                              ) : null}
                            </div>
                          </div>

                          {organization.bio !== undefined ? (
                            <p className="mt-3 line-clamp-2">
                              {organization.bio}
                            </p>
                          ) : null}

                          {organization.areas !== undefined &&
                          organization.areas.length > 0 ? (
                            <div className="flex font-semibold flex-col lg:flex-row w-full mt-3">
                              <div className="lg:flex-label text-xs lg:text-sm leading-4 lg:leading-6 mb-2 lg:mb-0">
                                Aktivitätsgebiete
                              </div>
                              <div className="flex-auto line-clamp-3">
                                <span>
                                  {organization.areas
                                    .map((area) => area.area.name)
                                    .join(" / ")}
                                </span>
                              </div>
                            </div>
                          ) : null}
                        </Link>
                      </div>
                    );
                  })
                ) : (
                  <p>
                    Für Deine Suche konnten leider keine Organisationen gefunden
                    werden.
                  </p>
                )}
              </div>
            </section>
          ) : null}

          {/* TODO: Type issue */}
          {type === "events" ? (
            <>
              {items.length > 0 ? (
                <section
                  ref={refCallback}
                  className="container my-8 md:my-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 items-stretch"
                >
                  <>
                    {items.map((event) => {
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
                          key={`future-event-${event.id}`}
                          className="rounded-2xl bg-white shadow-xl flex flex-col overflow-hidden"
                        >
                          <Link
                            className="relative flex-initial"
                            to={`/event/${event.slug}`}
                          >
                            <div className="w-full aspect-4/3 lg:aspect-video">
                              {event.background !== undefined ? (
                                <img
                                  src={
                                    event.background ||
                                    "/images/default-event-background.jpg"
                                  }
                                  alt={event.name}
                                  className="object-cover w-full h-full"
                                />
                              ) : null}
                            </div>
                            {event.canceled ? (
                              <div className="absolute left-0 right-0 top-0 bg-salmon-500 py-2 text-white text-center">
                                Abgesagt
                              </div>
                            ) : null}
                            <div className="flex justify-between absolute p-2 left-0 right-0 bottom-0">
                              {isSameDay(startTime, endTime) ? (
                                <div className="text-white bg-primary px-2 py-1 rounded-lg text-xs">
                                  {getTimeDuration(startTime, endTime)}
                                </div>
                              ) : null}
                              {event._count.childEvents === 0 ? (
                                <div className="text-white bg-primary px-2 py-1 rounded-lg text-xs">
                                  {event.participantLimit === null ? (
                                    "Unbegrenzte Plätze"
                                  ) : (
                                    <>
                                      {event._count.participants >=
                                      event.participantLimit ? (
                                        <span>
                                          {event._count.waitingList} auf der
                                          Warteliste
                                        </span>
                                      ) : (
                                        `${
                                          event.participantLimit -
                                          event._count.participants
                                        } / ${
                                          event.participantLimit
                                        } Plätzen frei`
                                      )}
                                    </>
                                  )}
                                </div>
                              ) : null}
                            </div>
                          </Link>
                          <Link
                            className="relative flex-auto"
                            to={`/event/${event.slug}`}
                          >
                            <div className="p-4 pb-0 flex justify-between ">
                              <p className="text-xs">
                                {getDateDuration(startTime, endTime)}
                              </p>
                              <div className="flex items-center">
                                {event.stage !== null &&
                                event.stage.title === "vor Ort" ? (
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="16"
                                    height="16"
                                    fill="currentColor"
                                    viewBox="0 0 16 16"
                                  >
                                    <path
                                      fillRule="evenodd"
                                      d="M2 13.5V7h1v6.5a.5.5 0 0 0 .5.5h9a.5.5 0 0 0 .5-.5V7h1v6.5a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 2 13.5zm11-11V6l-2-2V2.5a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5z"
                                    />
                                    <path
                                      fillRule="evenodd"
                                      d="M7.293 1.5a1 1 0 0 1 1.414 0l6.647 6.646a.5.5 0 0 1-.708.708L8 2.207 1.354 8.854a.5.5 0 1 1-.708-.708L7.293 1.5z"
                                    />
                                  </svg>
                                ) : null}
                                {event.stage !== null &&
                                event.stage.title === "Online" ? (
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="16"
                                    height="16"
                                    fill="currentColor"
                                    viewBox="0 0 16 16"
                                  >
                                    <path d="M0 8a8 8 0 1 1 16 0A8 8 0 0 1 0 8zm7.5-6.923c-.67.204-1.335.82-1.887 1.855A7.97 7.97 0 0 0 5.145 4H7.5V1.077zM4.09 4a9.267 9.267 0 0 1 .64-1.539 6.7 6.7 0 0 1 .597-.933A7.025 7.025 0 0 0 2.255 4H4.09zm-.582 3.5c.03-.877.138-1.718.312-2.5H1.674a6.958 6.958 0 0 0-.656 2.5h2.49zM4.847 5a12.5 12.5 0 0 0-.338 2.5H7.5V5H4.847zM8.5 5v2.5h2.99a12.495 12.495 0 0 0-.337-2.5H8.5zM4.51 8.5a12.5 12.5 0 0 0 .337 2.5H7.5V8.5H4.51zm3.99 0V11h2.653c.187-.765.306-1.608.338-2.5H8.5zM5.145 12c.138.386.295.744.468 1.068.552 1.035 1.218 1.65 1.887 1.855V12H5.145zm.182 2.472a6.696 6.696 0 0 1-.597-.933A9.268 9.268 0 0 1 4.09 12H2.255a7.024 7.024 0 0 0 3.072 2.472zM3.82 11a13.652 13.652 0 0 1-.312-2.5h-2.49c.062.89.291 1.733.656 2.5H3.82zm6.853 3.472A7.024 7.024 0 0 0 13.745 12H11.91a9.27 9.27 0 0 1-.64 1.539 6.688 6.688 0 0 1-.597.933zM8.5 12v2.923c.67-.204 1.335-.82 1.887-1.855.173-.324.33-.682.468-1.068H8.5zm3.68-1h2.146c.365-.767.594-1.61.656-2.5h-2.49a13.65 13.65 0 0 1-.312 2.5zm2.802-3.5a6.959 6.959 0 0 0-.656-2.5H12.18c.174.782.282 1.623.312 2.5h2.49zM11.27 2.461c.247.464.462.98.64 1.539h1.835a7.024 7.024 0 0 0-3.072-2.472c.218.284.418.598.597.933zM10.855 4a7.966 7.966 0 0 0-.468-1.068C9.835 1.897 9.17 1.282 8.5 1.077V4h2.355z" />
                                  </svg>
                                ) : null}
                                {event.stage !== null &&
                                event.stage.title === "Hybrid" ? (
                                  <>
                                    <svg
                                      xmlns="http://www.w3.org/2000/svg"
                                      width="16"
                                      height="16"
                                      fill="currentColor"
                                      viewBox="0 0 16 16"
                                    >
                                      <path
                                        fillRule="evenodd"
                                        d="M2 13.5V7h1v6.5a.5.5 0 0 0 .5.5h9a.5.5 0 0 0 .5-.5V7h1v6.5a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 2 13.5zm11-11V6l-2-2V2.5a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5z"
                                      />
                                      <path
                                        fillRule="evenodd"
                                        d="M7.293 1.5a1 1 0 0 1 1.414 0l6.647 6.646a.5.5 0 0 1-.708.708L8 2.207 1.354 8.854a.5.5 0 1 1-.708-.708L7.293 1.5z"
                                      />
                                    </svg>
                                    <span className="mx-1">/</span>
                                    <svg
                                      xmlns="http://www.w3.org/2000/svg"
                                      width="16"
                                      height="16"
                                      fill="currentColor"
                                      viewBox="0 0 16 16"
                                    >
                                      <path d="M0 8a8 8 0 1 1 16 0A8 8 0 0 1 0 8zm7.5-6.923c-.67.204-1.335.82-1.887 1.855A7.97 7.97 0 0 0 5.145 4H7.5V1.077zM4.09 4a9.267 9.267 0 0 1 .64-1.539 6.7 6.7 0 0 1 .597-.933A7.025 7.025 0 0 0 2.255 4H4.09zm-.582 3.5c.03-.877.138-1.718.312-2.5H1.674a6.958 6.958 0 0 0-.656 2.5h2.49zM4.847 5a12.5 12.5 0 0 0-.338 2.5H7.5V5H4.847zM8.5 5v2.5h2.99a12.495 12.495 0 0 0-.337-2.5H8.5zM4.51 8.5a12.5 12.5 0 0 0 .337 2.5H7.5V8.5H4.51zm3.99 0V11h2.653c.187-.765.306-1.608.338-2.5H8.5zM5.145 12c.138.386.295.744.468 1.068.552 1.035 1.218 1.65 1.887 1.855V12H5.145zm.182 2.472a6.696 6.696 0 0 1-.597-.933A9.268 9.268 0 0 1 4.09 12H2.255a7.024 7.024 0 0 0 3.072 2.472zM3.82 11a13.652 13.652 0 0 1-.312-2.5h-2.49c.062.89.291 1.733.656 2.5H3.82zm6.853 3.472A7.024 7.024 0 0 0 13.745 12H11.91a9.27 9.27 0 0 1-.64 1.539 6.688 6.688 0 0 1-.597.933zM8.5 12v2.923c.67-.204 1.335-.82 1.887-1.855.173-.324.33-.682.468-1.068H8.5zm3.68-1h2.146c.365-.767.594-1.61.656-2.5h-2.49a13.65 13.65 0 0 1-.312 2.5zm2.802-3.5a6.959 6.959 0 0 0-.656-2.5H12.18c.174.782.282 1.623.312 2.5h2.49zM11.27 2.461c.247.464.462.98.64 1.539h1.835a7.024 7.024 0 0 0-3.072-2.472c.218.284.418.598.597.933zM10.855 4a7.966 7.966 0 0 0-.468-1.068C9.835 1.897 9.17 1.282 8.5 1.077V4h2.355z" />
                                    </svg>
                                  </>
                                ) : null}
                                {event.stage !== null ? (
                                  <span className="ml-1.5 text-xs">
                                    {event.stage.title}
                                  </span>
                                ) : null}
                              </div>
                            </div>
                            <div className="p-4 pb-0">
                              <h4 className="font-bold text-base m-0 line-clamp-1">
                                {event.name}
                              </h4>
                              {event.subline !== null ? (
                                <p className="text-xs mt-1 line-clamp-2">
                                  {event.subline}
                                </p>
                              ) : (
                                <p className="text-xs mt-1 line-clamp-2">
                                  {event.description}
                                </p>
                              )}
                              <hr className="h-0 border-t border-neutral-400 m-0 mt-4" />
                            </div>
                          </Link>

                          <div className="flex flex-initial items-center p-4">
                            {event.responsibleOrganizations.length > 0 ? (
                              <Link
                                className="flex flex-row"
                                to={`/organization/${event.responsibleOrganizations[0].organization.slug}`}
                              >
                                {event.responsibleOrganizations[0].organization
                                  .logo !== null &&
                                event.responsibleOrganizations[0].organization
                                  .logo !== "" ? (
                                  <div className="h-11 w-11 flex items-center justify-center rounded-full overflow-hidden shrink-0 border">
                                    <img
                                      src={
                                        event.responsibleOrganizations[0]
                                          .organization.logo
                                      }
                                      alt={
                                        event.responsibleOrganizations[0]
                                          .organization.name
                                      }
                                    />
                                  </div>
                                ) : (
                                  <div className="h-11 w-11 bg-primary text-white text-xl flex items-center justify-center rounded-full overflow-hidden shrink-0">
                                    {getInitialsOfName(
                                      event.responsibleOrganizations[0]
                                        .organization.name
                                    )}
                                  </div>
                                )}
                              </Link>
                            ) : null}
                            {event.responsibleOrganizations.length > 1 ? (
                              <p className="ml-2 text-sm">
                                +{event._count.responsibleOrganizations - 1}
                              </p>
                            ) : null}

                            {"isParticipant" in event &&
                            event.isParticipant &&
                            !event.canceled ? (
                              <div className="font-semibold ml-auto text-green-600">
                                <p>Angemeldet</p>
                              </div>
                            ) : null}
                            {"isParticipant" in event &&
                            canUserParticipate(event) ? (
                              <div className="ml-auto">
                                <AddParticipantButton
                                  action={`/event/${event.slug}/settings/participants/add-participant`}
                                  userId={loaderData.userId}
                                  eventId={event.id}
                                  email={loaderData.email}
                                />
                              </div>
                            ) : null}
                            {"isParticipant" in event &&
                            event.isOnWaitingList &&
                            !event.canceled ? (
                              <div className="font-semibold ml-auto text-neutral-500">
                                <p>Wartend</p>
                              </div>
                            ) : null}
                            {"isParticipant" in event &&
                            canUserBeAddedToWaitingList(event) ? (
                              <div className="ml-auto">
                                <AddToWaitingListButton
                                  action={`/event/${event.slug}/settings/participants/add-to-waiting-list`}
                                  userId={loaderData.userId}
                                  eventId={event.id}
                                  email={loaderData.email}
                                />
                              </div>
                            ) : null}
                            {("isParticipant" in event &&
                              !event.isParticipant &&
                              !canUserParticipate(event) &&
                              !event.isOnWaitingList &&
                              !canUserBeAddedToWaitingList(event) &&
                              !event.canceled) ||
                            (loaderData.userId === undefined &&
                              event._count.childEvents > 0) ? (
                              <div className="ml-auto">
                                <Link
                                  to={`/event/${event.slug}`}
                                  className="btn btn-primary"
                                >
                                  Mehr erfahren
                                </Link>
                              </div>
                            ) : null}
                            {loaderData.userId === undefined &&
                            event.canceled === false &&
                            event._count.childEvents === 0 ? (
                              <div className="ml-auto">
                                <Link
                                  className="btn btn-primary"
                                  to={`/login?login_redirect=/event/${event.slug}`}
                                >
                                  Anmelden
                                </Link>
                              </div>
                            ) : null}
                          </div>
                        </div>
                      );
                    })}
                  </>
                </section>
              ) : (
                <p className="text-center">
                  Für Deine Suche konnten leider keine Veranstaltungen gefunden
                  werden.
                </p>
              )}
            </>
          ) : null}
          {/* TODO: Type issue */}
          {type === "projects" ? (
            <>
              {items.length > 0 ? (
                <section className="container my-8 md:my-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-8 items-stretch">
                  {items.map((project) => {
                    return (
                      <div
                        key={`project-${project.id}`}
                        className="rounded-2xl bg-white shadow-xl flex flex-col border"
                      >
                        <Link
                          className="relative flex-initial"
                          to={`/project/${project.slug}`}
                        >
                          <div className="w-full aspect-4/3 lg:aspect-video rounded-t-2xl hidden">
                            <img
                              src={
                                project.background ||
                                "/images/default-event-background.jpg"
                              }
                              alt={project.name}
                              className="object-cover w-full h-full"
                            />
                          </div>
                        </Link>
                        <Link
                          to={`/project/${project.slug}`}
                          className="flex flex-nowrap content-start items-start p-4 rounded-2xl hover:bg-neutral-200"
                        >
                          <div>
                            <div className="w-full flex items-center flex-row">
                              {project.logo !== "" && project.logo !== null ? (
                                <div className="h-11 w-11 flex items-center justify-center relative shrink-0 rounded-full overflow-hidden border">
                                  <img
                                    className="max-w-full w-auto max-h-16 h-auto"
                                    src={project.logo}
                                    alt={project.name}
                                  />
                                </div>
                              ) : (
                                <div className="h-11 w-11 bg-primary text-white text-xl flex items-center justify-center rounded-full overflow-hidden shrink-0 border">
                                  {getInitialsOfName(project.name)}
                                </div>
                              )}
                              <div className="pl-4">
                                <H3
                                  like="h4"
                                  className="text-base mb-0 font-bold"
                                >
                                  {project.name}
                                </H3>
                                {project.responsibleOrganizations &&
                                project.responsibleOrganizations.length > 0 ? (
                                  <p className="font-bold text-sm">
                                    {project.responsibleOrganizations
                                      .map(
                                        ({ organization }) => organization.name
                                      )
                                      .join(" / ")}
                                  </p>
                                ) : null}
                              </div>
                            </div>
                            {project.excerpt !== null &&
                            project.excerpt !== "" ? (
                              <div className="mt-2 line-clamp-3 text-sm">
                                {project.excerpt}
                              </div>
                            ) : null}
                          </div>
                          {project.awards.length > 0 ? (
                            <div className="-mt-4 flex ml-4">
                              {project.awards.map(({ award }) => {
                                const date = utcToZonedTime(
                                  award.date,
                                  "Europe/Berlin"
                                );
                                return (
                                  <div
                                    key={`award-${award.id}`}
                                    className="bg-[url('/images/award_bg.svg')] -mt-px bg-cover bg-no-repeat bg-left-top drop-shadow-lg aspect-[11/17]"
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
                                      <div className="px-2 pt-1 mb-4">
                                        {award.shortTitle ? (
                                          <H4
                                            like="h4"
                                            className="text-xxs mb-0 text-center text-neutral-600 font-bold leading-none"
                                          >
                                            {award.shortTitle}
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
                        </Link>

                        <div className="items-end px-4">
                          <div className="py-4 border-t text-right">
                            <Link
                              to={`/project/${project.slug}`}
                              className="btn btn-primary btn-small"
                            >
                              Zum Projekt
                            </Link>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </section>
              ) : (
                <p className="text-center">
                  Für Deine Suche konnten leider keine Projekte gefunden werden.
                </p>
              )}
            </>
          ) : null}
        </>
      ) : null}
    </>
  );
}
