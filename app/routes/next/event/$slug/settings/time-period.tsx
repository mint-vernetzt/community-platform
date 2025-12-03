import {
  type ActionFunctionArgs,
  Form,
  useActionData,
  useLoaderData,
  useSearchParams,
  type LoaderFunctionArgs,
} from "react-router";
import BasicStructure from "~/components/next/BasicStructure";
import RadioButtonSettings from "~/components/next/RadioButtonSettings";
import TitleSection from "~/components/next/TitleSection";
import { detectLanguage } from "~/i18n.server";
import { extendSearchParams } from "~/lib/utils/searchParams";
import { languageModuleMap } from "~/locales/.server";
import { TIME_PERIOD_MULTI, TIME_PERIOD_SINGLE } from "../../utils.shared";
import { useState } from "react";
import { useHydrated } from "remix-utils/use-hydrated";
import { useIsSubmitting } from "~/lib/hooks/useIsSubmitting";
import { getFormProps, getInputProps, useForm } from "@conform-to/react-v1";
import { getZodConstraint, parseWithZod } from "@conform-to/zod-v1";
import classNames from "classnames";
import { Input } from "@mint-vernetzt/components/src/molecules/Input";
import { Button } from "@mint-vernetzt/components/src/molecules/Button";
import { createTimePeriodSchema } from "./time-period.shared";
import { captureException } from "@sentry/node";
import { redirectWithToast } from "~/toast.server";
import { checkFeatureAbilitiesOrThrow } from "~/routes/feature-access.server";
import { createAuthClient, getSessionUserOrThrow } from "~/auth.server";
import { deriveEventMode } from "~/routes/event/utils.server";
import { invariantResponse } from "~/lib/utils/response";

export const loader = async (args: LoaderFunctionArgs) => {
  const { request } = args;

  const language = await detectLanguage(request);
  const locales =
    languageModuleMap[language]["next/event/$slug/settings/time-period"];

  return { locales };
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
  const mode = await deriveEventMode(sessionUser, params.slug);
  invariantResponse(mode === "admin", "Not an admin", { status: 403 });
  const language = await detectLanguage(request);
  const locales =
    languageModuleMap[language]["next/event/$slug/settings/time-period"];

  const formData = await request.formData();

  const schema = createTimePeriodSchema({
    locales: locales.route.form.validation,
    // TODO: provide actual parent and child event data
    parentEvent: undefined,
    childEvents: undefined,
  });
  const submission = await parseWithZod(formData, { schema });

  if (submission.status !== "success") {
    return submission.reply();
  }

  try {
    // TODO: handle successful form submission, e.g., save to database
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
  const { locales } = useLoaderData<typeof loader>();
  const actionData = useActionData();
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
    id: "time-period-form",
    constraint: getZodConstraint(
      createTimePeriodSchema({
        locales: locales.route.form.validation,
        // TODO: provide actual parent and child event data
        parentEvent: undefined,
        childEvents: undefined,
      })
    ),
    shouldDirtyConsider(name) {
      return name !== "timePeriod";
    },
    shouldValidate: "onBlur",
    onValidate: (values) => {
      const submission = parseWithZod(values.formData, {
        schema: createTimePeriodSchema({
          locales: locales.route.form.validation,
          // TODO: provide actual parent and child event data
          parentEvent: undefined,
          childEvents: undefined,
        }),
      });
      return submission;
    },
    // TODO: provide actual default values
    // defaultValue: {
    // },
    shouldRevalidate: "onInput",
    lastResult: actionData,
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
            <Input
              {...getInputProps(fields.timePeriod, { type: "hidden" })}
              value={timePeriod}
            />
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
