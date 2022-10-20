import { GravityType } from "imgproxy/dist/types";
import { Link, LoaderFunction, useLoaderData } from "remix";
import { badRequest, forbidden, notFound } from "remix-utils";
import { getUserByRequest } from "~/auth.server";
import { useNavigate } from "react-router-dom";
import { getImageURL } from "~/images.server";
import { getInitials } from "~/lib/profile/getInitials";
import { getOrganizationInitials } from "~/lib/organization/getOrganizationInitials";
import {
  canUserBeAddedToWaitingList,
  canUserParticipate,
  getIsOnWaitingList,
  getIsParticipant,
  getIsSpeaker,
  getIsTeamMember,
} from "~/lib/event/utils";
import { checkFeatureAbilitiesOrThrow } from "~/lib/utils/application";
import { getDuration } from "~/lib/utils/time";
import { getPublicURL } from "~/storage.server";
import { AddParticipantButton } from "./settings/participants/add-participant";
import { AddToWaitingListButton } from "./settings/participants/add-to-waiting-list";
import { RemoveFromWaitingListButton } from "./settings/participants/remove-from-waiting-list";
import { RemoveParticipantButton } from "./settings/participants/remove-participant";
import {
  deriveMode,
  enhanceChildEventsWithParticipationStatus,
  getEvent,
  getEventParticipants,
  getEventSpeakers,
  getFullDepthParticipants,
  getFullDepthSpeakers,
  MaybeEnhancedEvent,
} from "./utils.server";

type LoaderData = {
  mode: Awaited<ReturnType<typeof deriveMode>>;
  event: MaybeEnhancedEvent;
  // TODO: move "is"-Properties to event
  isParticipant: boolean | undefined;
  isOnWaitingList: boolean | undefined;
  isSpeaker: boolean | undefined;
  isTeamMember: boolean | undefined;
  userId?: string;
  email?: string;
  // fullDepthParticipants: Awaited<ReturnType<typeof getFullDepthParticipants>>;
  // fullDepthSpeaker: Awaited<ReturnType<typeof getFullDepthSpeaker>>;
  // fullDepthOrganizers: Awaited<ReturnType<typeof getFullDepthOrganizers>>;
};

export const loader: LoaderFunction = async (args): Promise<LoaderData> => {
  const { request, params } = args;
  const { slug } = params;
  await checkFeatureAbilitiesOrThrow(request, "events");

  if (slug === undefined || typeof slug !== "string") {
    throw badRequest({ message: '"slug" missing' });
  }

  const currentUser = await getUserByRequest(request);
  const event = await getEvent(slug);

  if (event === null) {
    throw notFound({ message: `Event not found` });
  }

  const mode = await deriveMode(event, currentUser);

  if (mode !== "owner" && event.published === false) {
    throw forbidden({ message: "Event not published" });
  }

  let participants: Awaited<
    ReturnType<typeof getEventParticipants | typeof getFullDepthParticipants>
  > = [];
  let speakers: Awaited<
    ReturnType<typeof getEventSpeakers | typeof getFullDepthSpeakers>
  > = [];
  let enhancedEvent: MaybeEnhancedEvent = {
    ...event,
    participants: [],
    speakers: [],
  };

  if (event.childEvents.length > 0) {
    speakers = (await getFullDepthSpeakers(event.id)) || [];
  } else {
    speakers = await getEventSpeakers(event.id);
  }

  speakers = speakers.map((item) => {
    if (item.profile.avatar !== null) {
      const publicURL = getPublicURL(item.profile.avatar);
      if (publicURL !== null) {
        const avatar = getImageURL(publicURL, {
          resize: { type: "fill", width: 64, height: 64 },
          gravity: GravityType.center,
        });
        item.profile.avatar = avatar;
      }
    }
    return item;
  });

  enhancedEvent.speakers = speakers;

  enhancedEvent.teamMembers = enhancedEvent.teamMembers.map((item) => {
    if (item.profile.avatar !== null) {
      const publicURL = getPublicURL(item.profile.avatar);
      if (publicURL !== null) {
        const avatar = getImageURL(publicURL, {
          resize: { type: "fill", width: 64, height: 64 },
          gravity: GravityType.center,
        });
        item.profile.avatar = avatar;
      }
    }
    return item;
  });

  if (mode !== "anon" && currentUser !== null) {
    if (event.childEvents.length > 0) {
      participants = (await getFullDepthParticipants(event.id)) || [];
    } else {
      participants = await getEventParticipants(event.id);
    }

    participants = participants.map((item) => {
      if (item.profile.avatar !== null) {
        const publicURL = getPublicURL(item.profile.avatar);
        if (publicURL !== null) {
          const avatar = getImageURL(publicURL, {
            resize: { type: "fill", width: 64, height: 64 },
            gravity: GravityType.center,
          });
          item.profile.avatar = avatar;
        }
      }
      return item;
    });

    enhancedEvent.participants = participants;

    if (mode === "authenticated") {
      enhancedEvent = await enhanceChildEventsWithParticipationStatus(
        currentUser.id,
        enhancedEvent
      );
    }
  }

  let isParticipant;
  let isOnWaitingList;
  let isSpeaker;
  let isTeamMember;

  if (currentUser !== null) {
    isParticipant = await getIsParticipant(enhancedEvent.id, currentUser.id);
    isOnWaitingList = await getIsOnWaitingList(
      enhancedEvent.id,
      currentUser.id
    );
    isSpeaker = await getIsSpeaker(enhancedEvent.id, currentUser.id);
    isTeamMember = await getIsTeamMember(enhancedEvent.id, currentUser.id);
  }

  if (event.background !== null) {
    const publicURL = getPublicURL(event.background);
    if (publicURL) {
      event.background = getImageURL(publicURL, {
        resize: { type: "fit", width: 1488, height: 480 },
      });
    }
  }

  if (mode !== "owner") {
    enhancedEvent.childEvents = enhancedEvent.childEvents.filter((item) => {
      return item.published;
    });
  }

  enhancedEvent.childEvents = enhancedEvent.childEvents.map((item) => {
    if (item.background !== null) {
      const publicURL = getPublicURL(item.background);
      if (publicURL) {
        item.background = getImageURL(publicURL, {
          resize: { type: "fit", width: 160, height: 160 },
        });
      }
    }
    return item;
  });

  event.responsibleOrganizations = event.responsibleOrganizations.map(
    (item) => {
      if (item.organization.logo !== null) {
        const publicURL = getPublicURL(item.organization.logo);
        if (publicURL) {
          item.organization.logo = getImageURL(publicURL, {
            resize: { type: "fit", width: 144, height: 144 },
          });
        }
      }
      return item;
    }
  );

  return {
    mode,
    event: enhancedEvent,
    userId: currentUser?.id || undefined,
    email: currentUser?.email || undefined,
    isParticipant,
    isOnWaitingList,
    isSpeaker,
    isTeamMember,
  };
};

function getForm(loaderData: LoaderData) {
  const isParticipating = loaderData.isParticipant || false;
  const isOnWaitingList = loaderData.isOnWaitingList || false;

  const participantLimitReached =
    loaderData.event.participantLimit !== null
      ? loaderData.event.participantLimit <=
        loaderData.event._count.participants
      : false;

  if (isParticipating) {
    return (
      <RemoveParticipantButton
        action="./settings/participants/remove-participant"
        userId={loaderData.userId}
        profileId={loaderData.userId}
        eventId={loaderData.event.id}
      />
    );
  } else if (isOnWaitingList) {
    return (
      <RemoveFromWaitingListButton
        action="./settings/participants/remove-from-waiting-list"
        userId={loaderData.userId}
        profileId={loaderData.userId}
        eventId={loaderData.event.id}
      />
    );
  } else {
    if (participantLimitReached) {
      return (
        <AddToWaitingListButton
          action="./settings/participants/add-to-waiting-list"
          userId={loaderData.userId}
          eventId={loaderData.event.id}
          email={loaderData.email}
        />
      );
    } else {
      return (
        <AddParticipantButton
          action="./settings/participants/add-participant"
          userId={loaderData.userId}
          eventId={loaderData.event.id}
          email={loaderData.email}
        />
      );
    }
  }
}

function formatDateTime(date: Date) {
  const formattedDate = `${date.toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  })}, ${date.toLocaleTimeString("de-DE", {
    hour: "2-digit",
    minute: "2-digit",
  })} Uhr`;
  return formattedDate;
}

function Index() {
  const loaderData = useLoaderData<LoaderData>();

  const navigate = useNavigate();

  const reachedParticipationDeadline =
    new Date() > new Date(loaderData.event.participationUntil);

  const Form = getForm(loaderData);

  const startTime = new Date(loaderData.event.startTime);
  const endTime = new Date(loaderData.event.endTime);

  const duration = getDuration(startTime, endTime);

  return (
    <>
      <section className="container md:mt-2">
        <div className="font-semi text-neutral-500 flex items-center mb-4">
          {loaderData.event.parentEvent !== null && (
            <>
              <Link
                className=""
                to={`/event/${loaderData.event.parentEvent.slug}`}
              >
                {loaderData.event.parentEvent.name}
              </Link>
              <span className="mx-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  fill="currentColor"
                  viewBox="0 0 16 16"
                >
                  <path
                    fillRule="evenodd"
                    d="M4.646 1.646a.5.5 0 0 1 .708 0l6 6a.5.5 0 0 1 0 .708l-6 6a.5.5 0 0 1-.708-.708L10.293 8 4.646 2.354a.5.5 0 0 1 0-.708z"
                  />
                </svg>
              </span>
            </>
          )}
          {loaderData.event.name}
        </div>
        <div className="font-semi text-neutral-600 flex items-center">
          {/* TODO: get back route from loader */}
          <button onClick={() => navigate(-1)} className="flex items-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              className="h-auto w-6"
              fill="currentColor"
              viewBox="0 0 16 16"
            >
              <path
                fillRule="evenodd"
                d="M15 8a.5.5 0 0 0-.5-.5H2.707l3.147-3.146a.5.5 0 1 0-.708-.708l-4 4a.5.5 0 0 0 0 .708l4 4a.5.5 0 0 0 .708-.708L2.707 8.5H14.5A.5.5 0 0 0 15 8z"
              />
            </svg>
            <span className="ml-2">zurück</span>
          </button>
        </div>
      </section>
      <section className="hidden md:block container mt-6">
        <div className="rounded-3xl overflow-hidden w-full relative">
          {loaderData.mode === "owner" && (
            <>
              {loaderData.event.canceled ? (
                <div className="absolute top-0 inset-x-0 font-semibold text-center bg-salmon-500 p-2 text-white z-20">
                  Abgesagt
                </div>
              ) : (
                <>
                  {loaderData.event.published ? (
                    <div className="absolute top-0 inset-x-0 font-semibold text-center bg-green-600 p-2 text-white z-20">
                      Veröffentlicht
                    </div>
                  ) : (
                    <div className="absolute top-0 inset-x-0 font-semibold text-center bg-blue-300 p-2 text-white z-20">
                      Entwurf
                    </div>
                  )}
                </>
              )}
            </>
          )}
          {loaderData.mode !== "owner" && loaderData.event.canceled && (
            <div className="absolute top-0 inset-x-0 font-semibold text-center bg-salmon-500 p-2 text-white z-20">
              Abgesagt
            </div>
          )}
          <div className="relative overflow-hidden bg-yellow-500 w-full aspect-[31/10] z-10">
            <div className="w-full h-full">
              {loaderData.event.background !== undefined && (
                <img
                  src={
                    loaderData.event.background ||
                    "/images/default-event-background.jpg"
                  }
                  alt={loaderData.event.name}
                />
              )}
            </div>
          </div>
          {loaderData.mode !== "owner" && (
            <>
              {reachedParticipationDeadline ? (
                <div className="bg-accent-300 p-8">
                  <p className="font-bold text-center">
                    Teilnahmefrist bereits abgelaufen.
                  </p>
                </div>
              ) : (
                <>
                  {loaderData.mode === "anon" &&
                    loaderData.event.canceled === false && (
                      <div className="bg-white border border-neutral-500 rounded-b-3xl px-8 py-6 text-right">
                        <Link
                          className="btn btn-outline btn-primary"
                          to={`/login?event_slug=${loaderData.event.slug}`}
                        >
                          Anmelden um teilzunehmen
                        </Link>
                      </div>
                    )}
                  {loaderData.mode !== "anon" &&
                    loaderData.event.canceled === false &&
                    loaderData.event.childEvents.length === 0 && (
                      <div className="bg-white border border-neutral-500 rounded-b-3xl px-8 py-6 text-right">
                        {Form}
                      </div>
                    )}
                </>
              )}
              {loaderData.event.childEvents.length > 0 && (
                <>
                  <div className="bg-accent-300 p-8">
                    <p className="font-bold text-center">
                      Wähle{" "}
                      <a
                        href="#child-events"
                        className="underline hover:no-underline"
                      >
                        Subveranstaltungen
                      </a>{" "}
                      aus, an denen Du teilnehmen möchtest.
                    </p>
                  </div>
                </>
              )}
            </>
          )}
        </div>
        {loaderData.mode === "owner" && (
          <>
            <div className="bg-accent-white p-8 pb-0">
              <p className="font-bold text-right">
                <Link
                  className="btn btn-outline btn-primary ml-4"
                  to={`/event/${loaderData.event.slug}/settings`}
                >
                  Veranstaltung bearbeiten
                </Link>
                <Link
                  className="btn btn-primary ml-4"
                  to={`/event/create/?parent=${loaderData.event.id}`}
                >
                  Subveranstaltung anlegen
                </Link>
              </p>
            </div>
          </>
        )}
      </section>
      <div className="container relative pt-20 pb-44">
        <div className="flex -mx-4 justify-center">
          <div className="md:flex-1/2 px-4 pt-10 lg:pt-0">
            <p className="font-bold text-xl mb-8">{duration}</p>
            <header className="mb-8">
              <h1 className="m-0">{loaderData.event.name}</h1>
              {loaderData.event.subline !== null ? (
                <p className="font-bold text-xl mt-2">
                  {loaderData.event.subline}
                </p>
              ) : (
                <p className="font-bold text-xl mt-2 line-clamp-2">
                  {loaderData.event.description}
                </p>
              )}
            </header>
            {loaderData.event.description && (
              <p className="mb-6">{loaderData.event.description}</p>
            )}

            <div className="grid grid-cols-[minmax(100px,_1fr)_4fr] gap-x-4 gap-y-6">
              {loaderData.event.types.length > 0 && (
                <>
                  <div className="text-xs leading-6">Veranstaltungsart</div>
                  <div>
                    {loaderData.event.types
                      .map((item) => item.eventType.title)
                      .join(" / ")}
                  </div>
                </>
              )}

              <div className="text-xs leading-6">Veranstaltungsort</div>
              <div>
                {loaderData.event.venueName !== null ? (
                  <p>
                    {loaderData.event.venueName}, {loaderData.event.venueStreet}{" "}
                    {loaderData.event.venueStreetNumber},{" "}
                    {loaderData.event.venueZipCode} {loaderData.event.venueCity}
                  </p>
                ) : (
                  <p>Online</p>
                )}
              </div>

              {loaderData.event.conferenceLink && (
                <>
                  <div className="text-xs leading-6">Konferenzlink</div>
                  <div>
                    <a
                      href={loaderData.event.conferenceLink}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {loaderData.event.conferenceLink}
                    </a>
                  </div>
                </>
              )}

              {loaderData.event.conferenceCode && (
                <>
                  <div className="text-xs leading-6">Konferenzlink</div>
                  <div>{loaderData.event.conferenceCode}</div>
                </>
              )}

              {loaderData.event.startTime && (
                <>
                  <div className="text-xs leading-6">Start</div>
                  <div>{formatDateTime(startTime)}</div>
                </>
              )}
              {loaderData.event.endTime && (
                <>
                  <div className="text-xs leading-6">Ende</div>
                  <div>{formatDateTime(endTime)}</div>
                </>
              )}

              {loaderData.event.participationUntil && (
                <>
                  <div className="text-xs leading-6">Registrierung bis</div>
                  <div>
                    {formatDateTime(
                      new Date(loaderData.event.participationUntil)
                    )}
                  </div>
                </>
              )}

              {loaderData.event.participationUntil && (
                <>
                  <div className="text-xs leading-6">Verfügbare Plätze</div>
                  <div>
                    {loaderData.event.participantLimit === null ? (
                      "ohne Beschränkung"
                    ) : (
                      <>
                        {loaderData.event._count.participants} /{" "}
                        {loaderData.event.participantLimit}
                      </>
                    )}
                  </div>
                </>
              )}

              <div className="text-xs leading-6 mt-1">Kalender-Eintrag</div>
              <div>
                <Link
                  className="btn btn-outline btn-primary btn-small"
                  to="ics-download"
                  reloadDocument
                >
                  Download
                </Link>
              </div>

              {loaderData.event.documents.length > 0 && (
                <>
                  <div className="text-xs leading-6">Downloads</div>
                  <div>
                    {loaderData.event.documents.map((item, index) => {
                      return (
                        <div key={`document-${index}`} className="">
                          <Link
                            className="underline hover:no-underline"
                            to={`/event/${loaderData.event.slug}/documents-download?document_id=${item.document.id}`}
                            reloadDocument
                          >
                            {item.document.title || item.document.filename}
                          </Link>
                          {item.document.description && (
                            <p className="text-sm italic">
                              {item.document.description}
                            </p>
                          )}
                        </div>
                      );
                    })}
                    {loaderData.event.documents.length > 1 && (
                      <Link
                        className="btn btn-outline btn-primary btn-small mt-4"
                        to={`/event/${loaderData.event.slug}/documents-download`}
                        reloadDocument
                      >
                        Alle Herunterladen
                      </Link>
                    )}
                  </div>
                </>
              )}

              {loaderData.event.focuses.length > 0 && (
                <>
                  <div className="text-xs leading-5 pt-[7px]">Schwerpunkte</div>
                  <div className="event-tags -m-1">
                    {loaderData.event.focuses.map((item, index) => {
                      return (
                        <div key={`focus-${index}`} className="badge">
                          {item.focus.title}
                        </div>
                      );
                    })}
                  </div>
                </>
              )}

              {loaderData.event.targetGroups.length > 0 && (
                <>
                  <div className="text-xs leading-5 pt-[7px]">Zielgruppe</div>
                  <div className="event-tags -m-1">
                    {loaderData.event.targetGroups.map((item, index) => {
                      return (
                        <div key={`targetGroups-${index}`} className="badge">
                          {item.targetGroup.title}
                        </div>
                      );
                    })}
                  </div>
                </>
              )}

              {loaderData.event.experienceLevel && (
                <>
                  <div className="text-xs leading-5 pt-[7px]">
                    Erfahrunsglevel
                  </div>
                  <div className="event-tags -m-1">
                    <div className="badge">
                      {loaderData.event.experienceLevel.title}
                    </div>
                  </div>
                </>
              )}

              {loaderData.event.tags.length > 0 && (
                <>
                  <div className="text-xs leading-5 pt-[7px]">Tags</div>
                  <div className="event-tags -m-1">
                    {loaderData.event.tags.map((item, index) => {
                      return (
                        <div key={`tags-${index}`} className="badge">
                          {item.tag.title}
                        </div>
                      );
                    })}
                  </div>
                </>
              )}

              {loaderData.event.areas.length > 0 && (
                <>
                  <div className="text-xs leading-5 pt-[7px]">Gebiete</div>
                  <div className="event-tags -m-1">
                    {loaderData.event.areas.map((item, index) => {
                      return (
                        <div key={`areas-${index}`} className="badge">
                          {item.area.name}
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>

            {loaderData.event.speakers !== null &&
              loaderData.event.speakers.length > 0 && (
                <>
                  <h3 className="mt-16 mb-8 font-bold">Speaker:innen</h3>
                  <div className="grid grid-cols-3 gap-4 mb-16">
                    {loaderData.event.speakers.map((speaker) => {
                      const { profile } = speaker;
                      return (
                        <div key={profile.username}>
                          <Link
                            className="flex flex-row"
                            to={`/profile/${profile.username}`}
                          >
                            <div className="h-11 w-11 bg-primary text-white text-xl flex items-center justify-center rounded-full overflow-hidden shrink-0 border">
                              {profile.avatar !== null &&
                              profile.avatar !== "" ? (
                                <img
                                  src={profile.avatar}
                                  alt={
                                    profile.firstName + " " + profile.lastName
                                  }
                                />
                              ) : (
                                getInitials(profile)
                              )}
                            </div>

                            <div className="pl-4">
                              <h5 className="text-sm m-0 font-bold">
                                {`${profile.academicTitle || ""} ${
                                  profile.firstName
                                } ${profile.lastName}`.trimStart()}
                              </h5>
                              <p className="text-sm m-0 line-clamp-2">
                                {profile.position}
                              </p>
                            </div>
                          </Link>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            {loaderData.event.childEvents.length > 0 && (
              <>
                <h3 id="child-events" className="mt-16 mb-8 font-bold">
                  Subveranstaltungen
                </h3>
                <div className="mb-16">
                  {loaderData.event.childEvents.map((event, index) => {
                    const startTime = new Date(event.startTime);
                    const endTime = new Date(event.endTime);
                    return (
                      <div
                        key={`child-event-${index}`}
                        className="rounded-lg bg-white shadow-xl border border-neutral-300  mb-2 flex items-stretch overflow-hidden"
                      >
                        <div className="w-40 shrink-0">
                          {event.background !== undefined && (
                            <img
                              src={
                                event.background ||
                                "/images/default-event-background.jpg"
                              }
                              alt={event.name}
                              className="cover w-full h-full"
                            />
                          )}
                        </div>
                        <Link className="px-4 py-6" to={`/event/${event.slug}`}>
                          <p className="text-xs mb-1">
                            {/* TODO: Display icons (see figma) */}
                            {event.stage !== null && event.stage.title + " | "}
                            {getDuration(startTime, endTime)}
                            {event._count.childEvents === 0 && (
                              <>
                                {event.participantLimit === null
                                  ? " | Unbegrenzte Plätze"
                                  : ` | ${
                                      event.participantLimit -
                                      event._count.participants
                                    } / ${event.participantLimit} Plätzen frei`}
                              </>
                            )}
                            {event.participantLimitReached && (
                              <>
                                {" "}
                                |{" "}
                                <span>
                                  {event._count.waitingList} auf der Warteliste
                                </span>
                              </>
                            )}
                          </p>
                          <h4 className="font-bold text-base m-0">
                            {event.name}
                          </h4>
                          {event.subline !== null && (
                            <p className="text-xs mt-1">{event.subline}</p>
                          )}
                        </Link>

                        {loaderData.mode === "owner" && !event.canceled && (
                          <>
                            {event.published ? (
                              <div className="flex font-semibold items-center ml-auto border-r-8 border-green-600 pr-4 py-6 text-green-600">
                                Veröffentlicht
                              </div>
                            ) : (
                              <div className="flex font-semibold items-center ml-auto border-r-8 border-blue-300 pr-4 py-6 text-blue-300">
                                Entwurf
                              </div>
                            )}
                          </>
                        )}
                        {event.canceled && (
                          <div className="flex font-semibold items-center ml-auto border-r-8 border-salmon-500 pr-4 py-6 text-salmon-500">
                            Abgesagt
                          </div>
                        )}
                        {"isParticipant" in event &&
                          event.isParticipant &&
                          !event.canceled && (
                            <div className="flex font-semibold items-center ml-auto border-r-8 border-green-500 pr-4 py-6 text-green-600">
                              <p>Angemeldet</p>
                            </div>
                          )}
                        {"isParticipant" in event && canUserParticipate(event) && (
                          <div className="flex items-center ml-auto pr-4 py-6">
                            <AddParticipantButton
                              action={`/event/${event.slug}/settings/participants/add-participant`}
                              userId={loaderData.userId}
                              eventId={event.id}
                              email={loaderData.email}
                            />
                          </div>
                        )}
                        {"isParticipant" in event &&
                          event.isOnWaitingList &&
                          !event.canceled && (
                            <div className="flex font-semibold items-center ml-auto border-r-8 border-neutral-500 pr-4 py-6">
                              <p>Wartend</p>
                            </div>
                          )}
                        {"isParticipant" in event &&
                          canUserBeAddedToWaitingList(event) && (
                            <div className="flex items-center ml-auto pr-4 py-6">
                              <AddToWaitingListButton
                                action={`/event/${event.slug}/settings/participants/add-to-waiting-list`}
                                userId={loaderData.userId}
                                eventId={event.id}
                                email={loaderData.email}
                              />
                            </div>
                          )}
                        {"isParticipant" in event &&
                          !event.isParticipant &&
                          !canUserParticipate(event) &&
                          !event.isOnWaitingList &&
                          !canUserBeAddedToWaitingList(event) &&
                          !event.canceled && (
                            <div className="flex items-center ml-auto pr-4 py-6">
                              <Link
                                to={`/event/${event.slug}`}
                                className="btn btn-primary"
                              >
                                Mehr erfahren...
                              </Link>
                            </div>
                          )}
                      </div>
                    );
                  })}
                </div>
              </>
            )}

            {loaderData.event.teamMembers.length > 0 && (
              <>
                <h3 className="mt-16 mb-8 font-bold">Team</h3>
                <div className="grid grid-cols-3 gap-4">
                  {loaderData.event.teamMembers.map((member, index) => {
                    return (
                      <div key={`team-member-${index}`}>
                        <Link
                          className="flex flex-row"
                          to={`/profile/${member.profile.username}`}
                        >
                          <div className="h-11 w-11 bg-primary text-white text-xl flex items-center justify-center rounded-full overflow-hidden shrink-0 border">
                            {member.profile.avatar !== null &&
                            member.profile.avatar !== "" ? (
                              <img
                                src={member.profile.avatar}
                                alt={
                                  member.profile.firstName +
                                  " " +
                                  member.profile.lastName
                                }
                              />
                            ) : (
                              getInitials(member.profile)
                            )}
                          </div>

                          <div className="pl-4">
                            <h5 className="text-sm m-0 font-bold">
                              {member.profile.firstName +
                                " " +
                                member.profile.lastName}
                            </h5>
                            <p className="text-sm m-0 line-clamp-2">
                              {member.profile.position}
                            </p>
                          </div>
                        </Link>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
            {loaderData.event.responsibleOrganizations.length > 0 && (
              <>
                <h3 className="mt-16 mb-8 font-bold">Veranstaltet von</h3>
                <div className="grid grid-cols-3 gap-4">
                  {loaderData.event.responsibleOrganizations.map(
                    (item, index) => {
                      return (
                        <div key={`organizer-${index}`}>
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
                                {getOrganizationInitials(
                                  item.organization.name
                                )}
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
                    }
                  )}
                </div>
              </>
            )}

            {loaderData.event.participants !== null &&
              loaderData.event.participants.length > 0 && (
                <>
                  <h3 className="mt-16 mb-8 font-bold">Teilnehmer:innen</h3>
                  <div className="grid grid-cols-3 gap-4">
                    {loaderData.event.participants.map((participant) => {
                      const { profile } = participant;
                      return (
                        <div key={profile.username}>
                          <Link
                            className="flex flex-row"
                            to={`/profile/${profile.username}`}
                          >
                            <div className="h-11 w-11 bg-primary text-white text-xl flex items-center justify-center rounded-full overflow-hidden shrink-0 border">
                              {profile.avatar !== null &&
                              profile.avatar !== "" ? (
                                <img
                                  src={profile.avatar}
                                  alt={
                                    profile.firstName + " " + profile.lastName
                                  }
                                />
                              ) : (
                                getInitials(profile)
                              )}
                            </div>

                            <div className="pl-4">
                              <h5 className="text-sm m-0 font-bold">
                                {`${profile.academicTitle || ""} ${
                                  profile.firstName
                                } ${profile.lastName}`.trimStart()}
                              </h5>
                              <p className="text-sm m-0 line-clamp-2">
                                {profile.position}
                              </p>
                            </div>
                          </Link>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
          </div>
        </div>
      </div>
    </>
  );
}

export default Index;
