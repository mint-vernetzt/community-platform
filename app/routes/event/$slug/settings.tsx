import { NavLink, Outlet } from "@remix-run/react";
import { redirect, type LoaderFunctionArgs } from "@remix-run/node";
import { createAuthClient, getSessionUser } from "~/auth.server";
import { prismaClient } from "~/prisma.server";
import { getParamValueOrThrow } from "~/lib/utils/routes";

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
  const getClassName = (active: boolean) =>
    `block text-3xl ${
      active ? "text-primary" : "text-neutral-500"
    }  hover:text-primary py-3`;
  return (
    <div className="container relative">
      <div className="flex flex-col items-stretch lg:flex-row -mx-4 pt-10 lg:pt-0 mb-8">
        <div className="basis-4/12 px-4">
          <div className="px-4 py-8 lg:p-8 pb-15 rounded-lg bg-neutral-200 shadow-lg relative mb-8">
            <h3 className="font-bold mb-7">Veranstaltung bearbeiten</h3>
            <menu>
              <NavLink
                to="general"
                className={({ isActive }) => getClassName(isActive)}
              >
                Allgemein
              </NavLink>
              <NavLink
                to="events"
                className={({ isActive }) => getClassName(isActive)}
              >
                Verknüpfte Veranstaltungen
              </NavLink>
              <NavLink
                to="admins"
                className={({ isActive }) => getClassName(isActive)}
              >
                Administrator:innen
              </NavLink>
              <NavLink
                to="team"
                className={({ isActive }) => getClassName(isActive)}
              >
                Team
              </NavLink>
              <NavLink
                to="speakers"
                className={({ isActive }) => getClassName(isActive)}
              >
                Vortragende
              </NavLink>
              <NavLink
                to="participants"
                className={({ isActive }) => getClassName(isActive)}
              >
                Teilnehmende
              </NavLink>
              <NavLink
                to="waiting-list"
                className={({ isActive }) => getClassName(isActive)}
              >
                Warteliste
              </NavLink>
              <NavLink
                to="organizations"
                className={({ isActive }) => getClassName(isActive)}
              >
                Verantwortliche Organisationen
              </NavLink>
              <NavLink
                to="documents"
                className={({ isActive }) => getClassName(isActive)}
              >
                Dokumente verwalten
              </NavLink>
              <hr className="border-neutral-400 my-4 lg:my-8" />
              <NavLink
                to="delete"
                className={({ isActive }) => getClassName(isActive)}
              >
                Veranstaltung löschen
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
