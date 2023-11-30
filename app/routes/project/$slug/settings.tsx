import { NavLink, Outlet } from "@remix-run/react";
import { type LoaderArgs, redirect } from "@remix-run/node";
import { createAuthClient, getSessionUser } from "~/auth.server";
import { prismaClient } from "~/prisma.server";
import { getParamValueOrThrow } from "~/lib/utils/routes";
import { useTranslation } from "react-i18next";

const i18nNS = ["routes/project/settings"];
export const handle = {
  i18n: i18nNS,
};

export const loader = async (args: LoaderArgs) => {
  const { request, params } = args;
  const response = new Response();

  const authClient = createAuthClient(request, response);
  const slug = getParamValueOrThrow(params, "slug");

  const sessionUser = await getSessionUser(authClient);
  if (sessionUser !== null) {
    const userProfile = await prismaClient.profile.findFirst({
      where: { id: sessionUser.id },
      select: { termsAccepted: true },
    });
    if (userProfile !== null && userProfile.termsAccepted === false) {
      return redirect(`/accept-terms?redirect_to=/project/${slug}/settings`, {
        headers: response.headers,
      });
    }
  }
  return null;
};

function Settings() {
  const getClassName = (active: boolean) =>
    `block text-3xl ${
      active ? "text-primary" : "text-neutral-500"
    }  hover:text-primary py-3`;
  const { t } = useTranslation(i18nNS);

  return (
    <>
      <div className="container relative">
        <div className="flex flex-col lg:flex-row -mx-4 pt-10 lg:pt-0">
          <div className="basis-4/12 px-4">
            <div className="px-4 py-8 lg:p-8 pb-15 rounded-lg bg-neutral-200 shadow-lg relative mb-8">
              <h3 className="font-bold mb-7">{t("content.headline")}</h3>
              <menu>
                <ul>
                  <li>
                    <NavLink
                      to="general"
                      className={({ isActive }) => getClassName(isActive)}
                    >
                      {t("content.navigation.general")}
                    </NavLink>
                  </li>
                  <li>
                    <NavLink
                      to="admins"
                      className={({ isActive }) => getClassName(isActive)}
                    >
                      {t("content.navigation.admins")}
                    </NavLink>
                  </li>
                  <li>
                    <NavLink
                      to="team"
                      className={({ isActive }) => getClassName(isActive)}
                    >
                      {t("content.navigation.team")}
                    </NavLink>
                  </li>
                  <li>
                    <NavLink
                      to="organizations"
                      className={({ isActive }) => getClassName(isActive)}
                    >
                      {t("content.navigation.organizations")}
                    </NavLink>
                  </li>
                </ul>
                <hr className="border-neutral-400 my-4 lg:my-8" />
                <div>
                  <NavLink
                    to="delete"
                    className={({ isActive }) => getClassName(isActive)}
                  >
                    {t("content.navigation.delete")}
                  </NavLink>
                </div>
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
    </>
  );
}

export default Settings;
