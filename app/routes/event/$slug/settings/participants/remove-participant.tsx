import type { ActionFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useFetcher } from "@remix-run/react";
import { createServerClient } from "@supabase/auth-helpers-remix";
import { makeDomainFunction } from "remix-domains";
import type { PerformMutation } from "remix-forms";
import { Form, performMutation } from "remix-forms";
import type { Schema } from "zod";
import { z } from "zod";
import { getSessionUserOrThrow } from "~/auth.server";
import { checkSameEventOrThrow, getEventByIdOrThrow } from "../../utils.server";
import { checkIdentityOrThrow, checkOwnershipOrThrow } from "../utils.server";
import { disconnectParticipantFromEvent } from "./utils.server";

const schema = z.object({
  userId: z.string(),
  eventId: z.string(),
  profileId: z.string(),
});

export const removeParticipantSchema = schema;

const mutation = makeDomainFunction(schema)(async (values) => {
  return values;
});

export type ActionData = PerformMutation<
  z.infer<Schema>,
  z.infer<typeof schema>
>;

export const action: ActionFunction = async (args) => {
  const { request } = args;
  const response = new Response();
  const supabaseClient = createServerClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY,
    {
      request,
      response,
    }
  );
  const sessionUser = await getSessionUserOrThrow(supabaseClient);
  await checkIdentityOrThrow(request, sessionUser);

  const result = await performMutation({ request, schema, mutation });

  if (result.success === true) {
    const event = await getEventByIdOrThrow(result.data.eventId);
    await checkSameEventOrThrow(request, event.id);
    if (sessionUser.id !== result.data.profileId) {
      await checkOwnershipOrThrow(event, sessionUser);
    }
    await disconnectParticipantFromEvent(event.id, result.data.profileId);
  }
  return json<ActionData>(result, { headers: response.headers });
};

type RemoveParticipantButtonProps = {
  action: string;
  userId?: string;
  eventId?: string;
  profileId?: string;
};

export function RemoveParticipantButton(props: RemoveParticipantButtonProps) {
  const fetcher = useFetcher();
  return (
    <Form
      action={props.action}
      fetcher={fetcher}
      schema={schema}
      hiddenFields={["eventId", "userId", "profileId"]}
      values={{
        userId: props.userId,
        eventId: props.eventId,
        profileId: props.profileId,
      }}
    >
      {(props) => {
        const { Field, Errors } = props;
        return (
          <>
            <Field name="userId" />
            <Field name="eventId" />
            <Field name="profileId" />
            <button className="btn btn-primary" type="submit">
              Nicht mehr teilnehmen
            </button>
            <Errors />
          </>
        );
      }}
    </Form>
  );
}
