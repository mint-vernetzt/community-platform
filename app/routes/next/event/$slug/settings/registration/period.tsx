import { getFormProps, getInputProps, useForm } from "@conform-to/react";
import { getZodConstraint, parseWithZod } from "@conform-to/zod";
import { Button } from "@mint-vernetzt/components/src/molecules/Button";
import { Input } from "@mint-vernetzt/components/src/molecules/Input";
import { captureException } from "@sentry/node";
import { format } from "date-fns";
import { utcToZonedTime } from "date-fns-tz";
import { useEffect, useState } from "react";
import {
  data,
  Form,
  redirect,
  useActionData,
  useLoaderData,
  useLocation,
  useNavigation,
  useSearchParams,
  type ActionFunctionArgs,
  type LoaderFunctionArgs,
} from "react-router";
import { useHydrated } from "remix-utils/use-hydrated";
import { createAuthClient, getSessionUserOrThrow } from "~/auth.server";
import { usePreviousLocation } from "~/components/next/PreviousLocationContext";
import RadioButtonSettings, {
  RadioSubmitButtonSettings,
} from "~/components/next/RadioButtonSettings";
import TitleSection from "~/components/next/TitleSection";
import { UnsavedChangesModal } from "~/components/next/UnsavedChangesModal";
import { INTENT_FIELD_NAME } from "~/form-helpers";
import { detectLanguage } from "~/i18n.server";
import { useFormRevalidationAfterSuccess } from "~/lib/hooks/useFormRevalidationAfterSuccess";
import { useIsSubmitting } from "~/lib/hooks/useIsSubmitting";
import { invariantResponse } from "~/lib/utils/response";
import {
  extendSearchParams,
  UnsavedChangesModalParam,
} from "~/lib/utils/searchParams";
import { languageModuleMap } from "~/locales/.server";
import { checkFeatureAbilitiesOrThrow } from "~/routes/feature-access.server";
import { createToastHeaders, redirectWithToast } from "~/toast.server";
import { getRedirectPathOnProtectedEventRoute } from "../../settings.server";
import { getEventBySlug, updateEventRegistrationPeriod } from "./period.server";
import {
  createSetRegistrationPeriodToDefaultSchema,
  createUpdateRegistrationPeriodSchema,
  REGISTRATION_PERIOD_CUSTOM,
  REGISTRATION_PERIOD_SEARCH_PARAM,
  SET_REGISTRATION_PERIOD_TO_DEFAULT_INTENT,
  UPDATE_REGISTRATION_PERIOD_INTENT,
} from "./period.shared";

export async function loader(args: LoaderFunctionArgs) {
  const { request, params } = args;
  const { slug } = params;

  invariantResponse(typeof slug === "string", "slug is not defined", {
    status: 400,
  });

  const language = await detectLanguage(request);
  const locales =
    languageModuleMap[language][
      "next/event/$slug/settings/registration/period"
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
      "next/event/$slug/settings/registration/period"
    ];

  const formData = await request.formData();
  const intent = formData.get(INTENT_FIELD_NAME);

  invariantResponse(
    intent === SET_REGISTRATION_PERIOD_TO_DEFAULT_INTENT ||
      intent === UPDATE_REGISTRATION_PERIOD_INTENT,
    "Invalid intent",
    { status: 400 }
  );

  const event = await getEventBySlug(slug);
  invariantResponse(event !== null, "Event not found", { status: 404 });

  if (intent === SET_REGISTRATION_PERIOD_TO_DEFAULT_INTENT) {
    const submission = await parseWithZod(formData, {
      schema: createSetRegistrationPeriodToDefaultSchema({
        locales: locales.route.custom.form,
      }),
    });

    if (submission.status !== "success") {
      return { submission: submission.reply(), intent };
    }
    try {
      await updateEventRegistrationPeriod({
        eventId: event.id,
        participationFrom: event.createdAt,
        participationUntil: event.startTime,
      });
      const toastHeaders = await createToastHeaders({
        id: "update-registration-period-success",
        key: `update-registration-period-success-${Date.now()}`,
        message: locales.route.success.updateRegistrationPeriodSuccess,
      });
      return data(
        { submission: submission.reply(), intent },
        {
          headers: toastHeaders,
        }
      );
    } catch (error) {
      captureException(error);
      return redirectWithToast(request.url, {
        id: "update-registration-period-error",
        key: `update-registration-period-error-${Date.now()}`,
        message: locales.route.errors.updateRegistrationPeriodError,
        level: "negative",
      });
    }
  }

  const submission = await parseWithZod(formData, {
    schema: createUpdateRegistrationPeriodSchema({
      startDate: event.startTime,
      endDate: event.endTime,
      createdAt: event.createdAt,
      participationFrom: event.participationFrom,
      participationUntil: event.participationUntil,
      locales: locales.route.custom.form,
    }),
  });

  if (submission.status !== "success") {
    return { submission: submission.reply(), intent };
  }

  try {
    await updateEventRegistrationPeriod({
      eventId: event.id,
      participationFrom: submission.value.participationFrom,
      participationUntil: submission.value.participationUntil,
    });
    const toastHeaders = await createToastHeaders({
      id: "update-registration-period-success",
      key: `update-registration-period-success-${Date.now()}`,
      message: locales.route.success.updateRegistrationPeriodSuccess,
    });
    return data(
      { submission: submission.reply(), intent },
      {
        headers: toastHeaders,
      }
    );
  } catch (error) {
    captureException(error);
    return redirectWithToast(request.url, {
      id: "update-registration-period-error",
      key: `update-registration-period-error-${Date.now()}`,
      message: locales.route.errors.updateRegistrationPeriodError,
      level: "negative",
    });
  }
}

function RegistrationPeriod() {
  const loaderData = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const { locales, event } = loaderData;

  const [searchParams] = useSearchParams();

  const isHydrated = useHydrated();
  const isSubmitting = useIsSubmitting();
  const navigation = useNavigation();

  const [isDefault, setIsDefault] = useState(
    event.participationFrom.getDate() === event.createdAt.getDate() &&
      event.participationUntil.getDate() === event.startTime.getDate()
  );

  useEffect(() => {
    if (navigation.state === "idle") {
      setIsDefault(
        searchParams.get(REGISTRATION_PERIOD_SEARCH_PARAM) !==
          REGISTRATION_PERIOD_CUSTOM
      );
    }
  }, [navigation.state, searchParams]);

  let intent;
  let submission;
  if (typeof actionData !== "undefined" && actionData !== null) {
    intent = actionData.intent;
    submission = actionData.submission;
  }
  const startTimeFromZoned = utcToZonedTime(event.startTime, "Europe/Berlin");
  const createdAtFromZoned = utcToZonedTime(event.createdAt, "Europe/Berlin");
  const formattedStartDate = format(startTimeFromZoned, "yyyy-MM-dd");
  const formattedStartTime = format(startTimeFromZoned, "HH:mm");

  const formattedCreatedAtDate = format(createdAtFromZoned, "yyyy-MM-dd");
  const formattedCreatedAtTime = format(createdAtFromZoned, "HH:mm");

  const participationFromZoned = utcToZonedTime(
    event.participationFrom,
    "Europe/Berlin"
  );
  const participationUntilZoned = utcToZonedTime(
    event.participationUntil,
    "Europe/Berlin"
  );
  const formattedParticipationFromDate = format(
    participationFromZoned,
    "yyyy-MM-dd"
  );
  const formattedParticipationFromTime = format(
    participationFromZoned,
    "HH:mm"
  );
  const formattedParticipationUntilDate = format(
    participationUntilZoned,
    "yyyy-MM-dd"
  );
  const formattedParticipationUntilTime = format(
    participationUntilZoned,
    "HH:mm"
  );

  const [
    setRegistrationPeriodToDefaultForm,
    setRegistrationPeriodToDefaultFields,
  ] = useForm({
    id: "set-registration-period-to-default-form",
    defaultValue: {
      participationFromDate: formattedCreatedAtDate,
      participationFromTime: formattedCreatedAtTime,
      participationUntilDate: formattedStartDate,
      participationUntilTime: formattedStartTime,
    },
    lastResult:
      intent === SET_REGISTRATION_PERIOD_TO_DEFAULT_INTENT
        ? submission
        : undefined,
  });

  const [updateRegistrationPeriodForm, updateRegistrationPeriodFields] =
    useForm({
      id: "udate-registration-period-form",
      constraint: getZodConstraint(
        createUpdateRegistrationPeriodSchema({
          startDate: event.startTime,
          endDate: event.endTime,
          createdAt: event.createdAt,
          participationFrom: event.participationFrom,
          participationUntil: event.participationUntil,
          locales: locales.route.custom.form,
        })
      ),
      defaultValue: {
        participationFromDate: formattedParticipationFromDate,
        participationFromTime: formattedParticipationFromTime,
        participationUntilDate: formattedParticipationUntilDate,
        participationUntilTime: formattedParticipationUntilTime,
      },
      shouldValidate: "onInput",
      shouldRevalidate: "onInput",
      onValidate: (values) => {
        const submission = parseWithZod(values.formData, {
          schema: createUpdateRegistrationPeriodSchema({
            startDate: event.startTime,
            endDate: event.endTime,
            createdAt: event.createdAt,
            participationFrom: event.participationFrom,
            participationUntil: event.participationUntil,
            locales: locales.route.custom.form,
          }),
        });
        return submission;
      },
      lastResult:
        navigation.state === "idle" &&
        intent === UPDATE_REGISTRATION_PERIOD_INTENT
          ? submission
          : undefined,
    });

  const location = useLocation();
  const previousLocation = usePreviousLocation();
  useFormRevalidationAfterSuccess({
    deps: {
      navigation,
      submissionResult: submission,
      form: updateRegistrationPeriodForm,
    },
    skipRevalidation:
      location.search.includes(UnsavedChangesModalParam) ||
      (previousLocation !== null &&
        previousLocation.search.includes(UnsavedChangesModalParam)),
  });

  return (
    <>
      <UnsavedChangesModal
        searchParam={UnsavedChangesModalParam}
        formMetadataToCheck={updateRegistrationPeriodForm}
        locales={locales.components.UnsavedChangesModal}
      />
      <TitleSection>
        <TitleSection.Headline>{locales.route.headline}</TitleSection.Headline>
        <TitleSection.Subline>{locales.route.subline}</TitleSection.Subline>
      </TitleSection>

      <Form {...getFormProps(setRegistrationPeriodToDefaultForm)} method="post">
        <RadioSubmitButtonSettings
          name={INTENT_FIELD_NAME}
          value={SET_REGISTRATION_PERIOD_TO_DEFAULT_INTENT}
          active={isDefault}
          buttonProps={{
            onClick: () => {
              setIsDefault(true);
              searchParams.delete(REGISTRATION_PERIOD_SEARCH_PARAM);
              updateRegistrationPeriodForm.reset();
            },
          }}
        >
          {locales.route.default.label}
        </RadioSubmitButtonSettings>
        <input
          {...getInputProps(
            setRegistrationPeriodToDefaultFields.participationFromDate,
            { type: "hidden" }
          )}
        />
        <input
          {...getInputProps(
            setRegistrationPeriodToDefaultFields.participationFromTime,
            { type: "hidden" }
          )}
        />
        <input
          {...getInputProps(
            setRegistrationPeriodToDefaultFields.participationUntilDate,
            { type: "hidden" }
          )}
        />
        <input
          {...getInputProps(
            setRegistrationPeriodToDefaultFields.participationUntilTime,
            { type: "hidden" }
          )}
        />
      </Form>
      <RadioButtonSettings
        to={`?${extendSearchParams(searchParams, {
          addOrReplace: {
            [REGISTRATION_PERIOD_SEARCH_PARAM]: REGISTRATION_PERIOD_CUSTOM,
          },
        }).toString()}`}
        preventScrollReset
        active={isDefault === false}
        onClick={() => {
          setIsDefault(false);
          searchParams.set(
            REGISTRATION_PERIOD_SEARCH_PARAM,
            REGISTRATION_PERIOD_CUSTOM
          );
        }}
      >
        {locales.route.custom.label}
      </RadioButtonSettings>
      <Form
        {...getFormProps(updateRegistrationPeriodForm)}
        method="post"
        autoComplete="off"
        className="flex flex-col gap-4"
      >
        {isDefault === false && (
          <>
            <Input
              {...getInputProps(
                updateRegistrationPeriodFields.participationFromDate,
                { type: "date" }
              )}
              key="participationFromDate"
            >
              <Input.Label
                htmlFor={
                  updateRegistrationPeriodFields.participationFromDate.id
                }
              >
                {locales.route.custom.form.fields.participationFromDate}
              </Input.Label>
              {typeof updateRegistrationPeriodFields.participationFromDate
                .errors !== "undefined" &&
                updateRegistrationPeriodFields.participationFromDate.errors
                  .length > 0 &&
                updateRegistrationPeriodFields.participationFromDate.errors.map(
                  (error) => (
                    <Input.Error
                      id={
                        updateRegistrationPeriodFields.participationFromDate
                          .errorId
                      }
                      key={error}
                    >
                      {error}
                    </Input.Error>
                  )
                )}
            </Input>
            <Input
              {...getInputProps(
                updateRegistrationPeriodFields.participationFromTime,
                { type: "time" }
              )}
              key="participationFromTime"
            >
              <Input.Label
                htmlFor={
                  updateRegistrationPeriodFields.participationFromTime.id
                }
              >
                {locales.route.custom.form.fields.participationFromTime}
              </Input.Label>
              {typeof updateRegistrationPeriodFields.participationFromTime
                .errors !== "undefined" &&
                updateRegistrationPeriodFields.participationFromTime.errors
                  .length > 0 &&
                updateRegistrationPeriodFields.participationFromTime.errors.map(
                  (error) => (
                    <Input.Error
                      id={
                        updateRegistrationPeriodFields.participationFromTime
                          .errorId
                      }
                      key={error}
                    >
                      {error}
                    </Input.Error>
                  )
                )}
            </Input>
            <Input
              {...getInputProps(
                updateRegistrationPeriodFields.participationUntilDate,
                {
                  type: "date",
                }
              )}
              key="participationUntilDate"
            >
              <Input.Label
                htmlFor={
                  updateRegistrationPeriodFields.participationUntilDate.id
                }
              >
                {locales.route.custom.form.fields.participationUntilDate}
              </Input.Label>
              {typeof updateRegistrationPeriodFields.participationUntilDate
                .errors !== "undefined" &&
                updateRegistrationPeriodFields.participationUntilDate.errors
                  .length > 0 &&
                updateRegistrationPeriodFields.participationUntilDate.errors.map(
                  (error) => (
                    <Input.Error
                      id={
                        updateRegistrationPeriodFields.participationUntilDate
                          .errorId
                      }
                      key={error}
                    >
                      {error}
                    </Input.Error>
                  )
                )}
            </Input>
            <Input
              {...getInputProps(
                updateRegistrationPeriodFields.participationUntilTime,
                {
                  type: "time",
                }
              )}
              key="participationUntilTime"
            >
              <Input.Label
                htmlFor={
                  updateRegistrationPeriodFields.participationUntilTime.id
                }
              >
                {locales.route.custom.form.fields.participationUntilTime}
              </Input.Label>
              {typeof updateRegistrationPeriodFields.participationUntilTime
                .errors !== "undefined" &&
                updateRegistrationPeriodFields.participationUntilTime.errors
                  .length > 0 &&
                updateRegistrationPeriodFields.participationUntilTime.errors.map(
                  (error) => (
                    <Input.Error
                      id={
                        updateRegistrationPeriodFields.participationUntilTime
                          .errorId
                      }
                      key={error}
                    >
                      {error}
                    </Input.Error>
                  )
                )}
            </Input>
            <div className="w-full flex flex-col md:flex-row-reverse gap-4 md:justify-start">
              <div className="w-full md:w-fit">
                <Button
                  type="submit"
                  name={INTENT_FIELD_NAME}
                  value={UPDATE_REGISTRATION_PERIOD_INTENT}
                  fullSize
                  form={updateRegistrationPeriodForm.id}
                  // Don't disable button when js is disabled
                  disabled={
                    isHydrated
                      ? updateRegistrationPeriodForm.dirty === false ||
                        updateRegistrationPeriodForm.valid === false ||
                        isSubmitting
                      : false
                  }
                >
                  {locales.route.custom.form.submit}
                </Button>
              </div>
              <div className="w-full md:w-fit">
                <Button
                  type="reset"
                  onClick={() => {
                    updateRegistrationPeriodForm.reset();
                  }}
                  variant="outline"
                  fullSize
                  form={updateRegistrationPeriodForm.id}
                  // Don't disable button when js is disabled
                  disabled={
                    isHydrated
                      ? updateRegistrationPeriodForm.dirty === false
                      : false
                  }
                >
                  {locales.route.custom.form.reset}
                </Button>
                <noscript className="absolute top-0">
                  <Button as="link" to="." variant="outline" fullSize>
                    {locales.route.custom.form.reset}
                  </Button>
                </noscript>
              </div>
            </div>
          </>
        )}
      </Form>
    </>
  );
}

export default RegistrationPeriod;
