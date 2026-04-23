import { getFormProps, getInputProps, useForm } from "@conform-to/react";
import { getZodConstraint, parseWithZod } from "@conform-to/zod";
import { Button } from "@mint-vernetzt/components/src/molecules/Button";
import { Input } from "@mint-vernetzt/components/src/molecules/Input";
import { captureException } from "@sentry/node";
import classNames from "classnames";
import {
  type ActionFunctionArgs,
  Form,
  type LoaderFunctionArgs,
  redirect,
  useActionData,
  useLoaderData,
  useNavigation,
} from "react-router";
import { useHydrated } from "remix-utils/use-hydrated";
import { createAuthClient, getSessionUserOrThrow } from "~/auth.server";
import Hint from "~/components/next/Hint";
import TitleSection from "~/components/next/TitleSection";
import { INTENT_FIELD_NAME } from "~/form-helpers";
import { detectLanguage } from "~/i18n.server";
import { useIsSubmitting } from "~/lib/hooks/useIsSubmitting";
import { insertComponentsIntoLocale } from "~/lib/utils/i18n";
import { invariantResponse } from "~/lib/utils/response";
import { languageModuleMap } from "~/locales/.server";
import { checkFeatureAbilitiesOrThrow } from "~/routes/feature-access.server";
import { redirectWithToast } from "~/toast.server";
import { getRedirectPathOnProtectedEventRoute } from "../../settings.server";
import {
  getEventBySlug,
  updateEventExternalRegistrationUrl,
  updateEventRegistrationAccess,
} from "./access.server";
import {
  createExternalRegistrationUrlSchema,
  SET_REGISTRATION_ACCESS_TO_CLOSED_INTENT,
  SET_REGISTRATION_ACCESS_TO_OPEN_INTENT,
  SET_REGISTRATION_TYPE_TO_EXTERNAL_INTENT,
  SET_REGISTRATION_TYPE_TO_INTERNAL_INTENT,
  UPDATE_EXTERNAL_REGISTRATION_URL_INTENT,
} from "./access.shared";

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
  const intent = formData.get(INTENT_FIELD_NAME);

  invariantResponse(
    intent === SET_REGISTRATION_TYPE_TO_INTERNAL_INTENT ||
      intent === SET_REGISTRATION_TYPE_TO_EXTERNAL_INTENT ||
      intent === SET_REGISTRATION_ACCESS_TO_OPEN_INTENT ||
      intent === SET_REGISTRATION_ACCESS_TO_CLOSED_INTENT ||
      intent === UPDATE_EXTERNAL_REGISTRATION_URL_INTENT,
    "Invalid intent",
    {
      status: 400,
    }
  );

  const event = await getEventBySlug(slug);
  invariantResponse(event !== null, "Event not found", { status: 404 });

  if (
    intent === SET_REGISTRATION_TYPE_TO_INTERNAL_INTENT ||
    intent === SET_REGISTRATION_TYPE_TO_EXTERNAL_INTENT
  ) {
    try {
      await updateEventRegistrationAccess({
        eventId: event.id,
        external: intent === SET_REGISTRATION_TYPE_TO_EXTERNAL_INTENT,
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
    return null;
  }

  if (
    intent === SET_REGISTRATION_ACCESS_TO_OPEN_INTENT ||
    intent === SET_REGISTRATION_ACCESS_TO_CLOSED_INTENT
  ) {
    try {
      await updateEventRegistrationAccess({
        eventId: event.id,
        openForRegistration: intent === SET_REGISTRATION_ACCESS_TO_OPEN_INTENT,
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
    return null;
  }

  if (intent === UPDATE_EXTERNAL_REGISTRATION_URL_INTENT) {
    const schema = createExternalRegistrationUrlSchema({
      locales: locales.route.type.external.form.errors,
    });
    const submission = await parseWithZod(formData, { schema });

    if (submission.status !== "success") {
      return submission.reply();
    }

    try {
      await updateEventExternalRegistrationUrl({
        eventId: event.id,
        externalRegistrationUrl: submission.value.externalRegistrationUrl,
      });
      return redirectWithToast(request.url, {
        id: "registration-url-update-success",
        key: `registration-url-update-success-${Date.now()}`,
        message: locales.route.type.external.form.success,
        level: "positive",
      });
    } catch (error) {
      captureException(error);
      return redirectWithToast(request.url, {
        id: "registration-url-update-error",
        key: `registration-url-update-error-${Date.now()}`,
        message: locales.route.errors.updateRegistrationUrlFailed,
        level: "negative",
      });
    }
  }

  return null;
}

function RegistrationAccess() {
  const loaderData = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const { locales, event } = loaderData;
  const isHydrated = useHydrated();
  const isSubmitting = useIsSubmitting();
  const navigation = useNavigation();

  const [form, fields] = useForm({
    id: "registration-external-url-form",
    constraint: getZodConstraint(
      createExternalRegistrationUrlSchema({
        locales: locales.route.type.external.form.errors,
      })
    ),
    defaultValue: {
      externalRegistrationUrl: event.externalRegistrationUrl,
    },
    shouldValidate: "onBlur",
    shouldRevalidate: "onInput",
    onValidate: (values) => {
      return parseWithZod(values.formData, {
        schema: createExternalRegistrationUrlSchema({
          locales: locales.route.type.external.form.errors,
        }),
      });
    },
    lastResult: navigation.state === "idle" ? actionData : null,
  });

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
        <Hint>
          <Hint.InfoIcon />
          {insertComponentsIntoLocale(locales.route.type.external.hint, [
            <span key="strong" className="font-semibold" />,
          ])}
        </Hint>
        <Form
          id="registration-type-form"
          method="post"
          className="flex flex-col gap-4"
        >
          <RadioButtonSettings
            name={INTENT_FIELD_NAME}
            value={SET_REGISTRATION_TYPE_TO_INTERNAL_INTENT}
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
            name={INTENT_FIELD_NAME}
            value={SET_REGISTRATION_TYPE_TO_EXTERNAL_INTENT}
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
          <>
            <Form
              {...getFormProps(form)}
              method="post"
              className="flex flex-col gap-4"
            >
              <Input
                {...getInputProps(fields.externalRegistrationUrl, {
                  type: "text",
                })}
                placeholder={
                  locales.route.type.external.form.registrationUrl.placeholder
                }
                key="externalRegistrationUrl"
              >
                <Input.Label htmlFor={fields.externalRegistrationUrl.id}>
                  {locales.route.type.external.form.registrationUrl.label}
                </Input.Label>
                {typeof fields.externalRegistrationUrl.errors !== "undefined" &&
                fields.externalRegistrationUrl.errors.length > 0
                  ? fields.externalRegistrationUrl.errors.map((error) => (
                      <Input.Error
                        id={fields.externalRegistrationUrl.errorId}
                        key={error}
                      >
                        {error}
                      </Input.Error>
                    ))
                  : null}
              </Input>
              <div className="w-full flex flex-col md:flex-row-reverse gap-4 md:justify-start">
                <div className="w-full md:w-fit">
                  <Button
                    type="submit"
                    name={INTENT_FIELD_NAME}
                    value={UPDATE_EXTERNAL_REGISTRATION_URL_INTENT}
                    fullSize
                    form={form.id}
                    // Don't disable button when js is disabled
                    disabled={
                      isHydrated
                        ? form.dirty === false ||
                          form.valid === false ||
                          isSubmitting
                        : false
                    }
                  >
                    {locales.route.type.external.form.submit}
                  </Button>
                </div>
                <div className="w-full md:w-fit">
                  <Button
                    type="reset"
                    onClick={() => {
                      form.reset();
                    }}
                    variant="outline"
                    fullSize
                    // Don't disable button when js is disabled
                    disabled={isHydrated ? form.dirty === false : false}
                  >
                    {locales.route.type.external.form.reset}
                  </Button>
                  <noscript className="absolute top-0">
                    <Button as="link" to="." variant="outline" fullSize>
                      {locales.route.type.external.form.reset}
                    </Button>
                  </noscript>
                </div>
              </div>
            </Form>
          </>
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
              name={INTENT_FIELD_NAME}
              value={SET_REGISTRATION_ACCESS_TO_OPEN_INTENT}
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
              name={INTENT_FIELD_NAME}
              value={SET_REGISTRATION_ACCESS_TO_CLOSED_INTENT}
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
