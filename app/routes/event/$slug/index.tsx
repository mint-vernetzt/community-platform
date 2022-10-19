import { GravityType } from "imgproxy/dist/types";
import { Link, LoaderFunction, useLoaderData } from "remix";
import { badRequest, forbidden, notFound } from "remix-utils";
import { getUserByRequest } from "~/auth.server";
import { getImageURL } from "~/images.server";
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
  getIsOnWaitingList,
  getIsParticipant,
  getIsSpeaker,
  getIsTeamMember,
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
    isParticipant = await getIsParticipant(currentUser.id, enhancedEvent.id);
    isOnWaitingList = await getIsOnWaitingList(
      currentUser.id,
      enhancedEvent.id
    );
    isSpeaker = await getIsSpeaker(currentUser.id, enhancedEvent.id);
    isTeamMember = await getIsTeamMember(currentUser.id, enhancedEvent.id);
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
      <div className="mb-4 ml-4">
        <img
          src={
            loaderData.event.background ||
            "/images/default-event-background.jpg"
          }
          alt="background"
        />
        <h1>{loaderData.event.name}</h1>
        {reachedParticipationDeadline ? (
          <h3>Teilnahmefrist bereits abgelaufen.</h3>
        ) : (
          <>
            {loaderData.mode === "anon" && (
              <>
                <Link
                  className="btn btn-outline btn-primary"
                  to={`/login?event_slug=${loaderData.event.slug}`}
                >
                  Anmelden um teilzunehmen
                </Link>
              </>
            )}
            {loaderData.mode !== "anon" &&
              loaderData.event.childEvents.length === 0 &&
              Form}
          </>
        )}
        <Link
          className="btn btn-outline btn-primary mt-4"
          to="ics-download"
          reloadDocument
        >
          Kalendereintrag herunterladen
        </Link>
        <p>
          <strong>{duration}</strong>
        </p>
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
        <h3>Start: {formatDateTime(startTime)}</h3>
        <h3>End: {formatDateTime(endTime)}</h3>
        <h3>Venue</h3>
        {loaderData.event.venueName !== null && (
          <h5>
            {loaderData.event.venueName}, {loaderData.event.venueStreet}{" "}
            {loaderData.event.venueStreetNumber},{" "}
            {loaderData.event.venueZipCode} {loaderData.event.venueCity}
          </h5>
        )}
        <h3>
          Participation until:{" "}
          {formatDateTime(new Date(loaderData.event.participationUntil))}
        </h3>
        <h3>
          Participant limit:{" "}
          {loaderData.event.participantLimit === null
            ? "ohne Beschränkung"
            : loaderData.event.participantLimit}
        </h3>
        <h3>Description</h3>
        <p>{loaderData.event.description}</p>
        <h3>Focuses</h3>
        <ul>
          <ul>
            {loaderData.event.focuses
              .map((item) => item.focus.title)
              .join(" / ")}
          </ul>
        </ul>
        <h3>Target Groups</h3>
        <ul>
          {loaderData.event.targetGroups.map((item, index) => {
            return (
              <li key={`target-groups-${index}`}>{item.targetGroup.title}</li>
            );
          })}
        </ul>
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
        <ul>
          {loaderData.event.tags.map((item, index) => {
            return <li key={`tags-${index}`}>{item.tag.title}</li>;
          })}
        </ul>
        <h3>Areas</h3>
        <ul>
          <div className="lg:flex-auto">
            {loaderData.event.areas.map((item) => item.area.name).join(" / ")}
          </div>
        </ul>
        <h3>Conference Link: {loaderData.event.conferenceLink}</h3>
        <h3>Conference Code: {loaderData.event.conferenceCode}</h3>
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
                const hasChildEvents = childEvent._count.childEvents > 0;
                const hasLimit = childEvent.participantLimit !== null;
                const isAnon = loaderData.userId === undefined;
                let isParticipant = false;
                let isOnWaitingList = false;
                let isSpeaker = false;
                let isTeamMember = false;
                if ("isParticipant" in childEvent) {
                  isParticipant = childEvent.isParticipant;
                  isOnWaitingList = childEvent.isOnWaitingList;
                  isSpeaker = childEvent.isSpeaker;
                  isTeamMember = childEvent.isTeamMember;
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
