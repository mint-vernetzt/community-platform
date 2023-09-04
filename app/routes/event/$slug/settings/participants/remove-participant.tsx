import type { DataFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useFetcher } from "@remix-run/react";
import { makeDomainFunction } from "remix-domains";
import { Form, performMutation } from "remix-forms";
import { z } from "zod";
import { createAuthClient, getSessionUserOrThrow } from "~/auth.server";
import { invariantResponse } from "~/lib/utils/response";
import { getParamValueOrThrow } from "~/lib/utils/routes";
import { deriveEventMode } from "~/routes/event/utils.server";
import { checkSameEventOrThrow } from "../../utils.server";
import { checkIdentityOrThrow } from "../utils.server";
import { disconnectParticipantFromEvent, getEventById } from "./utils.server";

const schema = z.object({
  userId: z.string(),
  eventId: z.string(),
  profileId: z.string(),
});

export const removeParticipantSchema = schema;

const mutation = makeDomainFunction(schema)(async (values) => {
  return values;
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
    if (sessionUser.id !== result.data.profileId) {
      const mode = await deriveEventMode(sessionUser, slug);
      invariantResponse(mode === "admin", "Not privileged", { status: 403 });
    }
    await disconnectParticipantFromEvent(event.id, result.data.profileId);
  }
  return json(result, { headers: response.headers });
};

type RemoveParticipantButtonProps = {
  action: string;
  userId?: string;
  eventId?: string;
  profileId?: string;
};

export function RemoveParticipantButton(props: RemoveParticipantButtonProps) {
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
              Nicht mehr teilnehmen
            </button>
            <Errors />
          </>
        );
      }}
    </Form>
  );
}
