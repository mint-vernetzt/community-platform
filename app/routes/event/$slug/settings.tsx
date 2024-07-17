import { redirect, type LoaderFunctionArgs } from "@remix-run/node";
import { NavLink, Outlet } from "@remix-run/react";
import { useTranslation } from "react-i18next";
import {
  createAuthClient,
  getSessionUserOrRedirectPathToLogin,
} from "~/auth.server";

export const loader = async (args: LoaderFunctionArgs) => {
  const { request } = args;
  const { authClient } = createAuthClient(request);

  const { sessionUser, redirectPath } =
    await getSessionUserOrRedirectPathToLogin(authClient, request);

  if (sessionUser === null && redirectPath !== null) {
    return redirect(redirectPath);
  }
  return null;
};

function Settings() {
  const { t } = useTranslation(["routes/event/settings"]);
  const getClassName = (active: boolean) =>
    `block text-3xl ${
      active ? "text-primary" : "text-neutral-500"
    }  hover:text-primary py-3`;
  return (
    <div className="mv-w-full mv-mx-auto mv-px-4 @sm:mv-max-w-screen-container-sm @md:mv-max-w-screen-container-md @lg:mv-max-w-screen-container-lg @xl:mv-max-w-screen-container-xl @xl:mv-px-6 @2xl:mv-max-w-screen-container-2xl relative mv-mt-10 @md:mv-mt-12 @lg:mv-mt-14">
      <div className="flex flex-col items-stretch @lg:mv-flex-row -mx-4 pt-10 @lg:mv-pt-0 mb-8">
        <div className="basis-4/12 px-4">
          <div className="px-4 py-8 @lg:mv-p-8 pb-15 rounded-lg bg-neutral-200 shadow-lg relative mb-8">
            <h3 className="font-bold mb-7">{t("content.headline")}</h3>
            <menu>
              <NavLink
                to="general"
                className={({ isActive }) => getClassName(isActive)}
                preventScrollReset
              >
                {t("content.general")}
              </NavLink>
              <NavLink
                to="events"
                className={({ isActive }) => getClassName(isActive)}
                preventScrollReset
              >
                {t("content.linkedEvents")}
              </NavLink>
              <NavLink
                to="admins"
                className={({ isActive }) => getClassName(isActive)}
                preventScrollReset
              >
                {t("content.administrators")}
              </NavLink>
              <NavLink
                to="team"
                className={({ isActive }) => getClassName(isActive)}
                preventScrollReset
              >
                {t("content.team")}
              </NavLink>
              <NavLink
                to="speakers"
                className={({ isActive }) => getClassName(isActive)}
                preventScrollReset
              >
                {t("content.speakers")}
              </NavLink>
              <NavLink
                to="participants"
                className={({ isActive }) => getClassName(isActive)}
                preventScrollReset
              >
                {t("content.participants")}
              </NavLink>
              <NavLink
                to="waiting-list"
                className={({ isActive }) => getClassName(isActive)}
                preventScrollReset
              >
                {t("content.waitingList")}
              </NavLink>
              <NavLink
                to="organizations"
                className={({ isActive }) => getClassName(isActive)}
                preventScrollReset
              >
                {t("content.organizations")}
              </NavLink>
              <NavLink
                to="documents"
                className={({ isActive }) => getClassName(isActive)}
                preventScrollReset
              >
                {t("content.documents")}
              </NavLink>
              <hr className="border-neutral-400 my-4 @lg:mv-my-8" />
              <NavLink
                to="delete"
                className={({ isActive }) => getClassName(isActive)}
                preventScrollReset
              >
                {t("content.delete")}
              </NavLink>
            </menu>
          </div>
        </div>
        <div className="basis-6/12 px-4 pb-24 mv-mb-8">
          <main>
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}

export default Settings;
