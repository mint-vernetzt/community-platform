import type { ActionFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import { makeDomainFunction } from "remix-domains";
import type { PerformMutation } from "remix-forms";
import { performMutation } from "remix-forms";
import { badRequest, serverError } from "remix-utils";
import type { Schema } from "zod";
import { z } from "zod";
import { createAuthClient, getSessionUserOrThrow } from "~/auth.server";
import { mailerOptions } from "~/lib/submissions/mailer/mailerOptions";
import {
  checkFeatureAbilitiesOrThrow,
  getFeatureAbilities,
} from "~/lib/utils/application";
import {
  getHTMLMailTemplate,
  getTextMailTemplate,
  mailer,
} from "~/mailer.server";
import { getProfileByUserId } from "~/profile.server";
import { checkSameEventOrThrow, getEventByIdOrThrow } from "../../utils.server";
import { checkIdentityOrThrow, checkOwnershipOrThrow } from "../utils.server";
import {
  connectParticipantToEvent,
  disconnectFromWaitingListOfEvent,
} from "./utils.server";

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
        const sender = process.env.SYSTEM_MAIL_SENDER;
        if (sender === undefined) {
          console.error(
            "No system mail sender address provided. Please add one inside the .env."
          );
          return badRequest({
            message:
              "No system mail sender address provided. Please add one inside the .env.",
          });
        }
        // -> mail of person which was moved to waitinglist
        const recipient = profile.email;
        const subject = `Deine Teilnahme an der Veranstaltung\n${event.name}`;
        const content = {
          headline: subject,
          message: `Du wurdest bei der Veranstaltung "${event.name}" von der Warteliste zu den Teilnehmenden hinzugefügt.`,
          buttonText: "Zur Veranstaltung",
          buttonUrl: `${process.env.COMMUNITY_BASE_URL}/event/${event.slug}`,
        };
        const text = getTextMailTemplate(content);
        const html = await getHTMLMailTemplate(content);

        try {
          await mailer(mailerOptions, sender, recipient, subject, text, html);
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
