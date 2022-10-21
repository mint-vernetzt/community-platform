import { Link, LoaderFunction, useLoaderData } from "remix";
import { getUserByRequest } from "~/auth.server";
import { H1 } from "~/components/Heading/Heading";
import { getImageURL } from "~/images.server";
import {
  canUserBeAddedToWaitingList,
  canUserParticipate,
} from "~/lib/event/utils";
import { getOrganizationInitials } from "~/lib/organization/getOrganizationInitials";
import { checkFeatureAbilitiesOrThrow } from "~/lib/utils/application";
import { getFormattedDate, getTimeDuration } from "~/lib/utils/time";
import { getPublicURL } from "~/storage.server";
import { AddParticipantButton } from "../event/$slug/settings/participants/add-participant";
import { AddToWaitingListButton } from "../event/$slug/settings/participants/add-to-waiting-list";
import {
  enhanceEventsWithParticipationStatus,
  getEvents,
  MaybeEnhancedEvents,
} from "./utils.server";

type LoaderData = {
  events: MaybeEnhancedEvents;
  userId?: string;
  email?: string;
};

export const loader: LoaderFunction = async (args) => {
  const { request } = args;

  await checkFeatureAbilitiesOrThrow(request, "events");

  const currentUser = await getUserByRequest(request);

  const events = await await getEvents();

  let enhancedEvents: MaybeEnhancedEvents = events;

  if (currentUser !== null) {
    enhancedEvents = await enhanceEventsWithParticipationStatus(
      currentUser.id,
      events
    );
  }

  enhancedEvents = enhancedEvents.map((item) => {
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

  enhancedEvents = enhancedEvents.map((event) => {
    if (event.responsibleOrganizations.length > 0) {
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
    }
    return event;
  });

  return {
    events: enhancedEvents,
    userId: currentUser?.id || undefined,
    email: currentUser?.email || undefined,
  };
};

function Events() {
  const loaderData = useLoaderData<LoaderData>();

  return (
    <>
      <section className="container mt-8 md:mt-10 lg:mt-20 text-center">
        <H1 like="h0">Veranstaltungen</H1>
      </section>
      <section className="container my-8 md:my-10 lg:my-20">
        {loaderData.events.map((event, index) => {
          const startTime = new Date(event.startTime);
          const endTime = new Date(event.endTime);
          return (
            <div
              key={`child-event-${index}`}
              className="rounded-lg bg-white shadow-xl border-t border-r border-neutral-300  mb-2 flex items-stretch overflow-hidden"
            >
              <Link className="flex" to={`/event/${event.slug}`}>
                <div className="w-40 shrink-0">
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
                    {event.stage !== null && event.stage.title + " | "}
                    {getFormattedDate(startTime)}
                    {" | "}
                    {getTimeDuration(startTime, endTime)}
                    {" | "}
                    {event._count.childEvents === 0 && (
                      <>
                        {event.participantLimit === null
                          ? " | Unbegrenzte Plätze"
                          : ` | ${
                              event.participantLimit - event._count.participants
                            } / ${event.participantLimit} Plätzen frei`}
                      </>
                    )}
                    {event.participantLimit !== null &&
                      event._count.participants >= event.participantLimit && (
                        <>
                          {" "}
                          |{" "}
                          <span>
                            {event._count.waitingList} auf der Warteliste
                          </span>
                        </>
                      )}
                  </p>
                  <h4 className="font-bold text-base m-0 line-clamp-1">
                    {event.name}
                  </h4>
                  {event.subline !== null ? (
                    <p className="text-xs mt-1 line-clamp-2">{event.subline}</p>
                  ) : (
                    <p className="text-xs mt-1 line-clamp-2">
                      {event.description}
                    </p>
                  )}
                </div>
              </Link>

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
              {"isParticipant" in event && canUserBeAddedToWaitingList(event) && (
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
                      Mehr erfahren
                    </Link>
                  </div>
                )}
              {event.responsibleOrganizations.length > 0 && (
                <Link
                  className="flex flex-row"
                  to={`/organization/${event.responsibleOrganizations[0].organization.slug}`}
                >
                  {event.responsibleOrganizations[0].organization.logo !==
                    null &&
                  event.responsibleOrganizations[0].organization.logo !== "" ? (
                    <div className="h-11 w-11 flex items-center justify-center rounded-full overflow-hidden shrink-0 border">
                      <img
                        src={
                          event.responsibleOrganizations[0].organization.logo
                        }
                        alt={
                          event.responsibleOrganizations[0].organization.name
                        }
                      />
                    </div>
                  ) : (
                    <div className="h-11 w-11 bg-primary text-white text-xl flex items-center justify-center rounded-full overflow-hidden shrink-0">
                      {getOrganizationInitials(
                        event.responsibleOrganizations[0].organization.name
                      )}
                    </div>
                  )}
                </Link>
              )}
              {event.responsibleOrganizations.length > 1 && (
                <p>+ {event._count.responsibleOrganizations - 1}</p>
              )}
            </div>
          );
        })}
      </section>
    </>
  );
}

export default Events;
