import { useForm } from "@conform-to/react-v1";
import { Button } from "@mint-vernetzt/components/src/molecules/Button";
import { OrganizationCard } from "@mint-vernetzt/components/src/organisms/cards/OrganizationCard";
import { CardContainer } from "@mint-vernetzt/components/src/organisms/containers/CardContainer";
import { TabBar } from "@mint-vernetzt/components/src/organisms/TabBar";
import { useState } from "react";
import {
  Link,
  redirect,
  useActionData,
  useLoaderData,
  useNavigation,
  useSearchParams,
  type ActionFunctionArgs,
  type LoaderFunctionArgs,
} from "react-router";
import {
  createAuthClient,
  getSessionUserOrRedirectPathToLogin,
} from "~/auth.server";
import { Icon } from "~/components-next/icons/Icon";
import { ListContainer } from "~/components-next/ListContainer";
import { ListItem } from "~/components-next/ListItem";
import { Section } from "~/components-next/MyOrganizationsSection";
import { detectLanguage } from "~/i18n.server";
import { insertComponentsIntoLocale } from "~/lib/utils/i18n";
import { invariantResponse } from "~/lib/utils/response";
import { extendSearchParams } from "~/lib/utils/searchParams";
import { languageModuleMap } from "~/locales/.server";
import { redirectWithToast } from "~/toast.server";
import {
  acceptOrRejectOrganizationMemberRequest,
  addImageUrlToNetworkInvites,
  addImageUrlToNetworkRequests,
  addImageUrlToOrganizationMemberInvites,
  addImageUrlToOrganizationMemberRequests,
  addImageUrlToOrganizations,
  createOrCancelOrganizationMemberRequest,
  flattenOrganizationRelations,
  getNetworkInvites,
  getNetworkRequests,
  getOrganizationMemberInvites,
  getOrganizationMemberRequests,
  getOrganizationsFromProfile,
  quitOrganization,
  updateNetworkInvite,
  updateNetworkRequest,
  updateOrganizationMemberInvite,
} from "./organizations.server";
import { getOrganizationsToAdd } from "./organizations/get-organizations-to-add.server";
import { getPendingRequestsToOrganizations } from "./organizations/requests.server";
import { z } from "zod";

export const loader = async (args: LoaderFunctionArgs) => {
  const { request } = args;
  const { authClient } = createAuthClient(request);

  const { sessionUser, redirectPath } =
    await getSessionUserOrRedirectPathToLogin(authClient, request);
  if (sessionUser === null && redirectPath !== null) {
    return redirect(redirectPath);
  }

  const language = await detectLanguage(request);
  const locales = languageModuleMap[language]["my/organizations"];

  const organizations = await getOrganizationsFromProfile(sessionUser.id);
  const enhancedOrganizations = addImageUrlToOrganizations(
    authClient,
    organizations
  );
  const flattenedOrganizations = flattenOrganizationRelations(
    enhancedOrganizations
  );

  const organizationMemberInvites = await getOrganizationMemberInvites(
    sessionUser.id
  );
  const enhancedOrganizationMemberInvites =
    addImageUrlToOrganizationMemberInvites(
      authClient,
      organizationMemberInvites
    );

  const pendingRequestsToOrganizations =
    await getPendingRequestsToOrganizations(sessionUser.id, authClient);
  const organizationsToAdd = await getOrganizationsToAdd(request, sessionUser);

  const organizationMemberRequests = await getOrganizationMemberRequests(
    sessionUser.id
  );
  const enhancedOrganizationMemberRequests =
    addImageUrlToOrganizationMemberRequests(
      authClient,
      organizationMemberRequests
    );

  const networkInvites = await getNetworkInvites(sessionUser.id);
  const enhancedNetworkInvites = addImageUrlToNetworkInvites(
    authClient,
    networkInvites
  );

  const networkRequests = await getNetworkRequests(sessionUser.id);
  const enhancedNetworkRequests = addImageUrlToNetworkRequests(
    authClient,
    networkRequests
  );

  const currentTimestamp = Date.now();

  return {
    organizationsToAdd,
    pendingRequestsToOrganizations,
    organizationMemberInvites: enhancedOrganizationMemberInvites,
    networkInvites: enhancedNetworkInvites,
    organizationMemberRequests: enhancedOrganizationMemberRequests,
    networkRequests: enhancedNetworkRequests,
    organizations: flattenedOrganizations,
    locales,
    currentTimestamp,
  };
};

export const createOrCancelOrganizationMemberRequestSchema = z.object({
  organizationId: z.string(),
});

export const updateOrganizationMemberInviteSchema = z.object({
  inviteId: z.string(),
});

export const updateNetworkInviteSchema = z.object({
  inviteId: z.string(),
});

export const acceptOrRejectOrganizationMemberRequestSchema = z.object({
  requestId: z.string(),
});

export const updateNetworkRequestSchema = z.object({
  requestId: z.string(),
});

export const quitOrganizationSchema = z.object({
  organizationId: z.string(),
});

export const action = async (args: ActionFunctionArgs) => {
  const { request } = args;

  const language = await detectLanguage(request);
  const locales = languageModuleMap[language]["my/organizations"];

  const { authClient } = createAuthClient(request);

  const { sessionUser, redirectPath } =
    await getSessionUserOrRedirectPathToLogin(authClient, request);
  if (sessionUser === null && redirectPath !== null) {
    return redirect(redirectPath);
  }

  let result;
  const formData = await request.formData();
  const intent = formData.get("intent");
  invariantResponse(typeof intent === "string", "Intent is not a string.", {
    status: 400,
  });

  if (intent.startsWith("create-organization-member-request-")) {
    const requestToJoinOrganizationFormData = new FormData();
    requestToJoinOrganizationFormData.set(
      "organizationId",
      intent.replace("create-organization-member-request-", "")
    );
    result = await createOrCancelOrganizationMemberRequest({
      formData: requestToJoinOrganizationFormData,
      intent: "createOrganizationMemberRequest",
      locales,
      sessionUser,
    });
  } else if (intent.startsWith("cancel-organization-member-request-")) {
    const cancelOrganizationJoinRequestFormData = new FormData();
    cancelOrganizationJoinRequestFormData.set(
      "organizationId",
      intent.replace("cancel-organization-member-request-", "")
    );
    result = await createOrCancelOrganizationMemberRequest({
      formData: cancelOrganizationJoinRequestFormData,
      intent: "cancelOrganizationMemberRequest",
      locales,
      sessionUser,
    });
  } else if (intent.startsWith("accept-organization-member-invite-")) {
    const acceptOrganizationMemberInviteFormData = new FormData();
    acceptOrganizationMemberInviteFormData.set(
      "organizationId",
      intent.replace("accept-organization-member-invite-", "")
    );
    result = await updateOrganizationMemberInvite({
      formData: acceptOrganizationMemberInviteFormData,
      intent: "acceptOrganizationMemberInvite",
      locales,
      sessionUser,
    });
  } else if (intent.startsWith("reject-organization-member-invite-")) {
    const rejectOrganizationMemberInviteFormData = new FormData();
    rejectOrganizationMemberInviteFormData.set(
      "organizationId",
      intent.replace("reject-organization-member-invite-", "")
    );
    result = await updateOrganizationMemberInvite({
      formData: rejectOrganizationMemberInviteFormData,
      intent: "rejectOrganizationMemberInvite",
      locales,
      sessionUser,
    });
  } else if (intent.startsWith("accept-network-invite-")) {
    const acceptNetworkInviteFormData = new FormData();
    acceptNetworkInviteFormData.set(
      "organizationId",
      intent.replace("accept-network-invite-", "")
    );
    result = await updateNetworkInvite({
      formData: acceptNetworkInviteFormData,
      intent: "acceptNetworkInvite",
      locales,
      sessionUser,
    });
  } else if (intent.startsWith("reject-network-invite-")) {
    const rejectNetworkInviteFormData = new FormData();
    rejectNetworkInviteFormData.set(
      "organizationId",
      intent.replace("reject-network-invite-", "")
    );
    result = await updateNetworkInvite({
      formData: rejectNetworkInviteFormData,
      intent: "rejectNetworkInvite",
      locales,
      sessionUser,
    });
  } else if (intent.startsWith("accept-organization-member-request-")) {
    const acceptOrganizationMemberRequestFormData = new FormData();
    acceptOrganizationMemberRequestFormData.set(
      "organizationId",
      intent.replace("accept-organization-member-request-", "")
    );
    result = await acceptOrRejectOrganizationMemberRequest({
      formData: acceptOrganizationMemberRequestFormData,
      intent: "acceptOrganizationMemberRequest",
      locales,
      sessionUser,
    });
  } else if (intent.startsWith("reject-organization-member-request-")) {
    const rejectOrganizationMemberRequestFormData = new FormData();
    rejectOrganizationMemberRequestFormData.set(
      "organizationId",
      intent.replace("reject-organization-member-request-", "")
    );
    result = await acceptOrRejectOrganizationMemberRequest({
      formData: rejectOrganizationMemberRequestFormData,
      intent: "rejectOrganizationMemberRequest",
      locales,
      sessionUser,
    });
  } else if (intent.startsWith("accept-network-request-")) {
    const acceptNetworkRequestFormData = new FormData();
    acceptNetworkRequestFormData.set(
      "organizationId",
      intent.replace("accept-network-request-", "")
    );
    result = await updateNetworkRequest({
      formData: acceptNetworkRequestFormData,
      intent: "acceptNetworkRequest",
      locales,
      sessionUser,
    });
  } else if (intent.startsWith("reject-network-request-")) {
    const rejectNetworkRequestFormData = new FormData();
    rejectNetworkRequestFormData.set(
      "organizationId",
      intent.replace("reject-network-request-", "")
    );
    result = await updateNetworkRequest({
      formData: rejectNetworkRequestFormData,
      intent: "rejectNetworkRequest",
      locales,
      sessionUser,
    });
  } else if (intent.startsWith("quit-organization-")) {
    const quitOrganizationFormData = new FormData();
    quitOrganizationFormData.set(
      "organizationId",
      intent.replace("quit-organization-", "")
    );
    result = await quitOrganization({
      formData: quitOrganizationFormData,
      locales,
      sessionUser,
    });
  } else {
    invariantResponse(false, "Invalid intent", {
      status: 400,
    });
  }

  if (
    result.submission !== undefined &&
    result.submission.status === "success" &&
    result.toast !== undefined
  ) {
    const url = new URL(request.url);
    const searchParams = url.searchParams;
    if (searchParams.get("modal-quit-organization") === "true") {
      searchParams.delete("modal-quit-organization");
    }
    const redirectUrl = `${process.env.COMMUNITY_BASE_URL}${
      url.pathname
    }?${searchParams.toString()}`;
    return redirectWithToast(redirectUrl, result.toast);
  }
  return { submission: result.submission, currentTimestamp: Date.now() };
};

export default function MyOrganizations() {
  const {
    organizationsToAdd,
    pendingRequestsToOrganizations,
    organizationMemberInvites: organizationMemberInvitesFromLoader,
    networkInvites: networkInvitesFromLoader,
    organizationMemberRequests: organizationMemberRequestsFromLoader,
    networkRequests: networkRequestsFromLoader,
    organizations: organizationsFromLoader,
    locales,
    currentTimestamp,
  } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const [searchParams] = useSearchParams();
  const navigation = useNavigation();

  // JS for request to add yourself to an organization section
  // TODO: Refactor to use conform and this routes action
  const [createOrganizationMemberRequesteForm] = useForm({
    id: `create-organization-member-request-${
      actionData?.currentTimestamp || currentTimestamp
    }`,
    lastResult: navigation.state === "idle" ? actionData?.submission : null,
  });
  // TODO: Refactor to use conform and this routes action
  const [cancelOrganizationMemberRequesteForm] = useForm({
    id: `cancel-organization-member-request-${
      actionData?.currentTimestamp || currentTimestamp
    }`,
    lastResult: navigation.state === "idle" ? actionData?.submission : null,
  });

  // JS for incoming organization member invites section
  // TODO: Refactor to use conform and this routes action
  const [acceptOrRejectOrganizationMemberInviteForm] = useForm({
    id: `accept-or-reject-organization-member-invite-${
      actionData?.currentTimestamp || currentTimestamp
    }`,
    lastResult: navigation.state === "idle" ? actionData?.submission : null,
  });
  const [
    activeOrganizationMemberInvitesTab,
    setActiveOrganizationMemberInvitesTab,
  ] = useState(
    searchParams.get("organization-member-invites-tab") !== null &&
      searchParams.get("organization-member-invites-tab") !== ""
      ? searchParams.get("organization-member-invites-tab")
      : organizationMemberInvitesFromLoader.adminInvites.length > 0
      ? "admin"
      : "teamMember"
  );
  const organizationMemberInvites = {
    admin: {
      invites: organizationMemberInvitesFromLoader.adminInvites,
      active: activeOrganizationMemberInvitesTab === "admin",
      searchParams: extendSearchParams(searchParams, {
        addOrReplace: { "organization-member-invites-tab": "admin" },
      }),
    },
    teamMember: {
      invites: organizationMemberInvitesFromLoader.teamMemberInvites,
      active: activeOrganizationMemberInvitesTab === "teamMember",
      searchParams: extendSearchParams(searchParams, {
        addOrReplace: { "organization-member-invites-tab": "teamMember" },
      }),
    },
  };

  // JS for incoming network invites section
  const [acceptOrRejectNetworkInviteForm] = useForm({
    id: `accept-or-reject-network-invite-${
      actionData?.currentTimestamp || currentTimestamp
    }`,
    lastResult: navigation.state === "idle" ? actionData?.submission : null,
  });
  const [activeNetworkInvitesTab, setActiveNetworkInvitesTab] = useState(
    searchParams.get("network-invites-tab") !== null &&
      searchParams.get("network-invites-tab") !== ""
      ? searchParams.get("network-invites-tab")
      : networkInvitesFromLoader.find((organization) => {
          return organization.receivedNetworkJoinInvites.length > 0;
        })?.name
  );
  const networkInvites = networkInvitesFromLoader.map((organization) => {
    return {
      organization: organization,
      active: activeNetworkInvitesTab === organization.name,
      searchParams: extendSearchParams(searchParams, {
        addOrReplace: { "network-invites-tab": organization.name },
      }),
    };
  });

  // JS for incoming organization member requests section
  // TODO: Refactor to use conform and this routes action
  const [acceptOrRejectOrganizationMemberRequestForm] = useForm({
    id: `accept-or-reject-organization-member-request-${
      actionData?.currentTimestamp || currentTimestamp
    }`,
    lastResult: navigation.state === "idle" ? actionData?.submission : null,
  });
  const [
    activeOrganizationMemberRequestsTab,
    setActiveOrganizationMemberRequestsTab,
  ] = useState(
    searchParams.get("organization-member-requests-tab") !== null &&
      searchParams.get("organization-member-requests-tab") !== ""
      ? searchParams.get("organization-member-requests-tab")
      : organizationMemberRequestsFromLoader.find((organization) => {
          return organization.profileJoinRequests.length > 0;
        })?.name
  );
  const organizationMemberRequests = organizationMemberRequestsFromLoader.map(
    (organization) => {
      return {
        organization: organization,
        active: activeOrganizationMemberRequestsTab === organization.name,
        searchParams: extendSearchParams(searchParams, {
          addOrReplace: {
            "organization-member-requests-tab": organization.name,
          },
        }),
      };
    }
  );

  // JS for incoming network requests section
  // TODO: conform form for accepting and rejecting network requests
  const [acceptOrRejectNetworkRequestForm] = useForm({
    id: `accept-or-reject-network-request-${
      actionData?.currentTimestamp || currentTimestamp
    }`,
    lastResult: navigation.state === "idle" ? actionData?.submission : null,
  });
  const [activeNetworkRequestsTab, setActiveNetworkRequestsTab] = useState(
    searchParams.get("network-requests-tab") !== null &&
      searchParams.get("network-requests-tab") !== ""
      ? searchParams.get("network-requests-tab")
      : networkRequestsFromLoader.find((organization) => {
          return organization.receivedNetworkJoinRequests.length > 0;
        })?.name
  );
  const networkRequests = networkRequestsFromLoader.map((organization) => {
    return {
      organization: organization,
      active: activeNetworkRequestsTab === organization.name,
      searchParams: extendSearchParams(searchParams, {
        addOrReplace: { "network-requests-tab": organization.name },
      }),
    };
  });

  // JS for own organizations section
  // TODO: Refactor to use conform and this routes action
  const [quitOrganizationForm] = useForm({
    id: `quit-organization-${actionData?.currentTimestamp || currentTimestamp}`,
    lastResult: navigation.state === "idle" ? actionData?.submission : null,
  });
  // SearchParams as fallback when javascript is disabled (See <Links> in <TabBar>)
  const [activeOrganizationsTab, setActiveOrganizationsTab] = useState(
    searchParams.get("organizations-tab") !== null &&
      searchParams.get("organizations-tab") !== ""
      ? searchParams.get("organizations-tab")
      : organizationsFromLoader.adminOrganizations.length > 0
      ? "admin"
      : "teamMember"
  );
  const organizations = {
    admin: {
      organizations: organizationsFromLoader.adminOrganizations,
      active: activeOrganizationsTab === "admin",
      searchParams: extendSearchParams(searchParams, {
        addOrReplace: { "organizations-tab": "admin" },
      }),
    },
    teamMember: {
      organizations: organizationsFromLoader.teamMemberOrganizations,
      active: activeOrganizationsTab === "teamMember",
      searchParams: extendSearchParams(searchParams, {
        addOrReplace: { "organizations-tab": "teamMember" },
      }),
    },
  };

  return (
    <>
      <div className="mv-w-full mv-h-full mv-flex mv-justify-center">
        <div className="mv-w-full mv-py-6 mv-px-4 @lg:mv-py-8 @md:mv-px-6 @lg:mv-px-8 mv-flex mv-flex-col mv-gap-6 mv-mb-10 @sm:mv-mb-[72px] @lg:mv-mb-16 mv-max-w-screen-2xl">
          <div className="mv-flex mv-flex-col @sm:mv-flex-row mv-gap-4 @md:mv-gap-6 @lg:mv-gap-8 mv-items-center mv-justify-between">
            <h1 className="mv-mb-0 mv-text-5xl mv-text-primary mv-font-bold mv-leading-9">
              {locales.route.headline}
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
              {locales.route.cta}
            </Button>
          </div>
          {/* Information about organization type network Section */}
          <Section additionalClassNames="mv-group">
            <Section.Headline>
              {locales.route.networkInfo.headline}
            </Section.Headline>
            <div className="mv-text-neutral-700 mv-text-lg mv-leading-[22px]">
              <p className="mv-font-semibold">
                {locales.route.networkInfo.sublineOne}
              </p>
              <p>
                {insertComponentsIntoLocale(
                  locales.route.networkInfo.sublineTwo,
                  [
                    <span
                      key="network-info-subline-two-semibold"
                      className="mv-font-semibold"
                    />,
                  ]
                )}
              </p>
            </div>

            <div className="mv-w-full mv-border mv-border-neutral-200 mv-hidden group-has-[:checked]:mv-block" />
            <h3 className="mv-mb-0 mv-text-neutral-700 mv-text-lg mv-font-bold mv-leading-6 mv-hidden group-has-[:checked]:mv-block">
              {locales.route.networkInfo.steps.headline}
            </h3>
            <ol className="mv-w-full mv-flex-col mv-gap-6 mv-list-none mv-pr-6 mv-max-w-[964px] mv-hidden group-has-[:checked]:mv-flex">
              <li className="mv-w-full mv-flex mv-gap-2">
                <span className="mv-text-center mv-align-middle mv-w-5 mv-h-5 mv-rounded-full mv-bg-primary-50 mv-text-sm mv-text-primary mv-font-semibold mv-leading-[18px]">
                  1
                </span>
                <div className="mv-w-full mv-flex mv-flex-col mv-gap-5">
                  <p className="mv-text-primary mv-font-semibold mv-leading-5">
                    {locales.route.networkInfo.steps.checkExisting.headline}
                  </p>
                  <p className="mv-text-neutral-700 mv-leading-5">
                    {insertComponentsIntoLocale(
                      locales.route.networkInfo.steps.checkExisting.description,
                      [
                        <span
                          key="network-info-step-check-existing-description-semibold"
                          className="mv-font-semibold"
                        />,
                      ]
                    )}
                  </p>
                </div>
              </li>
              <li className="mv-w-full mv-flex mv-gap-2">
                <span className="mv-text-center mv-align-middle mv-w-5 mv-h-5 mv-rounded-full mv-bg-primary-50 mv-text-sm mv-text-primary mv-font-semibold mv-leading-[18px]">
                  2
                </span>
                <div className="mv-w-full mv-flex mv-flex-col mv-gap-5">
                  <p className="mv-text-primary mv-font-semibold mv-leading-5">
                    {locales.route.networkInfo.steps.createNetwork.headline}
                  </p>
                  <div className="mv-w-full mv-flex mv-flex-col mv-gap-4 mv-text-neutral-700 mv-leading-5">
                    <p>
                      {insertComponentsIntoLocale(
                        locales.route.networkInfo.steps.createNetwork
                          .descriptionOne,
                        [
                          <span
                            key="network-info-step-create-network-description-one-semibold"
                            className="mv-font-semibold"
                          />,
                        ]
                      )}
                    </p>
                    <p>
                      {
                        locales.route.networkInfo.steps.createNetwork
                          .descriptionTwo
                      }
                    </p>
                  </div>
                </div>
              </li>
              <li className="mv-w-full mv-flex mv-gap-2">
                <span className="mv-text-center mv-align-middle mv-w-5 mv-h-5 mv-rounded-full mv-bg-primary-50 mv-text-sm mv-text-primary mv-font-semibold mv-leading-[18px]">
                  3
                </span>
                <div className="mv-w-full mv-flex mv-flex-col mv-gap-5">
                  <p className="mv-text-primary mv-font-semibold mv-leading-5">
                    {locales.route.networkInfo.steps.addInformation.headline}
                  </p>
                  <p className="mv-text-neutral-700 mv-leading-5">
                    {insertComponentsIntoLocale(
                      locales.route.networkInfo.steps.addInformation
                        .description,
                      [
                        <span
                          key="network-info-step-add-information-description-semibold"
                          className="mv-font-semibold"
                        />,
                      ]
                    )}
                  </p>
                </div>
              </li>
            </ol>
            {/* TODO: Add FAQ section when design is ready */}
            <div className="mv-w-full mv-border mv-border-neutral-200" />
            <div
              key="show-more-network-info-container"
              className="mv-w-full mv-flex mv-justify-center mv-text-sm mv-text-neutral-600 mv-font-semibold mv-leading-5 mv-justify-self-center"
            >
              <label
                htmlFor="show-more-network-info"
                className="mv-flex mv-gap-2 mv-cursor-pointer mv-w-fit"
              >
                <div className="group-has-[:checked]:mv-hidden">
                  {locales.route.networkInfo.more}
                </div>
                <div className="mv-hidden group-has-[:checked]:mv-block">
                  {locales.route.networkInfo.less}
                </div>
                <div className="mv-rotate-90 group-has-[:checked]:-mv-rotate-90">
                  <Icon type="chevron-right" />
                </div>
              </label>
              <input
                id="show-more-network-info"
                type="checkbox"
                className="mv-w-0 mv-h-0 mv-opacity-0"
              />
            </div>
          </Section>
          {/* Add Organization Section */}
          <Section>
            <Section.Headline>
              {locales.route.requestOrganizationMembership.headline}
            </Section.Headline>
            <Section.Subline>
              {locales.route.requestOrganizationMembership.subline}
            </Section.Subline>
            {/* TODO: Refactor to use conform and this routes action */}
            {/* <AddOrganization
              organizations={organizationsToAdd}
              memberOrganizations={organizationsFromLoader}
              pendingRequestsToOrganizations={pendingRequestsToOrganizations}
              invites={organizationMemberInvitesFromLoader}
              createRequestFetcher={createOrganizationMemberRequestFetcher}
              locales={locales}
            /> */}
            {pendingRequestsToOrganizations.length > 0 ? (
              <>
                <hr />
                <h4 className="mv-mb-0 mv-text-primary mv-font-semibold mv-text-base @md:mv-text-lg">
                  {locales.route.organizationMemberRequests.headline}
                </h4>
                <ListContainer
                  listKey="pending-requests-to-organizations"
                  hideAfter={3}
                  locales={locales}
                >
                  {pendingRequestsToOrganizations.map((organization, index) => {
                    return (
                      <ListItem
                        key={`cancel-request-from-${organization.id}`}
                        listIndex={index}
                        entity={organization}
                        hideAfter={3}
                        locales={locales}
                      >
                        {/* TODO: Refactor to use conform and this routes action */}
                        {/* <CancelRequestFetcher
                          fetcher={cancelOrganizationMemberRequestFetcher}
                          organizationId={organization.id}
                          locales={locales}
                        /> */}
                      </ListItem>
                    );
                  })}
                </ListContainer>
              </>
            ) : null}
          </Section>
          {/* Organization team member and admin invites section */}
          {organizationMemberInvites.teamMember.invites.length > 0 ||
          organizationMemberInvites.admin.invites.length > 0 ? (
            <section className="mv-py-6 mv-px-4 @lg:mv-px-6 mv-flex mv-flex-col mv-gap-4 mv-border mv-border-neutral-200 mv-bg-white mv-rounded-2xl">
              <div className="mv-flex mv-flex-col mv-gap-2">
                <h2 className="mv-text-2xl mv-font-bold mv-text-primary mv-leading-[26px] mv-mb-0">
                  {locales.route.organizationMemberInvites.headline}
                </h2>
                <p className="mv-text-sm mv-text-neutral-700">
                  {locales.route.organizationMemberInvites.subline}
                </p>
              </div>
              <TabBar>
                {Object.entries(organizationMemberInvites).map(
                  ([key, value]) => {
                    return value.invites.length > 0 ? (
                      <TabBar.Item
                        key={`${key}-organization-member-invites-tab`}
                        active={value.active}
                      >
                        <Link
                          to={`?${value.searchParams.toString()}`}
                          onClick={(event) => {
                            event.preventDefault();
                            setActiveOrganizationMemberInvitesTab(key);
                            return;
                          }}
                          preventScrollReset
                        >
                          <div
                            id={`tab-description-${key}`}
                            className="mv-flex mv-gap-1.5 mv-items-center"
                          >
                            <span>
                              {(() => {
                                let title;
                                if (
                                  key in
                                  locales.route.organizationMemberInvites.tabbar
                                ) {
                                  type LocaleKey =
                                    keyof typeof locales.route.organizationMemberInvites.tabbar;
                                  title =
                                    locales.route.organizationMemberInvites
                                      .tabbar[key as LocaleKey];
                                } else {
                                  console.error(
                                    `Tab bar title ${key} not found in locales`
                                  );
                                  title = key;
                                }
                                return title;
                              })()}
                            </span>
                            <TabBar.Counter active={value.active}>
                              {value.invites.length}
                            </TabBar.Counter>
                          </div>
                        </Link>
                      </TabBar.Item>
                    ) : null;
                  }
                )}
              </TabBar>
              {Object.entries(organizationMemberInvites).map(([key, value]) => {
                return value.active && value.invites.length > 0 ? (
                  <ListContainer
                    key={key}
                    listKey={`${key}-list`}
                    locales={locales}
                  >
                    {value.invites.map((invite, index) => {
                      return (
                        <ListItem
                          key={`${key}-invite-${invite.organizationId}`}
                          listIndex={index}
                          entity={invite.organization}
                          hideAfter={3}
                          locales={locales}
                        >
                          {/* TODO: Refactor to use conform and this routes action */}
                          {/* <AcceptOrRejectInviteFetcher
                            inviteFetcher={organizationMemberInviteFetcher}
                            organizationId={invite.organizationId}
                            tabKey={key}
                            locales={locales}
                          /> */}
                        </ListItem>
                      );
                    })}
                  </ListContainer>
                ) : null;
              })}
            </section>
          ) : null}
          {/* Network invites section */}
          {networkInvites.length > 0 ? (
            <section className="mv-py-6 mv-px-4 @lg:mv-px-6 mv-flex mv-flex-col mv-gap-4 mv-border mv-border-neutral-200 mv-bg-white mv-rounded-2xl">
              <div className="mv-flex mv-flex-col mv-gap-2">
                <h2 className="mv-text-2xl mv-font-bold mv-text-primary mv-leading-[26px] mv-mb-0">
                  {locales.route.networkInvites.headline}
                </h2>
                <p className="mv-text-sm mv-text-neutral-700">
                  {locales.route.networkInvites.subline}
                </p>
              </div>
              <TabBar>
                {Object.entries(networkInvites).map(([key, value]) => {
                  return value.organization.receivedNetworkJoinInvites.length >
                    0 ? (
                    <TabBar.Item
                      key={`${key}-network-invites-tab`}
                      active={value.active}
                    >
                      <Link
                        to={`?${value.searchParams.toString()}`}
                        onClick={(event) => {
                          event.preventDefault();
                          setActiveNetworkInvitesTab(value.organization.name);
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
                            {
                              value.organization.receivedNetworkJoinInvites
                                .length
                            }
                          </TabBar.Counter>
                        </div>
                      </Link>
                    </TabBar.Item>
                  ) : null;
                })}
              </TabBar>

              {Object.entries(networkInvites).map(([key, value]) => {
                return value.active &&
                  value.organization.receivedNetworkJoinInvites.length > 0 ? (
                  <ListContainer
                    key={key}
                    listKey={`${key}-list`}
                    hideAfter={3}
                    locales={locales}
                  >
                    {value.organization.receivedNetworkJoinInvites.map(
                      (invite, index) => {
                        return (
                          <ListItem
                            key={`${key}-request-${invite.network.id}`}
                            listIndex={index}
                            entity={invite.network}
                            hideAfter={3}
                            locales={locales}
                          >
                            {/* TODO: conform fetcher form to accept or reject network invites -> point to this routes action */}
                            TODO
                          </ListItem>
                        );
                      }
                    )}
                  </ListContainer>
                ) : null;
              })}
            </section>
          ) : null}
          {/* Organization team member requests section */}
          {organizationMemberRequests.length > 0 ? (
            <section className="mv-py-6 mv-px-4 @lg:mv-px-6 mv-flex mv-flex-col mv-gap-4 mv-border mv-border-neutral-200 mv-bg-white mv-rounded-2xl">
              <div className="mv-flex mv-flex-col mv-gap-2">
                <h2 className="mv-text-2xl mv-font-bold mv-text-primary mv-leading-[26px] mv-mb-0">
                  {locales.route.organizationMemberRequests.headline}
                </h2>
                <p className="mv-text-sm mv-text-neutral-700">
                  {locales.route.organizationMemberRequests.subline}
                </p>
              </div>
              <TabBar>
                {Object.entries(organizationMemberRequests).map(
                  ([key, value]) => {
                    return value.organization.profileJoinRequests.length > 0 ? (
                      <TabBar.Item
                        key={`${key}-organization-member-requests-tab`}
                        active={value.active}
                      >
                        <Link
                          to={`?${value.searchParams.toString()}`}
                          onClick={(event) => {
                            event.preventDefault();
                            setActiveOrganizationMemberRequestsTab(
                              value.organization.name
                            );
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
                  }
                )}
              </TabBar>

              {Object.entries(organizationMemberRequests).map(
                ([key, value]) => {
                  return value.active &&
                    value.organization.profileJoinRequests.length > 0 ? (
                    <ListContainer
                      key={key}
                      listKey={`${key}-list`}
                      hideAfter={3}
                      locales={locales}
                    >
                      {value.organization.profileJoinRequests.map(
                        (request, index) => {
                          return (
                            <ListItem
                              key={`${key}-request-${request.profile.id}`}
                              listIndex={index}
                              entity={request.profile}
                              hideAfter={3}
                              locales={locales}
                            >
                              {/* TODO: Refactor to use conform and this routes action */}
                              {/* <AcceptOrRejectRequestFetcher
                                fetcher={OrganizationMemberRequestFetcher}
                                organizationId={value.organization.id}
                                profileId={request.profile.id}
                                tabKey={key}
                                locales={locales}
                              /> */}
                            </ListItem>
                          );
                        }
                      )}
                    </ListContainer>
                  ) : null;
                }
              )}
            </section>
          ) : null}
          {/* Network requests section */}
          {networkRequests.length > 0 ? (
            <section className="mv-py-6 mv-px-4 @lg:mv-px-6 mv-flex mv-flex-col mv-gap-4 mv-border mv-border-neutral-200 mv-bg-white mv-rounded-2xl">
              <div className="mv-flex mv-flex-col mv-gap-2">
                <h2 className="mv-text-2xl mv-font-bold mv-text-primary mv-leading-[26px] mv-mb-0">
                  {locales.route.networkRequests.headline}
                </h2>
                <p className="mv-text-sm mv-text-neutral-700">
                  {locales.route.networkRequests.subline}
                </p>
              </div>
              <TabBar>
                {Object.entries(networkRequests).map(([key, value]) => {
                  return value.organization.receivedNetworkJoinRequests.length >
                    0 ? (
                    <TabBar.Item
                      key={`${key}-network-requests-tab`}
                      active={value.active}
                    >
                      <Link
                        to={`?${value.searchParams.toString()}`}
                        onClick={(event) => {
                          event.preventDefault();
                          setActiveNetworkRequestsTab(value.organization.name);
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
                            {
                              value.organization.receivedNetworkJoinRequests
                                .length
                            }
                          </TabBar.Counter>
                        </div>
                      </Link>
                    </TabBar.Item>
                  ) : null;
                })}
              </TabBar>

              {Object.entries(networkRequests).map(([key, value]) => {
                return value.active &&
                  value.organization.receivedNetworkJoinRequests.length > 0 ? (
                  <ListContainer
                    key={key}
                    listKey={`${key}-list`}
                    hideAfter={3}
                    locales={locales}
                  >
                    {value.organization.receivedNetworkJoinRequests.map(
                      (invite, index) => {
                        return (
                          <ListItem
                            key={`${key}-request-${invite.organization.id}`}
                            listIndex={index}
                            entity={invite.organization}
                            hideAfter={3}
                            locales={locales}
                          >
                            {/* TODO: conform fetcher form to accept or reject network requests -> point to this routes action */}
                            TODO
                          </ListItem>
                        );
                      }
                    )}
                  </ListContainer>
                ) : null;
              })}
            </section>
          ) : null}
          {/* Team and Admin Organizations Section */}
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
                          <span>
                            {(() => {
                              let title;
                              if (key in locales.route.organizations.tabbar) {
                                type LocaleKey =
                                  keyof typeof locales.route.organizations.tabbar;
                                title =
                                  locales.route.organizations.tabbar[
                                    key as LocaleKey
                                  ];
                              } else {
                                console.error(
                                  `Tab bar title ${key} not found in locales`
                                );
                                title = key;
                              }
                              return title;
                            })()}
                          </span>
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
                    <div key={`${key}-organizations`}>
                      <p className="mv-text-sm mv-text-neutral-700 mv-mx-4 mv-mb-6">
                        {
                          locales.route.organizations.subline[
                            key as keyof typeof organizations
                          ]
                        }
                      </p>
                      <CardContainer type="multi row">
                        {value.organizations.map((organization) => {
                          return (
                            <OrganizationCard
                              key={`${key}-organization-${organization.id}`}
                              organization={organization}
                              // TODO: Refactor to use conform and this routes action
                              // menu={{
                              //   mode: key === "admin" ? "admin" : "teamMember",
                              //   quitOrganizationFetcher:
                              //     quitOrganizationFetcher,
                              // }}
                              locales={locales}
                            />
                          );
                        })}
                      </CardContainer>
                    </div>
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
