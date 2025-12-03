import { Input } from "@mint-vernetzt/components/src/molecules/Input";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import {
  Form,
  Link,
  redirect,
  useActionData,
  useLoaderData,
  useSearchParams,
} from "react-router";
import {
  createAuthClient,
  getSessionUserOrRedirectPathToLogin,
  getSessionUserOrThrow,
} from "~/auth.server";
import BasicStructure from "~/components/next/BasicStructure";
import MobileSettingsHeader from "~/components/next/MobileSettingsHeader";
import SettingsHeading from "~/components/next/SettingsHeading";
import TitleSection from "~/components/next/TitleSection";
import { detectLanguage } from "~/i18n.server";
import { insertComponentsIntoLocale } from "~/lib/utils/i18n";
import { languageModuleMap } from "~/locales/.server";
import { checkFeatureAbilitiesOrThrow } from "~/routes/feature-access.server";
import RadioButtonSettings from "~/components/next/RadioButtonSettings";
import { extendSearchParams } from "~/lib/utils/searchParams";
import { useState } from "react";
import classNames from "classnames";
import { Button } from "@mint-vernetzt/components/src/molecules/Button";
import { createEventCreationSchema } from "./create.shared";
import { TIME_PERIOD_MULTI, TIME_PERIOD_SINGLE } from "./utils.shared";
import { getZodConstraint, parseWithZod } from "@conform-to/zod-v1";
import { getFormProps, getInputProps, useForm } from "@conform-to/react-v1";
import { prismaClient } from "~/prisma.server";
import { generateEventSlug } from "~/utils.server";
import { redirectWithToast } from "~/toast.server";
import { captureException } from "@sentry/node";
import { useHydrated } from "remix-utils/use-hydrated";
import { useIsSubmitting } from "~/lib/hooks/useIsSubmitting";

export const loader = async (args: LoaderFunctionArgs) => {
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

  return { locales };
};

export const action = async (args: ActionFunctionArgs) => {
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

  const schema = createEventCreationSchema(locales.route.form.validation);
  const submission = await parseWithZod(formData, { schema });

  if (submission.status !== "success") {
    return submission.reply();
  }

  const slug = generateEventSlug(submission.value.name);

  try {
    await prismaClient.$transaction(async (client) => {
      const event = await client.event.create({
        data: {
          ...submission.value,
          slug,
        },
      });
      await client.eventVisibility.create({
        data: {
          eventId: event.id,
        },
      });
      await client.teamMemberOfEvent.create({
        data: {
          profileId: sessionUser.id,
          eventId: event.id,
        },
      });
      await client.adminOfEvent.create({
        data: {
          profileId: sessionUser.id,
          eventId: event.id,
        },
      });
      return event;
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

  return redirect(`/event/${slug}/detail/about`);
};

export default function Create() {
  const loaderData = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const { locales } = loaderData;
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
  const [form, fields] = useForm({
    id: "create-event-form",
    constraint: getZodConstraint(
      createEventCreationSchema(locales.route.form.validation)
    ),
    shouldDirtyConsider(name) {
      return name !== "timePeriod";
    },
    shouldValidate: "onBlur",
    onValidate: (values) => {
      const submission = parseWithZod(values.formData, {
        schema: createEventCreationSchema(locales.route.form.validation),
      });
      return submission;
    },
    shouldRevalidate: "onInput",
    lastResult: actionData,
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
            to="/my/events"
            aria-label={locales.route.close}
            prefetch="intent"
          >
            <MobileSettingsHeader.CloseIcon />
          </Link>
        </MobileSettingsHeader.Close>
      </MobileSettingsHeader>
      <div className="w-full p-4 bg-primary-50 xl:hidden">
        <p className="text-neutral-700 text-base leading-5">
          {insertComponentsIntoLocale(locales.route.info, [
            <span key="highlight" className="font-bold" />,
            <Link
              key="help-link"
              to="/help#events-eventCreationConsiderations"
              target="_blank"
              className="font-bold underline"
              prefetch="intent"
            />,
          ])}
        </p>
      </div>
      <Form {...getFormProps(form)} method="post">
        <BasicStructure>
          <div className="hidden xl:block w-full">
            <SettingsHeading>{locales.route.headline}</SettingsHeading>
          </div>
          <div className="hidden xl:block w-full p-6 bg-primary-50 border border-neutral-200 rounded-2xl">
            <p className="text-neutral-700 text-base leading-5">
              {insertComponentsIntoLocale(locales.route.info, [
                <span key="highlight" className="font-bold" />,
                <Link
                  key="help-link"
                  to="/help#events-eventCreationConsiderations"
                  target="_blank"
                  className="font-bold underline"
                  prefetch="intent"
                />,
              ])}
            </p>
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
              <Input
                {...getInputProps(fields.timePeriod, { type: "hidden" })}
                value={timePeriod}
              />
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
                <Button
                  as="link"
                  to="/my/events"
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
