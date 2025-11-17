import {
  NavLink,
  Outlet,
  redirect,
  useLoaderData,
  type LoaderFunctionArgs,
} from "react-router";
import {
  createAuthClient,
  getSessionUserOrRedirectPathToLogin,
} from "~/auth.server";
import { BackButton } from "~/components-next/BackButton";
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
      <section className="w-full mx-auto px-4 @sm:max-w-screen-container-sm @md:max-w-screen-container-md @lg:max-w-screen-container-lg @xl:max-w-screen-container-xl @xl:px-6 @2xl:max-w-screen-container-2xl mb-2 @md:mb-4 @md:mt-2">
        <BackButton
          to={`/event/${loaderData.slug}/detail/about`}
          prefetch="intent"
        >
          {locales.back}
        </BackButton>
      </section>
      <div className="w-full mx-auto px-4 @sm:max-w-screen-container-sm @md:max-w-screen-container-md @lg:max-w-screen-container-lg @xl:max-w-screen-container-xl @xl:px-6 @2xl:max-w-screen-container-2xl relative">
        <div className="flex flex-col items-stretch @lg:flex-row -mx-4 pt-10 @lg:pt-0 mb-8">
          <div className="basis-4/12 px-4">
            <div className="px-4 py-8 @lg:p-8 pb-15 rounded-lg bg-neutral-50 shadow-lg relative mb-8">
              <h3 className="font-bold mb-7">{locales.content.headline}</h3>
              <menu>
                <NavLink
                  to="general#settings"
                  className={({ isActive }) => getClassName(isActive)}
                  preventScrollReset
                  prefetch="intent"
                >
                  {locales.content.general}
                </NavLink>
                <NavLink
                  to="events#settings"
                  className={({ isActive }) => getClassName(isActive)}
                  preventScrollReset
                  prefetch="intent"
                >
                  {locales.content.linkedEvents}
                </NavLink>
                <NavLink
                  to="admins#settings"
                  className={({ isActive }) => getClassName(isActive)}
                  preventScrollReset
                  prefetch="intent"
                >
                  {locales.content.administrators}
                </NavLink>
                <NavLink
                  to="team#settings"
                  className={({ isActive }) => getClassName(isActive)}
                  preventScrollReset
                  prefetch="intent"
                >
                  {locales.content.team}
                </NavLink>
                <NavLink
                  to="speakers#settings"
                  className={({ isActive }) => getClassName(isActive)}
                  preventScrollReset
                  prefetch="intent"
                >
                  {locales.content.speakers}
                </NavLink>
                <NavLink
                  to="participants#settings"
                  className={({ isActive }) => getClassName(isActive)}
                  preventScrollReset
                  prefetch="intent"
                >
                  {locales.content.participants}
                </NavLink>
                <NavLink
                  to="waiting-list#settings"
                  className={({ isActive }) => getClassName(isActive)}
                  preventScrollReset
                  prefetch="intent"
                >
                  {locales.content.waitingList}
                </NavLink>
                <NavLink
                  to="organizations#settings"
                  className={({ isActive }) => getClassName(isActive)}
                  preventScrollReset
                  prefetch="intent"
                >
                  {locales.content.organizations}
                </NavLink>
                <NavLink
                  to="documents#settings"
                  className={({ isActive }) => getClassName(isActive)}
                  preventScrollReset
                  prefetch="intent"
                >
                  {locales.content.documents}
                </NavLink>
                <hr className="border-t border-neutral-400 my-4 @lg:my-8" />
                <NavLink
                  to="delete#settings"
                  className={({ isActive }) => getClassName(isActive)}
                  preventScrollReset
                  prefetch="intent"
                >
                  {locales.content.delete}
                </NavLink>
              </menu>
            </div>
          </div>
          <div className="basis-6/12 px-4 pb-24 mb-8 relative">
            <div id="settings" className="absolute -top-[76px] xl:-top-20" />
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
