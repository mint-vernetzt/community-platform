import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import {
  Link,
  useFetcher,
  useLoaderData,
  useParams,
  useSearchParams,
  useSubmit,
} from "@remix-run/react";
import { utcToZonedTime } from "date-fns-tz";
import { Form, Form as RemixForm } from "remix-forms";
import { createAuthClient, getSessionUserOrThrow } from "~/auth.server";
import Autocomplete from "~/components/Autocomplete/Autocomplete";
import { getImageURL } from "~/images.server";
import { checkFeatureAbilitiesOrThrow } from "~/lib/utils/application";
import { invariantResponse } from "~/lib/utils/response";
import { getParamValueOrThrow } from "~/lib/utils/routes";
import { removeHtmlTags } from "~/lib/utils/sanitizeUserHtml";
import { getDuration } from "~/lib/utils/time";
import { getPublicURL } from "~/storage.server";
import { deriveEventMode } from "../../utils.server";
import { getEventBySlug } from "./events.server";
import {
  addChildSchema,
  type action as addChildAction,
} from "./events/add-child";
import { publishSchema, type action as publishAction } from "./events/publish";
import {
  removeChildSchema,
  type action as removeChildAction,
} from "./events/remove-child";
import {
  setParentSchema,
  type action as setParentAction,
} from "./events/set-parent";
import {
  getChildEventSuggestions,
  // getEventsOfPrivilegedMemberExceptOfGivenEvent,
  // getOptionsFromEvents,
  getParentEventSuggestions,
} from "./utils.server";

export const loader = async (args: LoaderFunctionArgs) => {
  const { request, params } = args;
  const response = new Response();
  const authClient = createAuthClient(request, response);
  await checkFeatureAbilitiesOrThrow(authClient, "events");
  const slug = getParamValueOrThrow(params, "slug");
  const sessionUser = await getSessionUserOrThrow(authClient);
  const event = await getEventBySlug(slug);
  invariantResponse(event, "Event not found", { status: 404 });
  const mode = await deriveEventMode(sessionUser, slug);
  invariantResponse(mode === "admin", "Not privileged", { status: 403 });

  const enhancedChildEvents = event.childEvents.map((childEvent) => {
    if (childEvent.background !== null) {
      const publicURL = getPublicURL(authClient, childEvent.background);
      if (publicURL) {
        childEvent.background = getImageURL(publicURL, {
          resize: { type: "fit", width: 160, height: 160 },
        });
      }
    }
    return childEvent;
  });
  if (event.parentEvent !== null && event.parentEvent.background !== null) {
    const publicURL = getPublicURL(authClient, event.parentEvent.background);
    if (publicURL) {
      event.parentEvent.background = getImageURL(publicURL, {
        resize: { type: "fit", width: 160, height: 160 },
      });
    }
  }

  const url = new URL(request.url);
  const parentSuggestionsQuery =
    url.searchParams.get("parent_autocomplete_query") || undefined;
  let parentEventSuggestions;
  if (parentSuggestionsQuery !== undefined && parentSuggestionsQuery !== "") {
    const query = parentSuggestionsQuery.split(" ");
    const alreadyParentId = event.parentEvent?.id || undefined;
    parentEventSuggestions = await getParentEventSuggestions(
      authClient,
      alreadyParentId,
      query,
      event.startTime,
      event.endTime,
      sessionUser.id
    );
  }
  const childSuggestionsQuery =
    url.searchParams.get("child_autocomplete_query") || undefined;
  let childEventSuggestions;
  if (childSuggestionsQuery !== undefined && childSuggestionsQuery !== "") {
    const query = childSuggestionsQuery.split(" ");
    const alreadyChildIds = event.childEvents.map((childEvent) => {
      return childEvent.id;
    });
    childEventSuggestions = await getChildEventSuggestions(
      authClient,
      alreadyChildIds,
      query,
      event.startTime,
      event.endTime,
      sessionUser.id
    );
  }

  return json(
    {
      parentEvent: event.parentEvent,
      parentEventSuggestions,
      childEvents: enhancedChildEvents,
      childEventSuggestions,
      published: event.published,
    },
    { headers: response.headers }
  );
};

function Events() {
  const { slug } = useParams();
  const loaderData = useLoaderData<typeof loader>();
  const setParentFetcher = useFetcher<typeof setParentAction>();
  const addChildFetcher = useFetcher<typeof addChildAction>();
  const removeChildFetcher = useFetcher<typeof removeChildAction>();
  const publishFetcher = useFetcher<typeof publishAction>();
  let parentEventStartTime: ReturnType<typeof utcToZonedTime> | undefined;
  let parentEventEndTime: ReturnType<typeof utcToZonedTime> | undefined;
  if (loaderData.parentEvent !== null) {
    parentEventStartTime = utcToZonedTime(
      loaderData.parentEvent.startTime,
      "Europe/Berlin"
    );
    parentEventEndTime = utcToZonedTime(
      loaderData.parentEvent.endTime,
      "Europe/Berlin"
    );
  }
  const [searchParams] = useSearchParams();
  const parentEventSuggestionsQuery = searchParams.get(
    "parent_autocomplete_query"
  );
  const childEventSuggestionsQuery = searchParams.get(
    "child_autocomplete_query"
  );
  const submit = useSubmit();

  return (
    <>
      <h1 className="mb-8">Verknüpfte Veranstaltungen</h1>
      <h4 className="mb-4 font-semibold">Rahmenveranstaltung zuweisen</h4>

      <p className="mb-4">
        Welche Veranstaltung ist deiner Veranstaltung übergeordnet? Findet sie
        beispielsweise im Rahmen einer Tagung statt? Füge hier deiner
        Veranstaltung eine Rahmenversanstaltung hinzu oder entferne sie.
        Allerdings musst du priviligiertes Teammitglied der Rahmenveranstaltung
        sein und deine Veranstaltung muss sich innerhalb des Zeitraums der
        Rahmenveranstaltung befinden.
      </p>
      <Form
        schema={setParentSchema}
        fetcher={setParentFetcher}
        action={`/event/${slug}/settings/events/set-parent`}
        onSubmit={() => {
          submit({
            method: "get",
            action: `/event/${slug}/settings/events`,
          });
        }}
      >
        {(props) => {
          const { Button, Field, Errors, register } = props;

          return (
            <div className="form-control w-full">
              <Errors />
              <div className="flex flex-row items-center mb-2">
                <div className="flex-auto">
                  <label id="label-for-name" htmlFor="Name" className="label">
                    Name der Veranstaltung
                  </label>
                </div>
              </div>

              <div className="flex flex-row">
                <Field name="parentEventId" className="flex-auto">
                  {({ Errors }) => (
                    <>
                      <Errors />
                      <Autocomplete
                        suggestions={loaderData.parentEventSuggestions || []}
                        suggestionsLoaderPath={`/event/${slug}/settings/events`}
                        defaultValue={parentEventSuggestionsQuery || ""}
                        {...register("parentEventId")}
                        searchParameter="parent_autocomplete_query"
                      />
                    </>
                  )}
                </Field>
                <div className="ml-2">
                  <Button className="bg-transparent w-10 h-8 flex items-center justify-center rounded-md border border-neutral-500 text-neutral-600 mt-0.5">
                    +
                  </Button>
                </div>
              </div>
            </div>
          );
        }}
      </Form>
      {setParentFetcher.data !== undefined &&
      "message" in setParentFetcher.data ? (
        <div className={`p-4 bg-green-200 rounded-md mt-4`}>
          {setParentFetcher.data.message}
        </div>
      ) : null}
      <h4 className="mb-4 mt-4 font-semibold">Aktuelle Rahmenveranstaltung</h4>
      <p className="mb-8">
        Hier siehst du die aktuelle Rahmenveranstaltung deiner Veranstaltung.
        <br></br>
        {loaderData.parentEvent === null
          ? "\nAktuell ist deiner Veranstaltung keine Rahmenveranstaltung zugewiesen."
          : ""}
      </p>
      {loaderData.parentEvent !== null ? (
        <div>
          <Form
            schema={setParentSchema}
            fetcher={setParentFetcher}
            action={`/event/${slug}/settings/events/set-parent`}
            hiddenFields={["parentEventId"]}
            values={{
              parentEventId: undefined,
            }}
          >
            {(props) => {
              if (
                loaderData.parentEvent !== null &&
                parentEventStartTime !== undefined &&
                parentEventEndTime !== undefined
              ) {
                const { Field, Button } = props;
                return (
                  <div className="rounded-lg bg-white shadow-xl border-t border-r border-neutral-300  mb-2 flex items-stretch overflow-hidden">
                    <Link
                      className="flex"
                      to={`/event/${loaderData.parentEvent.slug}`}
                    >
                      <div className="hidden xl:block w-40 shrink-0">
                        <img
                          src={
                            loaderData.parentEvent.background ||
                            "/images/default-event-background.jpg"
                          }
                          alt={loaderData.parentEvent.name}
                          className="object-cover w-full h-full"
                        />
                      </div>
                      <div className="px-4 py-6">
                        <p className="text-xs mb-1">
                          {/* TODO: Display icons (see figma) */}
                          {loaderData.parentEvent.stage !== null
                            ? loaderData.parentEvent.stage.title + " | "
                            : ""}
                          {getDuration(
                            parentEventStartTime,
                            parentEventEndTime
                          )}
                          {loaderData.parentEvent._count.childEvents === 0 ? (
                            <>
                              {loaderData.parentEvent.participantLimit === null
                                ? " | Unbegrenzte Plätze"
                                : ` | ${
                                    loaderData.parentEvent.participantLimit -
                                    loaderData.parentEvent._count.participants
                                  } / ${
                                    loaderData.parentEvent.participantLimit
                                  } Plätzen frei`}
                            </>
                          ) : (
                            ""
                          )}
                          {loaderData.parentEvent.participantLimit !== null &&
                          loaderData.parentEvent._count.participants >=
                            loaderData.parentEvent.participantLimit ? (
                            <>
                              {" "}
                              |{" "}
                              <span>
                                {loaderData.parentEvent._count.waitingList} auf
                                der Warteliste
                              </span>
                            </>
                          ) : (
                            ""
                          )}
                        </p>
                        <h4 className="font-bold text-base m-0 md:line-clamp-1">
                          {loaderData.parentEvent.name}
                        </h4>
                        {loaderData.parentEvent.subline !== null ? (
                          <p className="hidden md:block text-xs mt-1 md:line-clamp-2">
                            {loaderData.parentEvent.subline}
                          </p>
                        ) : (
                          <p className="hidden md:block text-xs mt-1 md:line-clamp-2">
                            {loaderData.parentEvent.description}
                          </p>
                        )}
                      </div>
                    </Link>
                    <Field name="parentEventId" />
                    <Button className="ml-auto btn-none" title="entfernen">
                      <svg
                        viewBox="0 0 10 10"
                        width="10px"
                        height="10px"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M.808.808a.625.625 0 0 1 .885 0L5 4.116 8.308.808a.626.626 0 0 1 .885.885L5.883 5l3.31 3.308a.626.626 0 1 1-.885.885L5 5.883l-3.307 3.31a.626.626 0 1 1-.885-.885L4.116 5 .808 1.693a.625.625 0 0 1 0-.885Z"
                          fill="currentColor"
                        />
                      </svg>
                    </Button>
                  </div>
                );
              } else {
                return null;
              }
            }}
          </Form>
        </div>
      ) : null}
      <hr className="border-neutral-400 my-4 lg:my-8" />
      <h4 className="mb-4 font-semibold">
        Zugehörige Veranstaltungen hinzufügen
      </h4>

      <p className="mb-4">
        Welche Veranstaltungen sind deiner Veranstaltung untergeordnet? Ist
        deine Veranstaltung beispielsweise eine Tagung und hat mehrere
        Unterveranstaltungen, wie Workshops, Paneldiskussionen oder ähnliches?
        Dann füge ihr hier andere zugehörige Veranstaltungen hinzu oder entferne
        sie. Beachte, dass du priviligiertes Teammitglied in den zugehörigen
        Veranstaltungen sein musst und, dass die zugehörigen Veranstaltungen im
        Zeitraum deiner Veranstaltung stattfinden müssen.
      </p>
      <Form
        schema={addChildSchema}
        fetcher={addChildFetcher}
        action={`/event/${slug}/settings/events/add-child`}
        onSubmit={() => {
          submit({
            method: "get",
            action: `/event/${slug}/settings/events`,
          });
        }}
      >
        {(props) => {
          const { Button, Field, Errors, register } = props;

          return (
            <div className="form-control w-full">
              <Errors />
              <div className="flex flex-row items-center mb-2">
                <div className="flex-auto">
                  <label id="label-for-name" htmlFor="Name" className="label">
                    Name der Veranstaltung
                  </label>
                </div>
              </div>

              <div className="flex flex-row">
                <Field name="childEventId" className="flex-auto">
                  {({ Errors }) => (
                    <>
                      <Autocomplete
                        suggestions={loaderData.childEventSuggestions || []}
                        suggestionsLoaderPath={`/event/${slug}/settings/events`}
                        defaultValue={childEventSuggestionsQuery || ""}
                        {...register("childEventId")}
                        searchParameter="child_autocomplete_query"
                        autoFocus={false}
                      />
                      <Errors />
                    </>
                  )}
                </Field>
                <div className="ml-2">
                  <Button className="bg-transparent w-10 h-8 flex items-center justify-center rounded-md border border-neutral-500 text-neutral-600 mt-0.5">
                    +
                  </Button>
                </div>
              </div>
            </div>
          );
        }}
      </Form>
      {addChildFetcher.data !== undefined &&
      "message" in addChildFetcher.data ? (
        <div className={`p-4 bg-green-200 rounded-md mt-4`}>
          {addChildFetcher.data.message}
        </div>
      ) : null}
      <h4 className="mb-4 mt-4 font-semibold">
        Aktuelle zugehörige Veranstaltungen
      </h4>
      <p className="mb-8">
        Hier siehst du die aktuellen zugehörigen Veranstaltung deiner
        Veranstaltung.
        <br></br>
        {loaderData.childEvents.length === 0
          ? "\nAktuell besitzt deine Veranstaltung keine zugehörigen Veranstaltungen."
          : ""}
      </p>
      {loaderData.childEvents.length > 0 ? (
        <div className="mt-6">
          <ul>
            {loaderData.childEvents.map((childEvent) => {
              const eventStartTime = utcToZonedTime(
                childEvent.startTime,
                "Europe/Berlin"
              );
              const eventEndTime = utcToZonedTime(
                childEvent.endTime,
                "Europe/Berlin"
              );
              return (
                <Form
                  key={`remove-child-${childEvent.id}`}
                  schema={removeChildSchema}
                  fetcher={removeChildFetcher}
                  action={`/event/${slug}/settings/events/remove-child`}
                  hiddenFields={["childEventId"]}
                  values={{
                    childEventId: childEvent.id,
                  }}
                >
                  {(props) => {
                    const { Field, Button } = props;
                    return (
                      <div className="rounded-lg bg-white shadow-xl border-t border-r border-neutral-300  mb-2 flex items-stretch overflow-hidden">
                        <Link className="flex" to={`/event/${childEvent.slug}`}>
                          <div className="hidden xl:block w-40 shrink-0">
                            <img
                              src={
                                childEvent.background ||
                                "/images/default-event-background.jpg"
                              }
                              alt={childEvent.name}
                              className="object-cover w-full h-full"
                            />
                          </div>
                          <div className="px-4 py-6">
                            <p className="text-xs mb-1">
                              {/* TODO: Display icons (see figma) */}
                              {childEvent.stage !== null
                                ? childEvent.stage.title + " | "
                                : ""}
                              {getDuration(eventStartTime, eventEndTime)}
                              {childEvent._count.childEvents === 0 ? (
                                <>
                                  {childEvent.participantLimit === null
                                    ? " | Unbegrenzte Plätze"
                                    : ` | ${
                                        childEvent.participantLimit -
                                        childEvent._count.participants
                                      } / ${
                                        childEvent.participantLimit
                                      } Plätzen frei`}
                                </>
                              ) : (
                                ""
                              )}
                              {childEvent.participantLimit !== null &&
                              childEvent._count.participants >=
                                childEvent.participantLimit ? (
                                <>
                                  {" "}
                                  |{" "}
                                  <span>
                                    {childEvent._count.waitingList} auf der
                                    Warteliste
                                  </span>
                                </>
                              ) : (
                                ""
                              )}
                            </p>
                            <h4 className="font-bold text-base m-0 md:line-clamp-1">
                              {childEvent.name}
                            </h4>
                            {childEvent.subline !== null ? (
                              <p className="hidden md:block text-xs mt-1 md:line-clamp-2">
                                {childEvent.subline}
                              </p>
                            ) : (
                              <p className="hidden md:block text-xs mt-1 md:line-clamp-2">
                                {removeHtmlTags(childEvent.description ?? "")}
                              </p>
                            )}
                          </div>
                        </Link>
                        <Field name="childEventId" />
                        <Button className="ml-auto btn-none" title="entfernen">
                          <svg
                            viewBox="0 0 10 10"
                            width="10px"
                            height="10px"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              d="M.808.808a.625.625 0 0 1 .885 0L5 4.116 8.308.808a.626.626 0 0 1 .885.885L5.883 5l3.31 3.308a.626.626 0 1 1-.885.885L5 5.883l-3.307 3.31a.626.626 0 1 1-.885-.885L4.116 5 .808 1.693a.625.625 0 0 1 0-.885Z"
                              fill="currentColor"
                            />
                          </svg>
                        </Button>
                      </div>
                    );
                  }}
                </Form>
              );
            })}
          </ul>
        </div>
      ) : null}
      <footer className="fixed bg-white border-t-2 border-primary w-full inset-x-0 bottom-0 pb-24 md:pb-0">
        <div className="container">
          <div className="flex flex-row flex-nowrap items-center justify-end my-4">
            <RemixForm
              schema={publishSchema}
              fetcher={publishFetcher}
              action={`/event/${slug}/settings/events/publish`}
              hiddenFields={["publish"]}
              values={{
                publish: !loaderData.published,
              }}
            >
              {(props) => {
                const { Button, Field } = props;
                return (
                  <>
                    <Field name="publish"></Field>
                    <Button className="btn btn-outline-primary">
                      {loaderData.published ? "Verstecken" : "Veröffentlichen"}
                    </Button>
                  </>
                );
              }}
            </RemixForm>
          </div>
        </div>
      </footer>
    </>
  );
}

export default Events;
