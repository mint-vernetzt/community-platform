import { LoaderFunction, useFetcher, useLoaderData, useParams } from "remix";
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

import { setParentSchema } from "./events/set-parent";

type LoaderData = {
  userId: string;
  eventId: string;
  options: ReturnType<typeof getOptionsFromEvents>;
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
    eventId: event.id,
    userId: currentUser.id,
  };
};

function Events() {
  const { slug } = useParams();
  const loaderData = useLoaderData<LoaderData>();
  const setParentFetcher = useFetcher();

  return (
    <>
      <h1>Events</h1>
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
    </>
  );
}

export default Events;
