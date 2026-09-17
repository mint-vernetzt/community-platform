import {
  type ActionFunctionArgs,
  redirect,
  useLoaderData,
  type LoaderFunctionArgs,
  Form,
} from "react-router";
import { createAuthClient, getSessionUser } from "~/auth.server";
import TitleSection from "~/components/next/TitleSection";
import { invariantResponse } from "~/lib/utils/response";
import { getRedirectPathOnProtectedEventRoute } from "../../settings.server";
import { checkFeatureAbilitiesOrThrow } from "~/routes/feature-access.server";
import { detectLanguage } from "~/i18n.server";
import { languageModuleMap } from "~/locales/.server";
import {
  getCurrentActiveReminderMails,
  getEvent,
  updateEventActiveReminderMails,
} from "./list.server";
import { Toggle } from "~/components-next/icons/Toggle";
import { INTENT_FIELD_NAME } from "~/form-helpers";
import {
  ACTIVATE_ONE_DAY_REMINDER_MAIL_INTENT,
  DEACTIVATE_ONE_DAY_REMINDER_MAIL_INTENT,
  ACTIVATE_ONE_HOUR_REMINDER_MAIL_INTENT,
  DEACTIVATE_ONE_HOUR_REMINDER_MAIL_INTENT,
  ACTIVATE_FIFTEEN_MINUTES_REMINDER_MAIL_INTENT,
  DEACTIVATE_FIFTEEN_MINUTES_REMINDER_MAIL_INTENT,
} from "./list.shared";
import { captureException } from "@sentry/node";
import { redirectWithToast } from "~/toast.server";
import Hint from "~/components/next/Hint";
import { insertComponentsIntoLocale } from "~/lib/utils/i18n";

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

  if (event.external) {
    return redirect(`../../time-period`);
  }

  return { locales, event };
}

export async function action(args: ActionFunctionArgs) {
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

  const currentActiveReminderMails = await getCurrentActiveReminderMails(slug);

  const formData = await request.formData();
  const intent = formData.get(INTENT_FIELD_NAME);

  invariantResponse(typeof intent === "string", "intent is not defined", {
    status: 400,
  });
  invariantResponse(
    intent === ACTIVATE_ONE_DAY_REMINDER_MAIL_INTENT ||
      intent === DEACTIVATE_ONE_DAY_REMINDER_MAIL_INTENT ||
      intent === ACTIVATE_ONE_HOUR_REMINDER_MAIL_INTENT ||
      intent === DEACTIVATE_ONE_HOUR_REMINDER_MAIL_INTENT ||
      intent === ACTIVATE_FIFTEEN_MINUTES_REMINDER_MAIL_INTENT ||
      intent === DEACTIVATE_FIFTEEN_MINUTES_REMINDER_MAIL_INTENT,
    "unknown intent",
    {
      status: 400,
    }
  );
  // Remove all occurences to avoid duplicates
  const newReminderMails = currentActiveReminderMails.filter(
    (activeReminderMail) => {
      if (
        intent === ACTIVATE_ONE_DAY_REMINDER_MAIL_INTENT ||
        intent === DEACTIVATE_ONE_DAY_REMINDER_MAIL_INTENT
      ) {
        return activeReminderMail !== "oneDayBefore";
      }
      if (
        intent === ACTIVATE_ONE_HOUR_REMINDER_MAIL_INTENT ||
        intent === DEACTIVATE_ONE_HOUR_REMINDER_MAIL_INTENT
      ) {
        return activeReminderMail !== "oneHourBefore";
      }
      if (
        intent === ACTIVATE_FIFTEEN_MINUTES_REMINDER_MAIL_INTENT ||
        intent === DEACTIVATE_FIFTEEN_MINUTES_REMINDER_MAIL_INTENT
      ) {
        return activeReminderMail !== "fifteenMinutesBefore";
      }
      return true;
    }
  );
  if (intent === ACTIVATE_ONE_DAY_REMINDER_MAIL_INTENT) {
    newReminderMails.push("oneDayBefore");
  }
  if (intent === ACTIVATE_ONE_HOUR_REMINDER_MAIL_INTENT) {
    newReminderMails.push("oneHourBefore");
  }
  if (intent === ACTIVATE_FIFTEEN_MINUTES_REMINDER_MAIL_INTENT) {
    newReminderMails.push("fifteenMinutesBefore");
  }
  try {
    await updateEventActiveReminderMails(slug, newReminderMails);
  } catch (error) {
    captureException(error);
    return redirectWithToast(request.url, {
      id: "update-reminder-mail-error",
      key: `update-reminder-mail-error-${Date.now()}`,
      message: locales.route.errors.updateReminderMail,
      level: "negative",
    });
  }
  return redirectWithToast(request.url, {
    id: "update-reminder-mail-success",
    key: `update-reminder-mail-success-${Date.now()}`,
    message:
      intent === ACTIVATE_ONE_DAY_REMINDER_MAIL_INTENT ||
      intent === ACTIVATE_ONE_HOUR_REMINDER_MAIL_INTENT ||
      intent === ACTIVATE_FIFTEEN_MINUTES_REMINDER_MAIL_INTENT
        ? locales.route.success.updateReminderMail.activated
        : locales.route.success.updateReminderMail.deactivated,
    level: "positive",
  });
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
        <Form
          id="reminder-mails-form"
          method="POST"
          preventScrollReset
          replace
          hidden
        />
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
                form="reminder-mails-form"
                type="submit"
                name={INTENT_FIELD_NAME}
                value={
                  event.activeReminderMails.includes("oneDayBefore")
                    ? DEACTIVATE_ONE_DAY_REMINDER_MAIL_INTENT
                    : ACTIVATE_ONE_DAY_REMINDER_MAIL_INTENT
                }
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
                  form="reminder-mails-form"
                  type="submit"
                  name={INTENT_FIELD_NAME}
                  value={
                    event.activeReminderMails.includes("oneHourBefore")
                      ? DEACTIVATE_ONE_HOUR_REMINDER_MAIL_INTENT
                      : ACTIVATE_ONE_HOUR_REMINDER_MAIL_INTENT
                  }
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
                  form="reminder-mails-form"
                  type="submit"
                  name={INTENT_FIELD_NAME}
                  value={
                    event.activeReminderMails.includes("fifteenMinutesBefore")
                      ? DEACTIVATE_FIFTEEN_MINUTES_REMINDER_MAIL_INTENT
                      : ACTIVATE_FIFTEEN_MINUTES_REMINDER_MAIL_INTENT
                  }
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
        {event.stage !== null &&
        ((event.stage.slug === "online" &&
          event.activeReminderMails.includes("oneDayBefore") === false &&
          event.activeReminderMails.includes("fifteenMinutesBefore") ===
            false) ||
          (event.stage.slug === "hybrid" &&
            event.activeReminderMails.includes("oneHourBefore") === false &&
            event.activeReminderMails.includes("fifteenMinutesBefore") ===
              false)) ? (
          <Hint>
            {insertComponentsIntoLocale(
              locales.route.system.disabledReminderMailsHint,
              [<span key="bold" className="font-semibold" />]
            )}
          </Hint>
        ) : null}
      </div>
    </div>
  );
}

export default NotificationsList;
