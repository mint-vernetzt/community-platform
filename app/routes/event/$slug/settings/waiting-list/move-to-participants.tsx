import type { ActionFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import { makeDomainFunction } from "remix-domains";
import type { PerformMutation } from "remix-forms";
import { performMutation } from "remix-forms";
import type { Schema } from "zod";
import { z } from "zod";
import { createAuthClient, getSessionUserOrThrow } from "~/auth.server";
import {
  checkFeatureAbilitiesOrThrow,
  getFeatureAbilities,
} from "~/lib/utils/application";
import { getProfileByUserId } from "~/profile.server";
import { checkSameEventOrThrow, getEventByIdOrThrow } from "../../utils.server";
import { checkIdentityOrThrow, checkOwnershipOrThrow } from "../utils.server";
import {
  connectParticipantToEvent,
  disconnectFromWaitingListOfEvent,
} from "./utils.server";
import { mailerOptions } from "~/lib/submissions/mailer/mailerOptions";
import { submissionMailer } from "~/lib/submissions/mailer/submissionMailer";
import { serverError } from "remix-utils";

const schema = z.object({
  userId: z.string(),
  eventId: z.string(),
  profileId: z.string(),
});

export const moveToParticipantsSchema = schema;

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
  const authClient = createAuthClient(request, response);
  await checkFeatureAbilitiesOrThrow(authClient, "events");
  const sessionUser = await getSessionUserOrThrow(authClient);
  await checkIdentityOrThrow(request, sessionUser);

  const result = await performMutation({ request, schema, mutation });

  if (result.success === true) {
    const event = await getEventByIdOrThrow(result.data.eventId);
    await checkOwnershipOrThrow(event, sessionUser);
    await checkSameEventOrThrow(request, event.id);
    const profile = await getProfileByUserId(result.data.profileId);
    if (profile !== null) {
      await connectParticipantToEvent(event.id, profile.id);
      await disconnectFromWaitingListOfEvent(event.id, result.data.profileId);
      // Check feature ability: waitinglistMail -> Add it to .env
      const featureAbilities = await getFeatureAbilities(
        authClient,
        "waitinglistMail"
      );
      if (featureAbilities["waitinglistMail"].hasAccess === true) {
        // Send dummy text mail (event.url, event.name, short message)
        const sender = process.env.SUBMISSION_SENDER || "";
        // -> mail of person which was moved to waitinglist
        const recipient = profile.email;
        const subject = `Deine Teilnahme an der Veranstaltung ${event.name}`;
        const eventUrl = `${process.env.COMMUNITY_BASE_URL}/event/${event.slug}`;
        // Build data object with event.url, event.name, short message (They will resolve in this text mail: "Key: Value\n --- \nKey: Value\n --- \n...")
        const data = {
          url: eventUrl,
          name: event.name,
          message: `Du wurdest bei der Veranstaltung "${event.name}" von der Warteliste zu den Teilnehmenden hinzugefügt.`,
        };
        try {
          await submissionMailer<typeof data>( // include typeof data object as generic
            mailerOptions,
            sender,
            recipient,
            subject,
            data
          );
        } catch (error) {
          // Throw a 500 -> Mailer issue
          console.error(error);
          return serverError({ message: "Mailer Issue" });
        }
      }
    }
  }
  return json<ActionData>(result, { headers: response.headers });
};
