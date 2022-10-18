import { GravityType } from "imgproxy/dist/types";
import { Link, LoaderFunction, useLoaderData } from "remix";
import { badRequest, forbidden, notFound } from "remix-utils";
import { getUserByRequest } from "~/auth.server";
import { getImageURL } from "~/images.server";
import { getInitials } from "~/lib/profile/getInitials";
import { checkFeatureAbilitiesOrThrow } from "~/lib/utils/application";
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
  getIsOnWaitingList,
  getIsParticipant,
  MaybeEnhancedEvent,
} from "./utils.server";

type LoaderData = {
  mode: Awaited<ReturnType<typeof deriveMode>>;
  event: MaybeEnhancedEvent;
  // TODO: move "is"-Properties to event
  isParticipant: boolean | undefined;
  isOnWaitingList: boolean | undefined;
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

  if (currentUser !== null) {
    isParticipant = await getIsParticipant(currentUser.id, enhancedEvent.id);
    isOnWaitingList = await getIsOnWaitingList(
      currentUser.id,
      enhancedEvent.id
    );
  }

  if (event.background !== null) {
    const publicURL = getPublicURL(event.background);
    if (publicURL) {
      event.background = getImageURL(publicURL, {
        resize: { type: "fit", width: 1488, height: 480 },
      });
    }
  }

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
  };
};

function getDuration(startTime: Date, endTime: Date) {
  let duration: string;

  const formattedStartDate = startTime.toLocaleDateString("de-DE", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
  const formattedEndDate = endTime.toLocaleDateString("de-DE", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });

  const sameYear = startTime.getFullYear() === endTime.getFullYear();
  const sameMonth = sameYear && startTime.getMonth() === endTime.getMonth();
  const sameDay = formattedStartDate === formattedEndDate;

  if (sameDay) {
    // 01. Januar 2022
    duration = startTime.toLocaleDateString("de-DE", {
      year: "numeric",
      month: "long",
      day: "2-digit",
    });
  } else if (sameMonth) {
    // 01. - 02. Januar 2022
    duration = `${startTime.toLocaleDateString("de-DE", {
      day: "2-digit",
    })}. - ${endTime.toLocaleDateString("de-DE", {
      year: "numeric",
      month: "long",
      day: "2-digit",
    })}`;
  } else if (sameYear) {
    // 01. Jan - 02. Feb 2022
    duration = `${startTime.toLocaleDateString("de-DE", {
      day: "2-digit",
      month: "short",
    })} - ${formattedEndDate}`;
  } else {
    // 01. Jan 2022 - 02. Feb 2021
    duration = `${formattedStartDate} - ${formattedEndDate}`;
  }

  return duration;
}

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

  const reachedParticipationDeadline =
    new Date() > new Date(loaderData.event.participationUntil);

  const Form = getForm(loaderData);

  const startTime = new Date(loaderData.event.startTime);
  const endTime = new Date(loaderData.event.endTime);

  const duration = getDuration(startTime, endTime);

  return (
    <>
      <section className="hidden md:block container mt-8 md:mt-10 lg:mt-20">
        <div className="rounded-3xl overflow-hidden w-full">
          <div className="relative overflow-hidden bg-yellow-500 w-full aspect-[31/10]">
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
          {reachedParticipationDeadline ? (
            <div className="bg-accent-300 p-8">
              <p className="font-bold text-center">
                Teilnahmefrist bereits abgelaufen.
              </p>
            </div>
          ) : (
            <>
              {loaderData.mode === "anon" && (
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
                  Wähle Sub-Veranstaltungen aus, an denen Du teilnehmen
                  möchtest.
                </p>
              </div>
            </>
          )}
        </div>
      </section>
      <div className="container relative pt-20 pb-44">
        <div className="flex -mx-4 justify-center">
          <div className="md:flex-1/2 px-4 pt-10 lg:pt-0">
            <p className="font-bold text-xl mb-8">{duration}</p>
            <header className="mb-8">
              <h1 className="m-0">{loaderData.event.name}</h1>
              <p className="font-bold text-xl mt-2">
                Subheader noch nicht implementiert.
              </p>
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
                    <a href={loaderData.event.conferenceLink} target="_blank">
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
                            <p> - {item.document.description}</p>
                          )}
                        </div>
                      );
                    })}
                    <Link
                      className="btn btn-outline btn-primary btn-small mt-4"
                      to={`/event/${loaderData.event.slug}/documents-download`}
                      reloadDocument
                    >
                      Alle Herunterladen
                    </Link>
                  </div>
                </>
              )}
            </div>

            <div className="event-tags mt-6 -mx-1">
              {loaderData.event.focuses.map((item, index) => {
                return (
                  <button key={`focus-${index}`} className="badge">
                    {item.focus.title}
                  </button>
                );
              })}
              {loaderData.event.targetGroups.map((item, index) => {
                return (
                  <button key={`target-groups-${index}`} className="badge">
                    {item.targetGroup.title}
                  </button>
                );
              })}

              {loaderData.event.tags.map((item, index) => {
                return (
                  <button key={`tags-${index}`} className="badge">
                    {item.tag.title}
                  </button>
                );
              })}
            </div>

            <div className="grid grid-cols-[minmax(100px,_1fr)_4fr] gap-x-4 gap-y-6 mt-6">
              {loaderData.event.teamMembers.length > 0 && (
                <>
                  <div className="text-xs leading-6">Team</div>
                  <div className="grid grid-cols-2 gap-4">
                    {loaderData.event.teamMembers.map((member, index) => {
                      return (
                        <div key={`team-member-${index}`}>
                          <Link
                            className="flex flex-row"
                            to={`/profile/${member.profile.username}`}
                          >
                            <div className="h-11 w-11 bg-primary text-white text-xl flex items-center justify-center rounded-full overflow-hidden shrink-0">
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
                              <p className="text-sm m-0">
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

              {loaderData.event.speakers !== null && (
                <>
                  <div className="text-xs leading-6">Speaker:innen</div>
                  <div className="grid grid-cols-2 gap-4">
                    {loaderData.event.speakers.map((speaker) => {
                      const { profile } = speaker;
                      return (
                        <div key={profile.username}>
                          <Link
                            className="flex flex-row"
                            to={`/profile/${profile.username}`}
                          >
                            <div className="h-11 w-11 bg-primary text-white text-xl flex items-center justify-center rounded-full overflow-hidden shrink-0">
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
                              <p className="text-sm m-0">{profile.position}</p>
                            </div>
                          </Link>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>

            {loaderData.event.childEvents.length > 0 && (
              <>
                <h3 className="mt-16 font-bold">Subveranstaltungen</h3>
                <div>
                  {loaderData.event.childEvents.map((childEvent, index) => {
                    console.log(childEvent);
                    const hasChildEvents = childEvent._count.childEvents > 0;
                    const hasLimit = childEvent.participantLimit !== null;
                    const isAnon = loaderData.userId === undefined;
                    let isParticipant = false;
                    let isOnWaitingList = false;
                    if ("isParticipant" in childEvent) {
                      isParticipant = childEvent.isParticipant;
                      isOnWaitingList = childEvent.isOnWaitingList;
                    }
                    const limitReached =
                      childEvent.participantLimit !== null
                        ? childEvent.participantLimit <=
                          childEvent._count.participants
                        : false;

                    const childStartTime = new Date(childEvent.startTime);
                    const childEndTime = new Date(childEvent.endTime);

                    const childDuration = getDuration(
                      childStartTime,
                      childEndTime
                    );
                    return (
                      <div
                        key={`child-event-${index}`}
                        className="rounded-lg bg-white shadow-xl border border-neutral-300 px-4 py-6 mb-2 flex item-stretch"
                      >
                        <Link
                          className="underline hover:no-underline"
                          to={`/event/${childEvent.slug}`}
                        >
                          <p className="text-xs">
                            {hasChildEvents && <span>{childDuration}</span>}
                            {!hasChildEvents && (
                              <span>
                                Ausgabe: Startdatum | Start Uhrzeit - Ende
                                Uhrzeit
                              </span>
                            )}
                          </p>
                          {childEvent.name}
                        </Link>
                        {!hasChildEvents && isAnon && (
                          <div className="flex item-center ml-auto">
                            <Link
                              className="btn btn-primary"
                              to={`/login?event_slug=${childEvent.slug}`}
                            >
                              Anmelden um teilzunehmen
                            </Link>
                          </div>
                        )}
                        {!hasChildEvents && isParticipant && <p>Angemeldet!</p>}
                        {!hasChildEvents && isOnWaitingList && (
                          <p>Auf Warteliste!</p>
                        )}
                        {!hasChildEvents &&
                          (!hasLimit || (hasLimit && !limitReached)) &&
                          !isParticipant && (
                            <AddParticipantButton
                              action={`/event/${childEvent.slug}/settings/participants/add-participant`}
                              userId={loaderData.userId}
                              eventId={childEvent.id}
                              email={loaderData.email}
                            />
                          )}
                        {!hasChildEvents &&
                          hasLimit &&
                          limitReached &&
                          !isOnWaitingList &&
                          !isParticipant && (
                            <AddToWaitingListButton
                              action={`/event/${childEvent.slug}/settings/participants/add-to-waiting-list`}
                              userId={loaderData.userId}
                              eventId={childEvent.id}
                              email={loaderData.email}
                            />
                          )}
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
      <div className="mb-4 ml-4">
        {loaderData.event.documents.length > 0 && (
          <div className="my-8">
            <h3>Aktuelle Dokumente</h3>
            <ul>
              {loaderData.event.documents.map((item, index) => {
                return (
                  <div key={`document-${index}`} className="mb-2">
                    <Link
                      className="underline hover:no-underline"
                      to={`/event/${loaderData.event.slug}/documents-download?document_id=${item.document.id}`}
                      reloadDocument
                    >
                      {item.document.title || item.document.filename}
                    </Link>
                    {item.document.description && (
                      <p> - {item.document.description}</p>
                    )}
                  </div>
                );
              })}
            </ul>
            <Link
              className="btn btn-outline btn-primary mt-4"
              to={`/event/${loaderData.event.slug}/documents-download`}
              reloadDocument
            >
              Alle Herunterladen
            </Link>
          </div>
        )}
        <h3>Published: {String(loaderData.event.published)}</h3>

        <h3>
          Experience Level: {loaderData.event.experienceLevel?.title || ""}
        </h3>
        <h3>Types</h3>
        <ul>
          {loaderData.event.types.map((item, index) => {
            return <li key={`types-${index}`}>{item.eventType.title}</li>;
          })}
        </ul>
        <h3>Tags</h3>
        <ul></ul>
        <h3>Areas</h3>
        <ul>
          <div className="lg:flex-auto">
            {loaderData.event.areas.map((item) => item.area.name).join(" / ")}
          </div>
        </ul>

        {loaderData.event.parentEvent !== null && (
          <h3>
            Parent Event:{" "}
            <Link
              className="underline hover:no-underline"
              to={`/event/${loaderData.event.parentEvent.slug}`}
            >
              {loaderData.event.parentEvent.name}
            </Link>
          </h3>
        )}
        {loaderData.event.childEvents.length > 0 && (
          <>
            <h3>Child Events:</h3>
            <ul>
              {loaderData.event.childEvents.map((childEvent, index) => {
                console.log(childEvent);
                const hasChildEvents = childEvent._count.childEvents > 0;
                const hasLimit = childEvent.participantLimit !== null;
                const isAnon = loaderData.userId === undefined;
                let isParticipant = false;
                let isOnWaitingList = false;
                if ("isParticipant" in childEvent) {
                  isParticipant = childEvent.isParticipant;
                  isOnWaitingList = childEvent.isOnWaitingList;
                }
                const limitReached =
                  childEvent.participantLimit !== null
                    ? childEvent.participantLimit <=
                      childEvent._count.participants
                    : false;
                return (
                  <li key={`child-event-${index}`}>
                    -{" "}
                    <Link
                      className="underline hover:no-underline"
                      to={`/event/${childEvent.slug}`}
                    >
                      {childEvent.name}
                    </Link>
                    {!hasChildEvents && isAnon && (
                      <Link
                        className="btn btn-primary"
                        to={`/login?event_slug=${childEvent.slug}`}
                      >
                        Anmelden um teilzunehmen
                      </Link>
                    )}
                    {!hasChildEvents && isParticipant && <p>Angemeldet!</p>}
                    {!hasChildEvents && isOnWaitingList && (
                      <p>Auf Warteliste!</p>
                    )}
                    {!hasChildEvents &&
                      (!hasLimit || (hasLimit && !limitReached)) &&
                      !isParticipant && (
                        <AddParticipantButton
                          action={`/event/${childEvent.slug}/settings/participants/add-participant`}
                          userId={loaderData.userId}
                          eventId={childEvent.id}
                          email={loaderData.email}
                        />
                      )}
                    {!hasChildEvents &&
                      hasLimit &&
                      limitReached &&
                      !isOnWaitingList &&
                      !isParticipant && (
                        <AddToWaitingListButton
                          action={`/event/${childEvent.slug}/settings/participants/add-to-waiting-list`}
                          userId={loaderData.userId}
                          eventId={childEvent.id}
                          email={loaderData.email}
                        />
                      )}
                  </li>
                );
              })}
            </ul>
          </>
        )}
        {loaderData.event.participants !== null && (
          <>
            <h1>Participants</h1>
            <ul>
              {loaderData.event.participants.map((participant) => {
                const { profile } = participant;
                return (
                  <li key={profile.username}>
                    <Link
                      className="underline hover:no-underline"
                      to={`/profile/${profile.username}`}
                    >
                      {`${profile.academicTitle || ""} ${profile.firstName} ${
                        profile.lastName
                      }`.trimStart()}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </>
        )}
        {loaderData.event.speakers !== null && (
          <>
            <h1>Speakers</h1>
            <ul>
              {loaderData.event.speakers.map((speaker) => {
                const { profile } = speaker;
                return (
                  <li key={profile.username}>
                    <Link
                      className="underline hover:no-underline"
                      to={`/profile/${profile.username}`}
                    >
                      {`${profile.academicTitle || ""} ${profile.firstName} ${
                        profile.lastName
                      }`.trimStart()}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </>
        )}

        {/* {loaderData.fullDepthParticipants !== null &&
          loaderData.fullDepthParticipants.length > 0 && (
            <>
              <h3 className="mt-4">Teilnehmer*innen:</h3>
              <ul>
                {loaderData.fullDepthParticipants.map((profile, index) => {
                  return (
                    <li key={`participant-${index}`}>
                      -{" "}
                      <Link
                        className="underline hover:no-underline"
                        to={`/profile/${profile.username}`}
                      >
                        {profile.firstName + " " + profile.lastName}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </>
          )} */}
        {/* {loaderData.mode === "owner" &&
          loaderData.event.waitingList.length > 0 && (
            <>
              <h3 className="mt-4">Warteliste:</h3>
              <ul>
                {loaderData.event.waitingList.map(
                  (waitingParticipant, index) => {
                    return (
                      <li key={`waiting-participant-${index}`}>
                        -{" "}
                        <Link
                          className="underline hover:no-underline"
                          to={`/profile/${waitingParticipant.profile.username}`}
                        >
                          {waitingParticipant.profile.firstName +
                            " " +
                            waitingParticipant.profile.lastName}
                        </Link>
                      </li>
                    );
                  }
                )}
              </ul>
            </>
          )} */}
        {/* {loaderData.fullDepthSpeaker !== null &&
          loaderData.fullDepthSpeaker.length > 0 && (
            <>
              <h3 className="mt-4">Speaker*innen:</h3>
              <ul>
                {loaderData.fullDepthSpeaker.map((profile, index) => {
                  return (
                    <li key={`speaker-${index}`}>
                      -{" "}
                      <Link
                        className="underline hover:no-underline"
                        to={`/profile/${profile.username}`}
                      >
                        {profile.firstName + " " + profile.lastName}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </>
          )} */}
        {/* {loaderData.fullDepthOrganizers !== null &&
          loaderData.fullDepthOrganizers.length > 0 && (
            <>
              <h3 className="mt-4">Organisator*innen:</h3>
              <ul>
                {loaderData.fullDepthOrganizers.map((organization, index) => {
                  return (
                    <li key={`organizer-${index}`}>
                      -{" "}
                      <Link
                        className="underline hover:no-underline"
                        to={`/organization/${organization.slug}`}
                      >
                        {organization.name}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </>
          )} */}
        {loaderData.event.teamMembers.length > 0 && (
          <>
            <h3 className="mt-4">Das Team:</h3>
            <ul>
              {loaderData.event.teamMembers.map((member, index) => {
                return (
                  <li key={`team-member-${index}`}>
                    -{" "}
                    <Link
                      className="underline hover:no-underline"
                      to={`/profile/${member.profile.username}`}
                    >
                      {member.profile.firstName + " " + member.profile.lastName}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </div>
      {loaderData.mode === "owner" && (
        <>
          <Link
            className="btn btn-outline btn-primary"
            to={`/event/${loaderData.event.slug}/settings`}
          >
            Veranstaltung bearbeiten
          </Link>
          <Link
            className="btn btn-outline btn-primary"
            to={`/event/create/?child=${loaderData.event.id}`}
          >
            Rahmenveranstaltung anlegen
          </Link>
          <Link
            className="btn btn-outline btn-primary"
            to={`/event/create/?parent=${loaderData.event.id}`}
          >
            Subveranstaltung anlegen
          </Link>
        </>
      )}
    </>
  );
}

export default Index;
