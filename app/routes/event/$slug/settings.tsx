import { NavLink, Outlet } from "@remix-run/react";
import { redirect, type LoaderFunctionArgs } from "@remix-run/node";
import { createAuthClient, getSessionUser } from "~/auth.server";
import { prismaClient } from "~/prisma.server";
import { getParamValueOrThrow } from "~/lib/utils/routes";
import { useTranslation } from "react-i18next";

export const loader = async (args: LoaderFunctionArgs) => {
  const { request, params } = args;
  const slug = getParamValueOrThrow(params, "slug");
  const { authClient } = createAuthClient(request);

  const sessionUser = await getSessionUser(authClient);
  if (sessionUser !== null) {
    const userProfile = await prismaClient.profile.findFirst({
      where: { id: sessionUser.id },
      select: { termsAccepted: true },
    });
    if (userProfile !== null && userProfile.termsAccepted === false) {
      return redirect(`/accept-terms?redirect_to=/event/${slug}/settings`);
    }
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
    <div className="mv-container-custom relative">
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
        <div className="basis-6/12 px-4 pb-24">
          <main>
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}

export default Settings;
