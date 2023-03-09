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
  getProfileById,
} from "../utils.server";
import { connectProfileToEvent } from "./utils.server";

const schema = z.object({
  userId: z.string(),
  eventId: z.string(),
  id: z.string(),
});

export const addMemberSchema = schema;

const mutation = makeDomainFunction(schema)(async (values) => {
  const profile = await getProfileById(values.id);
  if (profile === null) {
    throw new InputError(
      "Es existiert noch kein Profil unter diesem Namen.",
      "id"
    );
  }
  const alreadyMember = profile.teamMemberOfEvents.some((entry) => {
    return entry.event.id === values.eventId;
  });
  if (alreadyMember) {
    throw new InputError(
      "Das Profil unter diesem Namen ist bereits Teammitglied Eurer Veranstaltung.",
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
  await checkFeatureAbilitiesOrThrow(authClient, "events");
  const sessionUser = await getSessionUserOrThrow(authClient);
  await checkIdentityOrThrow(request, sessionUser);

  const result = await performMutation({ request, schema, mutation });

  if (result.success === true) {
    const event = await getEventByIdOrThrow(result.data.eventId);
    await checkOwnershipOrThrow(event, sessionUser);
    await checkSameEventOrThrow(request, event.id);
    const teamMemberProfile = await getProfileById(result.data.id);
    if (teamMemberProfile !== null) {
      await connectProfileToEvent(event.id, teamMemberProfile.id);
    }
    return json<SuccessActionData>(
      {
        message: `Ein neues Teammitglied mit dem Namen "${result.data.firstName} ${result.data.lastName}" wurde hinzugefügt.`,
      },
      { headers: response.headers }
    );
  }
  return json<FailureActionData>(result, { headers: response.headers });
};
