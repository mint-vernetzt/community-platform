import { NavLink, Outlet, useLoaderData } from "@remix-run/react";
import {
  type DataFunctionArgs,
  json,
  redirect,
} from "@remix-run/server-runtime";
import { createAuthClient, getSessionUser } from "~/auth.server";
import { invariantResponse } from "~/lib/utils/response";
import { getRedirectPathOnProtectedProjectRoute } from "./settings/utils.server";
import { prismaClient } from "~/prisma.server";
import { Section } from "@mint-vernetzt/components";

export const loader = async (args: DataFunctionArgs) => {
  const { request, params } = args;
  const response = new Response();

  const authClient = createAuthClient(request, response);

  const sessionUser = await getSessionUser(authClient);

  // check slug exists (throw bad request if not)
  invariantResponse(params.slug !== undefined, "No valid route", {
    status: 400,
  });

  const redirectPath = await getRedirectPathOnProtectedProjectRoute({
    request,
    slug: params.slug,
    sessionUser,
    authClient,
  });

  if (redirectPath !== null) {
    return redirect(redirectPath, { headers: response.headers });
  }

  const project = await prismaClient.project.findFirst({
    where: { slug: params.slug },
    select: {
      name: true,
    },
  });

  invariantResponse(project !== null, "Project not found", { status: 404 });

  return json(
    {
      project,
    },
    { headers: response.headers }
  );
};

function ProjectSettings() {
  const loaderData = useLoaderData<typeof loader>();

  return (
    <>
      <h1>Project Settings</h1>
      <div className="mv-p-4">
        <Section variant="primary" withBorder>
          <Section.Header>{loaderData.project.name}</Section.Header>
          <Section.Body>
            Lege hier Dein Gute-Praxis-Projekt an, um Akteur:innen zu
            inspirieren ähnliche Projekte zu starten.
          </Section.Body>
        </Section>
      </div>
      <div className="mv-flex mv-gap-4">
        <NavLink
          to="./general"
          className={({ isActive }) => {
            return isActive ? "mv-underline" : "mv-text-primary";
          }}
        >
          General
        </NavLink>
        <NavLink
          to="./web-social"
          className={({ isActive }) => {
            return isActive ? "mv-underline" : "mv-text-primary";
          }}
        >
          Web/Social
        </NavLink>
        <NavLink
          to="./details"
          className={({ isActive }) => {
            return isActive ? "mv-underline" : "mv-text-primary";
          }}
        >
          Details
        </NavLink>
        <NavLink
          to="./requirements"
          className={({ isActive }) => {
            return isActive ? "mv-underline" : "mv-text-primary";
          }}
        >
          Requirements
        </NavLink>
        <NavLink
          to="./responsible-orgs"
          className={({ isActive }) => {
            return isActive ? "mv-underline" : "mv-text-primary";
          }}
        >
          Responsible Organizations
        </NavLink>
        <NavLink
          to="./team"
          className={({ isActive }) => {
            return isActive ? "mv-underline" : "mv-text-primary";
          }}
        >
          Team
        </NavLink>
        <NavLink
          to="./admins"
          className={({ isActive }) => {
            return isActive ? "mv-underline" : "mv-text-primary";
          }}
        >
          Admins
        </NavLink>
        <NavLink
          to="./attachments"
          className={({ isActive }) => {
            return isActive ? "mv-underline" : "mv-text-primary";
          }}
        >
          Attachments
        </NavLink>
        <NavLink
          to="./danger-zone"
          className={({ isActive }) => {
            return isActive ? "mv-underline" : "mv-text-primary";
          }}
        >
          Danger Zone
        </NavLink>
      </div>
      <Outlet />
    </>
  );
}

export default ProjectSettings;
