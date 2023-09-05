import type { ActionArgs, LoaderArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { Link, useFetcher, useLoaderData, useParams } from "@remix-run/react";
import { InputError, makeDomainFunction } from "remix-domains";
import { Form as RemixForm, performMutation } from "remix-forms";
import { badRequest, notFound } from "remix-utils";
import { z } from "zod";
import { createAuthClient, getSessionUserOrThrow } from "~/auth.server";
import Input from "~/components/FormElements/Input/Input";
import { checkFeatureAbilitiesOrThrow } from "~/lib/utils/application";
import { invariantResponse } from "~/lib/utils/response";
import { getParamValueOrThrow } from "~/lib/utils/routes";
import { deriveEventMode } from "../../utils.server";
import {
  getEventBySlug,
  getEventBySlugForAction,
  getProfileById,
} from "./delete.server";
import { publishSchema, type action as publishAction } from "./events/publish";
import { deleteEventById } from "./utils.server";

const schema = z.object({
  eventId: z.string().optional(),
  eventName: z.string().optional(),
});

const environmentSchema = z.object({ id: z.string(), name: z.string() });

export const loader = async (args: LoaderArgs) => {
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

  return json(
    {
      eventId: event.id,
      published: event.published,
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

export const action = async (args: ActionArgs) => {
  const { request, params } = args;
  const response = new Response();
  const authClient = createAuthClient(request, response);

  await checkFeatureAbilitiesOrThrow(authClient, "events");

  const slug = getParamValueOrThrow(params, "slug");

  const sessionUser = await getSessionUserOrThrow(authClient);

  const event = await getEventBySlugForAction(slug);
  invariantResponse(event, "Event not found", { status: 404 });

  const mode = await deriveEventMode(sessionUser, slug);
  invariantResponse(mode === "admin", "Not privileged", { status: 403 });

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
    const profile = await getProfileById(sessionUser.id);
    if (profile === null) {
      throw notFound("Profile not found");
    }
    return redirect(`/profile/${profile.username}`);
  }

  return json(result, { headers: response.headers });
};

function Delete() {
  const loaderData = useLoaderData<typeof loader>();
  const { slug } = useParams();
  const publishFetcher = useFetcher<typeof publishAction>();

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
          </p>{" "}
          <ul className="mb-8">
            {loaderData.childEvents.map((childEvent) => {
              return (
                <li key={`child-event-${childEvent.id}`}>
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
      ) : null}

      <RemixForm method="post" schema={schema}>
        {({ Field, Errors, register }) => (
          <>
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
      <footer className="fixed bg-white border-t-2 border-primary w-full inset-x-0 bottom-0 pb-24 md:pb-0">
        <div className="container">
          <div className="flex flex-row flex-nowrap items-center justify-end my-4">
            <RemixForm
              schema={publishSchema}
              fetcher={publishFetcher}
              action={`/event/${slug}/settings/events/publish`}
              hiddenFields={["eventId", "publish"]}
              values={{
                eventId: loaderData.eventId,
                publish: !loaderData.published,
              }}
            >
              {(props) => {
                const { Button, Field } = props;
                return (
                  <>
                    <Field name="eventId" />
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

export default Delete;
