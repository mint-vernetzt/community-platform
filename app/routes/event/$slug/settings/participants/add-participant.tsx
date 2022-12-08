import type { ActionFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useFetcher } from "@remix-run/react";
import { InputError, makeDomainFunction } from "remix-domains";
import type { PerformMutation } from "remix-forms";
import { Form, performMutation } from "remix-forms";
import type { Schema } from "zod";
import { z } from "zod";
import { createAuthClient, getSessionUserOrThrow } from "~/auth.server";
import { getProfileByEmail } from "~/routes/organization/$slug/settings/utils.server";
import { checkSameEventOrThrow, getEventByIdOrThrow } from "../../utils.server";
import { checkIdentityOrThrow, checkOwnershipOrThrow } from "../utils.server";
import { connectParticipantToEvent } from "./utils.server";

const schema = z.object({
  userId: z.string(),
  eventId: z.string(),
  email: z.string().email(),
});

export const addParticipantSchema = schema;

const mutation = makeDomainFunction(schema)(async (values) => {
  const profile = await getProfileByEmail(values.email);
  if (profile === null) {
    throw new InputError(
      "Es existiert noch kein Profil unter dieser E-Mail.",
      "email"
    );
  }
  const alreadyMember = profile.participatedEvents.some((entry) => {
    return entry.event.id === values.eventId;
  });
  if (alreadyMember) {
    throw new InputError(
      "Das Profil unter dieser E-Mail nimmt bereits an Eurer Veranstaltung teil.",
      "email"
    );
  }
  return values;
});

export type ActionData = PerformMutation<
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
    if (sessionUser.email !== result.data.email) {
      await checkOwnershipOrThrow(event, sessionUser);
      const profile = await getProfileByEmail(result.data.email);
      if (profile !== null) {
        await connectParticipantToEvent(event.id, profile.id);
      }
    } else {
      await connectParticipantToEvent(event.id, sessionUser.id);
    }
  }
  return json<ActionData>(result, { headers: response.headers });
};

type AddParticipantButtonProps = {
  action: string;
  userId?: string;
  eventId?: string;
  email?: string;
};

export function AddParticipantButton(props: AddParticipantButtonProps) {
  const fetcher = useFetcher();
  return (
    <Form
      action={props.action}
      fetcher={fetcher}
      schema={schema}
      hiddenFields={["eventId", "userId", "email"]}
      values={{
        userId: props.userId,
        eventId: props.eventId,
        email: props.email,
      }}
    >
      {(props) => {
        const { Field, Errors } = props;
        return (
          <>
            <Field name="userId" />
            <Field name="eventId" />
            <Field name="email" />
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
