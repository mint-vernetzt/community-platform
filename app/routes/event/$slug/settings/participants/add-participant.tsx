import type { ActionFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useFetcher } from "@remix-run/react";
import { InputError, makeDomainFunction } from "remix-domains";
import type { PerformMutation } from "remix-forms";
import { Form, performMutation } from "remix-forms";
import type { Schema } from "zod";
import { z } from "zod";
import { createAuthClient, getSessionUserOrThrow } from "~/auth.server";
import { checkSameEventOrThrow, getEventByIdOrThrow } from "../../utils.server";
import {
  checkIdentityOrThrow,
  checkOwnershipOrThrow,
  getProfileById,
} from "../utils.server";
import { connectParticipantToEvent } from "./utils.server";
import Button from "@mint-vernetzt/components";

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

export type SuccessActionData = {
  message: string;
};

export type FailureActionData = PerformMutation<
  z.infer<Schema>,
  z.infer<typeof schema>
>;

export const action: ActionFunction = async (args) => {
  const { request } = args;
  const response = new Response();
  const authClient = createAuthClient(request, response);
  const sessionUser = await getSessionUserOrThrow(authClient);
  await checkIdentityOrThrow(request, sessionUser);

  const result = await performMutation({ request, schema, mutation });

  if (result.success === true) {
    const event = await getEventByIdOrThrow(result.data.eventId);
    await checkSameEventOrThrow(request, event.id);
    if (sessionUser.id !== result.data.id) {
      await checkOwnershipOrThrow(event, sessionUser);
      const profile = await getProfileById(result.data.id);
      if (profile !== null) {
        await connectParticipantToEvent(event.id, profile.id);
      }
    } else {
      await connectParticipantToEvent(event.id, sessionUser.id);
    }
    return json<SuccessActionData>(
      {
        message: `Das Profil mit dem Namen "${result.data.firstName} ${result.data.lastName}" wurde als Teilnehmer:in hinzugefügt.`,
      },
      { headers: response.headers }
    );
  }
  return json<FailureActionData>(result, { headers: response.headers });
};

type AddParticipantButtonProps = {
  action: string;
  userId?: string;
  eventId?: string;
  id?: string;
};

export function AddParticipantButton(props: AddParticipantButtonProps) {
  const fetcher = useFetcher();
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
            {/* <Button type="submit" size="x-small">
              Teilnehmen
            </Button> */}
            <Errors />
          </>
        );
      }}
    </Form>
  );
}
