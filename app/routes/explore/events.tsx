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
      <section className="container my-8 md:my-10 lg:my-20 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 items-stretch">
        {loaderData.events.map((event, index) => {
          const startTime = new Date(event.startTime);
          const endTime = new Date(event.endTime);
          return (
            <div
              key={`child-event-${index}`}
              className="rounded-2xl bg-white shadow-xl flex flex-col overflow-hidden"
            >
              <Link
                className="relative flex-initial"
                to={`/event/${event.slug}`}
              >
                <div className="w-full aspect-4/3 lg:aspect-video">
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
                {event.canceled && (
                  <div className="absolute left-0 right-0 top-0 bg-salmon-500 py-2 text-white text-center">
                    Abgesagt
                  </div>
                )}
                <div className="flex justify-between absolute p-2 left-0 right-0 bottom-0">
                  <div className="text-white bg-primary px-2 py-1 rounded-lg text-xs">
                    {getTimeDuration(startTime, endTime)}
                  </div>
                  {event._count.childEvents === 0 && (
                    <div className="text-white bg-primary px-2 py-1 rounded-lg text-xs">
                      {event.participantLimit === null ? (
                        "Unbegrenzte Plätze"
                      ) : (
                        <>
                          {event._count.participants >=
                          event.participantLimit ? (
                            <span>
                              {event._count.waitingList} auf der Warteliste
                            </span>
                          ) : (
                            `${
                              event.participantLimit - event._count.participants
                            } / ${event.participantLimit} Plätzen frei`
                          )}
                        </>
                      )}
                    </div>
                  )}
                </div>
              </Link>
              <Link className="relative flex-auto" to={`/event/${event.slug}`}>
                <div className="p-4 pb-0 flex justify-between ">
                  <p className="text-xs">{getFormattedDate(startTime)}</p>
                  <div className="flex items-center">
                    {event.stage !== null && event.stage.title === "vor Ort" && (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        fill="currentColor"
                        viewBox="0 0 16 16"
                      >
                        <path
                          fill-rule="evenodd"
                          d="M2 13.5V7h1v6.5a.5.5 0 0 0 .5.5h9a.5.5 0 0 0 .5-.5V7h1v6.5a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 2 13.5zm11-11V6l-2-2V2.5a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5z"
                        />
                        <path
                          fill-rule="evenodd"
                          d="M7.293 1.5a1 1 0 0 1 1.414 0l6.647 6.646a.5.5 0 0 1-.708.708L8 2.207 1.354 8.854a.5.5 0 1 1-.708-.708L7.293 1.5z"
                        />
                      </svg>
                    )}
                    {event.stage !== null && event.stage.title === "Online" && (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        fill="currentColor"
                        viewBox="0 0 16 16"
                      >
                        <path d="M0 8a8 8 0 1 1 16 0A8 8 0 0 1 0 8zm7.5-6.923c-.67.204-1.335.82-1.887 1.855A7.97 7.97 0 0 0 5.145 4H7.5V1.077zM4.09 4a9.267 9.267 0 0 1 .64-1.539 6.7 6.7 0 0 1 .597-.933A7.025 7.025 0 0 0 2.255 4H4.09zm-.582 3.5c.03-.877.138-1.718.312-2.5H1.674a6.958 6.958 0 0 0-.656 2.5h2.49zM4.847 5a12.5 12.5 0 0 0-.338 2.5H7.5V5H4.847zM8.5 5v2.5h2.99a12.495 12.495 0 0 0-.337-2.5H8.5zM4.51 8.5a12.5 12.5 0 0 0 .337 2.5H7.5V8.5H4.51zm3.99 0V11h2.653c.187-.765.306-1.608.338-2.5H8.5zM5.145 12c.138.386.295.744.468 1.068.552 1.035 1.218 1.65 1.887 1.855V12H5.145zm.182 2.472a6.696 6.696 0 0 1-.597-.933A9.268 9.268 0 0 1 4.09 12H2.255a7.024 7.024 0 0 0 3.072 2.472zM3.82 11a13.652 13.652 0 0 1-.312-2.5h-2.49c.062.89.291 1.733.656 2.5H3.82zm6.853 3.472A7.024 7.024 0 0 0 13.745 12H11.91a9.27 9.27 0 0 1-.64 1.539 6.688 6.688 0 0 1-.597.933zM8.5 12v2.923c.67-.204 1.335-.82 1.887-1.855.173-.324.33-.682.468-1.068H8.5zm3.68-1h2.146c.365-.767.594-1.61.656-2.5h-2.49a13.65 13.65 0 0 1-.312 2.5zm2.802-3.5a6.959 6.959 0 0 0-.656-2.5H12.18c.174.782.282 1.623.312 2.5h2.49zM11.27 2.461c.247.464.462.98.64 1.539h1.835a7.024 7.024 0 0 0-3.072-2.472c.218.284.418.598.597.933zM10.855 4a7.966 7.966 0 0 0-.468-1.068C9.835 1.897 9.17 1.282 8.5 1.077V4h2.355z" />
                      </svg>
                    )}
                    {event.stage !== null && event.stage.title === "Hybrid" && (
                      <>
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="16"
                          height="16"
                          fill="currentColor"
                          viewBox="0 0 16 16"
                        >
                          <path
                            fill-rule="evenodd"
                            d="M2 13.5V7h1v6.5a.5.5 0 0 0 .5.5h9a.5.5 0 0 0 .5-.5V7h1v6.5a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 2 13.5zm11-11V6l-2-2V2.5a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5z"
                          />
                          <path
                            fill-rule="evenodd"
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
                    )}
                    <span className="ml-1.5 text-xs">
                      {event.stage !== null && event.stage.title}
                    </span>
                  </div>
                </div>
                <div className="p-4 pb-0">
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
                  <hr className="h-0 border-t border-neutral-400 m-0 mt-4" />
                </div>
              </Link>

              <div className="flex flex-initial items-center p-4">
                {event.responsibleOrganizations.length > 0 && (
                  <Link
                    className="flex flex-row"
                    to={`/organization/${event.responsibleOrganizations[0].organization.slug}`}
                  >
                    {event.responsibleOrganizations[0].organization.logo !==
                      null &&
                    event.responsibleOrganizations[0].organization.logo !==
                      "" ? (
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
                  <p className="ml-2 text-sm">
                    +{event._count.responsibleOrganizations - 1}
                  </p>
                )}

                {"isParticipant" in event &&
                  event.isParticipant &&
                  !event.canceled && (
                    <div className="font-semibold ml-auto text-green-600">
                      <p>Angemeldet</p>
                    </div>
                  )}
                {"isParticipant" in event && canUserParticipate(event) && (
                  <div className="ml-auto">
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
                    <div className="font-semibold ml-auto text-neutral-500">
                      <p>Wartend</p>
                    </div>
                  )}
                {"isParticipant" in event &&
                  canUserBeAddedToWaitingList(event) && (
                    <div className="ml-auto">
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
                    <div className="ml-auto">
                      <Link
                        to={`/event/${event.slug}`}
                        className="btn btn-primary"
                      >
                        Mehr erfahren
                      </Link>
                    </div>
                  )}
              </div>
            </div>
          );
        })}
      </section>
    </>
  );
}

export default Events;
