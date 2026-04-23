import { Form, useLoaderData, type LoaderFunctionArgs } from "react-router";
import Hint from "~/components/next/Hint";
import TitleSection from "~/components/next/TitleSection";
import { detectLanguage } from "~/i18n.server";
import { invariantResponse } from "~/lib/utils/response";
import { languageModuleMap } from "~/locales/.server";
import { getEventBySlug } from "./access.server";
import classNames from "classnames";

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
        <Form method="post" className="flex flex-col gap-4">
          <RadioButtonSettings
            name="type"
            value="internal"
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
            name="type"
            value="external"
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
      </div>
      <div className="flex flex-col gap-4">
        <TitleSection>
          <TitleSection.Headline>
            {locales.route.access.headline}
          </TitleSection.Headline>
          <TitleSection.Subline>
            {locales.route.access.subline}
          </TitleSection.Subline>
        </TitleSection>
        <Form method="post" className="flex flex-col gap-4">
          <RadioButtonSettings
            name="access"
            value="open"
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
            name="access"
            value="closed"
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
