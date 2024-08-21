import { json, redirect, type LoaderFunctionArgs } from "@remix-run/node";
import {
  createAuthClient,
  getSessionUserOrRedirectPathToLogin,
} from "~/auth.server";
import { invariantResponse } from "~/lib/utils/response";
import { getParamValueOrThrow } from "~/lib/utils/routes";
import { deriveProfileMode } from "~/routes/profile/$username/utils.server";
import {
  addImageUrlToOrganizations,
  flattenOrganizationRelations,
  getOrganizationsFromProfile,
} from "./organizations.server";
import { Link, useLoaderData, useSearchParams } from "@remix-run/react";
import {
  Button,
  CardContainer,
  OrganizationCard,
  TabBar,
} from "@mint-vernetzt/components";
import { useState } from "react";
import { getFeatureAbilities } from "~/lib/utils/application";

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  const { authClient } = createAuthClient(request);

  const abilities = await getFeatureAbilities(authClient, "my_organizations");
  if (abilities.my_organizations.hasAccess === false) {
    return redirect("/");
  }

  const { sessionUser, redirectPath } =
    await getSessionUserOrRedirectPathToLogin(authClient, request);
  if (sessionUser === null && redirectPath !== null) {
    return redirect(redirectPath);
  }
  const username = getParamValueOrThrow(params, "username");
  const mode = await deriveProfileMode(sessionUser, username);
  invariantResponse(mode === "owner", "Forbidden", { status: 403 });

  const organizations = await getOrganizationsFromProfile(username);
  const enhancedOrganizations = addImageUrlToOrganizations(
    authClient,
    organizations
  );
  const { adminOrganizations, teamMemberOrganizations } =
    flattenOrganizationRelations(enhancedOrganizations);

  return json({ adminOrganizations, teamMemberOrganizations });
};

export default function MyOrganizations() {
  const loaderData = useLoaderData<typeof loader>();
  const [searchParams] = useSearchParams();
  const [activeItem, setActiveItem] = useState(
    searchParams.get("tab") || loaderData.teamMemberOrganizations.length > 0
      ? "teamMember"
      : "admin"
  );

  // TODO: Styling
  // TODO: i18n
  return (
    <>
      <h1>Meine Organisationen</h1>
      <Button as="a" href={"/organization/create"}>
        {/* TODO: 

        - svg and text vertically does not center vertically
        - padding of size medium is not correct on dev side

      */}
        <svg
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="mv-leading-5"
        >
          <path
            d="M10 5C10.1658 5 10.3247 5.06585 10.4419 5.18306C10.5592 5.30027 10.625 5.45924 10.625 5.625V9.375H14.375C14.5408 9.375 14.6997 9.44085 14.8169 9.55806C14.9342 9.67527 15 9.83424 15 10C15 10.1658 14.9342 10.3247 14.8169 10.4419C14.6997 10.5592 14.5408 10.625 14.375 10.625H10.625V14.375C10.625 14.5408 10.5592 14.6997 10.4419 14.8169C10.3247 14.9342 10.1658 15 10 15C9.83424 15 9.67527 14.9342 9.55806 14.8169C9.44085 14.6997 9.375 14.5408 9.375 14.375V10.625H5.625C5.45924 10.625 5.30027 10.5592 5.18306 10.4419C5.06585 10.3247 5 10.1658 5 10C5 9.83424 5.06585 9.67527 5.18306 9.55806C5.30027 9.44085 5.45924 9.375 5.625 9.375H9.375V5.625C9.375 5.45924 9.44085 5.30027 9.55806 5.18306C9.67527 5.06585 9.83424 5 10 5Z"
            fill="currentColor"
          />
        </svg>
        <span>Organisation anlegen</span>
      </Button>
      {/* TODO: Ask Design if this is correct behaviour -> hide complete section */}
      {loaderData.teamMemberOrganizations.length > 0 ||
      loaderData.adminOrganizations.length > 0 ? (
        <section>
          {/* TODO: Ask design about section headline */}
          <TabBar>
            {/* TODO: Add counter prop to TabBar.Item */}
            <TabBar.Item active={activeItem === "teamMember"}>
              {loaderData.teamMemberOrganizations.length > 0 ? (
                <Link
                  to="?tab=teamMember"
                  onClick={(event) => {
                    event.preventDefault();
                    setActiveItem("teamMember");
                    return;
                  }}
                >
                  Teammitglied {loaderData.teamMemberOrganizations.length}
                </Link>
              ) : (
                <span className="mv-cursor-default">
                  Teammitglied {loaderData.teamMemberOrganizations.length}
                </span>
              )}
            </TabBar.Item>
            <TabBar.Item active={activeItem === "admin"}>
              {loaderData.adminOrganizations.length > 0 ? (
                <Link
                  to="?tab=admin"
                  onClick={(event) => {
                    event.preventDefault();
                    setActiveItem("admin");
                    return;
                  }}
                >
                  Admin {loaderData.adminOrganizations.length}
                </Link>
              ) : (
                <span className="mv-cursor-default">
                  Admin {loaderData.adminOrganizations.length}
                </span>
              )}
            </TabBar.Item>
          </TabBar>
          {activeItem === "teamMember" ? (
            <p>Diesen Organisationen bist du als Teammitglied zugeordnet.</p>
          ) : (
            <p>Diesen Organisationen bist du als Admin zugeordnet.</p>
          )}
          {activeItem === "teamMember" &&
          loaderData.teamMemberOrganizations.length > 0 ? (
            <CardContainer type="multi row">
              {loaderData.teamMemberOrganizations.map((organization) => {
                return (
                  <OrganizationCard
                    key={`team-member-organization-${organization.id}`}
                    organization={organization}
                  />
                );
              })}
            </CardContainer>
          ) : null}
          {activeItem === "admin" &&
          loaderData.adminOrganizations.length > 0 ? (
            <CardContainer type="multi row">
              {loaderData.adminOrganizations.map((organization) => {
                return (
                  <OrganizationCard
                    key={`admin-organization-${organization.id}`}
                    organization={organization}
                  />
                );
              })}
            </CardContainer>
          ) : null}
        </section>
      ) : null}
    </>
  );
}
