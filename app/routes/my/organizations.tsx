import { json, redirect, type LoaderFunctionArgs } from "@remix-run/node";
import {
  createAuthClient,
  getSessionUserOrRedirectPathToLogin,
} from "~/auth.server";
import {
  addImageUrlToInvites,
  addImageUrlToOrganizations,
  flattenOrganizationRelations,
  getOrganizationInvitesForProfile,
  getOrganizationsFromProfile,
} from "./organizations.server";
import { Form, Link, useLoaderData, useSearchParams } from "@remix-run/react";
import {
  Avatar,
  Button,
  CardContainer,
  OrganizationCard,
  TabBar,
} from "@mint-vernetzt/components";
import { useState } from "react";
import { getFeatureAbilities } from "~/lib/utils/application";
import { useTranslation } from "react-i18next";
import { extendSearchParams } from "~/lib/utils/searchParams";

const i18nNS = ["routes/my/organizations"];
export const handle = {
  i18n: i18nNS,
};

export const loader = async ({ request }: LoaderFunctionArgs) => {
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
  const flattenedOrganizations = flattenOrganizationRelations(
    enhancedOrganizations
  );

  const invites = await getOrganizationInvitesForProfile(sessionUser.id);
  const enhancedInvites = addImageUrlToInvites(authClient, invites);

  return json({
    organizations: flattenedOrganizations,
    invites: enhancedInvites,
  });
};

export default function MyOrganizations() {
  const loaderData = useLoaderData<typeof loader>();
  const { t } = useTranslation(i18nNS);
  const [searchParams] = useSearchParams();

  const [activeOrganizationsTab, setActiveOrganizationsTab] = useState(
    searchParams.get("organizations-tab") !== null &&
      searchParams.get("organizations-tab") !== ""
      ? searchParams.get("organizations-tab")
      : loaderData.organizations.teamMemberOrganizations.length > 0
      ? "teamMember"
      : "admin"
  );
  const organizations = {
    teamMember: {
      organizations: loaderData.organizations.teamMemberOrganizations,
      active: activeOrganizationsTab === "teamMember",
      searchParams: extendSearchParams(searchParams, {
        set: { "organizations-tab": "teamMember" },
      }),
    },
    admin: {
      organizations: loaderData.organizations.adminOrganizations,
      active: activeOrganizationsTab === "admin",
      searchParams: extendSearchParams(searchParams, {
        set: { "organizations-tab": "admin" },
      }),
    },
  };

  const [activeInvitesTab, setActiveInvitesTab] = useState(
    searchParams.get("invites-tab") !== null &&
      searchParams.get("invites-tab") !== ""
      ? searchParams.get("invites-tab")
      : loaderData.invites.teamMemberInvites.length > 0
      ? "teamMember"
      : "admin"
  );
  const invites = {
    teamMember: {
      invites: loaderData.invites.teamMemberInvites,
      active: activeInvitesTab === "teamMember",
      searchParams: extendSearchParams(searchParams, {
        set: { "invites-tab": "teamMember" },
      }),
    },
    admin: {
      invites: loaderData.invites.adminInvites,
      active: activeInvitesTab === "admin",
      searchParams: extendSearchParams(searchParams, {
        set: { "invites-tab": "admin" },
      }),
    },
  };

  // TODO: Forms with action function

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
        {invites.teamMember.invites.length > 0 ||
        invites.admin.invites.length > 0 ? (
          <section className="mv-py-6 @lg:mv-py-8 mv-px-4 @lg:mv-px-6 mv-flex mv-flex-col mv-gap-4 mv-border mv-border-neutral-200 mv-bg-white mv-rounded-2xl">
            <div className="mv-flex mv-flex-col mv-gap-2">
              <h2 className="mv-text-2xl mv-font-bold mv-text-primary mv-leading-[26px] mv-mb-0">
                {t("invites.headline")}
              </h2>
              <p className="mv-text-sm mv-text-neutral-700">
                {t("invites.subline")}
              </p>
            </div>
            <TabBar>
              {Object.entries(invites).map(([key, value]) => {
                return (
                  <TabBar.Item
                    key={`${key}-invites-tab`}
                    active={value.active}
                    disabled={value.invites.length === 0}
                  >
                    <Link
                      to={`?${value.searchParams.toString()}`}
                      onClick={(event) => {
                        event.preventDefault();
                        setActiveInvitesTab(key);
                        return;
                      }}
                      preventScrollReset
                    >
                      <div className="mv-flex mv-gap-1.5 mv-items-center">
                        <span>{t(`invites.tabbar.${key}`)}</span>
                        <TabBar.Counter active={value.active}>
                          {value.invites.length}
                        </TabBar.Counter>
                      </div>
                    </Link>
                  </TabBar.Item>
                );
              })}
            </TabBar>
            <ul className="mv-flex mv-flex-col mv-gap-4">
              {Object.entries(invites).map(([key, value]) => {
                return value.active && value.invites.length > 0
                  ? value.invites.map((invite) => {
                      return (
                        <li
                          key={`${key}-invite-${invite.organizationId}`}
                          className="mv-flex mv-flex-col @sm:mv-flex-row mv-gap-4 mv-p-4 mv-border mv-border-neutral-200 mv-rounded-2xl mv-justify-between mv-items-center"
                        >
                          <Link
                            to={`/organization/${invite.organization.slug}`}
                            className="mv-flex mv-gap-2 @sm:mv-gap-4 mv-items-center mv-w-full @sm:mv-w-fit"
                          >
                            <div className="mv-h-[72px] mv-w-[72px] mv-min-h-[72px] mv-min-w-[72px]">
                              <Avatar size="full" {...invite.organization} />
                            </div>
                            <div>
                              <p className="mv-text-primary mv-text-sm mv-font-bold mv-line-clamp-2">
                                {invite.organization.name}
                              </p>
                              <p className="mv-text-neutral-700 mv-text-sm mv-line-clamp-1">
                                {invite.organization.types
                                  .map((relation) => {
                                    return relation.organizationType.title;
                                  })
                                  .join(", ")}
                              </p>
                            </div>
                          </Link>
                          <Form
                            method="post"
                            className="mv-grid mv-grid-cols-2 mv-grid-rows-1 mv-gap-4 mv-w-full @sm:mv-w-fit"
                          >
                            <Button variant="outline" fullSize>
                              {t("invites.decline")}
                            </Button>
                            <Button fullSize>{t("invites.accept")}</Button>
                          </Form>
                        </li>
                      );
                    })
                  : null;
              })}
            </ul>
          </section>
        ) : null}
        {organizations.teamMember.organizations.length > 0 ||
        organizations.admin.organizations.length > 0 ? (
          // TODO:
          // Ask design if this is intentional: section has py-6 and px-8 on lg -> section above has py-8 and px-6 on lg
          // Its not the bahaviour of above section

          <section className="mv-w-full mv-flex mv-flex-col mv-gap-8 @sm:mv-px-2 @md:mv-px-4 @lg:mv-px-8 @sm:mv-py-2 @md:mv-py-4 @lg:mv-py-6 @sm:mv-gap-4 @sm:mv-bg-white @sm:mv-rounded-2xl @sm:mv-border @sm:mv-border-neutral-200">
            <TabBar>
              {Object.entries(organizations).map(([key, value]) => {
                return (
                  <TabBar.Item
                    key={`${key}-organizations-tab`}
                    active={value.active}
                    disabled={value.organizations.length === 0}
                  >
                    <Link
                      to={`?${value.searchParams.toString()}`}
                      onClick={(event) => {
                        event.preventDefault();
                        setActiveOrganizationsTab(key);
                        return;
                      }}
                      preventScrollReset
                    >
                      <div className="mv-flex mv-gap-1.5 mv-items-center">
                        <span>{t(`organizations.tabbar.${key}`)}</span>
                        <TabBar.Counter active={value.active}>
                          {value.organizations.length}
                        </TabBar.Counter>
                      </div>
                    </Link>
                  </TabBar.Item>
                );
              })}
            </TabBar>
            {/* TODO: 
              Ask design if this is intentional: mv-hidden @sm:mv-block
              Its not the bahaviour of above section
             */}
            <p className="mv-hidden @sm:mv-block">
              {activeOrganizationsTab === "teamMember"
                ? t("organizations.subline.teamMember")
                : t("organizations.subline.admin")}
            </p>
            <div className="-mv-mx-4">
              {Object.entries(organizations).map(([key, value]) => {
                return value.active && value.organizations.length > 0 ? (
                  <CardContainer key={`${key}-organizations`} type="multi row">
                    {value.organizations.map((organization) => {
                      return (
                        <OrganizationCard
                          key={`${key}-organization-${organization.id}`}
                          organization={organization}
                        />
                      );
                    })}
                  </CardContainer>
                ) : null;
              })}
            </div>
          </section>
        ) : null}
      </div>
    </div>
  );
}
