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
import {
  getEventBySlug,
  getProfileByUserId,
} from "./move-to-participants.server";
import {
  connectParticipantToEvent,
  disconnectFromWaitingListOfEvent,
} from "./utils.server";
import { utcToZonedTime } from "date-fns-tz";
import i18next from "~/i18next.server";
import { detectLanguage } from "~/root.server";

const schema = z.object({
  profileId: z.string(),
});

export const moveToParticipantsSchema = schema;

const mutation = makeDomainFunction(schema)(async (values) => {
  return values;
});

export const action = async (args: DataFunctionArgs) => {
  const { request, params } = args;
  const response = new Response();
  const locale = detectLanguage(request);
  const t = await i18next.getFixedT(locale, [
    "routes/event/settings/waiting-list/move-to-participants",
  ]);
  const slug = getParamValueOrThrow(params, "slug");
  const authClient = createAuthClient(request, response);
  const sessionUser = await getSessionUserOrThrow(authClient);
  const mode = await deriveEventMode(sessionUser, slug);
  invariantResponse(mode === "admin", t("error.notPrivileged"), {
    status: 403,
  });
  await checkFeatureAbilitiesOrThrow(authClient, "events");

  const result = await performMutation({ request, schema, mutation });

  if (result.success === true) {
    const event = await getEventBySlug(slug);
    invariantResponse(event, t("error.notFound.event"), { status: 404 });
    const profile = await getProfileByUserId(result.data.profileId);
    invariantResponse(profile, t("error.notFound.profile"), { status: 404 });
    await connectParticipantToEvent(event.id, result.data.profileId);
    await disconnectFromWaitingListOfEvent(event.id, result.data.profileId);
    // Send info mail
    const sender = process.env.SYSTEM_MAIL_SENDER;
    if (sender === undefined) {
      console.error(t("error.env.sender"));
      throw badRequest({
        message: t("error.env.sender"),
      });
    }
    const baseUrl = process.env.COMMUNITY_BASE_URL;
    if (baseUrl === undefined) {
      console.error(t("error.env.url"));
      throw badRequest({
        message: t("error.env.url"),
      });
    }
    // -> mail of person which was moved to waitinglist
    const recipient = profile.email;
    const subject = t("email.subject", { title: event.name });
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
            t("email.supportContact.firstName"),
          lastName:
            event.admins[0].profile.lastName ??
            t("email.supportContact.lastName"),
          email:
            event.admins[0].profile.email ?? t("email.supportContact.email"),
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
      return serverError({ message: t("error.mailer") });
    }
  }
  return json(result, { headers: response.headers });
};
