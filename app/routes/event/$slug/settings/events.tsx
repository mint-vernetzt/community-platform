import type { LoaderFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import { Link, useFetcher, useLoaderData, useParams } from "@remix-run/react";
import { Form } from "remix-forms";
import { createAuthClient, getSessionUserOrThrow } from "~/auth.server";
import { H3 } from "~/components/Heading/Heading";
import { checkFeatureAbilitiesOrThrow } from "~/lib/utils/application";
import { getParamValueOrThrow } from "~/lib/utils/routes";
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

type LoaderData = {
  userId: string;
  eventId: string;
  options: ReturnType<typeof getOptionsFromEvents>;
  childEvents: { id: string; slug: string; name: string }[];
  parentEventId: string | null;
  parentEventName: string | null;
};

export const loader: LoaderFunction = async (args) => {
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

  return json<LoaderData>(
    {
      options,
      parentEventId,
      parentEventName,
      childEvents: event.childEvents,
      eventId: event.id,
      userId: sessionUser.id,
    },
    { headers: response.headers }
  );
};

function Events() {
  const { slug } = useParams();
  const loaderData = useLoaderData<LoaderData>();
  const setParentFetcher = useFetcher<SetParentActionData>();
  const addChildFetcher = useFetcher<AddChildActionData>();
  const removeChildFetcher = useFetcher<RemoveChildActionData>();

  return (
    <>
      <h1>Veranstaltungen</h1>
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
                    Rahmenveranstaltung
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
                        defaultValue={loaderData.parentEventId || ""}
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
      <hr className="border-neutral-400 my-4 lg:my-8" />
      {loaderData.childEvents.length > 0 ? (
        <div className="mb-8">
          <h3>Zugehörige Veranstaltungen</h3>
          <ul>
            {loaderData.childEvents.map((childEvent) => {
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
                      <div className="w-full flex items-center flex-row border-b border-neutral-400 p-4">
                        <div className="pl-4">
                          <H3 like="h4" className="text-xl mb-1">
                            <Link
                              className="underline hover:no-underline"
                              to={`/event/${childEvent.slug}`}
                            >
                              {childEvent.name}
                            </Link>
                          </H3>
                        </div>
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
                    Zugehörige Veranstaltungen
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
                            if (loaderData.parentEventId !== null) {
                              isNotParent =
                                option.value !== loaderData.parentEventId;
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
    </>
  );
}

export default Events;
