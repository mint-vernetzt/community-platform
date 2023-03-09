import type { ActionFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import { InputError, makeDomainFunction } from "remix-domains";
import type { PerformMutation } from "remix-forms";
import { performMutation } from "remix-forms";
import type { Schema } from "zod";
import { z } from "zod";
import { createAuthClient, getSessionUserOrThrow } from "~/auth.server";
import { checkFeatureAbilitiesOrThrow } from "~/lib/utils/application";
import { checkSameEventOrThrow, getEventByIdOrThrow } from "../../utils.server";
import {
  checkIdentityOrThrow,
  checkOwnershipOrThrow,
  getOrganizationById,
} from "../utils.server";
import { connectOrganizationToEvent } from "./utils.server";

const schema = z.object({
  userId: z.string(),
  eventId: z.string(),
  id: z.string(),
});

export const addOrganizationSchema = schema;

const mutation = makeDomainFunction(schema)(async (values) => {
  const organization = await getOrganizationById(values.id);
  if (organization === null) {
    throw new InputError(
      "Es existiert noch keine Organisation mit diesem Namen.",
      "id"
    );
  }
  const alreadyMember = organization.responsibleForEvents.some((entry) => {
    return entry.event.id === values.eventId;
  });
  if (alreadyMember) {
    throw new InputError(
      "Die Organisation mit diesem Namen ist bereits für Eure Veranstaltung verantwortlich.",
      "id"
    );
  }
  return { ...values, name: organization.name };
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
  await checkFeatureAbilitiesOrThrow(authClient, "events");
  const sessionUser = await getSessionUserOrThrow(authClient);
  await checkIdentityOrThrow(request, sessionUser);

  const result = await performMutation({ request, schema, mutation });

  if (result.success === true) {
    const event = await getEventByIdOrThrow(result.data.eventId);
    await checkOwnershipOrThrow(event, sessionUser);
    await checkSameEventOrThrow(request, event.id);
    const organization = await getOrganizationById(result.data.id);
    if (organization !== null) {
      await connectOrganizationToEvent(event.id, organization.id);
    }
    return json<SuccessActionData>(
      {
        message: `Die Organisation "${result.data.name}" ist jetzt verantwortlich für Eure Veranstaltung.`,
      },
      { headers: response.headers }
    );
  }
  return json<FailureActionData>(result, { headers: response.headers });
};
