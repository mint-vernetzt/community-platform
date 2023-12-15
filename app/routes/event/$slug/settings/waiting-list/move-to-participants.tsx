import type { ActionFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { utcToZonedTime } from "date-fns-tz";
import { makeDomainFunction } from "remix-domains";
import { performMutation } from "remix-forms";
import { z } from "zod";
import { createAuthClient, getSessionUserOrThrow } from "~/auth.server";
import { mailerOptions } from "~/lib/submissions/mailer/mailerOptions";
import { checkFeatureAbilitiesOrThrow } from "~/lib/utils/application";
import { invariantResponse } from "~/lib/utils/response";
import { getParamValueOrThrow } from "~/lib/utils/routes";
import { getCompiledMailTemplate, mailer } from "~/mailer.server";
import { deriveEventMode } from "~/routes/event/utils.server";
import {
  getEventBySlug,
  getProfileByUserId,
} from "./move-to-participants.server";
import {
  connectParticipantToEvent,
  disconnectFromWaitingListOfEvent,
} from "./utils.server";

const schema = z.object({
  profileId: z.string(),
});

export const moveToParticipantsSchema = schema;

const mutation = makeDomainFunction(schema)(async (values) => {
  return values;
});

export const action = async (args: ActionFunctionArgs) => {
  const { request, params } = args;
  const response = new Response();
  const slug = getParamValueOrThrow(params, "slug");
  const authClient = createAuthClient(request, response);
  const sessionUser = await getSessionUserOrThrow(authClient);
  const mode = await deriveEventMode(sessionUser, slug);
  invariantResponse(mode === "admin", "Not privileged", { status: 403 });
  await checkFeatureAbilitiesOrThrow(authClient, "events");

  const result = await performMutation({ request, schema, mutation });

  if (result.success === true) {
    const event = await getEventBySlug(slug);
    invariantResponse(event, "Event not found", { status: 404 });
    const profile = await getProfileByUserId(result.data.profileId);
    invariantResponse(profile, "Profile not found", { status: 404 });
    await connectParticipantToEvent(event.id, result.data.profileId);
    await disconnectFromWaitingListOfEvent(event.id, result.data.profileId);
    // Send info mail
    const sender = process.env.SYSTEM_MAIL_SENDER;
    if (sender === undefined) {
      console.error(
        "No system mail sender address provided. Please add one inside the .env."
      );
      throw json(
        {
          message:
            "No system mail sender address provided. Please add one inside the .env.",
        },
        { status: 500 }
      );
    }
    const baseUrl = process.env.COMMUNITY_BASE_URL;
    if (baseUrl === undefined) {
      console.error(
        "No community base url provided. Please add one inside the .env."
      );
      throw json(
        {
          message:
            "No community base url provided. Please add one inside the .env.",
        },
        { status: 500 }
      );
    }
    // -> mail of person which was moved to waitinglist
    const recipient = profile.email;
    const subject = `Deine Teilnahme an der Veranstaltung ${event.name}`;
    const startTime = utcToZonedTime(event.startTime, "Europe/Berlin");
    const content = {
      recipient: {
        firstName: profile.firstName,
        lastName: profile.lastName,
      },
      event: {
        name: event.name,
        url: `${baseUrl}/event/${event.slug}`,
        startDate: `${startTime.getDate()}.${
          startTime.getMonth() + 1
        }.${startTime.getFullYear()}`,
        startTime: `${startTime.getHours()}:${
          startTime.getMinutes() < 10
            ? `0${startTime.getMinutes()}`
            : startTime.getMinutes()
        }`,
        supportContact: {
          firstName:
            event.admins[0].profile.firstName ??
            "Kein zuständiges Teammitglied gefunden",
          lastName:
            event.admins[0].profile.lastName ??
            "Kein zuständiges Teammitglied gefunden",
          email:
            event.admins[0].profile.email ??
            "Kein zuständiges Teammitglied gefunden",
        },
      },
    };
    const textTemplatePath = "mail-templates/move-to-participants/text.hbs";
    const text = await getCompiledMailTemplate<typeof textTemplatePath>(
      textTemplatePath,
      content,
      baseUrl,
      "text"
    );
    const htmlTemplatePath = "mail-templates/move-to-participants/html.hbs";
    const html = await getCompiledMailTemplate<typeof htmlTemplatePath>(
      htmlTemplatePath,
      content,
      baseUrl,
      "html"
    );

    try {
      await mailer(mailerOptions, sender, recipient, subject, text, html);
    } catch (error) {
      // Throw a 500 -> Mailer issue
      console.error(error);
      return json({ message: "Mailer Issue" }, { status: 500 });
    }
  }
  return json(result, { headers: response.headers });
};
