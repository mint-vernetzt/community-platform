import { ActionFunction, Link, LoaderFunction, useLoaderData } from "remix";
import { makeDomainFunction } from "remix-domains";
import { Form as RemixForm, performMutation } from "remix-forms";
import { badRequest, forbidden } from "remix-utils";
import { z } from "zod";
import { getUserByRequest, getUserByRequestOrThrow } from "~/auth.server";
import { checkFeatureAbilitiesOrThrow } from "~/lib/utils/application";
import { getParamValueOrThrow } from "~/lib/utils/routes";
import {
  connectParticipantToEvent,
  connectToWaitingListOfEvent,
  disconnectFromWaitingListOfEvent,
  disconnectParticipantFromEvent,
} from "./settings/participants/utils.server";
import { checkIdentityOrThrow } from "./settings/utils.server";
import {
  deriveMode,
  getEventBySlugOrThrow,
  getFullDepthOrganizers,
  getFullDepthParticipants,
  getFullDepthSpeaker,
} from "./utils.server";

const schema = z.object({
  userId: z.string(),
  eventId: z.string(),
  submit: z.string(),
});

const environmentSchema = z.object({
  id: z.string(),
  reachedParticipantLimit: z.boolean(),
  reachedParticipationDeadline: z.boolean(),
});

type LoaderData = {
  mode: Awaited<ReturnType<typeof deriveMode>>;
  event: Awaited<ReturnType<typeof getEventBySlugOrThrow>>;
  userId?: string;
  fullDepthParticipants: Awaited<ReturnType<typeof getFullDepthParticipants>>;
  fullDepthSpeaker: Awaited<ReturnType<typeof getFullDepthSpeaker>>;
  fullDepthOrganizers: Awaited<ReturnType<typeof getFullDepthOrganizers>>;
};

export const loader: LoaderFunction = async (args): Promise<LoaderData> => {
  const { request, params } = args;
  const { slug } = params;
  await checkFeatureAbilitiesOrThrow(request, "events");

  if (slug === undefined || typeof slug !== "string") {
    throw badRequest({ message: '"slug" missing' });
  }

  const currentUser = await getUserByRequest(request);
  const event = await getEventBySlugOrThrow(slug);

  const mode = await deriveMode(event, currentUser);

  if (mode !== "owner" && event.published === false) {
    throw forbidden({ message: "Event not published" });
  }

  const fullDepthParticipants = await getFullDepthParticipants(event.id);
  const fullDepthSpeaker = await getFullDepthSpeaker(event.id);
  const fullDepthOrganizers = await getFullDepthOrganizers(event.id);

  return {
    mode,
    event,
    fullDepthParticipants,
    fullDepthSpeaker,
    userId: currentUser?.id || undefined,
    fullDepthOrganizers,
  };
};

const mutation = makeDomainFunction(
  schema,
  environmentSchema
)(async (values, environment) => {
  if (values.eventId !== environment.id) {
    throw "Id nicht korrekt.";
  }
  if (environment.reachedParticipationDeadline) {
    throw "Teilnahmefrist bereits abgelaufen.";
  }
  if (values.submit === "participate") {
    if (environment.reachedParticipantLimit) {
      throw "Maximale Teilnehmerzahl erreicht.";
    } else {
      try {
        await connectParticipantToEvent(values.eventId, values.userId);
      } catch (error) {
        throw "An der Veranstaltung konnte nicht teilgenommen werden.";
      }
    }
  } else if (values.submit === "addToWaitingList") {
    try {
      await connectToWaitingListOfEvent(values.eventId, values.userId);
    } catch (error) {
      throw "Das Hinzufügen zur Warteliste ist leider gescheitert.";
    }
  } else if (values.submit === "revokeParticipation") {
    try {
      await disconnectParticipantFromEvent(values.eventId, values.userId);
    } catch (error) {
      throw "Das Entfernen von der Teilnehmerliste ist leider gescheitert.";
    }
  } else if (values.submit === "removeFromWaitingList") {
    try {
      await disconnectFromWaitingListOfEvent(values.eventId, values.userId);
    } catch (error) {
      throw "Das Entfernen von der Warteliste ist leider gescheitert.";
    }
  } else {
    throw "Unzulässige Operation";
  }
  return values;
});

type ActionData = any;

export const action: ActionFunction = async (args): Promise<ActionData> => {
  const { request, params } = args;

  await checkFeatureAbilitiesOrThrow(request, "events");

  const slug = getParamValueOrThrow(params, "slug");

  const currentUser = await getUserByRequestOrThrow(request);

  await checkIdentityOrThrow(request, currentUser);

  const event = await getEventBySlugOrThrow(slug);

  const result = await performMutation({
    request,
    schema,
    mutation,
    environment: {
      id: event.id,
      reachedParticipantLimit: reachedParticipantLimit(event),
      reachedParticipationDeadline: reachedParticipateDeadline(event),
    },
  });

  return result;
};

function reachedParticipateDeadline(
  event: Pick<LoaderData["event"], "participationUntil">
) {
  const participationUntil = new Date(event.participationUntil).getTime();
  return Date.now() > participationUntil;
}

function isUserParticipating(
  event: Pick<LoaderData["event"], "participants">,
  userId: LoaderData["userId"]
) {
  return event.participants.some((participant) => {
    return participant.profile.id === userId;
  });
}

function isUserOnWaitingList(
  event: Pick<LoaderData["event"], "waitingList">,
  userId: LoaderData["userId"]
) {
  return event.waitingList.some((waitingUser) => {
    return waitingUser.profile.id === userId;
  });
}

function reachedParticipantLimit(
  event: Pick<LoaderData["event"], "participants" | "participantLimit">
) {
  if (event.participantLimit === null) {
    return false;
  }
  return event.participants.length >= event.participantLimit;
}

function createParticipationOption(
  isParticipating: boolean,
  isOnWaitingList: boolean,
  participantLimitReached: boolean
) {
  let participationOption = {
    value: "",
    buttonLabel: "",
  };

  if (isParticipating) {
    participationOption.value = "revokeParticipation";
    participationOption.buttonLabel = "Nicht mehr teilnehmen";
  } else if (isOnWaitingList) {
    participationOption.value = "removeFromWaitingList";
    participationOption.buttonLabel = "Von der Warteliste entfernen";
  } else {
    if (participantLimitReached) {
      participationOption.value = "addToWaitingList";
      participationOption.buttonLabel = "Auf die Warteliste";
    } else {
      participationOption.value = "participate";
      participationOption.buttonLabel = "Teilnehmen";
    }
  }

  return participationOption;
}

function Index() {
  const loaderData = useLoaderData<LoaderData>();

  // Should functions like these be called inside the loader?
  const reachedParticipationDeadline = reachedParticipateDeadline(
    loaderData.event
  );
  const isParticipating = isUserParticipating(
    loaderData.event,
    loaderData.userId
  );
  const isOnWaitingList = isUserOnWaitingList(
    loaderData.event,
    loaderData.userId
  );
  const participantLimitReached = reachedParticipantLimit(loaderData.event);
  const participationOption = createParticipationOption(
    isParticipating,
    isOnWaitingList,
    participantLimitReached
  );

  const startTime = new Date(loaderData.event.startTime);
  const endTime = new Date(loaderData.event.endTime);

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

  console.log(duration);

  return (
    <>
      <div className="mb-4 ml-4">
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
            {loaderData.mode !== "anon" && (
              <RemixForm method="post" schema={schema}>
                {({ Field, Errors }) => (
                  <>
                    <Field
                      name="userId"
                      hidden
                      value={loaderData.userId || ""}
                    />
                    <Field name="eventId" hidden value={loaderData.event.id} />
                    <Field
                      name="submit"
                      hidden
                      value={participationOption.value}
                    />
                    <button className="btn btn-primary" type="submit">
                      {participationOption.buttonLabel}
                    </button>
                    <Errors />
                  </>
                )}
              </RemixForm>
            )}
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
        <h3>Published: {String(loaderData.event.published)}</h3>
        <h3>Start: {loaderData.event.startTime}</h3>
        <h3>End: {loaderData.event.endTime}</h3>
        <h3>Venue</h3>
        {loaderData.event.venueName !== null && (
          <h5>
            {loaderData.event.venueName}, {loaderData.event.venueStreet}{" "}
            {loaderData.event.venueStreetNumber},{" "}
            {loaderData.event.venueZipCode} {loaderData.event.venueCity}
          </h5>
        )}
        <h3>Participation until: {loaderData.event.participationUntil}</h3>
        <h3>Participant limit: {loaderData.event.participantLimit}</h3>
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
                return (
                  <li key={`child-event-${index}`}>
                    -{" "}
                    <Link
                      className="underline hover:no-underline"
                      to={`/event/${childEvent.slug}`}
                    >
                      {childEvent.name}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </>
        )}
        {loaderData.fullDepthParticipants !== null &&
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
          )}
        {loaderData.mode === "owner" &&
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
          )}
        {loaderData.fullDepthSpeaker !== null &&
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
          )}
        {loaderData.fullDepthOrganizers !== null &&
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
          )}
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
