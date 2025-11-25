import { Input } from "@mint-vernetzt/components/src/molecules/Input";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { Link, redirect, useLoaderData, useSearchParams } from "react-router";
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

  await checkFeatureAbilitiesOrThrow(authClient, "next_event_create");
  await checkFeatureAbilitiesOrThrow(authClient, "events");

  return { locales };
};

export const action = async (args: ActionFunctionArgs) => {
  const { request } = args;
  const { authClient } = createAuthClient(request);
  await getSessionUserOrThrow(authClient);
  await checkFeatureAbilitiesOrThrow(authClient, "next_event_create");
  await checkFeatureAbilitiesOrThrow(authClient, "events");

  return null;
};

export default function Create() {
  const loaderData = useLoaderData<typeof loader>();
  const { locales } = loaderData;
  const [searchParams] = useSearchParams();
  const [timePeriod, setTimePeriod] = useState(
    searchParams.get("timePeriod") || "oneDay"
  );
  const timingInputContainerClasses = classNames(
    "flex-1",
    timePeriod === "oneDay" ? "md:flex-1/3" : "md:flex-1/2"
  );

  return (
    <>
      <MobileSettingsHeader>
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
            // TODO: {...getInputProps(fields.name, { type: "text" })}
            key="name"
            countCharacters
          >
            <Input.Label htmlFor="TODO: {fields.name.id}">
              {locales.route.name.label}
            </Input.Label>
            {/* TODO: {typeof fields.name.errors !== "undefined" &&
              fields.name.errors.length > 0
                ? fields.name.errors.map((error) => (
                    <Input.Error id={fields.name.errorId} key={error}>
                      {error}
                    </Input.Error>
                  ))
                : <Input.HelperText>{locales.route.name.helperText}</Input.HelperText>} */}
            <Input.HelperText>{locales.route.name.helperText}</Input.HelperText>
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
                addOrReplace: { timePeriod: "oneDay" },
              }).toString()}`}
              active={timePeriod === "oneDay"}
              onClick={(event) => {
                event.preventDefault();
                setTimePeriod("oneDay");
              }}
            >
              {locales.route.timePeriod.oneDay.label}
            </RadioButtonSettings>
            <RadioButtonSettings
              to={`?${extendSearchParams(searchParams, {
                addOrReplace: { timePeriod: "multiDay" },
              }).toString()}`}
              active={timePeriod === "multiDay"}
              onClick={(event) => {
                event.preventDefault();
                setTimePeriod("multiDay");
              }}
            >
              {locales.route.timePeriod.multiDay.label}
            </RadioButtonSettings>
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
                // TODO: {...getInputProps(fields.startDate, { type: "date" })}
                type="date"
                key="startDate"
              >
                <Input.Label htmlFor="TODO: {fields.startDate.id}">
                  {timePeriod === "oneDay"
                    ? locales.route.timings.startDate.oneDay.label
                    : locales.route.timings.startDate.multiDay.label}
                </Input.Label>
                {/* TODO: {typeof fields.startDate.errors !== "undefined" &&
              fields.startDate.errors.length > 0
                ? fields.startDate.errors.map((error) => (
                    <Input.Error id={fields.startDate.errorId} key={error}>
                      {error}
                    </Input.Error>
                  ))
                : null} */}
              </Input>
            </div>
            <div
              className={timingInputContainerClasses}
              hidden={timePeriod === "oneDay"}
            >
              <Input
                // TODO: {...getInputProps(fields.endDate, { type: "date" })}
                type="date"
                key="endDate"
              >
                <Input.Label htmlFor="TODO: {fields.endDate.id}">
                  {locales.route.timings.endDate.label}
                </Input.Label>
                {/* TODO: {typeof fields.endDate.errors !== "undefined" &&
              fields.endDate.errors.length > 0
                ? fields.endDate.errors.map((error) => (
                    <Input.Error id={fields.endDate.errorId} key={error}>
                      {error}
                    </Input.Error>
                  ))
                : null} */}
              </Input>
            </div>
            <div
              className={timingInputContainerClasses}
              hidden={timePeriod === "multiDay"}
            >
              <Input
                // TODO: {...getInputProps(fields.startTime, { type: "time" })}
                type="time"
                key="startTime"
              >
                <Input.Label htmlFor="TODO: {fields.startTime.id}">
                  {locales.route.timings.startTime.label}
                </Input.Label>
                {/* TODO: {typeof fields.startTime.errors !== "undefined" &&
              fields.startTime.errors.length > 0
                ? fields.startTime.errors.map((error) => (
                    <Input.Error id={fields.startTime.errorId} key={error}>
                      {error}
                    </Input.Error>
                  ))
                : null} */}
              </Input>
            </div>
            <div
              className={timingInputContainerClasses}
              hidden={timePeriod === "multiDay"}
            >
              <Input
                // TODO: {...getInputProps(fields.endTime, { type: "time" })}
                type="time"
                key="endTime"
              >
                <Input.Label htmlFor="TODO: {fields.endTime.id}">
                  {locales.route.timings.endTime.label}
                </Input.Label>
                {/* TODO: {typeof fields.endTime.errors !== "undefined" &&
              fields.endTime.errors.length > 0
                ? fields.endTime.errors.map((error) => (
                    <Input.Error id={fields.endTime.errorId} key={error}>
                      {error}
                    </Input.Error>
                  ))
                : null} */}
              </Input>
            </div>
          </div>
        </BasicStructure.Container>
        <div className="w-full flex flex-col md:flex-row md:justify-between gap-4">
          <p className="text-neutral-700 text-sm font-normal leading-[18px]">
            {locales.route.requiredHint}
          </p>
          <div className="w-full md:w-fit flex flex-col md:flex-row gap-4">
            <div className="w-full md:w-fit">
              <Button type="submit" fullSize>
                {locales.route.cta}
              </Button>
            </div>
            <div className="w-full md:w-fit">
              <Button as="link" to="/my/events" variant="outline" fullSize>
                {locales.route.cancel}
              </Button>
            </div>
          </div>
        </div>
      </BasicStructure>
    </>
  );
}
