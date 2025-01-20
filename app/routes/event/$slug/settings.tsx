import { TextButton } from "@mint-vernetzt/components/src/molecules/TextButton";
import { redirect, type LoaderFunctionArgs } from "@remix-run/node";
import { NavLink, Outlet, useLoaderData } from "@remix-run/react";
import {
  createAuthClient,
  getSessionUserOrRedirectPathToLogin,
} from "~/auth.server";
import { detectLanguage } from "~/i18n.server";
import { getParamValueOrThrow } from "~/lib/utils/routes";
import { languageModuleMap } from "~/locales/.server";

export const loader = async (args: LoaderFunctionArgs) => {
  const { request, params } = args;
  const { authClient } = createAuthClient(request);

  const { sessionUser, redirectPath } =
    await getSessionUserOrRedirectPathToLogin(authClient, request);

  if (sessionUser === null && redirectPath !== null) {
    return redirect(redirectPath);
  }
  const language = await detectLanguage(request);
  const locales = languageModuleMap[language]["event/$slug/settings"];

  const slug = getParamValueOrThrow(params, "slug");

  return {
    slug,
    locales,
  };
};

function Settings() {
  const loaderData = useLoaderData<typeof loader>();
  const { locales } = loaderData;
  const getClassName = (active: boolean) =>
    `block text-3xl ${
      active ? "text-primary" : "text-neutral-500"
    }  hover:text-primary py-3`;
  return (
    <>
      <section className="mv-w-full mv-mx-auto mv-px-4 @sm:mv-max-w-screen-container-sm @md:mv-max-w-screen-container-md @lg:mv-max-w-screen-container-lg @xl:mv-max-w-screen-container-xl @xl:mv-px-6 @2xl:mv-max-w-screen-container-2xl mv-mb-2 @md:mv-mb-4 @md:mv-mt-2">
        {/* TODO: I want prefetch intent here but the TextButton cannot be used with a remix Link wrapped inside. */}
        <TextButton
          as="a"
          href={`/event/${loaderData.slug}`}
          weight="thin"
          variant="neutral"
          arrowLeft
        >
          {locales.back}
        </TextButton>
      </section>
      <div className="mv-w-full mv-mx-auto mv-px-4 @sm:mv-max-w-screen-container-sm @md:mv-max-w-screen-container-md @lg:mv-max-w-screen-container-lg @xl:mv-max-w-screen-container-xl @xl:mv-px-6 @2xl:mv-max-w-screen-container-2xl relative">
        <div className="flex flex-col items-stretch @lg:mv-flex-row -mx-4 pt-10 @lg:mv-pt-0 mb-8">
          <div className="basis-4/12 px-4">
            <div className="px-4 py-8 @lg:mv-p-8 pb-15 rounded-lg bg-neutral-200 shadow-lg relative mb-8">
              <h3 className="font-bold mb-7">{locales.content.headline}</h3>
              <menu>
                <NavLink
                  to="general#settings"
                  className={({ isActive }) => getClassName(isActive)}
                  preventScrollReset
                >
                  {locales.content.general}
                </NavLink>
                <NavLink
                  to="events#settings"
                  className={({ isActive }) => getClassName(isActive)}
                  preventScrollReset
                >
                  {locales.content.linkedEvents}
                </NavLink>
                <NavLink
                  to="admins#settings"
                  className={({ isActive }) => getClassName(isActive)}
                  preventScrollReset
                >
                  {locales.content.administrators}
                </NavLink>
                <NavLink
                  to="team#settings"
                  className={({ isActive }) => getClassName(isActive)}
                  preventScrollReset
                >
                  {locales.content.team}
                </NavLink>
                <NavLink
                  to="speakers#settings"
                  className={({ isActive }) => getClassName(isActive)}
                  preventScrollReset
                >
                  {locales.content.speakers}
                </NavLink>
                <NavLink
                  to="participants#settings"
                  className={({ isActive }) => getClassName(isActive)}
                  preventScrollReset
                >
                  {locales.content.participants}
                </NavLink>
                <NavLink
                  to="waiting-list#settings"
                  className={({ isActive }) => getClassName(isActive)}
                  preventScrollReset
                >
                  {locales.content.waitingList}
                </NavLink>
                <NavLink
                  to="organizations#settings"
                  className={({ isActive }) => getClassName(isActive)}
                  preventScrollReset
                >
                  {locales.content.organizations}
                </NavLink>
                <NavLink
                  to="documents#settings"
                  className={({ isActive }) => getClassName(isActive)}
                  preventScrollReset
                >
                  {locales.content.documents}
                </NavLink>
                <hr className="border-neutral-400 my-4 @lg:mv-my-8" />
                <NavLink
                  to="delete#settings"
                  className={({ isActive }) => getClassName(isActive)}
                  preventScrollReset
                >
                  {locales.content.delete}
                </NavLink>
              </menu>
            </div>
          </div>
          <div id="settings" className="basis-6/12 px-4 pb-24 mv-mb-8">
            <main>
              <Outlet />
            </main>
          </div>
        </div>
      </div>
    </>
  );
}

export default Settings;
