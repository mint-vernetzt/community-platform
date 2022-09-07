import { Link, LoaderFunction, useLoaderData } from "remix";
import { badRequest, forbidden } from "remix-utils";
import { getUserByRequest } from "~/auth.server";
import { checkFeatureAbilitiesOrThrow } from "~/lib/utils/application";
import { deriveMode, getEventBySlugOrThrow } from "./utils.server";

type LoaderData = {
  mode: Awaited<ReturnType<typeof deriveMode>>;
  event: Awaited<ReturnType<typeof getEventBySlugOrThrow>>;
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

  return { mode, event };
};

function Index() {
  const loaderData = useLoaderData<LoaderData>();
  return (
    <>
      <div className="mb-4">
        <h1>{loaderData.event.name}</h1>
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
