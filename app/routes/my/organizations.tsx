import { json, redirect, type LoaderFunctionArgs } from "@remix-run/node";
import {
  createAuthClient,
  getSessionUserOrRedirectPathToLogin,
} from "~/auth.server";
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
import { useTranslation } from "react-i18next";

const i18nNS = ["routes/my/organizations"];
export const handle = {
  i18n: i18nNS,
};

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

  const organizations = await getOrganizationsFromProfile(sessionUser.id);
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
  const { t } = useTranslation(i18nNS);

  return (
    <div className="mv-w-full mv-flex mv-justify-center">
      <div className="mv-w-full mv-py-6 mv-px-4 @lg:mv-py-8 @md:mv-px-6 @lg:mv-px-8 mv-flex mv-flex-col mv-gap-6 mv-mb-10 @sm:mv-mb-[72px] @lg:mv-mb-16 mv-max-w-screen-2xl">
        <div className="mv-flex mv-flex-col @sm:mv-flex-row mv-gap-4 @md:mv-gap-6 @lg:mv-gap-8 mv-items-center mv-justify-between">
          <h1 className="mv-mb-0 mv-text-5xl mv-text-primary mv-font-bold mv-leading-9">
            {t("headline")}
          </h1>
          <Button as="a" href={"/organization/create"}>
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M10 5C10.1658 5 10.3247 5.06585 10.4419 5.18306C10.5592 5.30027 10.625 5.45924 10.625 5.625V9.375H14.375C14.5408 9.375 14.6997 9.44085 14.8169 9.55806C14.9342 9.67527 15 9.83424 15 10C15 10.1658 14.9342 10.3247 14.8169 10.4419C14.6997 10.5592 14.5408 10.625 14.375 10.625H10.625V14.375C10.625 14.5408 10.5592 14.6997 10.4419 14.8169C10.3247 14.9342 10.1658 15 10 15C9.83424 15 9.67527 14.9342 9.55806 14.8169C9.44085 14.6997 9.375 14.5408 9.375 14.375V10.625H5.625C5.45924 10.625 5.30027 10.5592 5.18306 10.4419C5.06585 10.3247 5 10.1658 5 10C5 9.83424 5.06585 9.67527 5.18306 9.55806C5.30027 9.44085 5.45924 9.375 5.625 9.375H9.375V5.625C9.375 5.45924 9.44085 5.30027 9.55806 5.18306C9.67527 5.06585 9.83424 5 10 5Z"
                fill="currentColor"
              />
            </svg>
            {t("cta")}
          </Button>
        </div>
        {loaderData.teamMemberOrganizations.length > 0 ||
        loaderData.adminOrganizations.length > 0 ? (
          <section className="mv-w-full mv-flex mv-flex-col mv-gap-8 @sm:mv-px-2 @md:mv-px-4 @lg:mv-px-8 @sm:mv-py-2 @md:mv-py-4 @lg:mv-py-6 @sm:mv-gap-4 @sm:mv-bg-white @sm:mv-rounded-2xl @sm:mv-border @sm:mv-border-neutral-200">
            <TabBar>
              <TabBar.Item
                active={activeItem === "teamMember"}
                disabled={loaderData.teamMemberOrganizations.length === 0}
              >
                <Link
                  to="?tab=teamMember"
                  onClick={(event) => {
                    event.preventDefault();
                    setActiveItem("teamMember");
                    return;
                  }}
                >
                  <div className="mv-flex mv-gap-1.5 mv-items-center">
                    <span>{t("tabbar.teamMember")}</span>
                    <TabBar.Counter active={activeItem === "teamMember"}>
                      {loaderData.teamMemberOrganizations.length}
                    </TabBar.Counter>
                  </div>
                </Link>
              </TabBar.Item>
              <TabBar.Item
                active={activeItem === "admin"}
                disabled={loaderData.adminOrganizations.length === 0}
              >
                <Link
                  to="?tab=admin"
                  onClick={(event) => {
                    event.preventDefault();
                    setActiveItem("admin");
                    return;
                  }}
                >
                  <div className="mv-flex mv-gap-1.5 mv-items-center">
                    <span>{t("tabbar.admin")}</span>
                    <TabBar.Counter active={activeItem === "admin"}>
                      {loaderData.adminOrganizations.length}
                    </TabBar.Counter>
                  </div>
                </Link>
              </TabBar.Item>
            </TabBar>
            <p className="mv-hidden @sm:mv-block">
              {activeItem === "teamMember"
                ? t("subline.teamMember")
                : t("subline.admin")}
            </p>
            <div className="-mv-mx-4">
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
            </div>
          </section>
        ) : null}
      </div>
    </div>
  );
}
