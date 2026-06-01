import { getFormProps, getInputProps, useForm } from "@conform-to/react";
import { getZodConstraint, parseWithZod } from "@conform-to/zod";
import { Button } from "@mint-vernetzt/components/src/molecules/Button";
import { Input } from "@mint-vernetzt/components/src/molecules/Input";
import { captureException } from "@sentry/node";
import classNames from "classnames";
import { useState } from "react";
import {
  Form,
  Link,
  redirect,
  useActionData,
  useLoaderData,
  useNavigation,
  useSearchParams,
  type ActionFunctionArgs,
  type LoaderFunctionArgs,
} from "react-router";
import { useHydrated } from "remix-utils/use-hydrated";
import {
  createAuthClient,
  getSessionUserOrRedirectPathToLogin,
  getSessionUserOrThrow,
} from "~/auth.server";
import BasicStructure from "~/components/next/BasicStructure";
import List from "~/components/next/List";
import ListItemEvent from "~/components/next/ListItemEvent";
import MobileSettingsHeader from "~/components/next/MobileSettingsHeader";
import RadioButtonSettings from "~/components/next/RadioButtonSettings";
import SettingsHeading from "~/components/next/SettingsHeading";
import TitleSection from "~/components/next/TitleSection";
import { detectLanguage } from "~/i18n.server";
import { useIsSubmitting } from "~/lib/hooks/useIsSubmitting";
import { insertComponentsIntoLocale } from "~/lib/utils/i18n";
import { invariant, invariantResponse } from "~/lib/utils/response";
import { Deep, extendSearchParams } from "~/lib/utils/searchParams";
import { languageModuleMap } from "~/locales/.server";
import { checkFeatureAbilitiesOrThrow } from "~/routes/feature-access.server";
import { redirectWithToast } from "~/toast.server";
import { generateEventSlug } from "~/utils.server";
import {
  createEvent,
  getParentEventBySlug,
  getParentEventBySlugForAction,
} from "./create.server";
import { createEventCreationSchema } from "./create.shared";
import { TIME_PERIOD_MULTI, TIME_PERIOD_SINGLE } from "./utils.shared";

export async function loader(args: LoaderFunctionArgs) {
  const { request } = args;
  const { authClient } = createAuthClient(request);
  const { sessionUser, redirectPath } =
    await getSessionUserOrRedirectPathToLogin(authClient, request);

  if (sessionUser === null && redirectPath !== null) {
    return redirect(redirectPath);
  }

  const language = await detectLanguage(request);
  const locales = languageModuleMap[language]["next/event/create"];

  await checkFeatureAbilitiesOrThrow(authClient, [
    "events",
    "next_event_create",
  ]);

  const url = new URL(request.url);
  const searchParams = url.searchParams;
  const parentSlug = searchParams.get("parent");

  let parentEvent = null;
  if (parentSlug !== null) {
    parentEvent = await getParentEventBySlug(parentSlug);
  }

  return { locales, language, parentEvent };
}

export async function action(args: ActionFunctionArgs) {
  const { request } = args;
  const { authClient } = createAuthClient(request);
  const sessionUser = await getSessionUserOrThrow(authClient);

  await checkFeatureAbilitiesOrThrow(authClient, [
    "events",
    "next_event_create",
  ]);

  const language = await detectLanguage(request);
  const locales = languageModuleMap[language]["next/event/create"];

  const formData = await request.formData();
  const timePeriod = formData.get("timePeriod");
  invariantResponse(
    timePeriod === TIME_PERIOD_SINGLE || timePeriod === TIME_PERIOD_MULTI,
    locales.route.errors.invalidTimePeriod,
    {
      status: 400,
    }
  );

  const url = new URL(request.url);
  const searchParams = url.searchParams;
  const parentSlug = searchParams.get("parent");

  let parentEvent = null;
  if (parentSlug !== null) {
    parentEvent = await getParentEventBySlugForAction(
      parentSlug,
      sessionUser.id
    );
    invariantResponse(
      parentEvent !== null,
      "Parent Event not found or not authorized",
      {
        status: 404,
      }
    );
  }

  const schema = createEventCreationSchema({
    locales: locales.route.form.validation,
    timePeriod,
    parentEvent,
  });
  const submission = await parseWithZod(formData, { schema });

  if (submission.status !== "success") {
    return submission.reply();
  }

  const slug = generateEventSlug(submission.value.name);

  try {
    await createEvent({
      userId: sessionUser.id,
      slug,
      data: submission.value,
    });
  } catch (error) {
    captureException(error);
    return redirectWithToast(request.url, {
      id: "event-creation-error",
      key: `event-creation-error-${Date.now()}`,
      message: locales.route.errors.createEventFailed,
      level: "negative",
    });
  }

  return redirect(
    parentEvent !== null
      ? `/next/event/${parentEvent.slug}/settings/related-events/child-events?${Deep}=true`
      : `/event/${slug}/detail/about`
  );
}

export default function Create() {
  const loaderData = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const { locales, language, parentEvent } = loaderData;

  const [searchParams] = useSearchParams();
  const timePeriodParam = searchParams.get("timePeriod");

  const [timePeriod, setTimePeriod] = useState<
    typeof TIME_PERIOD_SINGLE | typeof TIME_PERIOD_MULTI
  >(
    timePeriodParam === TIME_PERIOD_MULTI
      ? TIME_PERIOD_MULTI
      : TIME_PERIOD_SINGLE
  );

  const isHydrated = useHydrated();
  const isSubmitting = useIsSubmitting();
  const navigation = useNavigation();
  const [form, fields] = useForm({
    id: "create-event-form",
    constraint: getZodConstraint(
      createEventCreationSchema({
        locales: locales.route.form.validation,
        timePeriod,
        parentEvent,
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
        schema: createEventCreationSchema({
          locales: locales.route.form.validation,
          timePeriod,
          parentEvent,
        }),
      });
      return submission;
    },
    shouldRevalidate: "onInput",
    lastResult: navigation.state === "idle" ? actionData : undefined,
  });

  const timingInputContainerClasses = classNames(
    "flex-1",
    timePeriod === TIME_PERIOD_SINGLE ? "md:flex-1/3" : "md:flex-1/2"
  );

  return (
    <>
      <MobileSettingsHeader visibleUntil="xl">
        <MobileSettingsHeader.Heading>
          {locales.route.headline}
        </MobileSettingsHeader.Heading>
        <MobileSettingsHeader.Close>
          <Link
            to={
              parentEvent === null
                ? "/my/events"
                : `/next/event/${parentEvent.slug}/settings/related-events/child-events?${Deep}=true`
            }
            aria-label={locales.route.close}
            prefetch="intent"
          >
            <MobileSettingsHeader.CloseIcon />
          </Link>
        </MobileSettingsHeader.Close>
      </MobileSettingsHeader>

      <div className="w-full flex flex-col gap-4 p-4 bg-primary-50 xl:hidden">
        <p className="text-neutral-700 text-base leading-5">
          {parentEvent === null
            ? insertComponentsIntoLocale(locales.route.info, [
                <span key="highlight" className="font-bold" />,
                <Link
                  key="help-link"
                  to="/help#events-eventCreationConsiderations"
                  target="_blank"
                  className="font-bold underline"
                  prefetch="intent"
                />,
              ])
            : locales.route.parentHint}
        </p>
        {parentEvent !== null ? (
          <List
            id="parent-event-list"
            locales={locales.route.list}
            hideAfter={0}
          >
            <ListItemEvent
              index={0}
              to={`/event/${parentEvent.slug}/detail/about`}
            >
              <ListItemEvent.Info
                {...parentEvent}
                stage={parentEvent.stage}
                participantCount={parentEvent._count.participants}
                locales={{
                  stages: locales.stages,
                  ...locales.route.list,
                }}
                language={language}
              ></ListItemEvent.Info>
              <ListItemEvent.Headline>
                {parentEvent.name}
              </ListItemEvent.Headline>
            </ListItemEvent>
          </List>
        ) : null}
      </div>
      <Form {...getFormProps(form)} method="post">
        <BasicStructure>
          <div className="hidden xl:block w-full">
            <SettingsHeading>{locales.route.headline}</SettingsHeading>
          </div>
          <div className="hidden xl:flex w-full flex-col gap-4 p-6 bg-primary-50 border border-neutral-200 rounded-2xl">
            <p className="text-neutral-700 text-base leading-5">
              {parentEvent === null
                ? insertComponentsIntoLocale(locales.route.info, [
                    <span key="highlight" className="font-bold" />,
                    <Link
                      key="help-link"
                      to="/help#events-eventCreationConsiderations"
                      target="_blank"
                      className="font-bold underline"
                      prefetch="intent"
                    />,
                  ])
                : locales.route.parentHint}
            </p>
            {parentEvent !== null ? (
              <List id="parent-event-list" locales={locales.route.list}>
                <ListItemEvent
                  index={0}
                  to={`/event/${parentEvent.slug}/detail/about`}
                >
                  <ListItemEvent.Info
                    {...parentEvent}
                    stage={parentEvent.stage}
                    participantCount={parentEvent._count.participants}
                    locales={{
                      stages: locales.stages,
                      ...locales.route.list,
                    }}
                    language={language}
                  ></ListItemEvent.Info>
                  <ListItemEvent.Headline>
                    {parentEvent.name}
                  </ListItemEvent.Headline>
                </ListItemEvent>
              </List>
            ) : null}
          </div>
          <BasicStructure.Container
            deflatedUntil="xl"
            gaps={{ base: "gap-4", md: "gap-4", xl: "gap-4" }}
          >
            <TitleSection>
              <TitleSection.Headline>
                {locales.route.name.headline}
              </TitleSection.Headline>
            </TitleSection>
            <Input
              {...getInputProps(fields.name, { type: "text" })}
              key="name"
              countCharacters
            >
              <Input.Label htmlFor={fields.name.id}>
                {locales.route.name.label}
              </Input.Label>
              {typeof fields.name.errors !== "undefined" &&
                fields.name.errors.length > 0 &&
                fields.name.errors.map((error) => (
                  <Input.Error id={fields.name.errorId} key={error}>
                    {error}
                  </Input.Error>
                ))}
              <Input.HelperText>
                {locales.route.name.helperText}
              </Input.HelperText>
            </Input>
          </BasicStructure.Container>
          <BasicStructure.Container
            deflatedUntil="xl"
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
            deflatedUntil="xl"
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
                      ? locales.route.timings.startDate[TIME_PERIOD_SINGLE]
                          .label
                      : locales.route.timings.startDate[TIME_PERIOD_MULTI]
                          .label}
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
            <p className="text-neutral-700 text-sm font-normal leading-4.5">
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
                <Button
                  as="link"
                  to={
                    parentEvent === null
                      ? "/my/events"
                      : `/next/event/${parentEvent.slug}/settings/related-events/child-events?${Deep}=true`
                  }
                  variant="outline"
                  fullSize
                  prefetch="intent"
                >
                  {locales.route.cancel}
                </Button>
              </div>
            </div>
          </div>
        </BasicStructure>
      </Form>
    </>
  );
}
