import { GravityType } from "imgproxy/dist/types";
import { Link, LoaderFunction, useLoaderData } from "remix";
import { badRequest, forbidden, notFound } from "remix-utils";
import { getUserByRequest } from "~/auth.server";
import { H3 } from "~/components/Heading/Heading";
import { getImageURL } from "~/images.server";
import { getInitials } from "~/lib/profile/getInitials";
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
          <a href="/explore">Veranstaltungen</a>
          {loaderData.event.parentEvent !== null && (
            <>
              <span className="mx-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  fill="currentColor"
                  viewBox="0 0 16 16"
                >
                  <path
                    fill-rule="evenodd"
                    d="M4.646 1.646a.5.5 0 0 1 .708 0l6 6a.5.5 0 0 1 0 .708l-6 6a.5.5 0 0 1-.708-.708L10.293 8 4.646 2.354a.5.5 0 0 1 0-.708z"
                  />
                </svg>
              </span>
              <Link
                className=""
                to={`/event/${loaderData.event.parentEvent.slug}`}
              >
                {loaderData.event.parentEvent.name}
              </Link>
            </>
          )}
        </div>
        <div className="font-semi text-neutral-600 flex items-center">
          <a href="#" className="flex items-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              className="h-auto w-6"
              fill="currentColor"
              viewBox="0 0 16 16"
            >
              <path
                fill-rule="evenodd"
                d="M15 8a.5.5 0 0 0-.5-.5H2.707l3.147-3.146a.5.5 0 1 0-.708-.708l-4 4a.5.5 0 0 0 0 .708l4 4a.5.5 0 0 0 .708-.708L2.707 8.5H14.5A.5.5 0 0 0 15 8z"
              />
            </svg>
            <span className="ml-2">zurück</span>
          </a>
        </div>
      </section>
      <section className="hidden md:block container mt-6">
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
            </>
          )}
        </div>
        {loaderData.mode === "owner" && (
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
                to={`/event/create/?child=${loaderData.event.id}`}
              >
                Rahmenveranstaltung anlegen
              </Link>
              <Link
                className="btn btn-primary ml-4"
                to={`/event/create/?parent=${loaderData.event.id}`}
              >
                Subveranstaltung anlegen
              </Link>
            </p>
          </div>
        )}
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
              {loaderData.event.areas.map((item, index) => {
                return (
                  <button key={`areas-${index}`} className="badge">
                    {item.area.name}
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
                <h3 className="mt-16 mb-8 font-bold">Subveranstaltungen</h3>
                <div className="mb-16">
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

                    let freeSpaces =
                      childEvent.participantLimit -
                      childEvent._count.participants;

                    const childStartTime = new Date(childEvent.startTime);
                    const childEndTime = new Date(childEvent.endTime);

                    const childDuration = getDuration(
                      childStartTime,
                      childEndTime
                    );
                    return (
                      <div
                        key={`child-event-${index}`}
                        className="rounded-lg bg-white shadow-xl border border-neutral-300  mb-2 flex items-stretch overflow-hidden"
                      >
                        <div className="w-40 shrink-0">
                          {childEvent.background !== undefined && (
                            <img
                              src={
                                childEvent.background ||
                                "/images/default-event-background.jpg"
                              }
                              alt={childEvent.name}
                              className="cover w-full h-full"
                            />
                          )}
                        </div>
                        <Link
                          className="px-4 py-6"
                          to={`/event/${childEvent.slug}`}
                        >
                          <p className="text-xs mb-1">
                            {hasChildEvents && <span>{childDuration}</span>}
                            {!hasChildEvents && (
                              <span>
                                Ausgabe: Startdatum | Start Uhrzeit - Ende
                                Uhrzeit
                              </span>
                            )}
                            {hasLimit && !limitReached && (
                              <>
                                {" "}
                                |{" "}
                                <span>
                                  {freeSpaces} / {childEvent.participantLimit}{" "}
                                  Plätzen frei
                                </span>
                              </>
                            )}
                            {limitReached && (
                              <>
                                {" "}
                                |{" "}
                                <span>
                                  {childEvent._count.waitingList} auf der
                                  Warteliste
                                </span>
                              </>
                            )}
                          </p>
                          <h4 className="font-bold text-base m-0">
                            {childEvent.name}
                          </h4>
                          <p className="text-xs mt-1">
                            Subheader noch nicht implementiert.
                          </p>
                        </Link>
                        {!hasChildEvents && isAnon && (
                          <div className="flex item-center ml-auto">
                            <Link
                              className="btn btn-primary"
                              to={`/login?event_slug=${childEvent.slug}`}
                            >
                              Anmelden
                            </Link>
                          </div>
                        )}
                        {!hasChildEvents && isParticipant && (
                          <div className="flex font-semibold items-center ml-auto border-r-8 border-green-500 pr-4 py-6 text-green-600">
                            <p>Angemeldet</p>
                          </div>
                        )}
                        {!hasChildEvents && isOnWaitingList && (
                          <div className="flex font-semibold items-center ml-auto border-r-8 border-neutral-500 pr-4 py-6">
                            <p>Wartend</p>
                          </div>
                        )}
                        {!hasChildEvents &&
                          (!hasLimit || (hasLimit && !limitReached)) &&
                          !isParticipant && (
                            <div className="flex items-center ml-auto pr-4 py-6">
                              <AddParticipantButton
                                action={`/event/${childEvent.slug}/settings/participants/add-participant`}
                                userId={loaderData.userId}
                                eventId={childEvent.id}
                                email={loaderData.email}
                              />
                            </div>
                          )}
                        {!hasChildEvents &&
                          hasLimit &&
                          limitReached &&
                          !isOnWaitingList &&
                          !isParticipant && (
                            <div className="flex items-center ml-auto pr-4 py-6">
                              <AddToWaitingListButton
                                action={`/event/${childEvent.slug}/settings/participants/add-to-waiting-list`}
                                userId={loaderData.userId}
                                eventId={childEvent.id}
                                email={loaderData.email}
                              />
                            </div>
                          )}
                      </div>
                    );
                  })}
                </div>
              </>
            )}

            {loaderData.event.participants !== null && (
              <div className="grid grid-cols-[minmax(100px,_1fr)_4fr] gap-x-4 gap-y-6 mt-6">
                <div className="text-xs leading-6">Teilnehmer:innen</div>
                <div className="grid grid-cols-2 gap-4">
                  {loaderData.event.participants.map((participant) => {
                    const { profile } = participant;
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
                                alt={profile.firstName + " " + profile.lastName}
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
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="mb-4 ml-4">
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
      </div>
    </>
  );
}

export default Index;
