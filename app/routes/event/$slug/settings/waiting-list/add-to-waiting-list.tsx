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
import { getProfileById } from "../utils.server";
import { connectToWaitingListOfEvent, getEventById } from "./utils.server";

const schema = z.object({
  eventId: z.string(),
  id: z.string(),
});

export const addToWaitingListSchema = schema;

const mutation = makeDomainFunction(schema)(async (values) => {
  const profile = await getProfileById(values.id);
  if (profile === null) {
    throw new InputError(
      "Es existiert noch kein Profil unter diesem Namen.",
      "id"
    );
  }
  const alreadyMember = profile.waitingForEvents.some((entry) => {
    return entry.event.id === values.eventId;
  });
  if (alreadyMember) {
    throw new InputError(
      "Das Profil unter diesem Namen ist bereits auf der Warteliste Eurer Veranstaltung.",
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
        await connectToWaitingListOfEvent(event.id, profile.id);
      }
    } else {
      await connectToWaitingListOfEvent(event.id, sessionUser.id);
    }
    return json(
      {
        success: true,
        message: `Das Profil mit dem Namen "${result.data.firstName} ${result.data.lastName}" wurde zur Warteliste hinzugefügt.`,
      },
      { headers: response.headers }
    );
  }
  return json(result, { headers: response.headers });
};

type AddToWaitingListButtonProps = {
  action: string;
  eventId?: string;
  id?: string;
};

export function AddToWaitingListButton(props: AddToWaitingListButtonProps) {
  const fetcher = useFetcher<typeof action>();
  return (
    <Form
      action={props.action}
      fetcher={fetcher}
      schema={schema}
      hiddenFields={["eventId", "id"]}
      values={{
        eventId: props.eventId,
        id: props.id,
      }}
    >
      {(props) => {
        const { Field, Errors } = props;
        return (
          <>
            <Field name="eventId" />
            <Field name="id" />
            <button type="submit" className="btn btn-primary">
              Warteliste
            </button>
            <Errors />
          </>
        );
      }}
    </Form>
  );
}
