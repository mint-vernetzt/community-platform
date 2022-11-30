import { createServerClient } from "@supabase/auth-helpers-remix";
import { ActionFunction, json, useFetcher } from "remix";
import { makeDomainFunction } from "remix-domains";
import { Form, PerformMutation, performMutation } from "remix-forms";
import { Schema, z } from "zod";
import { getSessionUserOrThrow } from "~/auth.server";
import { checkSameEventOrThrow, getEventByIdOrThrow } from "../../utils.server";
import { checkIdentityOrThrow, checkOwnershipOrThrow } from "../utils.server";
import { disconnectFromWaitingListOfEvent } from "./utils.server";

const schema = z.object({
  userId: z.string(),
  eventId: z.string(),
  profileId: z.string(),
});

export const removeFromWaitingListSchema = schema;

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
    await disconnectFromWaitingListOfEvent(event.id, result.data.profileId);
  }
  return json<ActionData>(result, { headers: response.headers });
};

type RemoveFromWaitingListButtonProps = {
  action: string;
  userId?: string;
  eventId?: string;
  profileId?: string;
};

export function RemoveFromWaitingListButton(
  props: RemoveFromWaitingListButtonProps
) {
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
              Von der Warteliste entfernen
            </button>
            <Errors />
          </>
        );
      }}
    </Form>
  );
}
