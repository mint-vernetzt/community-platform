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
import { checkFeatureAbilitiesOrThrow } from "~/lib/utils/application";
import { getCompiledMailTemplate, mailer } from "~/mailer.server";
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
      // Send info mail
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
      const subject = `Deine Teilnahme an der Veranstaltung ${event.name}`;
      const content = {
        recipient: {
          firstName: profile.firstName,
          lastName: profile.lastName,
        },
        event: {
          name: event.name,
          url: `${process.env.COMMUNITY_BASE_URL}/event/${event.slug}`,
          startDate: `${event.startTime.getDate()}.${
            event.startTime.getMonth() + 1
          }.${event.startTime.getFullYear()}`,
          startTime: `${event.startTime.getHours()}:${event.startTime.getMinutes()}`,
          supportContact: {
            firstName:
              event.teamMembers[0].profile.firstName ??
              "Kein zuständiges Teammitglied gefunden",
            lastName:
              event.teamMembers[0].profile.lastName ??
              "Kein zuständiges Teammitglied gefunden",
            email:
              event.teamMembers[0].profile.email ??
              "Kein zuständiges Teammitglied gefunden",
          },
        },
      };
      const textTemplatePath = "mail-templates/move-to-participants/text.hbs";
      const text = await getCompiledMailTemplate<typeof textTemplatePath>(
        textTemplatePath,
        content
      );
      const htmlTemplatePath = "mail-templates/move-to-participants/html.hbs";
      const html = await getCompiledMailTemplate<typeof htmlTemplatePath>(
        htmlTemplatePath,
        content
      );

      try {
        await mailer(mailerOptions, sender, recipient, subject, text, html);
      } catch (error) {
        // Throw a 500 -> Mailer issue
        console.error(error);
        return serverError({ message: "Mailer Issue" });
      }
    }
  }
  return json<ActionData>(result, { headers: response.headers });
};
