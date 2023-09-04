import type { DataFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useFetcher } from "@remix-run/react";
import { InputError, makeDomainFunction } from "remix-domains";
import { Form, performMutation } from "remix-forms";
import { z } from "zod";
import { createAuthClient, getSessionUserOrThrow } from "~/auth.server";
import { invariantResponse } from "~/lib/utils/response";
import { getParamValueOrThrow } from "~/lib/utils/routes";
import { deriveEventMode } from "~/routes/event/utils.server";
import { checkSameEventOrThrow } from "../../utils.server";
import { checkIdentityOrThrow, getProfileById } from "../utils.server";
import { connectParticipantToEvent, getEventById } from "./utils.server";

const schema = z.object({
  userId: z.string(),
  eventId: z.string(),
  id: z.string(),
});

export const addParticipantSchema = schema;

const mutation = makeDomainFunction(schema)(async (values) => {
  const profile = await getProfileById(values.id);
  if (profile === null) {
    throw new InputError(
      "Es existiert noch kein Profil unter diesem Namen.",
      "id"
    );
  }
  const alreadyMember = profile.participatedEvents.some((entry) => {
    return entry.event.id === values.eventId;
  });
  if (alreadyMember) {
    throw new InputError(
      "Das Profil unter diesem Namen nimmt bereits an Eurer Veranstaltung teil.",
      "id"
    );
  }
  return {
    ...values,
    firstName: profile.firstName,
    lastName: profile.lastName,
  };
});

export const action = async (args: DataFunctionArgs) => {
  const { request, params } = args;
  const response = new Response();
  const authClient = createAuthClient(request, response);
  const sessionUser = await getSessionUserOrThrow(authClient);
  await checkIdentityOrThrow(request, sessionUser);
  const slug = getParamValueOrThrow(params, "slug");

  const result = await performMutation({ request, schema, mutation });

  if (result.success === true) {
    const event = await getEventById(result.data.eventId);
    invariantResponse(event, "Event not found", { status: 404 });
    await checkSameEventOrThrow(request, event.id);
    if (sessionUser.id !== result.data.id) {
      const mode = await deriveEventMode(sessionUser, slug);
      invariantResponse(mode === "admin", "Not privileged", { status: 403 });
      const profile = await getProfileById(result.data.id);
      if (profile !== null) {
        await connectParticipantToEvent(event.id, profile.id);
      }
    } else {
      await connectParticipantToEvent(event.id, sessionUser.id);
    }
    return json(
      {
        success: true,
        message: `Das Profil mit dem Namen "${result.data.firstName} ${result.data.lastName}" wurde als Teilnehmer:in hinzugefügt.`,
      },
      { headers: response.headers }
    );
  }
  return json(result, { headers: response.headers });
};

type AddParticipantButtonProps = {
  action: string;
  userId?: string;
  eventId?: string;
  id?: string;
};

export function AddParticipantButton(props: AddParticipantButtonProps) {
  const fetcher = useFetcher<typeof action>();
  return (
    <Form
      action={props.action}
      fetcher={fetcher}
      schema={schema}
      hiddenFields={["eventId", "userId", "id"]}
      values={{
        userId: props.userId,
        eventId: props.eventId,
        id: props.id,
      }}
    >
      {(props) => {
        const { Field, Errors } = props;
        return (
          <>
            <Field name="userId" />
            <Field name="eventId" />
            <Field name="id" />
            <button className="btn btn-primary" type="submit">
              Teilnehmen
            </button>
            <Errors />
          </>
        );
      }}
    </Form>
  );
}
