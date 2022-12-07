import type { LoaderFunction, MetaFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";
import { createServerClient } from "@supabase/auth-helpers-remix";
import { GravityType } from "imgproxy/dist/types";
import rcSliderStyles from "rc-slider/assets/index.css";
import React from "react";
import reactCropStyles from "react-image-crop/dist/ReactCrop.css";
import { useNavigate } from "react-router-dom";
import { badRequest, forbidden, notFound } from "remix-utils";
import { getSessionUser } from "~/auth.server";
import ImageCropper from "~/components/ImageCropper/ImageCropper";
import Modal from "~/components/Modal/Modal";
import { getImageURL } from "~/images.server";
import {
  canUserAccessConferenceLink,
  canUserBeAddedToWaitingList,
  canUserParticipate,
} from "~/lib/event/utils";
import { getInitials } from "~/lib/profile/getInitials";
import { getInitialsOfName } from "~/lib/string/getInitialsOfName";
import { nl2br } from "~/lib/string/nl2br";
import { getFeatureAbilities } from "~/lib/utils/application";
import { getDuration } from "~/lib/utils/time";
import { getPublicURL } from "~/storage.server";
import { AddParticipantButton } from "./settings/participants/add-participant";
import { AddToWaitingListButton } from "./settings/participants/add-to-waiting-list";
import { RemoveFromWaitingListButton } from "./settings/participants/remove-from-waiting-list";
import { RemoveParticipantButton } from "./settings/participants/remove-participant";
import type { MaybeEnhancedEvent } from "./utils.server";
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
} from "./utils.server";

export function links() {
  return [
    { rel: "stylesheet", href: rcSliderStyles },
    { rel: "stylesheet", href: reactCropStyles },
  ];
}

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
  abilities: Awaited<ReturnType<typeof getFeatureAbilities>>;
  // fullDepthParticipants: Awaited<ReturnType<typeof getFullDepthParticipants>>;
  // fullDepthSpeaker: Awaited<ReturnType<typeof getFullDepthSpeaker>>;
  // fullDepthOrganizers: Awaited<ReturnType<typeof getFullDepthOrganizers>>;
};

export const meta: MetaFunction = (args) => {
  return {
    title: `MINTvernetzt Community Plattform | ${args.data.event.name}`,
  };
};

export const loader: LoaderFunction = async (args) => {
  const { request, params } = args;
  const { slug } = params;
  const response = new Response();
  const supabaseClient = createServerClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY,
    {
      request,
      response,
    }
  );
  const abilities = await getFeatureAbilities(supabaseClient, "events");

  if (slug === undefined || typeof slug !== "string") {
    throw badRequest({ message: '"slug" missing' });
  }

  const sessionUser = await getSessionUser(supabaseClient);
  const event = await getEvent(slug);

  if (event === null) {
    throw notFound({ message: `Event not found` });
  }

  const mode = await deriveMode(event, sessionUser);

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
      const publicURL = getPublicURL(supabaseClient, item.profile.avatar);
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
      const publicURL = getPublicURL(supabaseClient, item.profile.avatar);
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

  if (mode !== "anon" && sessionUser !== null) {
    if (event.childEvents.length > 0) {
      participants = (await getFullDepthParticipants(event.id)) || [];
    } else {
      participants = await getEventParticipants(event.id);
    }

    participants = participants.map((item) => {
      if (item.profile.avatar !== null) {
        const publicURL = getPublicURL(supabaseClient, item.profile.avatar);
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
        sessionUser.id,
        enhancedEvent
      );
    }
  }

  let isParticipant;
  let isOnWaitingList;
  let isSpeaker;
  let isTeamMember;

  if (sessionUser !== null) {
    isParticipant = await getIsParticipant(enhancedEvent.id, sessionUser.id);
    isOnWaitingList = await getIsOnWaitingList(
      enhancedEvent.id,
      sessionUser.id
    );
    isSpeaker = await getIsSpeaker(enhancedEvent.id, sessionUser.id);
    isTeamMember = await getIsTeamMember(enhancedEvent.id, sessionUser.id);
  }

  if (enhancedEvent.background !== null) {
    const publicURL = getPublicURL(supabaseClient, enhancedEvent.background);
    if (publicURL) {
      enhancedEvent.background = getImageURL(publicURL, {
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
      const publicURL = getPublicURL(supabaseClient, item.background);
      if (publicURL) {
        item.background = getImageURL(publicURL, {
          resize: { type: "fit", width: 160, height: 160 },
        });
      }
    }
    return item;
  });

  enhancedEvent.responsibleOrganizations =
    enhancedEvent.responsibleOrganizations.map((item) => {
      if (item.organization.logo !== null) {
        const publicURL = getPublicURL(supabaseClient, item.organization.logo);
        if (publicURL) {
          item.organization.logo = getImageURL(publicURL, {
            resize: { type: "fit", width: 144, height: 144 },
          });
        }
      }
      return item;
    });

  if (
    !canUserAccessConferenceLink(
      enhancedEvent,
      isParticipant,
      isSpeaker,
      isTeamMember
    )
  ) {
    enhancedEvent.conferenceLink = null;
    enhancedEvent.conferenceCode = null;
  } else {
    if (
      enhancedEvent.conferenceLink === null ||
      enhancedEvent.conferenceLink === ""
    ) {
      enhancedEvent.conferenceLink = "noch nicht bekannt";
      enhancedEvent.conferenceCode = null;
    }
  }

  return json<LoaderData>(
    {
      mode,
      event: enhancedEvent,
      userId: sessionUser?.id || undefined,
      email: sessionUser?.email || undefined,
      isParticipant,
      isOnWaitingList,
      isSpeaker,
      isTeamMember,
      abilities,
    },
    { headers: response.headers }
  );
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

  const now = new Date();

  const beforeParticipationPeriod =
    now < new Date(loaderData.event.participationFrom);

  const afterParticipationPeriod =
    now > new Date(loaderData.event.participationUntil);

  const laysInThePast = new Date() > new Date(loaderData.event.endTime);

  const Form = getForm(loaderData);

  const startTime = new Date(loaderData.event.startTime);
  const endTime = new Date(loaderData.event.endTime);

  const duration = getDuration(startTime, endTime);

  const background = loaderData.event.background;
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

  return (
    <>
      <section className="container md:mt-2">
        <div className="font-semi text-neutral-500 flex flex-wrap items-center mb-4">
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
          <span className="w-full md:w-auto">{loaderData.event.name}</span>
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
            <span className="ml-2">Zurück</span>
          </button>
        </div>
      </section>
      <section className="container mt-6">
        <div className="rounded-3xl overflow-hidden w-full relative">
          <div className="hidden md:block">
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
              {loaderData.mode === "owner" &&
                loaderData.abilities.events.hasAccess && (
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
                        image={loaderData.event.background || undefined}
                        aspect={31 / 10}
                        minCropWidth={620}
                        minCropHeight={62}
                        maxTargetWidth={1488}
                        maxTargetHeight={480}
                        slug={loaderData.event.slug}
                        redirect={`/event/${loaderData.event.slug}`}
                      >
                        <Background />
                      </ImageCropper>
                    </Modal>
                  </div>
                )}
            </div>
          </div>
          {loaderData.mode === "owner" && (
            <>
              {loaderData.event.canceled ? (
                <div className="md:absolute md:top-0 md:inset-x-0 font-semibold text-center bg-salmon-500 p-2 text-white">
                  Abgesagt
                </div>
              ) : (
                <>
                  {loaderData.event.published ? (
                    <div className="md:absolute md:top-0 md:inset-x-0 font-semibold text-center bg-green-600 p-2 text-white">
                      Veröffentlicht
                    </div>
                  ) : (
                    <div className="md:absolute md:top-0 md:inset-x-0 font-semibold text-center bg-blue-300 p-2 text-white">
                      Entwurf
                    </div>
                  )}
                </>
              )}
            </>
          )}

          {loaderData.mode !== "owner" && loaderData.event.canceled && (
            <div className="md:absolute md:top-0 md:inset-x-0 font-semibold text-center bg-salmon-500 p-2 text-white">
              Abgesagt
            </div>
          )}
          {loaderData.mode !== "owner" && (
            <>
              {beforeParticipationPeriod || afterParticipationPeriod ? (
                <div className="bg-accent-300 p-8">
                  <p className="font-bold text-center">
                    {laysInThePast
                      ? "Veranstaltung hat bereits stattgefunden."
                      : beforeParticipationPeriod
                      ? "Anmeldefrist hat noch nicht begonnen."
                      : "Anmeldefrist ist bereits abgelaufen."}
                  </p>
                </div>
              ) : (
                <>
                  {loaderData.mode === "anon" &&
                    loaderData.event.canceled === false &&
                    loaderData.event.childEvents.length === 0 && (
                      <div className="md:bg-white md:border md:border-neutral-500 md:rounded-b-3xl px-8 md:py-6 md:text-right">
                        <Link
                          className="btn btn-primary"
                          to={`/login?login_redirect=/event/${loaderData.event.slug}`}
                        >
                          Anmelden um teilzunehmen
                        </Link>
                      </div>
                    )}
                  {loaderData.mode !== "anon" &&
                    loaderData.event.canceled === false &&
                    loaderData.event.childEvents.length === 0 && (
                      <div className="md:bg-white md:border md:border-neutral-500 md:rounded-b-3xl px-8 md:py-6 md:text-right">
                        {Form}
                      </div>
                    )}
                </>
              )}
              <div className="hidden md:block">
                {loaderData.event.childEvents.length > 0 &&
                  laysInThePast === false &&
                  !beforeParticipationPeriod &&
                  !afterParticipationPeriod && (
                    <>
                      <div className="bg-accent-300 p-8">
                        <p className="font-bold text-center">
                          Wähle{" "}
                          <a
                            href="#child-events"
                            className="underline hover:no-underline"
                          >
                            zugehörige Veranstaltungen
                          </a>{" "}
                          aus, an denen Du teilnehmen möchtest.
                        </p>
                      </div>
                    </>
                  )}
              </div>
            </>
          )}
        </div>
        {loaderData.mode === "owner" && loaderData.abilities.events.hasAccess && (
          <>
            <div className="bg-accent-white p-8 pb-0">
              <p className="font-bold text-right">
                <Link
                  className="btn btn-outline btn-primary ml-4 mb-2 md:mb-0"
                  to={`/event/${loaderData.event.slug}/settings`}
                >
                  Veranstaltung bearbeiten
                </Link>
                <Link
                  className="btn btn-primary ml-4"
                  to={`/event/create/?parent=${loaderData.event.id}`}
                >
                  Zugehörige Veranstaltungen anlegen
                </Link>
              </p>
            </div>
          </>
        )}
      </section>
      <div className="container relative pt-8 lg:pt-16 pb-20 lg:pb-44">
        <div className="flex -mx-4 justify-center">
          <div className="lg:flex-1/2 px-4">
            <p className="font-bold text-xl mb-8">{duration}</p>
            <header className="mb-8">
              <h1 className="m-0">{loaderData.event.name}</h1>
              {loaderData.event.subline !== null && (
                <p className="font-bold text-xl mt-2">
                  {loaderData.event.subline}
                </p>
              )}
            </header>
            {loaderData.event.description && (
              <p
                className="mb-6"
                dangerouslySetInnerHTML={{
                  __html: nl2br(loaderData.event.description, true),
                }}
              />
            )}

            <div className="grid grid-cols-1 md:grid-cols-[minmax(100px,_1fr)_4fr] gap-x-4 gap-y-1 md:gap-y-6">
              {loaderData.event.types.length > 0 && (
                <>
                  <div className="text-xs leading-6">Veranstaltungsart</div>
                  <div className="pb-3 md:pb-0">
                    {loaderData.event.types
                      .map((item) => item.eventType.title)
                      .join(" / ")}
                  </div>
                </>
              )}

              {loaderData.event.venueName !== null && (
                <>
                  <div className="text-xs leading-6">Veranstaltungsort</div>
                  <div className="pb-3 md:pb-0">
                    <p>
                      {loaderData.event.venueName},{" "}
                      {loaderData.event.venueStreet}{" "}
                      {loaderData.event.venueStreetNumber},{" "}
                      {loaderData.event.venueZipCode}{" "}
                      {loaderData.event.venueCity}
                    </p>
                  </div>
                </>
              )}

              {loaderData.event.conferenceLink !== null &&
                loaderData.event.conferenceLink !== "" && (
                  <>
                    <div className="text-xs leading-6">Konferenzlink</div>
                    <div className="pb-3 md:pb-0">
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
              {loaderData.event.conferenceCode !== null &&
                loaderData.event.conferenceCode !== "" && (
                  <>
                    <div className="text-xs leading-6">Konferenz-Code</div>
                    <div className="pb-3 md:pb-0">
                      {loaderData.event.conferenceCode}
                    </div>
                  </>
                )}

              {loaderData.event.startTime && (
                <>
                  <div className="text-xs leading-6">Start</div>
                  <div className="pb-3 md:pb-0">
                    {formatDateTime(startTime)}
                  </div>
                </>
              )}
              {loaderData.event.endTime && (
                <>
                  <div className="text-xs leading-6">Ende</div>
                  <div className="pb-3 md:pb-0">{formatDateTime(endTime)}</div>
                </>
              )}

              {loaderData.event.participationFrom &&
                new Date(loaderData.event.participationFrom) > new Date() && (
                  <>
                    <div className="text-xs leading-6">
                      Registrierungsbeginn
                    </div>
                    <div className="pb-3 md:pb-0">
                      {formatDateTime(
                        new Date(loaderData.event.participationFrom)
                      )}
                    </div>
                  </>
                )}
              {loaderData.event.participationUntil &&
                new Date(loaderData.event.participationUntil) > new Date() && (
                  <>
                    <div className="text-xs leading-6">Registrierungsende</div>
                    <div className="pb-3 md:pb-0">
                      {formatDateTime(
                        new Date(loaderData.event.participationUntil)
                      )}
                    </div>
                  </>
                )}

              {loaderData.event.participantLimit !== null && (
                <>
                  <div className="text-xs leading-6">Verfügbare Plätze</div>
                  <div className="pb-3 md:pb-0">
                    {loaderData.event.participantLimit === null ? (
                      "ohne Beschränkung"
                    ) : (
                      <>
                        {loaderData.event.participantLimit -
                          loaderData.event._count.participants <
                        0
                          ? 0
                          : loaderData.event.participantLimit -
                            loaderData.event._count.participants}{" "}
                        / {loaderData.event.participantLimit}
                      </>
                    )}
                  </div>
                </>
              )}

              {(loaderData.isParticipant ||
                loaderData.isSpeaker ||
                loaderData.isTeamMember) && (
                <>
                  <div className="text-xs leading-6 mt-1">Kalender-Eintrag</div>
                  <div className="pb-3 md:pb-0">
                    <Link
                      className="btn btn-outline btn-primary btn-small"
                      to="ics-download"
                      reloadDocument
                    >
                      Download
                    </Link>
                  </div>
                </>
              )}

              {loaderData.mode !== "anon" &&
                loaderData.event.documents.length > 0 && (
                  <>
                    <div className="text-xs leading-6">Downloads</div>
                    <div className="pb-3 md:pb-0">
                      {loaderData.event.documents.map((item) => {
                        return (
                          <div
                            key={`document-${item.document.id}`}
                            className=""
                          >
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
                  <div className="event-tags -m-1 pb-3 md:pb-0">
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
                  <div className="event-tags -m-1 pb-3 md:pb-0">
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
                  <div className="event-tags -m-1 pb-3 md:pb-0">
                    <div className="badge">
                      {loaderData.event.experienceLevel.title}
                    </div>
                  </div>
                </>
              )}

              {loaderData.event.tags.length > 0 && (
                <>
                  <div className="text-xs leading-5 pt-[7px]">Tags</div>
                  <div className="event-tags -m-1 pb-3 md:pb-0">
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
                  <div className="event-tags -m-1 pb-3 md:pb-0">
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
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mb-16">
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
                <h3 id="child-events" className="mt-16 font-bold">
                  Zugehörige Veranstaltungen
                </h3>
                <p className="mb-8">
                  Diese Veranstaltungen finden im Rahmen von "
                  {loaderData.event.name}" statt.
                </p>
                <div className="mb-16">
                  {loaderData.event.childEvents.map((event) => {
                    const startTime = new Date(event.startTime);
                    const endTime = new Date(event.endTime);
                    return (
                      <div
                        key={`child-event-${event.id}`}
                        className="rounded-lg bg-white shadow-xl border-t border-r border-neutral-300  mb-2 flex items-stretch overflow-hidden"
                      >
                        <Link className="flex" to={`/event/${event.slug}`}>
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
                            <h4 className="font-bold text-base m-0 md:line-clamp-1">
                              {event.name}
                            </h4>
                            {event.subline !== null ? (
                              <p className="hidden md:block text-xs mt-1 md:line-clamp-2">
                                {event.subline}
                              </p>
                            ) : (
                              <p className="hidden md:block text-xs mt-1 md:line-clamp-2">
                                {event.description}
                              </p>
                            )}
                          </div>
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
                          !event.canceled &&
                          loaderData.mode !== "owner" && (
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
                          !event.canceled &&
                          loaderData.mode !== "owner" && (
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
                        {(("isParticipant" in event &&
                          !event.isParticipant &&
                          !canUserParticipate(event) &&
                          !event.isOnWaitingList &&
                          !canUserBeAddedToWaitingList(event) &&
                          !event.canceled) ||
                          (loaderData.userId === undefined &&
                            event._count.childEvents > 0)) && (
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
                  })}
                </div>
              </>
            )}

            {loaderData.event.teamMembers.length > 0 && (
              <>
                <h3 className="mt-16 mb-8 font-bold">Team</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {loaderData.event.teamMembers.map((member) => {
                    return (
                      <div key={`team-member-${member.profile.id}`}>
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
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {loaderData.event.responsibleOrganizations.map((item) => {
                    return (
                      <div key={`organizer-${item.organization.id}`}>
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
                              {getInitialsOfName(item.organization.name)}
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
            )}

            {loaderData.event.participants !== null &&
              loaderData.event.participants.length > 0 && (
                <>
                  <h3 className="mt-16 mb-8 font-bold">Teilnehmer:innen</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
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
