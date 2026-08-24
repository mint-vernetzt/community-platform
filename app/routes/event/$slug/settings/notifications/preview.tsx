import { redirect, useLoaderData, type LoaderFunctionArgs } from "react-router";
import { createAuthClient, getSessionUser } from "~/auth.server";
import { detectLanguage } from "~/i18n.server";
import { invariantResponse } from "~/lib/utils/response";
import { languageModuleMap } from "~/locales/.server";
import { getRedirectPathOnProtectedEventRoute } from "../../settings.server";
import { getCompiledHtmlString, getEventBySlug } from "./preview.server";
import { utcToZonedTime } from "date-fns-tz";
import { getVenueString } from "~/utils.shared";

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
    notification === "oneDayBefore" ||
      notification === "oneHourBefore" ||
      notification === "fifteenMinutesBefore",
    "Invalid notification type",
    { status: 400 }
  );

  let content: {
    title: string;
    subject: string;
    html: string;
    plainText: string;
  };

  if (notification === "oneDayBefore") {
    content = locales.route.system.mails.oneDayBefore;
  } else if (notification === "oneHourBefore") {
    content = locales.route.system.mails.oneHourBefore;
  } else {
    content = locales.route.system.mails.fifteenMinutesBefore;
  }

  const zonedStartTime = utcToZonedTime(event.startTime, "Europe/Berlin");
  const html = getCompiledHtmlString({
    template: content.html,
    data: {
      event: {
        url: `${process.env.COMMUNITY_BASE_URL}/event/${event.slug}/detail`,
        name: event.name,
        startDate: zonedStartTime.toLocaleDateString("de-DE", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        }),
        startTime: zonedStartTime.toLocaleTimeString("de-DE", {
          hour: "2-digit",
          minute: "2-digit",
        }),
        timezone: locales.route.system.timezone,
        location: getVenueString(event),
        conferenceLink: event.conferenceLink,
      },
      profile: {
        firstName: "(Vorname)",
      },
    },
  });

  return {
    locales,
    content: { ...content, html, footer: locales.route.system.footer.html },
  };
}

function NotificationsPreview() {
  const loaderData = useLoaderData<typeof loader>();
  return (
    <>
      <div dangerouslySetInnerHTML={{ __html: loaderData.content.html }} />
    </>
  );
}

export default NotificationsPreview;
