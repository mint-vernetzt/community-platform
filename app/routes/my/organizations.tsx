import { parseWithZod } from "@conform-to/zod-v1";
import {
  Button,
  CardContainer,
  OrganizationCard,
  TabBar,
} from "@mint-vernetzt/components";
import {
  json,
  redirect,
  type ActionFunctionArgs,
  type LoaderFunctionArgs,
} from "@remix-run/node";
import {
  Link,
  useFetcher,
  useLoaderData,
  useSearchParams,
} from "@remix-run/react";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import {
  createAuthClient,
  getSessionUserOrRedirectPathToLogin,
} from "~/auth.server";
import i18next from "~/i18next.server";
import { mailerOptions } from "~/lib/submissions/mailer/mailerOptions";
import { invariantResponse } from "~/lib/utils/response";
import { extendSearchParams } from "~/lib/utils/searchParams";
import { getCompiledMailTemplate, mailer } from "~/mailer.server";
import { detectLanguage } from "~/root.server";
import { redirectWithToast } from "~/toast.server";
import {
  AcceptOrRejectInviteFetcher,
  AcceptOrRejectRequestFetcher,
  AddOrganization,
  CancelRequestFetcher,
  ListContainer,
  ListItem,
  Section,
} from "./__components";
import {
  addImageUrlToInvites,
  addImageUrlToOrganizations,
  addImageUrlToRequests,
  flattenOrganizationRelations,
  getAdminOrganizationsWithPendingRequests,
  getOrganizationInvitesForProfile,
  getOrganizationsFromProfile,
  getPendingOrganizationInvite,
  updateOrganizationInvite,
} from "./organizations.server";
import { getOrganizationsToAdd } from "./organizations/get-organizations-to-add.server";
import { type action as quitAction } from "./organizations/quit";
import {
  AddToOrganizationRequest,
  type action as requestsAction,
} from "./organizations/requests";
import { getPendingRequestsToOrganizations } from "./organizations/requests.server";

export const i18nNS = [
  "routes/my/organizations",
  "datasets/organizationTypes",
  "datasets/focuses",
];
export const handle = {
  i18n: i18nNS,
};

export const loader = async (args: LoaderFunctionArgs) => {
  const { request } = args;
  const { authClient } = createAuthClient(request);

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

  const pendingRequestsToOrganizations =
    await getPendingRequestsToOrganizations(sessionUser.id, authClient);
  const organizationsToAdd = await getOrganizationsToAdd(request, sessionUser);

  const adminOrganizationsWithPendingRequests =
    await getAdminOrganizationsWithPendingRequests(sessionUser.id);
  const enhancedAdminOrganizationsWithPendingRequests = addImageUrlToRequests(
    authClient,
    adminOrganizationsWithPendingRequests
  );

  return json({
    organizations: flattenedOrganizations,
    invites: enhancedInvites,
    organizationsToAdd,
    pendingRequestsToOrganizations,
    adminOrganizationsWithPendingRequests:
      enhancedAdminOrganizationsWithPendingRequests,
  });
};

const inviteSchema = z.object({
  intent: z
    .string()
    .refine((intent) => intent === "accepted" || intent === "rejected", {
      message: "Only accepted and rejected are valid intents.",
    }),
  organizationId: z.string().uuid(),
  role: z.string().refine((role) => role === "admin" || role === "member", {
    message: "Only admin and member are valid roles.",
  }),
});

export const action = async (args: ActionFunctionArgs) => {
  const { request } = args;

  const locale = detectLanguage(request);
  const t = await i18next.getFixedT(locale, i18nNS);

  const { authClient } = createAuthClient(request);

  const { sessionUser, redirectPath } =
    await getSessionUserOrRedirectPathToLogin(authClient, request);
  if (sessionUser === null && redirectPath !== null) {
    return redirect(redirectPath);
  }

  const formData = await request.formData();
  const submission = parseWithZod(formData, { schema: inviteSchema });
  if (submission.status !== "success") {
    return json(submission.reply());
  }

  const pendingInvite = await getPendingOrganizationInvite(
    submission.value.organizationId,
    sessionUser.id,
    submission.value.role
  );
  invariantResponse(pendingInvite !== null, "Pending invite not found.", {
    status: 404,
  });

  const invite = await updateOrganizationInvite({
    profileId: sessionUser.id,
    ...submission.value,
  });

  const sender = process.env.SYSTEM_MAIL_SENDER;
  await Promise.all(
    invite.organization.admins.map(async (admin) => {
      let textTemplatePath:
        | "mail-templates/invites/profile-to-join-organization/accepted-text.hbs"
        | "mail-templates/invites/profile-to-join-organization/rejected-text.hbs"
        | "mail-templates/invites/profile-to-join-organization/as-admin-accepted-text.hbs"
        | "mail-templates/invites/profile-to-join-organization/as-admin-rejected-text.hbs";
      let htmlTemplatePath:
        | "mail-templates/invites/profile-to-join-organization/accepted-html.hbs"
        | "mail-templates/invites/profile-to-join-organization/rejected-html.hbs"
        | "mail-templates/invites/profile-to-join-organization/as-admin-accepted-html.hbs"
        | "mail-templates/invites/profile-to-join-organization/as-admin-rejected-html.hbs";

      let subject: string;

      if (submission.value.intent === "accepted") {
        textTemplatePath =
          submission.value.role === "admin"
            ? "mail-templates/invites/profile-to-join-organization/as-admin-accepted-text.hbs"
            : "mail-templates/invites/profile-to-join-organization/accepted-text.hbs";
        htmlTemplatePath =
          submission.value.role === "admin"
            ? "mail-templates/invites/profile-to-join-organization/as-admin-accepted-html.hbs"
            : "mail-templates/invites/profile-to-join-organization/accepted-html.hbs";
        subject =
          submission.value.role === "admin"
            ? t("email.inviteAsAdminAccepted.subject")
            : t("email.inviteAccepted.subject");
      } else {
        textTemplatePath =
          submission.value.role === "admin"
            ? "mail-templates/invites/profile-to-join-organization/as-admin-rejected-text.hbs"
            : "mail-templates/invites/profile-to-join-organization/rejected-text.hbs";
        htmlTemplatePath =
          submission.value.role === "admin"
            ? "mail-templates/invites/profile-to-join-organization/as-admin-rejected-html.hbs"
            : "mail-templates/invites/profile-to-join-organization/rejected-html.hbs";
        subject =
          submission.value.role === "admin"
            ? t("email.inviteAsAdminRejected.subject")
            : t("email.inviteRejected.subject");
      }

      const content = {
        firstName: admin.profile.firstName,
        organization: {
          name: invite.organization.name,
        },
        profile: {
          firstName: invite.profile.firstName,
          lastName: invite.profile.lastName,
        },
      };

      const text = getCompiledMailTemplate<typeof textTemplatePath>(
        textTemplatePath,
        content,
        "text"
      );
      const html = getCompiledMailTemplate<typeof htmlTemplatePath>(
        htmlTemplatePath,
        content,
        "html"
      );

      await mailer(
        mailerOptions,
        sender,
        admin.profile.email,
        subject,
        text,
        html
      );
    })
  );

  return redirectWithToast("/my/organizations", {
    key: `${submission.value.intent}-${Date.now()}`,
    level: submission.value.intent === "accepted" ? "positive" : "negative",
    message: `${t(`alerts.${submission.value.intent}`, {
      organization: invite.organization.name,
    })}`,
  });
};

export default function MyOrganizations() {
  const loaderData = useLoaderData<typeof loader>();
  const { t } = useTranslation(i18nNS);
  const [searchParams] = useSearchParams();

  // SearchParams as fallback when javascript is disabled (See <Links> in <TabBar>)
  const [activeOrganizationsTab, setActiveOrganizationsTab] = useState(
    searchParams.get("organizations-tab") !== null &&
      searchParams.get("organizations-tab") !== ""
      ? searchParams.get("organizations-tab")
      : loaderData.organizations.adminOrganizations.length > 0
      ? "admin"
      : "teamMember"
  );
  const organizations = {
    admin: {
      organizations: loaderData.organizations.adminOrganizations,
      active: activeOrganizationsTab === "admin",
      searchParams: extendSearchParams(searchParams, {
        addOrReplace: { "organizations-tab": "admin" },
      }),
    },
    teamMember: {
      organizations: loaderData.organizations.teamMemberOrganizations,
      active: activeOrganizationsTab === "teamMember",
      searchParams: extendSearchParams(searchParams, {
        addOrReplace: { "organizations-tab": "teamMember" },
      }),
    },
  };

  const [activeRequestsTab, setActiveRequestsTab] = useState(
    searchParams.get("requests-tab") !== null &&
      searchParams.get("requests-tab") !== ""
      ? searchParams.get("requests-tab")
      : loaderData.adminOrganizationsWithPendingRequests.find(
          (organization) => {
            return organization.profileJoinRequests.length > 0;
          }
        )?.name
  );
  let requestsCount = 0;
  const requests = loaderData.adminOrganizationsWithPendingRequests.map(
    (organization) => {
      requestsCount += organization.profileJoinRequests.length;
      return {
        organization: organization,
        active: activeRequestsTab === organization.name,
        searchParams: extendSearchParams(searchParams, {
          addOrReplace: { "requests-tab": organization.name },
        }),
      };
    }
  );

  const [activeInvitesTab, setActiveInvitesTab] = useState(
    searchParams.get("invites-tab") !== null &&
      searchParams.get("invites-tab") !== ""
      ? searchParams.get("invites-tab")
      : loaderData.invites.adminInvites.length > 0
      ? "admin"
      : "teamMember"
  );
  const invites = {
    admin: {
      invites: loaderData.invites.adminInvites,
      active: activeInvitesTab === "admin",
      searchParams: extendSearchParams(searchParams, {
        addOrReplace: { "invites-tab": "admin" },
      }),
    },
    teamMember: {
      invites: loaderData.invites.teamMemberInvites,
      active: activeInvitesTab === "teamMember",
      searchParams: extendSearchParams(searchParams, {
        addOrReplace: { "invites-tab": "teamMember" },
      }),
    },
  };

  // Effect to update the active tab after the optimistic ui has been applied
  React.useEffect(() => {
    if (loaderData.invites.adminInvites.length > 0) {
      setActiveInvitesTab("admin");
    } else {
      setActiveInvitesTab("teamMember");
    }
  }, [loaderData.invites.adminInvites, loaderData.invites.teamMemberInvites]);

  React.useEffect(() => {
    if (loaderData.adminOrganizationsWithPendingRequests.length > 0) {
      setActiveRequestsTab(
        loaderData.adminOrganizationsWithPendingRequests.find(
          (organization) => {
            return organization.profileJoinRequests.length > 0;
          }
        )?.name
      );
    }
  }, [loaderData.adminOrganizationsWithPendingRequests]);

  // Optimistic UI when accepting or rejecting invites
  const inviteFetcher = useFetcher<typeof action>();
  const inviteIntent = inviteFetcher.formData?.get("intent");
  if (
    inviteFetcher.formData !== undefined &&
    (inviteIntent === "accepted" || inviteIntent === "rejected")
  ) {
    const organizationId = inviteFetcher.formData.get("organizationId");
    if (inviteFetcher.formData.get("role") === "admin") {
      loaderData.invites.adminInvites = loaderData.invites.adminInvites.filter(
        (invite) => {
          return invite.organizationId !== organizationId;
        }
      );
    }
    if (inviteFetcher.formData.get("role") === "member") {
      loaderData.invites.teamMemberInvites =
        loaderData.invites.teamMemberInvites.filter((invite) => {
          return invite.organizationId !== organizationId;
        });
    }
  }

  // Optimistic UI when accepting or rejecting requests
  const acceptOrRejectRequestFetcher = useFetcher<typeof requestsAction>();
  const acceptOrRejectRequest =
    acceptOrRejectRequestFetcher.formData?.get("intent");
  if (
    acceptOrRejectRequestFetcher.formData !== undefined &&
    (acceptOrRejectRequest === AddToOrganizationRequest.Accept ||
      acceptOrRejectRequest === AddToOrganizationRequest.Reject)
  ) {
    const organizationId =
      acceptOrRejectRequestFetcher.formData.get("organizationId");
    const profileId = acceptOrRejectRequestFetcher.formData.get("profileId");
    loaderData.adminOrganizationsWithPendingRequests =
      loaderData.adminOrganizationsWithPendingRequests.map((organization) => {
        if (organization.id !== organizationId) {
          return organization;
        }
        return {
          ...organization,
          profileJoinRequests: organization.profileJoinRequests.filter(
            (request) => {
              return request.profile.id !== profileId;
            }
          ),
        };
      });
  }

  // Optimistic UI when canceling requests
  const cancelRequestFetcher = useFetcher<typeof requestsAction>();
  if (
    cancelRequestFetcher.formData !== undefined &&
    cancelRequestFetcher.formData.get("organizationId") !== null
  ) {
    const organizationId = cancelRequestFetcher.formData.get("organizationId");
    if (organizationId !== null) {
      loaderData.pendingRequestsToOrganizations =
        loaderData.pendingRequestsToOrganizations.filter((organization) => {
          return organization.id !== organizationId;
        });
    }
  }

  // Optimistic UI when creating requests
  const createRequestFetcher = useFetcher<typeof requestsAction>();
  if (
    createRequestFetcher.formData !== undefined &&
    createRequestFetcher.formData.get("organizationId") !== null
  ) {
    const organizationId = createRequestFetcher.formData.get("organizationId");
    if (organizationId !== null && loaderData.organizationsToAdd !== null) {
      const organizationToTransfer = loaderData.organizationsToAdd.find(
        (organization) => {
          return organization.id === organizationId;
        }
      );
      loaderData.organizationsToAdd = loaderData.organizationsToAdd.filter(
        (organization) => {
          return organization.id !== organizationId;
        }
      );
      if (organizationToTransfer !== undefined) {
        loaderData.pendingRequestsToOrganizations.push(organizationToTransfer);
      }
    }
  }

  // Optimistic UI when quiting organizations
  const quitOrganizationFetcher = useFetcher<typeof quitAction>();
  if (
    quitOrganizationFetcher.formData !== undefined &&
    quitOrganizationFetcher.formData.get("slug") !== null
  ) {
    const slug = quitOrganizationFetcher.formData.get("slug");
    if (slug !== null) {
      loaderData.organizations.teamMemberOrganizations =
        loaderData.organizations.teamMemberOrganizations.filter(
          (organization) => {
            return organization.slug !== slug;
          }
        );
      loaderData.organizations.adminOrganizations =
        loaderData.organizations.adminOrganizations.filter((organization) => {
          return organization.slug !== slug;
        });
    }
  }

  return (
    <>
      <div className="mv-w-full mv-h-full mv-flex mv-justify-center">
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
            <section className="mv-py-6 mv-px-4 @lg:mv-px-6 mv-flex mv-flex-col mv-gap-4 mv-border mv-border-neutral-200 mv-bg-white mv-rounded-2xl">
              <div className="mv-flex mv-flex-col mv-gap-2">
                <h2
                  id="invites-headline"
                  className="mv-text-2xl mv-font-bold mv-text-primary mv-leading-[26px] mv-mb-0"
                >
                  {t("invites.headline")}
                </h2>
                <p
                  id="invites-subline"
                  className="mv-text-sm mv-text-neutral-700"
                >
                  {t("invites.subline")}
                </p>
              </div>
              <TabBar>
                {Object.entries(invites).map(([key, value]) => {
                  return value.invites.length > 0 ? (
                    <TabBar.Item
                      key={`${key}-invites-tab`}
                      active={value.active}
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
                        <div
                          id={`tab-description-${key}`}
                          className="mv-flex mv-gap-1.5 mv-items-center"
                        >
                          <span>{t(`invites.tabbar.${key}`)}</span>
                          <TabBar.Counter active={value.active}>
                            {value.invites.length}
                          </TabBar.Counter>
                        </div>
                      </Link>
                    </TabBar.Item>
                  ) : null;
                })}
              </TabBar>

              {Object.entries(invites).map(([key, value]) => {
                return value.active && value.invites.length > 0 ? (
                  <ListContainer key={key} listKey={`${key}-list`}>
                    {value.invites.map((invite, index) => {
                      return (
                        <ListItem
                          key={`${key}-invite-${invite.organizationId}`}
                          listIndex={index}
                          entity={invite.organization}
                          hideAfter={3}
                        >
                          <AcceptOrRejectInviteFetcher
                            inviteFetcher={inviteFetcher}
                            organizationId={invite.organizationId}
                            tabKey={key}
                          />
                        </ListItem>
                      );
                    })}
                  </ListContainer>
                ) : null;
              })}
            </section>
          ) : null}
          {requests.length > 0 ? (
            <section className="mv-py-6 mv-px-4 @lg:mv-px-6 mv-flex mv-flex-col mv-gap-4 mv-border mv-border-neutral-200 mv-bg-white mv-rounded-2xl">
              <div className="mv-flex mv-flex-col mv-gap-2">
                <h2
                  id="requests-headline"
                  className="mv-text-2xl mv-font-bold mv-text-primary mv-leading-[26px] mv-mb-0"
                >
                  {t("requests.headline")}
                </h2>
                <p
                  id="requests-subline"
                  className="mv-text-sm mv-text-neutral-700"
                >
                  {requestsCount === 1
                    ? t("requests.singleCountSubline")
                    : t("requests.subline", { count: requestsCount })}
                </p>
              </div>
              <TabBar>
                {Object.entries(requests).map(([key, value]) => {
                  return value.organization.profileJoinRequests.length > 0 ? (
                    <TabBar.Item
                      key={`${key}-requests-tab`}
                      active={value.active}
                    >
                      <Link
                        to={`?${value.searchParams.toString()}`}
                        onClick={(event) => {
                          event.preventDefault();
                          setActiveRequestsTab(value.organization.name);
                          return;
                        }}
                        preventScrollReset
                      >
                        <div
                          id={`tab-description-${key}`}
                          className="mv-flex mv-gap-1.5 mv-items-center"
                        >
                          <span>{value.organization.name}</span>
                          <TabBar.Counter active={value.active}>
                            {value.organization.profileJoinRequests.length}
                          </TabBar.Counter>
                        </div>
                      </Link>
                    </TabBar.Item>
                  ) : null;
                })}
              </TabBar>

              {Object.entries(requests).map(([key, value]) => {
                return value.active &&
                  value.organization.profileJoinRequests.length > 0 ? (
                  <ListContainer
                    key={key}
                    listKey={`${key}-list`}
                    hideAfter={3}
                  >
                    {value.organization.profileJoinRequests.map(
                      (request, index) => {
                        return (
                          <ListItem
                            key={`${key}-request-${request.profile.id}`}
                            listIndex={index}
                            entity={request.profile}
                            hideAfter={3}
                          >
                            <AcceptOrRejectRequestFetcher
                              fetcher={acceptOrRejectRequestFetcher}
                              organizationId={value.organization.id}
                              profileId={request.profile.id}
                              tabKey={key}
                            />
                          </ListItem>
                        );
                      }
                    )}
                  </ListContainer>
                ) : null;
              })}
            </section>
          ) : null}

          <Section>
            <Section.Headline>{t("addOrganization.headline")}</Section.Headline>
            <Section.Subline>{t("addOrganization.subline")}</Section.Subline>
            <AddOrganization
              organizations={loaderData.organizationsToAdd}
              memberOrganizations={loaderData.organizations}
              pendingRequestsToOrganizations={
                loaderData.pendingRequestsToOrganizations
              }
              invites={loaderData.invites}
              createRequestFetcher={createRequestFetcher}
            />
            {loaderData.pendingRequestsToOrganizations.length > 0 ? (
              <>
                <hr />
                <h4 className="mv-mb-0 mv-text-primary mv-font-semibold mv-text-base @md:mv-text-lg">
                  {t("requests.headline")}
                </h4>
                <ListContainer
                  listKey="pending-requests-to-organizations"
                  hideAfter={3}
                >
                  {loaderData.pendingRequestsToOrganizations.map(
                    (organization, index) => {
                      return (
                        <ListItem
                          key={`cancel-request-from-${organization.id}`}
                          listIndex={index}
                          entity={organization}
                          hideAfter={3}
                        >
                          <CancelRequestFetcher
                            fetcher={cancelRequestFetcher}
                            organizationId={organization.id}
                          />
                        </ListItem>
                      );
                    }
                  )}
                </ListContainer>
              </>
            ) : null}
          </Section>
          {organizations.teamMember.organizations.length > 0 ||
          organizations.admin.organizations.length > 0 ? (
            <Section>
              <TabBar>
                {Object.entries(organizations).map(([key, value]) => {
                  return value.organizations.length > 0 ? (
                    <TabBar.Item
                      key={`${key}-organizations-tab`}
                      active={value.active}
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
                  ) : null;
                })}
              </TabBar>
              <div className="-mv-mx-4">
                {Object.entries(organizations).map(([key, value]) => {
                  return value.active && value.organizations.length > 0 ? (
                    <CardContainer
                      key={`${key}-organizations`}
                      type="multi row"
                    >
                      {value.organizations.map((organization) => {
                        return (
                          <OrganizationCard
                            key={`${key}-organization-${organization.id}`}
                            organization={organization}
                            menu={{
                              mode: key === "admin" ? "admin" : "teamMember",
                              quitOrganizationFetcher: quitOrganizationFetcher,
                            }}
                          />
                        );
                      })}
                    </CardContainer>
                  ) : null;
                })}
              </div>
            </Section>
          ) : null}
        </div>
      </div>
    </>
  );
}
