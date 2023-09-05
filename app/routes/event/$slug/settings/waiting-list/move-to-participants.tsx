import type { DataFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { makeDomainFunction } from "remix-domains";
import { performMutation } from "remix-forms";
import { badRequest, serverError } from "remix-utils";
import { z } from "zod";
import { createAuthClient, getSessionUserOrThrow } from "~/auth.server";
import { mailerOptions } from "~/lib/submissions/mailer/mailerOptions";
import { checkFeatureAbilitiesOrThrow } from "~/lib/utils/application";
import { invariantResponse } from "~/lib/utils/response";
import { getParamValueOrThrow } from "~/lib/utils/routes";
import { getCompiledMailTemplate, mailer } from "~/mailer.server";
import { deriveEventMode } from "~/routes/event/utils.server";
import { checkSameEventOrThrow } from "../../utils.server";
import {
  getEventById,
  getProfileByUserId,
} from "./move-to-participants.server";
import {
  connectParticipantToEvent,
  disconnectFromWaitingListOfEvent,
} from "./utils.server";

const schema = z.object({
  eventId: z.string(),
  profileId: z.string(),
});

export const moveToParticipantsSchema = schema;

const mutation = makeDomainFunction(schema)(async (values) => {
  return values;
});

export const action = async (args: DataFunctionArgs) => {
  const { request, params } = args;
  const response = new Response();
  const authClient = createAuthClient(request, response);
  await checkFeatureAbilitiesOrThrow(authClient, "events");
  const sessionUser = await getSessionUserOrThrow(authClient);
  const slug = getParamValueOrThrow(params, "slug");

  const result = await performMutation({ request, schema, mutation });

  if (result.success === true) {
    const event = await getEventById(result.data.eventId);
    invariantResponse(event, "Event not found", { status: 404 });
    const mode = await deriveEventMode(sessionUser, slug);
    invariantResponse(mode === "admin", "Not privileged", { status: 403 });
    await checkSameEventOrThrow(request, event.id);
    const profile = await getProfileByUserId(result.data.profileId);
    invariantResponse(profile, "Profile not found", { status: 404 });
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
        startTime: `${event.startTime.getHours()}:${
          event.startTime.getMinutes() < 10
            ? `${event.startTime.getMinutes()}0`
            : event.startTime.getMinutes()
        }`,
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
  return json(result, { headers: response.headers });
};
