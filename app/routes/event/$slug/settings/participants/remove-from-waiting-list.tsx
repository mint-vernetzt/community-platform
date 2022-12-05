import { ActionFunction } from "@remix-run/node";
import { useFetcher } from "@remix-run/react";
import { makeDomainFunction } from "remix-domains";
import { Form, performMutation } from "remix-forms";
import { z } from "zod";
import { getUserByRequestOrThrow } from "~/auth.server";
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

export const action: ActionFunction = async (args) => {
  const { request } = args;
  const currentUser = await getUserByRequestOrThrow(request);
  await checkIdentityOrThrow(request, currentUser);

  const result = await performMutation({ request, schema, mutation });

  if (result.success === true) {
    const event = await getEventByIdOrThrow(result.data.eventId);
    await checkSameEventOrThrow(request, event.id);
    if (currentUser.id !== result.data.profileId) {
      await checkOwnershipOrThrow(event, currentUser);
    }
    await disconnectFromWaitingListOfEvent(event.id, result.data.profileId);
  }
  return result;
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
