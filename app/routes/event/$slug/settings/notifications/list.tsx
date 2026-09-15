import { redirect, useLoaderData, type LoaderFunctionArgs } from "react-router";
import { createAuthClient, getSessionUser } from "~/auth.server";
import TitleSection from "~/components/next/TitleSection";
import { invariantResponse } from "~/lib/utils/response";
import { getRedirectPathOnProtectedEventRoute } from "../../settings.server";
import { checkFeatureAbilitiesOrThrow } from "~/routes/feature-access.server";
import { detectLanguage } from "~/i18n.server";
import { languageModuleMap } from "~/locales/.server";
import { getEvent } from "./list.server";
import { Toggle } from "~/components-next/icons/Toggle";

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
  await checkFeatureAbilitiesOrThrow(authClient, ["events"]);

  const language = await detectLanguage(request);
  const locales =
    languageModuleMap[language]["event/$slug/settings/notifications/list"];

  const event = await getEvent(slug);
  invariantResponse(event !== null, "Event not found", { status: 404 });

  return { locales, event };
}

function NotificationsList() {
  const loaderData = useLoaderData<typeof loader>();
  const { locales, event } = loaderData;

  return (
    <div className="flex flex-col gap-8 pt-4">
      <div className="flex flex-col gap-4">
        <TitleSection>
          <TitleSection.Headline>
            {locales.route.system.title}
          </TitleSection.Headline>
          <TitleSection.Subline>
            {locales.route.system.description}
          </TitleSection.Subline>
        </TitleSection>
        <ul className="flex flex-col border border-neutral-200 rounded-xl *:border-b *:border-neutral-200 *:last:border-b-0 text-neutral-700 text-sm">
          <li className="flex justify-between items-center gap-4 p-4">
            <div className="flex flex-col gap-0.5">
              <p className="font-semibold">
                {locales.route.system.list.confirmation.title}
              </p>
              <p>{locales.route.system.list.confirmation.description}</p>
            </div>
          </li>
          <li className="flex justify-between items-center gap-4 p-4">
            <div className="flex flex-col gap-0.5">
              <p className="font-semibold">
                {locales.route.system.list.moveUpToParticipants.title}
              </p>
              <p>
                {locales.route.system.list.moveUpToParticipants.description}
              </p>
            </div>
          </li>
          <li className="flex justify-between items-center gap-4 p-4">
            <div className="flex flex-col gap-0.5">
              <p className="font-semibold">
                {locales.route.system.list.oneDayBefore.title}
              </p>
              <p>{locales.route.system.list.oneDayBefore.description}</p>
            </div>
            <div className="group">
              <button
                className="w-8 h-8"
                aria-label={
                  event.activeReminderMails.includes("oneDayBefore")
                    ? locales.route.system.list.oneDayBefore.toggle.active
                    : locales.route.system.list.oneDayBefore.toggle.inactive
                }
              >
                <Toggle
                  active={event.activeReminderMails.includes("oneDayBefore")}
                />
              </button>
            </div>
          </li>
          {(event.stage === null || event.stage.slug !== "online") && (
            <li className="flex justify-between items-center gap-4 p-4">
              <div className="flex flex-col gap-0.5">
                <p className="font-semibold">
                  {locales.route.system.list.oneHourBefore.title}
                </p>
                <p>{locales.route.system.list.oneHourBefore.description}</p>
              </div>
              <div className="group">
                <button
                  className="w-8 h-8"
                  aria-label={
                    event.activeReminderMails.includes("oneHourBefore")
                      ? locales.route.system.list.oneHourBefore.toggle.active
                      : locales.route.system.list.oneHourBefore.toggle.inactive
                  }
                >
                  <Toggle
                    active={event.activeReminderMails.includes("oneHourBefore")}
                  />
                </button>
              </div>
            </li>
          )}
          {(event.stage === null || event.stage.slug !== "on-site") && (
            <li className="flex justify-between items-center gap-4 p-4">
              <div className="flex flex-col gap-0.5">
                <p className="font-semibold">
                  {locales.route.system.list.fifteenMinutesBefore.title}
                </p>
                <p>
                  {locales.route.system.list.fifteenMinutesBefore.description}
                </p>
              </div>
              <div className="group">
                <button
                  className="w-8 h-8"
                  aria-label={
                    event.activeReminderMails.includes("fifteenMinutesBefore")
                      ? locales.route.system.list.fifteenMinutesBefore.toggle
                          .active
                      : locales.route.system.list.fifteenMinutesBefore.toggle
                          .inactive
                  }
                >
                  <Toggle
                    active={event.activeReminderMails.includes(
                      "fifteenMinutesBefore"
                    )}
                  />
                </button>
              </div>
            </li>
          )}
          <li className="flex justify-between items-center gap-4 p-4">
            <div className="flex flex-col gap-0.5">
              <p className="font-semibold">
                {locales.route.system.list.cancellation.title}
              </p>
              <p>{locales.route.system.list.cancellation.description}</p>
            </div>
          </li>
        </ul>
      </div>
    </div>
  );
}

export default NotificationsList;
