import {
  type ActionFunctionArgs,
  Form,
  useLoaderData,
  type LoaderFunctionArgs,
  redirect,
} from "react-router";
import Hint from "~/components/next/Hint";
import TitleSection from "~/components/next/TitleSection";
import { detectLanguage } from "~/i18n.server";
import { invariantResponse } from "~/lib/utils/response";
import { languageModuleMap } from "~/locales/.server";
import {
  getEventBySlug,
  updateEventRegistrationAccessBySlug,
} from "./access.server";
import classNames from "classnames";
import { createAuthClient, getSessionUserOrThrow } from "~/auth.server";
import { checkFeatureAbilitiesOrThrow } from "~/routes/feature-access.server";
import { getRedirectPathOnProtectedEventRoute } from "../../settings.server";
import {
  CLOSED_REGISTRATION,
  createAccessSettingsSchema,
  EXTERNAL_REGISTRATION,
  INTERNAL_REGISTRATION,
  OPEN_REGISTRATION,
  SUBMIT_REGISTRATION_ACCESS_ACTION,
  SUBMIT_REGISTRATION_TYPE_ACTION,
} from "./access.shared";
import { parseWithZod } from "@conform-to/zod";
import { redirectWithToast } from "~/toast.server";
import { captureException } from "@sentry/node";
import { insertComponentsIntoLocale } from "~/lib/utils/i18n";

export async function loader(args: LoaderFunctionArgs) {
  const { request, params } = args;
  const { slug } = params;

  invariantResponse(typeof slug === "string", "slug is not defined", {
    status: 400,
  });

  const language = await detectLanguage(request);
  const locales =
    languageModuleMap[language][
      "next/event/$slug/settings/registration/access"
    ];

  const event = await getEventBySlug(slug);
  invariantResponse(event !== null, "Event not found", { status: 404 });

  return { locales, event };
}

export async function action(args: ActionFunctionArgs) {
  const { request, params } = args;
  const { slug } = params;

  invariantResponse(typeof slug === "string", "slug is not defined", {
    status: 400,
  });

  const { authClient } = createAuthClient(request);
  await checkFeatureAbilitiesOrThrow(authClient, [
    "events",
    "next_event_settings",
  ]);
  const sessionUser = await getSessionUserOrThrow(authClient);
  const redirectPath = await getRedirectPathOnProtectedEventRoute({
    request,
    slug,
    sessionUser,
    authClient,
  });
  if (redirectPath !== null) {
    return redirect(redirectPath);
  }

  const language = await detectLanguage(request);
  const locales =
    languageModuleMap[language][
      "next/event/$slug/settings/registration/access"
    ];

  const formData = await request.formData();
  const schema = createAccessSettingsSchema();
  const submission = await parseWithZod(formData, { schema });

  if (submission.status !== "success") {
    return redirectWithToast(request.url, {
      id: "registration-access-settings-validation-error",
      key: `registration-access-settings-validation-error-${Date.now()}`,
      message: locales.route.errors.validationError,
      level: "negative",
    });
  }

  if (typeof submission.value.type !== "undefined") {
    try {
      await updateEventRegistrationAccessBySlug(slug, {
        external: submission.value.type === EXTERNAL_REGISTRATION,
      });
    } catch (error) {
      captureException(error);
      return redirectWithToast(request.url, {
        id: "registration-type-update-error",
        key: `registration-type-update-error-${Date.now()}`,
        message: locales.route.errors.updateTypeFailed,
        level: "negative",
      });
    }
  }

  if (typeof submission.value.access !== "undefined") {
    try {
      await updateEventRegistrationAccessBySlug(slug, {
        openForRegistration: submission.value.access === OPEN_REGISTRATION,
      });
    } catch (error) {
      captureException(error);
      return redirectWithToast(request.url, {
        id: "registration-access-update-error",
        key: `registration-access-update-error-${Date.now()}`,
        message: locales.route.errors.updateAccessFailed,
        level: "negative",
      });
    }
  }

  return null;
}

function RegistrationAccess() {
  const loaderData = useLoaderData<typeof loader>();
  const { locales, event } = loaderData;

  return (
    <div className="flex flex-col gap-8 pt-4">
      <div className="flex flex-col gap-4">
        <TitleSection>
          <TitleSection.Headline>
            {locales.route.type.headline}
          </TitleSection.Headline>
          <TitleSection.Subline>
            {locales.route.type.subline}
          </TitleSection.Subline>
        </TitleSection>
        <Hint>
          <Hint.InfoIcon />
          {locales.route.type.hint}
        </Hint>
        <Form
          id="registration-type-form"
          method="post"
          className="flex flex-col gap-4"
        >
          <RadioButtonSettings
            name={SUBMIT_REGISTRATION_TYPE_ACTION}
            value={INTERNAL_REGISTRATION}
            active={event.external === false}
            disabled={event.published}
          >
            <RadioButtonSettings.Title>
              {locales.route.type.internal.headline}
            </RadioButtonSettings.Title>
            <RadioButtonSettings.Subline>
              {locales.route.type.internal.subline}
            </RadioButtonSettings.Subline>
          </RadioButtonSettings>
          <RadioButtonSettings
            name={SUBMIT_REGISTRATION_TYPE_ACTION}
            value={EXTERNAL_REGISTRATION}
            active={event.external}
            disabled={event.published}
          >
            <RadioButtonSettings.Title>
              {locales.route.type.external.headline}
            </RadioButtonSettings.Title>
            <RadioButtonSettings.Subline>
              {locales.route.type.external.subline}
            </RadioButtonSettings.Subline>
          </RadioButtonSettings>
        </Form>
        {event.external && (
          <Hint>
            <Hint.InfoIcon />
            {insertComponentsIntoLocale(locales.route.type.external.hint, [
              <span key="strong" className="font-semibold" />,
            ])}
          </Hint>
        )}
      </div>
      {event.external === false && (
        <div className="flex flex-col gap-4">
          <TitleSection>
            <TitleSection.Headline>
              {locales.route.access.headline}
            </TitleSection.Headline>
            <TitleSection.Subline>
              {locales.route.access.subline}
            </TitleSection.Subline>
          </TitleSection>
          <Form
            id="registration-access-form"
            method="post"
            className="flex flex-col gap-4"
          >
            <RadioButtonSettings
              name={SUBMIT_REGISTRATION_ACCESS_ACTION}
              value={OPEN_REGISTRATION}
              active={event.openForRegistration}
              disabled={event.published}
            >
              <RadioButtonSettings.Title>
                {locales.route.access.open.headline}
              </RadioButtonSettings.Title>
              <RadioButtonSettings.Subline>
                {locales.route.access.open.subline}
              </RadioButtonSettings.Subline>
            </RadioButtonSettings>
            <RadioButtonSettings
              name={SUBMIT_REGISTRATION_ACCESS_ACTION}
              value={CLOSED_REGISTRATION}
              active={event.openForRegistration === false}
              disabled={event.published}
            >
              <RadioButtonSettings.Title>
                {locales.route.access.closed.headline}
              </RadioButtonSettings.Title>
              <RadioButtonSettings.Subline>
                {locales.route.access.closed.subline}
              </RadioButtonSettings.Subline>
            </RadioButtonSettings>
          </Form>
        </div>
      )}
    </div>
  );
}

function RadioButtonSettings(props: {
  children: React.ReactNode;
  active?: boolean;
  disabled?: boolean;
  name: string;
  value: string;
}) {
  const { children, active = false, disabled = false, name, value } = props;

  const buttonClasses = classNames(
    "w-full p-4 rounded-lg ring",
    disabled
      ? "ring-neutral-200 text-neutral-300"
      : "cursor-pointer hover:bg-neutral-100 ring focus:outline-none focus:ring-2 focus:ring-primary-200 text-neutral-700"
  );

  const radioClasses = classNames(
    "w-5 h-5 rounded-full bg-white border flex items-center justify-center",
    disabled ? "border-neutral-400" : "border-neutral-700"
  );

  const indicatorClasses = classNames(
    "w-3.5 h-3.5 rounded-full border",
    disabled
      ? "bg-neutral-400 border-neutral-400"
      : "bg-primary-700 border-neutral-700"
  );

  return (
    <button
      type="submit"
      name={name}
      value={value}
      disabled={disabled}
      className={buttonClasses}
      onClick={(event) => {
        if (active) {
          event.preventDefault();
        }
      }}
    >
      <div className="w-full flex gap-2 items-center">
        <div className={radioClasses}>
          {active && <div className={indicatorClasses} />}
        </div>
        <div className="inline-flex flex-col items-start ">{children}</div>
      </div>
    </button>
  );
}

function RadioButtonSettingsTitle(props: { children: React.ReactNode }) {
  return <span className="font-semibold">{props.children}</span>;
}

function RadioButtonSettingsSubline(props: { children: React.ReactNode }) {
  return <span className="text-sm">{props.children}</span>;
}

RadioButtonSettings.Title = RadioButtonSettingsTitle;
RadioButtonSettings.Subline = RadioButtonSettingsSubline;

export default RegistrationAccess;
