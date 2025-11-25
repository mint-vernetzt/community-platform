import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { Link, redirect, useLoaderData } from "react-router";
import {
  createAuthClient,
  getSessionUserOrRedirectPathToLogin,
  getSessionUserOrThrow,
} from "~/auth.server";
import BasicStructure from "~/components/next/BasicStructure";
import MobileSettingsHeader from "~/components/next/MobileSettingsHeader";
import SettingsHeading from "~/components/next/SettingsHeading";
import { detectLanguage } from "~/i18n.server";
import { insertComponentsIntoLocale } from "~/lib/utils/i18n";
import { languageModuleMap } from "~/locales/.server";
import { checkFeatureAbilitiesOrThrow } from "~/routes/feature-access.server";

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
      </BasicStructure>
    </>
  );
}
