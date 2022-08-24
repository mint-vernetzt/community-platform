import {
  Link,
  LoaderFunction,
  useFetcher,
  useLoaderData,
  useParams,
} from "remix";
import { Form } from "remix-forms";
import { getUserByRequestOrThrow } from "~/auth.server";
import { checkFeatureAbilitiesOrThrow } from "~/lib/utils/application";
import { getParamValueOrThrow } from "~/lib/utils/routes";
import { getEventBySlugOrThrow } from "../utils.server";
import {
  checkOwnershipOrThrow,
  getEventsOfPrivilegedMemberExceptOfGivenEvent,
  getOptionsFromEvents,
} from "./utils.server";

import { addChildSchema } from "./events/add-child";
import { setParentSchema } from "./events/set-parent";

type LoaderData = {
  userId: string;
  eventId: string;
  options: ReturnType<typeof getOptionsFromEvents>;
  childEvents: { id: string; slug: string; name: string }[];
  parentEventId: string | null;
  parentEventName: string | null;
};

export const loader: LoaderFunction = async (args): Promise<LoaderData> => {
  const { request, params } = args;
  await checkFeatureAbilitiesOrThrow(request, "events");
  const slug = getParamValueOrThrow(params, "slug");
  const currentUser = await getUserByRequestOrThrow(request);
  const event = await getEventBySlugOrThrow(slug);
  await checkOwnershipOrThrow(event, currentUser);

  const events = await getEventsOfPrivilegedMemberExceptOfGivenEvent(
    currentUser.id,
    event.id
  );

  const options = getOptionsFromEvents(events);

  let parentEventId: string | null = null;
  let parentEventName: string | null = null;

  if (event.parentEvent !== null) {
    parentEventId = event.parentEvent.id;
    parentEventName = event.parentEvent.name;
  }

  return {
    options,
    parentEventId,
    parentEventName,
    childEvents: event.childEvents,
    eventId: event.id,
    userId: currentUser.id,
  };
};

function Events() {
  const { slug } = useParams();
  const loaderData = useLoaderData<LoaderData>();
  const setParentFetcher = useFetcher();
  const addChildFetcher = useFetcher();

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
      {setParentFetcher.data?.message && (
        <div className="p-4 bg-green-200 rounded-md mt-4">
          {setParentFetcher.data.message}
        </div>
      )}
      <hr className="border-neutral-400 my-4 lg:my-8" />
      {loaderData.childEvents.length > 0 && (
        <div className="mb-8">
          <h3>Subveranstaltungen</h3>
          <ul>
            {loaderData.childEvents.map((childEvent, index) => {
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
        </div>
      )}
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
                    Subveranstaltung
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
                            return isNotParent && isNotChild;
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
      {addChildFetcher.data?.message && (
        <div className="p-4 bg-green-200 rounded-md mt-4">
          {addChildFetcher.data.message}
        </div>
      )}
    </>
  );
}

export default Events;
