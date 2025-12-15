import { getFormProps, getInputProps, useForm } from "@conform-to/react-v1";
import { getZodConstraint, parseWithZod } from "@conform-to/zod-v1";
import { Button } from "@mint-vernetzt/components/src/molecules/Button";
import { Input } from "@mint-vernetzt/components/src/molecules/Input";
import { captureException } from "@sentry/node";
import classNames from "classnames";
import { format } from "date-fns";
import { utcToZonedTime } from "date-fns-tz";
import { useState } from "react";
import {
  type ActionFunctionArgs,
  Form,
  type LoaderFunctionArgs,
  redirect,
  useActionData,
  useLoaderData,
  useNavigation,
  useSearchParams,
} from "react-router";
import { useHydrated } from "remix-utils/use-hydrated";
import { createAuthClient, getSessionUserOrThrow } from "~/auth.server";
import BasicStructure from "~/components/next/BasicStructure";
import List from "~/components/next/List";
import ListItemEvent from "~/components/next/ListItemEvent";
import RadioButtonSettings from "~/components/next/RadioButtonSettings";
import TitleSection from "~/components/next/TitleSection";
import { detectLanguage } from "~/i18n.server";
import { useIsSubmitting } from "~/lib/hooks/useIsSubmitting";
import { decideBetweenSingularOrPlural } from "~/lib/utils/i18n";
import { invariant, invariantResponse } from "~/lib/utils/response";
import { extendSearchParams } from "~/lib/utils/searchParams";
import { languageModuleMap } from "~/locales/.server";
import { checkFeatureAbilitiesOrThrow } from "~/routes/feature-access.server";
import { redirectWithToast } from "~/toast.server";
import { TIME_PERIOD_MULTI, TIME_PERIOD_SINGLE } from "../../utils.shared";
import { getRedirectPathOnProtectedEventRoute } from "../settings.server";
import {
  getEventBySlug,
  getEventBySlugForValidation,
  updateEventBySlug,
} from "./time-period.server";
import {
  createTimePeriodSchema,
  getTimePeriodDefaultValue,
} from "./time-period.shared";

export const loader = async (args: LoaderFunctionArgs) => {
  const { request, params } = args;
  invariantResponse(typeof params.slug === "string", "slug is not defined", {
    status: 400,
  });

  const language = await detectLanguage(request);
  const locales =
    languageModuleMap[language]["next/event/$slug/settings/time-period"];

  const event = await getEventBySlug(params.slug);
  invariantResponse(event !== null, "Event not found", { status: 404 });

  return { locales, language, event, currentTimeStamp: Date.now() };
};

export const action = async (args: ActionFunctionArgs) => {
  const { request, params } = args;
  invariantResponse(typeof params.slug === "string", "slug is not defined", {
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
    slug: params.slug,
    sessionUser,
    authClient,
  });
  if (redirectPath !== null) {
    return redirect(redirectPath);
  }
  const language = await detectLanguage(request);
  const locales =
    languageModuleMap[language]["next/event/$slug/settings/time-period"];

  const formData = await request.formData();
  const timePeriod = formData.get("timePeriod");
  invariantResponse(
    timePeriod === TIME_PERIOD_SINGLE || timePeriod === TIME_PERIOD_MULTI,
    locales.route.errors.invalidTimePeriod,
    {
      status: 400,
    }
  );

  const event = await getEventBySlugForValidation(params.slug);
  invariantResponse(event !== null, "Event not found", { status: 404 });

  const schema = createTimePeriodSchema({
    locales: locales.route.form.validation,
    timePeriod,
    parentEvent: event.parentEvent,
    childEvents: event.childEvents,
  });
  const submission = await parseWithZod(formData, { schema });

  if (submission.status !== "success") {
    return submission.reply();
  }

  try {
    await updateEventBySlug(params.slug, submission.value);
  } catch (error) {
    captureException(error);
    return redirectWithToast(request.url, {
      id: "time-period-error",
      key: `time-period-error-${Date.now()}`,
      message: locales.route.errors.saveFailed,
      level: "negative",
    });
  }

  return redirectWithToast(request.url, {
    id: "time-period-success",
    key: `time-period-success-${Date.now()}`,
    message: locales.route.success,
  });
};

export default function TimePeriod() {
  const { locales, language, event, currentTimeStamp } =
    useLoaderData<typeof loader>();
  const actionData = useActionData();
  const [searchParams] = useSearchParams();
  const timePeriodSearchParam = searchParams.get("timePeriod");
  const startTimeZoned = utcToZonedTime(event.startTime, "Europe/Berlin");
  const endTimeZoned = utcToZonedTime(event.endTime, "Europe/Berlin");
  const formattedStartDate = format(startTimeZoned, "yyyy-MM-dd");
  const formattedEndDate = format(endTimeZoned, "yyyy-MM-dd");
  const formattedStartTime = format(startTimeZoned, "HH:mm");
  const formattedEndTime = format(endTimeZoned, "HH:mm");

  const [timePeriod, setTimePeriod] = useState<
    typeof TIME_PERIOD_SINGLE | typeof TIME_PERIOD_MULTI
  >(
    getTimePeriodDefaultValue({
      timePeriodSearchParam,
      formattedStartDate,
      formattedEndDate,
    })
  );

  const isHydrated = useHydrated();
  const isSubmitting = useIsSubmitting();
  const navigation = useNavigation();
  const [form, fields] = useForm({
    id: `time-period-form-${currentTimeStamp}`,
    constraint: getZodConstraint(
      createTimePeriodSchema({
        locales: locales.route.form.validation,
        timePeriod,
        parentEvent: event.parentEvent,
        childEvents: event.childEvents.metrics,
      })
    ),
    shouldDirtyConsider(name) {
      return name !== "timePeriod";
    },
    shouldValidate: "onBlur",
    onValidate: (values) => {
      const formData = values.formData;
      const timePeriod = formData.get("timePeriod");
      invariant(
        timePeriod === TIME_PERIOD_SINGLE || timePeriod === TIME_PERIOD_MULTI,
        locales.route.errors.invalidTimePeriod
      );
      const submission = parseWithZod(values.formData, {
        schema: createTimePeriodSchema({
          locales: locales.route.form.validation,
          timePeriod,
          parentEvent: event.parentEvent,
          childEvents: event.childEvents.metrics,
        }),
      });
      return submission;
    },
    defaultValue:
      timePeriod === TIME_PERIOD_SINGLE
        ? {
            startDate: formattedStartDate,
            startTime: formattedStartTime,
            endTime: formattedEndTime,
          }
        : {
            startDate: formattedStartDate,
            endDate: formattedEndDate,
          },
    shouldRevalidate: "onInput",
    lastResult: navigation.state === "idle" ? actionData : undefined,
  });

  const timingInputContainerClasses = classNames(
    "flex-1",
    timePeriod === TIME_PERIOD_SINGLE ? "md:flex-1/3" : "md:flex-1/2"
  );

  return (
    <Form
      {...getFormProps(form)}
      method="post"
      preventScrollReset
      autoComplete="off"
    >
      {event.parentEvent !== null ? (
        <div
          className={classNames(
            "w-full flex flex-col gap-4 bg-primary-50",
            event.childEvents.data.length > 0 ? "px-4 pt-4" : "p-4"
          )}
        >
          <p className="text-neutral-700 text-base font-normal leading-5">
            {locales.route.eventLists.parentEvent.hint}
          </p>
          <List id="parent-event-list" locales={locales.route.eventLists}>
            <ListItemEvent
              key={event.id}
              index={0}
              to={`/event/${event.parentEvent.slug}/detail/about`}
            >
              <ListItemEvent.Info
                {...event.parentEvent}
                stage={event.parentEvent.stage}
                participantCount={event.parentEvent._count.participants}
                locales={{
                  stages: locales.stages,
                  ...locales.route.eventLists,
                }}
                language={language}
              ></ListItemEvent.Info>
              <ListItemEvent.Headline>
                {event.parentEvent.name}
              </ListItemEvent.Headline>
            </ListItemEvent>
          </List>
        </div>
      ) : null}
      {event.childEvents.data.length > 0 ? (
        <div className="w-full flex flex-col gap-4 p-4 bg-primary-50">
          <p className="text-neutral-700 text-base font-normal leading-5">
            {decideBetweenSingularOrPlural(
              locales.route.eventLists.childEvents.hint_singular,
              locales.route.eventLists.childEvents.hint_plural,
              event.childEvents.data.length
            )}
          </p>
          <List
            id="child-events-list"
            hideAfter={1}
            locales={locales.route.eventLists}
          >
            {event.childEvents.data.map((childEvent, index) => {
              return (
                <ListItemEvent
                  key={childEvent.id}
                  index={index}
                  to={`/event/${childEvent.slug}/detail/about`}
                >
                  <ListItemEvent.Info
                    {...childEvent}
                    stage={childEvent.stage}
                    participantCount={childEvent._count.participants}
                    locales={{
                      stages: locales.stages,
                      ...locales.route.eventLists,
                    }}
                    language={language}
                  ></ListItemEvent.Info>
                  <ListItemEvent.Headline>
                    {childEvent.name}
                  </ListItemEvent.Headline>
                </ListItemEvent>
              );
            })}
          </List>
        </div>
      ) : null}
      <div className="w-full flex flex-col p-4 gap-8 lg:p-6 lg:gap-6">
        <BasicStructure.Container
          deflatedUntil="lg"
          gaps={{ base: "gap-4", md: "gap-4", xl: "gap-4" }}
        >
          <TitleSection>
            <TitleSection.Headline>
              {locales.route.timePeriod.headline}
            </TitleSection.Headline>
          </TitleSection>
          <div className="w-full flex flex-col md:flex-row gap-4">
            <RadioButtonSettings
              to={`?${extendSearchParams(searchParams, {
                addOrReplace: { timePeriod: TIME_PERIOD_SINGLE },
              }).toString()}`}
              active={timePeriod === TIME_PERIOD_SINGLE}
              onClick={(event) => {
                event.preventDefault();
                setTimePeriod(TIME_PERIOD_SINGLE);
              }}
            >
              {locales.route.timePeriod[TIME_PERIOD_SINGLE].label}
            </RadioButtonSettings>
            <RadioButtonSettings
              to={`?${extendSearchParams(searchParams, {
                addOrReplace: { timePeriod: TIME_PERIOD_MULTI },
              }).toString()}`}
              active={timePeriod === TIME_PERIOD_MULTI}
              onClick={(event) => {
                event.preventDefault();
                setTimePeriod(TIME_PERIOD_MULTI);
              }}
            >
              {locales.route.timePeriod[TIME_PERIOD_MULTI].label}
            </RadioButtonSettings>
            <input type="hidden" name="timePeriod" value={timePeriod} />
          </div>
        </BasicStructure.Container>
        <BasicStructure.Container
          deflatedUntil="lg"
          gaps={{ base: "gap-4", md: "gap-4", xl: "gap-4" }}
        >
          <TitleSection>
            <TitleSection.Headline>
              {locales.route.timings.headline}
            </TitleSection.Headline>
          </TitleSection>
          <div className="w-full flex flex-col md:flex-row gap-4">
            <div className={timingInputContainerClasses}>
              <Input
                {...getInputProps(fields.startDate, { type: "date" })}
                type="date"
                key="startDate"
              >
                <Input.Label htmlFor={fields.startDate.id}>
                  {timePeriod === TIME_PERIOD_SINGLE
                    ? locales.route.timings.startDate[TIME_PERIOD_SINGLE].label
                    : locales.route.timings.startDate[TIME_PERIOD_MULTI].label}
                </Input.Label>
                {typeof fields.startDate.errors !== "undefined" &&
                fields.startDate.errors.length > 0
                  ? fields.startDate.errors.map((error) => (
                      <Input.Error id={fields.startDate.errorId} key={error}>
                        {error}
                      </Input.Error>
                    ))
                  : null}
              </Input>
            </div>

            <div
              className={timingInputContainerClasses}
              hidden={timePeriod === TIME_PERIOD_SINGLE}
            >
              <Input
                {...getInputProps(fields.endDate, { type: "date" })}
                type="date"
                key="endDate"
              >
                <Input.Label htmlFor={fields.endDate.id}>
                  {locales.route.timings.endDate.label}
                </Input.Label>
                {typeof fields.endDate.errors !== "undefined" &&
                fields.endDate.errors.length > 0
                  ? fields.endDate.errors.map((error) => (
                      <Input.Error id={fields.endDate.errorId} key={error}>
                        {error}
                      </Input.Error>
                    ))
                  : null}
              </Input>
            </div>
            <div
              className={timingInputContainerClasses}
              hidden={timePeriod === TIME_PERIOD_MULTI}
            >
              <Input
                {...getInputProps(fields.startTime, { type: "time" })}
                type="time"
                key="startTime"
              >
                <Input.Label htmlFor={fields.startTime.id}>
                  {locales.route.timings.startTime.label}
                </Input.Label>
                {typeof fields.startTime.errors !== "undefined" &&
                fields.startTime.errors.length > 0
                  ? fields.startTime.errors.map((error) => (
                      <Input.Error id={fields.startTime.errorId} key={error}>
                        {error}
                      </Input.Error>
                    ))
                  : null}
              </Input>
            </div>
            <div
              className={timingInputContainerClasses}
              hidden={timePeriod === TIME_PERIOD_MULTI}
            >
              <Input
                {...getInputProps(fields.endTime, { type: "time" })}
                type="time"
                key="endTime"
              >
                <Input.Label htmlFor={fields.endTime.id}>
                  {locales.route.timings.endTime.label}
                </Input.Label>
                {typeof fields.endTime.errors !== "undefined" &&
                fields.endTime.errors.length > 0
                  ? fields.endTime.errors.map((error) => (
                      <Input.Error id={fields.endTime.errorId} key={error}>
                        {error}
                      </Input.Error>
                    ))
                  : null}
              </Input>
            </div>
          </div>
        </BasicStructure.Container>

        <div className="w-full flex flex-col md:flex-row md:justify-between gap-4">
          <p className="text-neutral-700 text-sm font-normal leading-[18px]">
            {locales.route.requiredHint}
          </p>
          <div className="w-full md:w-fit flex flex-col md:flex-row-reverse gap-4">
            <div className="w-full md:w-fit">
              <Button
                type="submit"
                fullSize
                form={form.id} // Don't disable button when js is disabled
                disabled={
                  isHydrated
                    ? form.dirty === false ||
                      form.valid === false ||
                      isSubmitting
                    : false
                }
              >
                {locales.route.cta}
              </Button>
            </div>
            <div className="w-full md:w-fit">
              <div className="relative w-full">
                <Button
                  type="reset"
                  onClick={() => {
                    setTimePeriod(
                      formattedStartDate === formattedEndDate
                        ? TIME_PERIOD_SINGLE
                        : TIME_PERIOD_MULTI
                    );
                    setTimeout(() => form.reset(), 0);
                  }}
                  variant="outline"
                  fullSize
                  // Don't disable button when js is disabled
                  disabled={isHydrated ? form.dirty === false : false}
                >
                  {locales.route.cancel}
                </Button>
                <noscript className="absolute top-0">
                  <Button as="link" to="." variant="outline" fullSize>
                    {locales.route.cancel}
                  </Button>
                </noscript>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Form>
  );
}
