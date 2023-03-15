import type { LoaderArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { Link, useFetcher, useLoaderData, useParams } from "@remix-run/react";
import { utcToZonedTime } from "date-fns-tz";
import { Form } from "remix-forms";
import { createAuthClient, getSessionUserOrThrow } from "~/auth.server";
import { getImageURL } from "~/images.server";
import { checkFeatureAbilitiesOrThrow } from "~/lib/utils/application";
import { getParamValueOrThrow } from "~/lib/utils/routes";
import { getDuration } from "~/lib/utils/time";
import { getPublicURL } from "~/storage.server";
import { getEventBySlugOrThrow } from "../utils.server";
import type { ActionData as AddChildActionData } from "./events/add-child";
import { addChildSchema } from "./events/add-child";
import type { ActionData as RemoveChildActionData } from "./events/remove-child";
import { removeChildSchema } from "./events/remove-child";
import type { ActionData as SetParentActionData } from "./events/set-parent";
import { setParentSchema } from "./events/set-parent";
import {
  checkOwnershipOrThrow,
  getEventsOfPrivilegedMemberExceptOfGivenEvent,
  getOptionsFromEvents,
} from "./utils.server";

export const loader = async (args: LoaderArgs) => {
  const { request, params } = args;
  const response = new Response();
  const authClient = createAuthClient(request, response);
  await checkFeatureAbilitiesOrThrow(authClient, "events");
  const slug = getParamValueOrThrow(params, "slug");
  const sessionUser = await getSessionUserOrThrow(authClient);
  const event = await getEventBySlugOrThrow(slug);
  await checkOwnershipOrThrow(event, sessionUser);

  const events = await getEventsOfPrivilegedMemberExceptOfGivenEvent(
    sessionUser.id,
    event.id
  );

  const options = getOptionsFromEvents(events);

  let parentEventId: string | null = null;
  let parentEventName: string | null = null;

  if (event.parentEvent !== null) {
    parentEventId = event.parentEvent.id;
    parentEventName = event.parentEvent.name;
  }

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

  return json(
    {
      options,
      parentEvent: event.parentEvent,
      childEvents: enhancedChildEvents,
      eventId: event.id,
      userId: sessionUser.id,
    },
    { headers: response.headers }
  );
};

function Events() {
  const { slug } = useParams();
  const loaderData = useLoaderData<typeof loader>();
  const setParentFetcher = useFetcher<SetParentActionData>();
  const addChildFetcher = useFetcher<AddChildActionData>();
  const removeChildFetcher = useFetcher<RemoveChildActionData>();
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

  return (
    <>
      <h1 className="mb-8">Verknüpfte Veranstaltungen</h1>
      <h4 className="mb-4 font-semibold">Rahmenveranstaltung</h4>

      <p className="mb-4">
        Welche Veranstaltung ist deiner Veranstaltung übergeordnet? Findet sie
        beispielsweise im Rahmen einer Tagung statt? Füge hier deiner
        Veranstaltung eine Rahmenversanstaltung hinzu oder entferne sie.
      </p>
      <Form
        schema={setParentSchema}
        fetcher={setParentFetcher}
        action={`/event/${slug}/settings/events/set-parent`}
        hiddenFields={["userId", "eventId"]}
        values={{ userId: loaderData.userId, eventId: loaderData.eventId }}
      >
        {(props) => {
          const { Button, Field, Errors, register } = props;

          return (
            <div className="form-control w-full">
              <div className="flex flex-row items-center mb-2">
                <div className="flex-auto">
                  <label
                    id="label-for-parentEventId"
                    htmlFor="parentEventId"
                    className="label"
                  >
                    Rahmenveranstaltung zuweisen
                  </label>
                </div>
              </div>
              <Field name="userId" />
              <Field name="eventId" />
              <Field name="parentEventId">
                {(props) => {
                  const { Errors } = props;
                  return (
                    <div className="form-control w-full">
                      <select
                        id="parentEventId"
                        {...register("parentEventId")}
                        name="parentEventId"
                        className="select w-full select-bordered"
                      >
                        <option></option>
                        {loaderData.options.map((option, index) => {
                          return (
                            <option
                              key={`parentEventId-option-${index}`}
                              value={option.value}
                            >
                              {option.label}
                            </option>
                          );
                        })}
                      </select>
                      <Errors />
                    </div>
                  );
                }}
              </Field>
              <div className="mt-2">
                <Button className="btn btn-outline-primary ml-auto btn-small">
                  Speichern
                </Button>
                <Errors />
              </div>
            </div>
          );
        }}
      </Form>
      {setParentFetcher.data?.message ? (
        <div className="p-4 bg-green-200 rounded-md mt-4">
          {setParentFetcher.data.message}
        </div>
      ) : null}
      {loaderData.parentEvent !== null ? (
        <div className="mt-6">
          <Form
            schema={setParentSchema}
            fetcher={setParentFetcher}
            action={`/event/${slug}/settings/events/set-parent`}
            hiddenFields={["userId", "eventId", "parentEventId"]}
            values={{
              userId: loaderData.userId,
              eventId: loaderData.eventId,
              parentEventId: "",
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
                    <Field name="userId" />
                    <Field name="eventId" />
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
      <h4 className="mb-4 font-semibold">Zugehörige Veranstaltungen</h4>

      <p className="mb-4">
        Welche Veranstaltungen sind deiner Veranstaltung untergeordnet? Ist
        deine Veranstaltung beispielsweise eine Tagung und hat mehrere
        Unterveranstaltungen, wie Workshops, Paneldiskussionen oder ähnliches?
        Dann füge ihr hier andere zugehörige Veranstaltungen hinzu oder entferne
        sie.
      </p>
      <Form
        schema={addChildSchema}
        fetcher={addChildFetcher}
        action={`/event/${slug}/settings/events/add-child`}
        hiddenFields={["userId", "eventId"]}
        values={{ userId: loaderData.userId, eventId: loaderData.eventId }}
      >
        {(props) => {
          const { Button, Field, Errors, register } = props;

          return (
            <div className="form-control w-full">
              <div className="flex flex-row items-center mb-2">
                <div className="flex-auto">
                  <label
                    id="label-for-parentEventId"
                    htmlFor="parentEventId"
                    className="label"
                  >
                    Veranstaltung hinzufügen
                  </label>
                </div>
              </div>
              <Field name="userId" />
              <Field name="eventId" />
              <Field name="childEventId">
                {(props) => {
                  const { Errors } = props;
                  return (
                    <div className="form-control w-full">
                      <select
                        id="childEventId"
                        {...register("childEventId")}
                        name="childEventId"
                        className="select w-full select-bordered"
                      >
                        <option></option>
                        {loaderData.options
                          .filter((option) => {
                            let isNotParent = true;
                            let isNotChild = true;
                            if (loaderData.parentEvent !== null) {
                              isNotParent =
                                option.value !== loaderData.parentEvent.id;
                            }
                            if (loaderData.childEvents.length > 0) {
                              const index = loaderData.childEvents.findIndex(
                                (item) => item.id === option.value
                              );
                              isNotChild = index === -1;
                            }
                            return (
                              isNotParent &&
                              isNotChild &&
                              option.hasParent === false
                            );
                          })
                          .map((option, index) => {
                            return (
                              <option
                                key={`parentEventId-option-${index}`}
                                value={option.value}
                              >
                                {option.label}
                              </option>
                            );
                          })}
                      </select>
                      <Errors />
                    </div>
                  );
                }}
              </Field>
              <div className="mt-2">
                <Button className="btn btn-outline-primary ml-auto btn-small">
                  Hinzufügen
                </Button>
                <Errors />
              </div>
            </div>
          );
        }}
      </Form>
      {addChildFetcher.data?.message ? (
        <div className="p-4 bg-green-200 rounded-md mt-4">
          {addChildFetcher.data.message}
        </div>
      ) : null}
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
                  hiddenFields={["userId", "eventId", "childEventId"]}
                  values={{
                    userId: loaderData.userId,
                    eventId: loaderData.eventId,
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
                                {childEvent.description}
                              </p>
                            )}
                          </div>
                        </Link>
                        <Field name="userId" />
                        <Field name="eventId" />
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
    </>
  );
}

export default Events;
