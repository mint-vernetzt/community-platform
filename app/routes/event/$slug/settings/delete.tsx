import type { ActionFunction, LoaderFunction } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";
import { InputError, makeDomainFunction } from "remix-domains";
import type { PerformMutation } from "remix-forms";
import { Form as RemixForm, performMutation } from "remix-forms";
import { badRequest } from "remix-utils";
import type { Schema } from "zod";
import { z } from "zod";
import { createAuthClient, getSessionUserOrThrow } from "~/auth.server";
import Input from "~/components/FormElements/Input/Input";
import { checkFeatureAbilitiesOrThrow } from "~/lib/utils/application";
import { getParamValueOrThrow } from "~/lib/utils/routes";
import { getEventBySlugOrThrow } from "../utils.server";
import {
  checkIdentityOrThrow,
  checkOwnershipOrThrow,
  deleteEventById,
} from "./utils.server";

const schema = z.object({
  userId: z.string().optional(),
  eventId: z.string().optional(),
  eventName: z.string().optional(),
});

const environmentSchema = z.object({ id: z.string(), name: z.string() });

type LoaderData = {
  userId: string;
  eventId: string;
  eventName: string;
  childEvents: { id: string; name: string; slug: string }[];
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

  return json<LoaderData>(
    {
      userId: sessionUser.id,
      eventId: event.id,
      eventName: event.name,
      childEvents: event.childEvents,
    },
    { headers: response.headers }
  );
};

const mutation = makeDomainFunction(
  schema,
  environmentSchema
)(async (values, environment) => {
  if (values.eventId !== environment.id) {
    throw new Error("Id nicht korrekt");
  }
  if (values.eventName !== environment.name) {
    throw new InputError(
      "Der Name der Veranstaltung ist nicht korrekt",
      "eventName"
    );
  }
  try {
    await deleteEventById(values.eventId);
  } catch (error) {
    throw "Die Veranstaltung konnte nicht gelöscht werden.";
  }
});

export type ActionData = PerformMutation<
  z.infer<Schema>,
  z.infer<typeof schema>
>;

export const action: ActionFunction = async (args) => {
  const { request, params } = args;
  const response = new Response();
  const authClient = createAuthClient(request, response);

  await checkFeatureAbilitiesOrThrow(authClient, "events");

  const slug = getParamValueOrThrow(params, "slug");

  const sessionUser = await getSessionUserOrThrow(authClient);

  await checkIdentityOrThrow(request, sessionUser);

  const event = await getEventBySlugOrThrow(slug);

  await checkOwnershipOrThrow(event, sessionUser);

  const result = await performMutation({
    request,
    schema,
    mutation,
    environment: { id: event.id, name: event.name },
  });

  if (result.success === false) {
    if (
      result.errors._global !== undefined &&
      result.errors._global.includes("Id nicht korrekt")
    ) {
      throw badRequest({ message: "Id nicht korrekt" });
    }
  } else {
    return redirect(`/profile/${sessionUser.user_metadata.username}`);
  }

  return json<ActionData>(result, { headers: response.headers });
};

function Delete() {
  const loaderData = useLoaderData<LoaderData>();

  return (
    <>
      <h1 className="mb-8">Veranstaltung löschen</h1>

      <p className="mb-8">
        Bitte gib den Namen der Veranstaltung "{loaderData.eventName}" ein, um
        das Löschen zu bestätigen. Wenn Du danach auf "Veranstaltung löschen”
        klickst, wird Eure Veranstaltung ohne erneute Abfrage gelöscht.
      </p>

      {loaderData.childEvents.length > 0 ? (
        <>
          <p className="mb-2">
            Folgende Veranstaltung und zugehörige Veranstaltung werden auch
            gelöscht:
          </p>
          &nbsp;
          <ul className="mb-8">
            {loaderData.childEvents.map((childEvent) => {
              return (
                <li key={`child-event-${childEvent.id}`}>
                  -&nbsp;
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
      ) : null}

      <RemixForm method="post" schema={schema}>
        {({ Field, Errors, register }) => (
          <>
            <Field name="userId" hidden value={loaderData.userId} />
            <Field name="eventId" hidden value={loaderData.eventId} />
            <Field name="eventName" className="mb-4">
              {({ Errors }) => (
                <>
                  <Input
                    id="eventName"
                    label="Löschung bestätigen"
                    {...register("eventName")}
                  />
                  <Errors />
                </>
              )}
            </Field>
            <button
              type="submit"
              className="btn btn-outline-primary ml-auto btn-small"
            >
              Veranstaltung löschen
            </button>
            <Errors />
          </>
        )}
      </RemixForm>
    </>
  );
}

export default Delete;
