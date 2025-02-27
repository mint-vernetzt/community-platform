import type { ActionFunctionArgs } from "react-router";
import { utcToZonedTime } from "date-fns-tz";
import { makeDomainFunction } from "domain-functions";
import { performMutation } from "remix-forms";
import { z } from "zod";
import { createAuthClient, getSessionUserOrThrow } from "~/auth.server";
import { detectLanguage } from "~/i18n.server";
import { mailerOptions } from "~/lib/submissions/mailer/mailerOptions";
import { checkFeatureAbilitiesOrThrow } from "~/routes/feature-access.server";
import { insertParametersIntoLocale } from "~/lib/utils/i18n";
import { invariantResponse } from "~/lib/utils/response";
import { getParamValueOrThrow } from "~/lib/utils/routes";
import { languageModuleMap } from "~/locales/.server";
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
  const language = await detectLanguage(request);
  const locales =
    languageModuleMap[language][
      "event/$slug/settings/waiting-list/move-to-participants"
    ];
  const slug = getParamValueOrThrow(params, "slug");
  const { authClient } = createAuthClient(request);
  const sessionUser = await getSessionUserOrThrow(authClient);
  const mode = await deriveEventMode(sessionUser, slug);
  invariantResponse(mode === "admin", locales.error.notPrivileged, {
    status: 403,
  });
  await checkFeatureAbilitiesOrThrow(authClient, "events");

  const result = await performMutation({ request, schema, mutation });

  if (result.success === true) {
    const event = await getEventBySlug(slug);
    invariantResponse(event, locales.error.notFound.event, { status: 404 });
    const profile = await getProfileByUserId(result.data.profileId);
    invariantResponse(profile, locales.error.notFound.profile, { status: 404 });
    await connectParticipantToEvent(event.id, result.data.profileId);
    await disconnectFromWaitingListOfEvent(event.id, result.data.profileId);
    // Send info mail
    // -> mail of person which was moved to waitinglist
    const sender = process.env.SYSTEM_MAIL_SENDER;
    const recipient = profile.email;
    const subject = insertParametersIntoLocale(locales.email.subject, {
      title: event.name,
    });
    const startTime = utcToZonedTime(event.startTime, "Europe/Berlin");
    const content = {
      recipient: {
        firstName: profile.firstName,
        lastName: profile.lastName,
      },
      event: {
        name: event.name,
        url: `${process.env.COMMUNITY_BASE_URL}/event/${event.slug}`,
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
            locales.email.supportContact.firstName,
          lastName:
            event.admins[0].profile.lastName ??
            locales.email.supportContact.lastName,
          email:
            event.admins[0].profile.email ?? locales.email.supportContact.email,
        },
      },
    };
    const textTemplatePath = "mail-templates/move-to-participants/text.hbs";
    const text = getCompiledMailTemplate<typeof textTemplatePath>(
      textTemplatePath,
      content,
      "text"
    );
    const htmlTemplatePath = "mail-templates/move-to-participants/html.hbs";
    const html = getCompiledMailTemplate<typeof htmlTemplatePath>(
      htmlTemplatePath,
      content,
      "html"
    );

    try {
      await mailer(mailerOptions, sender, recipient, subject, text, html);
    } catch (error) {
      // Throw a 500 -> Mailer issue
      console.error(error);
      invariantResponse(false, locales.error.mailer, { status: 500 });
    }
  }
  return { success: true };
};
