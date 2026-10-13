import { redirect, useLoaderData, type LoaderFunctionArgs } from "react-router";
import { createAuthClient, getSessionUser } from "~/auth.server";
import { detectLanguage } from "~/i18n.server";
import { invariantResponse } from "~/lib/utils/response";
import { languageModuleMap } from "~/locales/.server";
import { getRedirectPathOnProtectedEventRoute } from "../../settings.server";
import { getCompiledHtmlString, getEventBySlug } from "./preview.server";
import { utcToZonedTime } from "date-fns-tz";
import { getVenueString } from "~/utils.shared";
import { RTE } from "~/components-next/RTE/RTE";
import { TextArea } from "~/components-next/TextArea";
import {
  NOTIFICATION_TYPE_CONFIRMATION,
  NOTIFICATION_TYPE_ONE_DAY_BEFORE,
  NOTIFICATION_TYPE_FIFTEEN_MINUTES_BEFORE,
  NOTIFICATION_TYPE_ONE_HOUR_BEFORE,
  NOTIFICATION_TYPE_MOVE_UP_TO_PARTICIPANTS,
  NOTIFICATION_TYPE_CANCELLATION,
} from "./list.shared";
import { getCompiledMailTemplate } from "~/mailer.server";
import { insertParametersIntoLocale } from "~/lib/utils/i18n";
import { getDuration } from "~/lib/utils/time";

export async function loader(args: LoaderFunctionArgs) {
  const { request, params } = args;
  const { slug } = params;

  invariantResponse(typeof slug === "string", "slug is not defined", {
    status: 400,
  });
  const { authClient } = createAuthClient(request);
  const sessionUser = await getSessionUser(authClient);
  const redirectPath = await getRedirectPathOnProtectedEventRoute({
    request,
    slug,
    sessionUser,
    authClient,
  });
  if (redirectPath !== null) {
    return redirect(redirectPath);
  }
  invariantResponse(sessionUser, "User not authenticated", { status: 401 });

  const event = await getEventBySlug(slug);
  invariantResponse(event !== null, "Event not found", { status: 404 });

  const language = await detectLanguage(request);
  const locales =
    languageModuleMap[language]["event/$slug/settings/notifications/preview"];

  const url = new URL(request.url);
  const searchParams = url.searchParams;
  const notification = searchParams.get("notification");

  invariantResponse(
    notification === NOTIFICATION_TYPE_ONE_DAY_BEFORE ||
      notification === NOTIFICATION_TYPE_ONE_HOUR_BEFORE ||
      notification === NOTIFICATION_TYPE_FIFTEEN_MINUTES_BEFORE ||
      notification === NOTIFICATION_TYPE_CONFIRMATION ||
      notification === NOTIFICATION_TYPE_MOVE_UP_TO_PARTICIPANTS ||
      notification === NOTIFICATION_TYPE_CANCELLATION,
    "Invalid notification type",
    { status: 400 }
  );

  const zonedStartTime = utcToZonedTime(event.startTime, "Europe/Berlin");
  const zonedEndTime = utcToZonedTime(event.endTime, "Europe/Berlin");

  const germanMailLocales = languageModuleMap["de"]["root"];
  const englishMailLocales = languageModuleMap["en"]["root"];
  let text;

  if (notification === NOTIFICATION_TYPE_ONE_DAY_BEFORE) {
    const textTemplatePath =
      "mail-templates/event/reminder-one-day-before-text.hbs";
    text = getCompiledMailTemplate(
      textTemplatePath,
      {
        headline: {
          de: insertParametersIntoLocale(
            germanMailLocales.route.event.reminder.oneDayBefore.subject,
            {
              eventName: event.name,
            }
          ),
          en: insertParametersIntoLocale(
            englishMailLocales.route.event.reminder.oneDayBefore.subject,
            {
              eventName: event.name,
            }
          ),
        },
        profile: {
          firstName: "Name",
          isGuest: false,
        },
        event: {
          name: event.name,
          url: `${process.env.COMMUNITY_BASE_URL}/event/${event.slug}`,
          date: {
            de: getDuration(zonedStartTime, zonedEndTime, "de"),
            en: getDuration(zonedStartTime, zonedEndTime, "en"),
          },
          location: getVenueString(event),
          conferenceLink: event.conferenceLink,
          conferenceCode: event.conferenceCode,
        },
      },
      "text"
    );
  } else if (notification === NOTIFICATION_TYPE_ONE_HOUR_BEFORE) {
    const textTemplatePath =
      "mail-templates/event/reminder-one-hour-before-text.hbs";
    text = getCompiledMailTemplate(
      textTemplatePath,
      {
        headline: {
          de: insertParametersIntoLocale(
            germanMailLocales.route.event.reminder.oneHourBefore.subject,
            {
              eventName: event.name,
            }
          ),
          en: insertParametersIntoLocale(
            englishMailLocales.route.event.reminder.oneHourBefore.subject,
            {
              eventName: event.name,
            }
          ),
        },
        profile: {
          firstName: "Name",
          isGuest: false,
        },
        event: {
          name: event.name,
          url: `${process.env.COMMUNITY_BASE_URL}/event/${event.slug}`,
          date: {
            de: getDuration(zonedStartTime, zonedEndTime, "de"),
            en: getDuration(zonedStartTime, zonedEndTime, "en"),
          },
          location: getVenueString(event),
          conferenceLink: event.conferenceLink,
          conferenceCode: event.conferenceCode,
        },
      },
      "text"
    );
  } else if (notification === NOTIFICATION_TYPE_FIFTEEN_MINUTES_BEFORE) {
    const textTemplatePath =
      "mail-templates/event/reminder-fifteen-minutes-before-text.hbs";
    text = getCompiledMailTemplate(
      textTemplatePath,
      {
        headline: {
          de: insertParametersIntoLocale(
            germanMailLocales.route.event.reminder.fifteenMinutesBefore.subject,
            {
              eventName: event.name,
            }
          ),
          en: insertParametersIntoLocale(
            englishMailLocales.route.event.reminder.fifteenMinutesBefore
              .subject,
            {
              eventName: event.name,
            }
          ),
        },
        profile: {
          firstName: "Name",
          isGuest: false,
        },
        event: {
          name: event.name,
          url: `${process.env.COMMUNITY_BASE_URL}/event/${event.slug}`,
          date: {
            de: getDuration(zonedStartTime, zonedEndTime, "de"),
            en: getDuration(zonedStartTime, zonedEndTime, "en"),
          },
          location: getVenueString(event),
          conferenceLink: event.conferenceLink,
          conferenceCode: event.conferenceCode,
        },
      },
      "text"
    );
  } else if (notification === NOTIFICATION_TYPE_CONFIRMATION) {
    const textTemplatePath =
      "mail-templates/event/profile-or-guest-added-to-participants-or-waiting-list-text.hbs";
    text = getCompiledMailTemplate(
      textTemplatePath,
      {
        headline: {
          de: insertParametersIntoLocale(
            germanMailLocales.route.event.confirmation.subject,
            {
              eventName: event.name,
            }
          ),
          en: insertParametersIntoLocale(
            englishMailLocales.route.event.confirmation.subject,
            {
              eventName: event.name,
            }
          ),
        },
        profile: {
          firstName: "Name",
          isGuest: false,
        },
        event: {
          name: event.name,
          url: `${process.env.COMMUNITY_BASE_URL}/event/${event.slug}`,
          date: {
            de: getDuration(zonedStartTime, zonedEndTime, "de"),
            en: getDuration(zonedStartTime, zonedEndTime, "en"),
          },
          location: getVenueString(event),
          conferenceLink: event.conferenceLink,
          conferenceCode: event.conferenceCode,
          icsLink: `${process.env.COMMUNITY_BASE_URL}/event/${event.slug}/ics-download`,
          isParent: event._count?.childEvents > 0,
        },
      },
      "text"
    );
  } else if (notification === NOTIFICATION_TYPE_MOVE_UP_TO_PARTICIPANTS) {
    const textTemplatePath =
      "mail-templates/event/profile-or-guest-moved-up-to-participants-text.hbs";
    text = getCompiledMailTemplate(
      textTemplatePath,
      {
        headline: {
          de: insertParametersIntoLocale(
            germanMailLocales.route.event.moveUpToParticipants.subject,
            {
              eventName: event.name,
            }
          ),
          en: insertParametersIntoLocale(
            englishMailLocales.route.event.moveUpToParticipants.subject,
            {
              eventName: event.name,
            }
          ),
        },
        profile: {
          firstName: "Name",
          isGuest: false,
          isOnWaitingList: false,
        },
        event: {
          name: event.name,
          url: `${process.env.COMMUNITY_BASE_URL}/event/${event.slug}`,
          date: {
            de: getDuration(zonedStartTime, zonedEndTime, "de"),
            en: getDuration(zonedStartTime, zonedEndTime, "en"),
          },
          location: getVenueString(event),
          conferenceLink: event.conferenceLink,
          conferenceCode: event.conferenceCode,
          icsLink: `${process.env.COMMUNITY_BASE_URL}/event/${event.slug}/ics-download`,
          isParent: event._count?.childEvents > 0,
        },
      },
      "text"
    );
  } else {
    const templatePath =
      "mail-templates/general-notification/event-canceled-text.hbs";
    text = getCompiledMailTemplate(
      templatePath,
      {
        headline: {
          de: insertParametersIntoLocale(
            germanMailLocales.route.event.cancellation.subject,
            {
              eventName: event.name,
            }
          ),
          en: insertParametersIntoLocale(
            englishMailLocales.route.event.cancellation.subject,
            {
              eventName: event.name,
            }
          ),
        },
        firstName: "Name",
        event: {
          name: event.name,
        },
      },
      "text"
    );
  }

  return {
    locales,
    content: { text, footer: locales.route.system.footer.html },
  };
}

function NotificationsPreview() {
  const loaderData = useLoaderData<typeof loader>();
  return (
    <>
      <p className="whitespace-pre">{loaderData.content.text}</p>
    </>
  );
}

export default NotificationsPreview;
