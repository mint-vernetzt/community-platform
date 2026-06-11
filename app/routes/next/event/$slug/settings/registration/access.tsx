import { getFormProps, getInputProps, useForm } from "@conform-to/react";
import { getZodConstraint, parseWithZod } from "@conform-to/zod";
import { Button } from "@mint-vernetzt/components/src/molecules/Button";
import { Input } from "@mint-vernetzt/components/src/molecules/Input";
import { captureException } from "@sentry/node";
import {
  type ActionFunctionArgs,
  data,
  Form,
  type LoaderFunctionArgs,
  redirect,
  useActionData,
  useLoaderData,
  useLocation,
  useNavigation,
} from "react-router";
import { useHydrated } from "remix-utils/use-hydrated";
import {
  createAuthClient,
  getSessionUser,
  getSessionUserOrThrow,
} from "~/auth.server";
import Hint from "~/components/next/Hint";
import { usePreviousLocation } from "~/components/next/PreviousLocationContext";
import { RadioSubmitButtonSettings } from "~/components/next/RadioButtonSettings";
import TitleSection from "~/components/next/TitleSection";
import { UnsavedChangesModal } from "~/components/next/UnsavedChangesModal";
import { INTENT_FIELD_NAME } from "~/form-helpers";
import { detectLanguage } from "~/i18n.server";
import { useFormRevalidationAfterSuccess } from "~/lib/hooks/useFormRevalidationAfterSuccess";
import { useIsSubmitting } from "~/lib/hooks/useIsSubmitting";
import { insertComponentsIntoLocale } from "~/lib/utils/i18n";
import { invariantResponse } from "~/lib/utils/response";
import { UnsavedChangesModalParam } from "~/lib/utils/searchParams";
import { languageModuleMap } from "~/locales/.server";
import { checkFeatureAbilitiesOrThrow } from "~/routes/feature-access.server";
import { createToastHeaders, redirectWithToast } from "~/toast.server";
import {
  getEventBySlugForIssues,
  getIssues,
  getRedirectPathOnProtectedEventRoute,
} from "../../settings.server";
import {
  getEventBySlug,
  updateEventExternalRegistrationUrl,
  updateEventRegistrationAccess,
  updateParentParticipationRequired,
} from "./access.server";
import {
  createExternalRegistrationUrlSchema,
  SET_PARENT_PARTICIPATION_TO_NOT_REQUIRED_INTENT,
  SET_PARENT_PARTICIPATION_TO_REQUIRED_INTENT,
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
  await checkFeatureAbilitiesOrThrow(authClient, [
    "events",
    "next_event_settings",
  ]);

  const language = await detectLanguage(request);
  const locales =
    languageModuleMap[language][
      "next/event/$slug/settings/registration/access"
    ];

  const event = await getEventBySlug(slug);
  invariantResponse(event !== null, "Event not found", { status: 404 });

  let issues: ReturnType<typeof getIssues> = [];
  if (event.publishIntended) {
    const eventForIssues = await getEventBySlugForIssues(slug);
    issues = getIssues({
      event: eventForIssues,
      locales: languageModuleMap[language]["next/event/$slug/settings"].route,
      section: "registration",
    });
  }

  return { locales, event, issues };
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
      intent === UPDATE_EXTERNAL_REGISTRATION_URL_INTENT ||
      intent === SET_PARENT_PARTICIPATION_TO_REQUIRED_INTENT ||
      intent === SET_PARENT_PARTICIPATION_TO_NOT_REQUIRED_INTENT,
    "Invalid intent",
    {
      status: 400,
    }
  );

  const event = await getEventBySlug(slug);
  invariantResponse(event !== null, "Event not found", { status: 404 });

  if (event.published && intent !== UPDATE_EXTERNAL_REGISTRATION_URL_INTENT) {
    return redirectWithToast(request.url, {
      id: "event-published-error",
      key: `event-published-error-${Date.now()}`,
      message: locales.route.errors.eventPublished,
      level: "negative",
    });
  }

  if (
    intent === SET_REGISTRATION_TYPE_TO_INTERNAL_INTENT ||
    intent === SET_REGISTRATION_TYPE_TO_EXTERNAL_INTENT
  ) {
    try {
      await updateEventRegistrationAccess({
        event,
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
        event,
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
        event,
        externalRegistrationUrl: submission.value.externalRegistrationUrl,
      });
      const toastHeaders = await createToastHeaders({
        id: "registration-url-update",
        key: `registration-url-update-${Date.now()}`,
        message: locales.route.type.external.form.success,
      });
      return data(submission.reply(), {
        headers: toastHeaders,
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

  if (
    intent === SET_PARENT_PARTICIPATION_TO_REQUIRED_INTENT ||
    intent === SET_PARENT_PARTICIPATION_TO_NOT_REQUIRED_INTENT
  ) {
    try {
      await updateParentParticipationRequired({
        event: event,
        intent,
      });
      return null;
    } catch (error) {
      captureException(error);
      return redirectWithToast(request.url, {
        id: "parent-participation-update-error",
        key: `parent-participation-update-error-${Date.now()}`,
        message: locales.route.errors.updateParentParticipationFailed,
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
    lastResult: navigation.state === "idle" ? actionData : undefined,
  });

  const location = useLocation();
  const previousLocation = usePreviousLocation();
  useFormRevalidationAfterSuccess({
    deps: {
      navigation,
      submissionResult: actionData === null ? undefined : actionData,
      form,
    },
    skipRevalidation:
      location.search.includes(UnsavedChangesModalParam) ||
      (previousLocation !== null &&
        previousLocation.search.includes(UnsavedChangesModalParam)),
  });

  const externalRegistrationUrlIssue = loaderData.issues.find((issue) => {
    return (
      issue.section === "registration" &&
      issue.fields.some((field) => {
        return field === "externalRegistrationUrl";
      })
    );
  });

  return (
    <>
      <UnsavedChangesModal
        searchParam={UnsavedChangesModalParam}
        formMetadataToCheck={form}
        locales={locales.components.UnsavedChangesModal}
      />
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
            <RadioSubmitButtonSettings
              name={INTENT_FIELD_NAME}
              value={SET_REGISTRATION_TYPE_TO_INTERNAL_INTENT}
              active={event.external === false}
              disabled={event.published}
              buttonProps={{
                onClick: (changeEvent) => {
                  if (event.external === false) {
                    changeEvent.preventDefault();
                  } else {
                    // Reset the external registration url input when switching back to internal
                    form.reset();
                  }
                },
              }}
            >
              <RadioSubmitButtonSettings.Title>
                {locales.route.type.internal.headline}
              </RadioSubmitButtonSettings.Title>
              <RadioSubmitButtonSettings.Subline>
                {locales.route.type.internal.subline}
              </RadioSubmitButtonSettings.Subline>
            </RadioSubmitButtonSettings>
            <RadioSubmitButtonSettings
              name={INTENT_FIELD_NAME}
              value={SET_REGISTRATION_TYPE_TO_EXTERNAL_INTENT}
              active={event.external}
              disabled={event.published}
            >
              <RadioSubmitButtonSettings.Title>
                {locales.route.type.external.headline}
              </RadioSubmitButtonSettings.Title>
              <RadioSubmitButtonSettings.Subline>
                {locales.route.type.external.subline}
              </RadioSubmitButtonSettings.Subline>
            </RadioSubmitButtonSettings>
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
                    <span className="flex items-center gap-2.5">
                      {locales.route.type.external.form.registrationUrl.label}
                      {typeof externalRegistrationUrlIssue !== "undefined" && (
                        <span className="rounded-full w-2 h-2 bg-primary-300" />
                      )}
                    </span>
                  </Input.Label>
                  {typeof fields.externalRegistrationUrl.errors !==
                    "undefined" &&
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
              </Form>
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
                    form={form.id}
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
              <RadioSubmitButtonSettings
                name={INTENT_FIELD_NAME}
                value={SET_REGISTRATION_ACCESS_TO_OPEN_INTENT}
                active={event.openForRegistration}
                disabled={event.published}
              >
                <RadioSubmitButtonSettings.Title>
                  {locales.route.access.open.headline}
                </RadioSubmitButtonSettings.Title>
                <RadioSubmitButtonSettings.Subline>
                  {locales.route.access.open.subline}
                </RadioSubmitButtonSettings.Subline>
              </RadioSubmitButtonSettings>
              <RadioSubmitButtonSettings
                name={INTENT_FIELD_NAME}
                value={SET_REGISTRATION_ACCESS_TO_CLOSED_INTENT}
                active={event.openForRegistration === false}
                disabled={event.published}
              >
                <RadioSubmitButtonSettings.Title>
                  {locales.route.access.closed.headline}
                </RadioSubmitButtonSettings.Title>
                <RadioSubmitButtonSettings.Subline>
                  {locales.route.access.closed.subline}
                </RadioSubmitButtonSettings.Subline>
              </RadioSubmitButtonSettings>
            </Form>
          </div>
        )}
        {event.external === false &&
          event.openForRegistration &&
          (event._count.childEvents > 0 || event.parentEvent !== null) && (
            <div className="flex flex-col gap-4">
              <TitleSection>
                <TitleSection.Headline>
                  {locales.route.parentParticipation.headline}
                </TitleSection.Headline>
                {event._count.childEvents > 0 && (
                  <TitleSection.Subline>
                    {locales.route.parentParticipation.subline.parent}
                  </TitleSection.Subline>
                )}
                {event.parentEvent !== null && (
                  <TitleSection.Subline>
                    {locales.route.parentParticipation.subline.child.general}
                  </TitleSection.Subline>
                )}
                {event.parentEvent !== null && (
                  <TitleSection.Subline>
                    {
                      locales.route.parentParticipation.subline.child
                        .childException
                    }
                  </TitleSection.Subline>
                )}
                {event.parentEvent !== null &&
                  event.parentParticipationRequired === null && (
                    <TitleSection.Subline>
                      <span className="font-semibold">
                        {
                          locales.route.parentParticipation.subline.child
                            .sameAsParent
                        }
                      </span>
                    </TitleSection.Subline>
                  )}
              </TitleSection>
              {event._count.childEvents > 0 && (
                <Hint>
                  <Hint.InfoIcon />
                  {locales.route.parentParticipation.hint}
                </Hint>
              )}
              <Form
                id="parent-participation-required-form"
                method="post"
                className="flex flex-col gap-4"
              >
                <RadioSubmitButtonSettings
                  name={INTENT_FIELD_NAME}
                  value={SET_PARENT_PARTICIPATION_TO_REQUIRED_INTENT}
                  active={
                    event.parentParticipationRequired === null &&
                    event.parentEvent !== null &&
                    event.parentEvent.parentParticipationRequired !== null
                      ? event.parentEvent.parentParticipationRequired
                      : event.parentParticipationRequired === true
                  }
                  disabled={
                    event.published ||
                    (event.parentEvent !== null &&
                      event.parentEvent.parentParticipationRequired === false)
                  }
                >
                  <RadioSubmitButtonSettings.Title>
                    {locales.route.parentParticipation.required}
                  </RadioSubmitButtonSettings.Title>
                </RadioSubmitButtonSettings>
                <RadioSubmitButtonSettings
                  name={INTENT_FIELD_NAME}
                  value={SET_PARENT_PARTICIPATION_TO_NOT_REQUIRED_INTENT}
                  active={
                    event.parentParticipationRequired === null &&
                    event.parentEvent !== null &&
                    event.parentEvent.parentParticipationRequired !== null
                      ? event.parentEvent.parentParticipationRequired === false
                      : event.parentParticipationRequired === false
                  }
                  disabled={event.published}
                >
                  <RadioSubmitButtonSettings.Title>
                    {event.parentEvent !== null
                      ? locales.route.parentParticipation.notRequired.child
                      : locales.route.parentParticipation.notRequired.parent}
                  </RadioSubmitButtonSettings.Title>
                </RadioSubmitButtonSettings>
              </Form>
            </div>
          )}
      </div>
    </>
  );
}

export default RegistrationAccess;
