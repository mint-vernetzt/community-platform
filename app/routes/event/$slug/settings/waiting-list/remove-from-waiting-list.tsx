import type { DataFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useFetcher } from "@remix-run/react";
import { makeDomainFunction } from "remix-domains";
import { Form, performMutation } from "remix-forms";
import { z } from "zod";
import { createAuthClient, getSessionUserOrThrow } from "~/auth.server";
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

export const action = async (args: DataFunctionArgs) => {
  const { request } = args;
  const response = new Response();
  const authClient = createAuthClient(request, response);
  const sessionUser = await getSessionUserOrThrow(authClient);
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
  return json(result, { headers: response.headers });
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
  const fetcher = useFetcher<typeof action>();
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
