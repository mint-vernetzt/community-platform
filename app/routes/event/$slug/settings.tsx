import { TextButton } from "@mint-vernetzt/components/src/molecules/TextButton";
import { redirect, type LoaderFunctionArgs } from "react-router";
import { NavLink, Outlet, useLoaderData } from "react-router";
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
    `mv-block mv-text-3xl ${
      active ? "mv-text-primary" : "mv-text-neutral-500"
    }  hover:mv-text-primary mv-py-3`;
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
      <div className="mv-w-full mv-mx-auto mv-px-4 @sm:mv-max-w-screen-container-sm @md:mv-max-w-screen-container-md @lg:mv-max-w-screen-container-lg @xl:mv-max-w-screen-container-xl @xl:mv-px-6 @2xl:mv-max-w-screen-container-2xl mv-relative">
        <div className="mv-flex mv-flex-col mv-items-stretch @lg:mv-flex-row mv--mx-4 mv-pt-10 @lg:mv-pt-0 mb-8">
          <div className="mv-basis-4/12 mv-px-4">
            <div className="mv-px-4 mv-py-8 @lg:mv-p-8 mv-pb-15 mv-rounded-lg mv-bg-neutral-50 mv-shadow-lg mv-relative mv-mb-8">
              <h3 className="mv-font-bold mv-mb-7">
                {locales.content.headline}
              </h3>
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
                <hr className="mv-border-neutral-400 mv-my-4 @lg:mv-my-8" />
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
          <div id="settings" className="mv-basis-6/12 mv-px-4 mv-pb-24 mv-mb-8">
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
