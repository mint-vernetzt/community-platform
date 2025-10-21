import { getFormProps, getInputProps, useForm } from "@conform-to/react-v1";
import { Button } from "@mint-vernetzt/components/src/molecules/Button";
import { OrganizationCard } from "@mint-vernetzt/components/src/organisms/cards/OrganizationCard";
import { CardContainer } from "@mint-vernetzt/components/src/organisms/containers/CardContainer";
import { TabBar } from "@mint-vernetzt/components/src/organisms/TabBar";
import { useState } from "react";
import {
  Form,
  Link,
  redirect,
  useActionData,
  useFetcher,
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
import {
  insertComponentsIntoLocale,
  insertParametersIntoLocale,
} from "~/lib/utils/i18n";
import { invariantResponse } from "~/lib/utils/response";
import {
  extendSearchParams,
  SearchOrganizations,
} from "~/lib/utils/searchParams";
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
  getPendingRequestsToOrganizations,
  quitOrganization,
  updateNetworkInvite,
  updateNetworkRequest,
  updateOrganizationMemberInvite,
} from "./organizations.server";
import { searchOrganizations } from "../utils.server";
import { getZodConstraint, parseWithZod } from "@conform-to/zod-v1";
import { INTENT_FIELD_NAME, searchOrganizationsSchema } from "~/form-helpers";
import { Input } from "@mint-vernetzt/components/src/molecules/Input";
import { CreateOrganization } from "~/components-next/CreateOrganization";
import { useHydrated } from "remix-utils/use-hydrated";
import { Modal } from "~/components-next/Modal";
import { useIsSubmitting } from "~/lib/hooks/useIsSubmitting";
import { OverlayMenu } from "~/components-next/OverlayMenu";
import { CLAIM_REQUEST_INTENTS } from "~/claim-request.shared";
import { prismaClient } from "~/prisma.server";
import { getFeatureAbilities } from "../feature-access.server";
import { handleClaimRequest } from "~/claim-request.server";

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
  const { searchedOrganizations, submission } = await searchOrganizations({
    searchParams: new URL(request.url).searchParams,
    authClient,
    locales,
    mode: "authenticated",
  });

  const abilities = await getFeatureAbilities(
    authClient,
    "provisional_organizations"
  );
  const enhancedSearchedOrganizations = await Promise.all(
    searchedOrganizations.map(async (organization) => {
      let alreadyRequestedToClaim = false;
      let allowedToClaimOrganization = false;
      if (abilities["provisional_organizations"].hasAccess === true) {
        const openClaimRequest =
          await prismaClient.organizationClaimRequest.findFirst({
            select: {
              status: true,
            },
            where: {
              organizationId: organization.id,
              claimerId: sessionUser.id,
            },
          });
        alreadyRequestedToClaim =
          openClaimRequest !== null
            ? openClaimRequest.status === "open"
            : false;
        allowedToClaimOrganization =
          organization.shadow === false
            ? false
            : openClaimRequest !== null
              ? openClaimRequest.status === "open" ||
                openClaimRequest.status === "withdrawn"
              : true;
      }
      return {
        ...organization,
        alreadyRequestedToClaim,
        allowedToClaimOrganization,
      };
    })
  );

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
    searchedOrganizations: enhancedSearchedOrganizations,
    submission,
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
  let redirectUrl = request.url;
  const formData = await request.formData();
  const intent = formData.get(INTENT_FIELD_NAME);
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
  } else if (intent.startsWith("accept-organization-invite-")) {
    const acceptOrganizationMemberInviteFormData = new FormData();
    const subIntent = intent.replace("accept-organization-invite-", "");
    if (subIntent.startsWith("admin-")) {
      acceptOrganizationMemberInviteFormData.set("role", "admin");
      acceptOrganizationMemberInviteFormData.set(
        "organizationId",
        subIntent.replace("admin-", "")
      );
    } else if (subIntent.startsWith("teamMember-")) {
      acceptOrganizationMemberInviteFormData.set("role", "member");
      acceptOrganizationMemberInviteFormData.set(
        "organizationId",
        subIntent.replace("teamMember-", "")
      );
    } else {
      invariantResponse(false, "Invalid intent", {
        status: 400,
      });
    }
    result = await updateOrganizationMemberInvite({
      formData: acceptOrganizationMemberInviteFormData,
      intent: "acceptOrganizationMemberInvite",
      locales,
      sessionUser,
    });
  } else if (intent.startsWith("reject-organization-invite-")) {
    const rejectOrganizationMemberInviteFormData = new FormData();
    const subIntent = intent.replace("reject-organization-invite-", "");
    if (subIntent.startsWith("admin-")) {
      rejectOrganizationMemberInviteFormData.set("role", "admin");
      rejectOrganizationMemberInviteFormData.set(
        "organizationId",
        subIntent.replace("admin-", "")
      );
    } else if (subIntent.startsWith("teamMember-")) {
      rejectOrganizationMemberInviteFormData.set("role", "member");
      rejectOrganizationMemberInviteFormData.set(
        "organizationId",
        subIntent.replace("teamMember-", "")
      );
    } else {
      invariantResponse(false, "Invalid intent", {
        status: 400,
      });
    }
    result = await updateOrganizationMemberInvite({
      formData: rejectOrganizationMemberInviteFormData,
      intent: "rejectOrganizationMemberInvite",
      locales,
      sessionUser,
    });
  } else if (intent.startsWith("accept-network-invite-")) {
    const acceptNetworkInviteFormData = new FormData();
    const idPair = intent.replace("accept-network-invite-", "");
    acceptNetworkInviteFormData.set("networkId", idPair.substring(0, 36));
    acceptNetworkInviteFormData.set("organizationId", idPair.substring(37));
    result = await updateNetworkInvite({
      formData: acceptNetworkInviteFormData,
      intent: "acceptNetworkInvite",
      locales,
      sessionUser,
    });
  } else if (intent.startsWith("reject-network-invite-")) {
    const rejectNetworkInviteFormData = new FormData();
    const idPair = intent.replace("reject-network-invite-", "");
    rejectNetworkInviteFormData.set("networkId", idPair.substring(0, 36));
    rejectNetworkInviteFormData.set("organizationId", idPair.substring(37));
    result = await updateNetworkInvite({
      formData: rejectNetworkInviteFormData,
      intent: "rejectNetworkInvite",
      locales,
      sessionUser,
    });
  } else if (intent.startsWith("accept-organization-member-request-")) {
    const acceptOrganizationMemberRequestFormData = new FormData();
    const idPair = intent.replace("accept-organization-member-request-", "");
    acceptOrganizationMemberRequestFormData.set(
      "profileId",
      idPair.substring(0, 36)
    );
    acceptOrganizationMemberRequestFormData.set(
      "organizationId",
      idPair.substring(37)
    );
    result = await acceptOrRejectOrganizationMemberRequest({
      formData: acceptOrganizationMemberRequestFormData,
      intent: "acceptOrganizationMemberRequest",
      locales,
      sessionUser,
    });
  } else if (intent.startsWith("reject-organization-member-request-")) {
    const rejectOrganizationMemberRequestFormData = new FormData();
    const idPair = intent.replace("reject-organization-member-request-", "");
    rejectOrganizationMemberRequestFormData.set(
      "profileId",
      idPair.substring(0, 36)
    );
    rejectOrganizationMemberRequestFormData.set(
      "organizationId",
      idPair.substring(37)
    );
    result = await acceptOrRejectOrganizationMemberRequest({
      formData: rejectOrganizationMemberRequestFormData,
      intent: "rejectOrganizationMemberRequest",
      locales,
      sessionUser,
    });
  } else if (intent.startsWith("accept-network-request-")) {
    const acceptNetworkRequestFormData = new FormData();
    const idPair = intent.replace("accept-network-request-", "");
    acceptNetworkRequestFormData.set("organizationId", idPair.substring(0, 36));
    acceptNetworkRequestFormData.set("networkId", idPair.substring(37));
    result = await updateNetworkRequest({
      formData: acceptNetworkRequestFormData,
      intent: "acceptNetworkRequest",
      locales,
      sessionUser,
    });
  } else if (intent.startsWith("reject-network-request-")) {
    const rejectNetworkRequestFormData = new FormData();
    const idPair = intent.replace("reject-network-request-", "");
    rejectNetworkRequestFormData.set("organizationId", idPair.substring(0, 36));
    rejectNetworkRequestFormData.set("networkId", idPair.substring(37));
    result = await updateNetworkRequest({
      formData: rejectNetworkRequestFormData,
      intent: "rejectNetworkRequest",
      locales,
      sessionUser,
    });
  } else if (intent.startsWith("quit-organization-admin-")) {
    const quitOrganizationFormData = new FormData();
    const organizationId = intent.replace("quit-organization-admin-", "");
    quitOrganizationFormData.set("organizationId", organizationId);
    result = await quitOrganization({
      formData: quitOrganizationFormData,
      locales,
      sessionUser,
      role: "admin",
    });
    const url = new URL(request.url);
    const searchParams = url.searchParams;
    if (
      searchParams.get(`modal-quit-organization-admin-${organizationId}`) ===
      "true"
    ) {
      searchParams.delete(`modal-quit-organization-admin-${organizationId}`);
    }
    redirectUrl = `${process.env.COMMUNITY_BASE_URL}${
      url.pathname
    }?${searchParams.toString()}`;
  } else if (intent.startsWith("quit-organization-teamMember-")) {
    const quitOrganizationFormData = new FormData();
    const organizationId = intent.replace("quit-organization-teamMember-", "");
    quitOrganizationFormData.set("organizationId", organizationId);
    result = await quitOrganization({
      formData: quitOrganizationFormData,
      locales,
      sessionUser,
      role: "teamMember",
    });
    const url = new URL(request.url);
    const searchParams = url.searchParams;
    if (
      searchParams.get(
        `modal-quit-organization-teamMember-${organizationId}`
      ) === "true"
    ) {
      searchParams.delete(
        `modal-quit-organization-teamMember-${organizationId}`
      );
    }
    redirectUrl = `${process.env.COMMUNITY_BASE_URL}${
      url.pathname
    }?${searchParams.toString()}`;
  } else if (
    intent.startsWith(CLAIM_REQUEST_INTENTS.create) ||
    intent.startsWith(CLAIM_REQUEST_INTENTS.withdraw)
  ) {
    const requestToClaimOrganizationFormData = new FormData();
    requestToClaimOrganizationFormData.set(
      "intent",
      intent.startsWith(CLAIM_REQUEST_INTENTS.create)
        ? CLAIM_REQUEST_INTENTS.create
        : CLAIM_REQUEST_INTENTS.withdraw
    );
    const organizationId = intent.startsWith(CLAIM_REQUEST_INTENTS.create)
      ? intent.replace(`${CLAIM_REQUEST_INTENTS.create}-`, "")
      : intent.replace(`${CLAIM_REQUEST_INTENTS.withdraw}-`, "");
    const organization = await prismaClient.organization.findUnique({
      select: {
        slug: true,
      },
      where: {
        id: organizationId,
      },
    });
    invariantResponse(organization !== null, "Organization not found", {
      status: 404,
    });
    result = await handleClaimRequest({
      formData: requestToClaimOrganizationFormData,
      sessionUserId: sessionUser.id,
      slug: organization.slug,
      locales,
    });
  } else {
    invariantResponse(false, "Invalid intent", {
      status: 400,
    });
  }

  if (
    typeof result.submission !== "undefined" &&
    result.submission !== null &&
    result.submission.status === "success" &&
    typeof result.toast !== "undefined" &&
    result.toast !== null
  ) {
    return redirectWithToast(redirectUrl, result.toast);
  }
  if (
    typeof result.submission !== "undefined" &&
    result.submission !== null &&
    result.submission.status === "success"
  ) {
    return redirect(redirectUrl);
  }
  return {
    submission: {
      ...result.submission,
      error: result.submission?.error || undefined,
    },
    currentTimestamp: Date.now(),
  };
};

export default function MyOrganizations() {
  const {
    searchedOrganizations: loaderSearchedOrganizations,
    submission: loaderSubmission,
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
  const isHydrated = useHydrated();
  const isSubmitting = useIsSubmitting();

  // JS for request to add yourself to an organization section
  const searchFetcher = useFetcher<typeof loader>();
  const searchedOrganizations =
    searchFetcher.data !== undefined
      ? searchFetcher.data.searchedOrganizations
      : loaderSearchedOrganizations;
  const currentSearchQuery =
    searchFetcher.data?.submission.initialValue?.[SearchOrganizations] ||
    searchParams.get(SearchOrganizations) ||
    undefined;

  const [searchForm, searchFields] = useForm({
    id: "search-organizations",
    defaultValue: {
      [SearchOrganizations]: searchParams.get(SearchOrganizations) || undefined,
    },
    constraint: getZodConstraint(searchOrganizationsSchema(locales)),
    shouldValidate: "onBlur",
    onValidate: (values) => {
      return parseWithZod(values.formData, {
        schema: searchOrganizationsSchema(locales),
      });
    },
    shouldRevalidate: "onInput",
    lastResult: navigation.state === "idle" ? loaderSubmission : null,
  });
  const [createOrganizationMemberOrClaimRequestForm] = useForm({
    id: `create-organization-member-or-claim-request-${
      actionData?.currentTimestamp || currentTimestamp
    }`,
    lastResult: navigation.state === "idle" ? actionData?.submission : null,
  });
  const [cancelOrganizationMemberRequestForm] = useForm({
    id: `cancel-organization-member-request-${
      actionData?.currentTimestamp || currentTimestamp
    }`,
    lastResult: navigation.state === "idle" ? actionData?.submission : null,
  });

  // JS for incoming organization member invites section
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
  const networkRequests = networkRequestsFromLoader.map((network) => {
    return {
      network: network,
      active: activeNetworkRequestsTab === network.name,
      searchParams: extendSearchParams(searchParams, {
        addOrReplace: { "network-requests-tab": network.name },
      }),
    };
  });

  // JS for own organizations section
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
      <div className="w-full h-full flex justify-center">
        <div className="w-full py-6 px-4 @lg:py-8 @md:px-6 @lg:px-8 flex flex-col gap-6 mb-10 @sm:mb-[72px] @lg:mb-16 max-w-screen-2xl">
          <div className="flex flex-col @sm:flex-row gap-8 @md:gap-6 @lg:gap-8 items-center justify-between mb-6 @sm:mb-0">
            <h1 className="mb-0 text-5xl text-primary font-bold leading-9">
              {locales.route.headline}
            </h1>
            <Button as="link" to={"/organization/create"} prefetch="intent">
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
          <Section additionalClassNames="group">
            <div className="w-full flex flex-col gap-6">
              <h2 className="text-2xl font-bold text-primary leading-[26px] mb-0">
                {locales.route.networkInfo.headline}
              </h2>
              <div className="text-neutral-700 text-lg leading-[22px] -mt-2">
                <p className="font-semibold">
                  {locales.route.networkInfo.sublineOne}
                </p>
                <p>
                  {insertComponentsIntoLocale(
                    locales.route.networkInfo.sublineTwo,
                    [
                      <span
                        key="network-info-subline-two-semibold"
                        className="font-semibold"
                      />,
                    ]
                  )}
                </p>
              </div>
            </div>
            <h3 className="mb-0 text-neutral-700 text-lg font-bold leading-6 hidden group-has-[:checked]:block">
              {locales.route.networkInfo.steps.headline}
            </h3>
            <ol className="w-full flex-col gap-6 list-none pr-6 max-w-[964px] hidden group-has-[:checked]:flex">
              <li className="w-full flex gap-2">
                <span className="text-center align-middle w-5 h-5 rounded-full bg-primary-50 text-sm text-primary font-semibold leading-[18px]">
                  1
                </span>
                <div className="w-full flex flex-col gap-5">
                  <p className="text-primary font-semibold leading-5">
                    {locales.route.networkInfo.steps.checkExisting.headline}
                  </p>
                  <p className="text-neutral-700 leading-5">
                    {insertComponentsIntoLocale(
                      locales.route.networkInfo.steps.checkExisting.description,
                      [
                        <span
                          key="network-info-step-check-existing-description-semibold"
                          className="font-semibold"
                        />,
                      ]
                    )}
                  </p>
                </div>
              </li>
              <li className="w-full flex gap-2">
                <span className="text-center align-middle w-5 h-5 rounded-full bg-primary-50 text-sm text-primary font-semibold leading-[18px]">
                  2
                </span>
                <div className="w-full flex flex-col gap-4">
                  <p className="text-primary font-semibold leading-5">
                    {locales.route.networkInfo.steps.createNetwork.headline}
                  </p>
                  <div className="w-full flex flex-col gap-4 text-neutral-700 leading-5">
                    <p>
                      {insertComponentsIntoLocale(
                        locales.route.networkInfo.steps.createNetwork
                          .descriptionOne,
                        [
                          <span
                            key="network-info-step-create-network-description-one-semibold"
                            className="font-semibold"
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
              <li className="w-full flex gap-2">
                <span className="text-center align-middle w-5 h-5 rounded-full bg-primary-50 text-sm text-primary font-semibold leading-[18px]">
                  3
                </span>
                <div className="w-full flex flex-col gap-5">
                  <p className="text-primary font-semibold leading-5">
                    {locales.route.networkInfo.steps.addInformation.headline}
                  </p>
                  <p className="text-neutral-700 leading-5">
                    {insertComponentsIntoLocale(
                      locales.route.networkInfo.steps.addInformation
                        .description,
                      [
                        <span
                          key="network-info-step-add-information-description-semibold"
                          className="font-semibold"
                        />,
                      ]
                    )}
                  </p>
                </div>
              </li>
            </ol>
            <div className="hidden group-has-[:checked]:block mb-2 ml-7">
              <p className="pb-2">{locales.route.networkInfo.faq.info}</p>
              <Link
                to={"/help#organizations"}
                target="_blank"
                rel="noopener noreferrer"
                className="text-neutral-700 font-semibold underline hover:no-underline"
                prefetch="intent"
              >
                {locales.route.networkInfo.faq.link}
              </Link>
            </div>
            <div className="w-full flex flex-col gap-6">
              <div
                key="show-more-network-info-container"
                className="w-full flex justify-center text-sm text-neutral-600 font-semibold leading-5 justify-self-center"
              >
                <label
                  htmlFor="show-more-network-info"
                  className="flex gap-2 cursor-pointer w-fit"
                >
                  <div className="group-has-[:checked]:hidden">
                    {locales.route.networkInfo.more}
                  </div>
                  <div className="hidden group-has-[:checked]:block">
                    {locales.route.networkInfo.less}
                  </div>
                  <div className="rotate-90 group-has-[:checked]:-rotate-90">
                    <Icon type="chevron-right" />
                  </div>
                </label>
                <input
                  id="show-more-network-info"
                  type="checkbox"
                  className="w-0 h-0 opacity-0"
                />
              </div>
              <div className="block @sm:hidden w-full border-t border-neutral-200" />
            </div>
          </Section>
          {/* Request Organization Membership Section */}
          <Section>
            <Section.Headline>
              {locales.route.requestOrganizationMembership.headline}
            </Section.Headline>
            <Section.Subline>
              {locales.route.requestOrganizationMembership.subline}
            </Section.Subline>
            <searchFetcher.Form
              {...getFormProps(searchForm)}
              method="get"
              onChange={(event) => {
                searchForm.validate();
                if (searchForm.valid) {
                  searchFetcher.submit(event.currentTarget, {
                    preventScrollReset: true,
                  });
                }
              }}
              autoComplete="off"
            >
              <Input
                {...getInputProps(searchFields[SearchOrganizations], {
                  type: "text",
                })}
                key={searchFields[SearchOrganizations].id}
                standalone
              >
                <Input.Label htmlFor={searchFields[SearchOrganizations].id}>
                  {locales.route.requestOrganizationMembership.label}
                </Input.Label>
                <Input.SearchIcon />
                <Input.ClearIcon />

                {typeof searchFields[SearchOrganizations].errors !==
                  "undefined" &&
                searchFields[SearchOrganizations].errors.length > 0 ? (
                  searchFields[SearchOrganizations].errors.map((error) => (
                    <Input.Error
                      id={searchFields[SearchOrganizations].errorId}
                      key={error}
                    >
                      {error}
                    </Input.Error>
                  ))
                ) : (
                  <Input.HelperText>
                    {locales.route.requestOrganizationMembership.helperText}
                  </Input.HelperText>
                )}
                <Input.ClearIcon
                  onClick={() => {
                    setTimeout(() => {
                      searchForm.reset();
                      searchFetcher.submit(null, {
                        preventScrollReset: true,
                      });
                    }, 0);
                  }}
                />
                <Input.Controls>
                  <noscript>
                    <Button type="submit" variant="outline">
                      {locales.route.requestOrganizationMembership.searchCta}
                    </Button>
                  </noscript>
                </Input.Controls>
              </Input>
              {typeof searchForm.errors !== "undefined" &&
              searchForm.errors.length > 0 ? (
                <div>
                  {searchForm.errors.map((error, index) => {
                    return (
                      <div
                        id={searchForm.errorId}
                        key={index}
                        className="text-sm font-semibold text-negative-600"
                      >
                        {error}
                      </div>
                    );
                  })}
                </div>
              ) : null}
            </searchFetcher.Form>
            {searchedOrganizations.length > 0 ? (
              <Form
                {...getFormProps(createOrganizationMemberOrClaimRequestForm)}
                method="post"
                preventScrollReset
              >
                <ListContainer
                  locales={locales}
                  listKey="organizations-to-request-membership-or-claim-search-results"
                  hideAfter={3}
                >
                  {searchedOrganizations.map((searchedOrganization, index) => {
                    return (
                      <ListItem
                        key={`organizations-to-request-membership-or-claim-search-result-${searchedOrganization.slug}`}
                        entity={searchedOrganization}
                        locales={locales}
                        listIndex={index}
                        hideAfter={3}
                        prefetch="intent"
                      >
                        {organizations.teamMember.organizations.some(
                          (organization) => {
                            return organization.id === searchedOrganization.id;
                          }
                        ) ? (
                          <div className="w-full text-center text-nowrap text-positive-600 text-sm font-semibold leading-5">
                            {
                              locales.route.requestOrganizationMembership
                                .alreadyMember
                            }
                          </div>
                        ) : pendingRequestsToOrganizations.some(
                            (organization) => {
                              return (
                                organization.id === searchedOrganization.id
                              );
                            }
                          ) ? (
                          <div className="w-full text-center text-nowrap text-neutral-700 text-sm font-semibold leading-5">
                            {
                              locales.route.requestOrganizationMembership
                                .alreadyRequested
                            }
                          </div>
                        ) : searchedOrganization.allowedToClaimOrganization ? (
                          <div className="flex w-full flex-col @lg:flex-row items-center gap-4 p-4 bg-primary-50 rounded-[4px]">
                            <p>
                              {searchedOrganization.alreadyRequestedToClaim
                                ? locales.route.claimRequest.alreadyRequested
                                    .description
                                : insertComponentsIntoLocale(
                                    locales.route.claimRequest.notRequested
                                      .description,
                                    [
                                      <span
                                        key="highlighted-text"
                                        className="font-semibold"
                                      />,
                                      <Link
                                        key="help-link"
                                        to="/help#organizations-whatAreProvisionalOrganizations"
                                        target="_blank"
                                        className="text-primary font-semibold hover:underline"
                                        prefetch="intent"
                                      >
                                        {" "}
                                      </Link>,
                                    ]
                                  )}
                            </p>
                            <div className="w-full @lg:w-fit">
                              <Button
                                name={INTENT_FIELD_NAME}
                                value={`${
                                  searchedOrganization.alreadyRequestedToClaim
                                    ? CLAIM_REQUEST_INTENTS.withdraw
                                    : CLAIM_REQUEST_INTENTS.create
                                }-${searchedOrganization.id}`}
                                type="submit"
                                variant="outline"
                                size="small"
                                fullSize
                                disabled={isSubmitting}
                              >
                                {searchedOrganization.alreadyRequestedToClaim
                                  ? locales.route.claimRequest.alreadyRequested
                                      .cta
                                  : locales.route.claimRequest.notRequested.cta}
                              </Button>
                            </div>
                          </div>
                        ) : searchedOrganization.shadow === false ? (
                          <Button
                            name={INTENT_FIELD_NAME}
                            variant="outline"
                            value={`create-organization-member-request-${searchedOrganization.id}`}
                            type="submit"
                            disabled={isSubmitting}
                            fullSize
                          >
                            {
                              locales.route.requestOrganizationMembership
                                .createOrganizationMemberRequestCta
                            }
                          </Button>
                        ) : null}
                      </ListItem>
                    );
                  })}
                </ListContainer>
                {typeof createOrganizationMemberOrClaimRequestForm.errors !==
                  "undefined" &&
                createOrganizationMemberOrClaimRequestForm.errors.length > 0 ? (
                  <div>
                    {createOrganizationMemberOrClaimRequestForm.errors.map(
                      (error, index) => {
                        return (
                          <div
                            id={
                              createOrganizationMemberOrClaimRequestForm.errorId
                            }
                            key={index}
                            className="text-sm font-semibold text-negative-600"
                          >
                            {error}
                          </div>
                        );
                      }
                    )}
                  </div>
                ) : null}
              </Form>
            ) : isHydrated === true &&
              searchForm.valid &&
              searchForm.dirty &&
              typeof currentSearchQuery !== "undefined" ? (
              <CreateOrganization
                name={String(currentSearchQuery)}
                locales={locales}
              />
            ) : typeof currentSearchQuery !== "undefined" &&
              searchForm.status !== "error" ? (
              <CreateOrganization
                name={String(currentSearchQuery)}
                locales={locales}
              />
            ) : null}
            {pendingRequestsToOrganizations.length > 0 ? (
              <>
                <hr />
                <h4 className="mb-0 text-primary font-semibold text-base @md:text-lg">
                  {
                    locales.route.requestOrganizationMembership
                      .openRequestsHeadline
                  }
                </h4>
                <Form
                  {...getFormProps(cancelOrganizationMemberRequestForm)}
                  method="post"
                  preventScrollReset
                >
                  <ListContainer
                    listKey="pending-requests-to-organizations"
                    hideAfter={3}
                    locales={locales}
                  >
                    {pendingRequestsToOrganizations.map(
                      (organization, index) => {
                        return (
                          <ListItem
                            key={`cancel-organization-member-request-${organization.id}`}
                            listIndex={index}
                            entity={organization}
                            hideAfter={3}
                            locales={locales}
                            prefetch="intent"
                          >
                            <Button
                              name="intent"
                              variant="outline"
                              value={`cancel-organization-member-request-${organization.id}`}
                              type="submit"
                              disabled={isSubmitting}
                              fullSize
                            >
                              {
                                locales.route.requestOrganizationMembership
                                  .cancelOrganizationMemberRequestCta
                              }
                            </Button>
                          </ListItem>
                        );
                      }
                    )}
                  </ListContainer>
                  {typeof cancelOrganizationMemberRequestForm.errors !==
                    "undefined" &&
                  cancelOrganizationMemberRequestForm.errors.length > 0 ? (
                    <div>
                      {cancelOrganizationMemberRequestForm.errors.map(
                        (error, index) => {
                          return (
                            <div
                              id={cancelOrganizationMemberRequestForm.errorId}
                              key={index}
                              className="text-sm font-semibold text-negative-600"
                            >
                              {error}
                            </div>
                          );
                        }
                      )}
                    </div>
                  ) : null}
                </Form>
              </>
            ) : null}
          </Section>
          {/* Organization team member and admin invites section */}
          {organizationMemberInvites.teamMember.invites.length > 0 ||
          organizationMemberInvites.admin.invites.length > 0 ? (
            <section className="py-6 px-4 @lg:px-6 flex flex-col gap-4 border border-neutral-200 bg-white rounded-2xl">
              <div className="flex flex-col gap-2">
                <h2 className="text-2xl font-bold text-primary leading-[26px] mb-0">
                  {locales.route.organizationMemberInvites.headline}
                </h2>
                <p className="text-sm text-neutral-700">
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
                            className="flex gap-1.5 items-center"
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
                  <Form
                    {...getFormProps(
                      acceptOrRejectOrganizationMemberInviteForm
                    )}
                    method="post"
                    preventScrollReset
                    key={key}
                  >
                    <ListContainer listKey={`${key}-list`} locales={locales}>
                      {value.invites.map((invite, index) => {
                        return (
                          <ListItem
                            key={`${key}-member-invite-${invite.organizationId}`}
                            listIndex={index}
                            entity={invite.organization}
                            hideAfter={3}
                            locales={locales}
                            prefetch="intent"
                          >
                            <div className="flex items-center gap-4 w-full @lg:w-fit @lg:min-w-fit">
                              <Button
                                variant="outline"
                                fullSize
                                type="submit"
                                name="intent"
                                value={`reject-organization-invite-${key}-${invite.organizationId}`}
                                className="text-wrap @lg:text-nowrap"
                                disabled={isSubmitting}
                              >
                                {
                                  locales.route.organizationMemberInvites
                                    .decline
                                }
                              </Button>
                              <Button
                                fullSize
                                type="submit"
                                name="intent"
                                value={`accept-organization-invite-${key}-${invite.organizationId}`}
                                className="text-wrap @lg:text-nowrap"
                                disabled={isSubmitting}
                              >
                                {locales.route.organizationMemberInvites.accept}
                              </Button>
                            </div>
                          </ListItem>
                        );
                      })}
                    </ListContainer>
                    {typeof acceptOrRejectOrganizationMemberInviteForm.errors !==
                      "undefined" &&
                    acceptOrRejectOrganizationMemberInviteForm.errors.length >
                      0 ? (
                      <div>
                        {acceptOrRejectOrganizationMemberInviteForm.errors.map(
                          (error, index) => {
                            return (
                              <div
                                id={
                                  acceptOrRejectOrganizationMemberInviteForm.errorId
                                }
                                key={index}
                                className="text-sm font-semibold text-negative-600"
                              >
                                {error}
                              </div>
                            );
                          }
                        )}
                      </div>
                    ) : null}
                  </Form>
                ) : null;
              })}
            </section>
          ) : null}
          {/* Network invites section */}
          {networkInvites.length > 0 ? (
            <section className="py-6 px-4 @lg:px-6 flex flex-col gap-4 border border-neutral-200 bg-white rounded-2xl">
              <div className="flex flex-col gap-2">
                <h2 className="text-2xl font-bold text-primary leading-[26px] mb-0">
                  {locales.route.networkInvites.headline}
                </h2>
                <p className="text-sm text-neutral-700">
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
                          className="flex gap-1.5 items-center"
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
                  <Form
                    {...getFormProps(acceptOrRejectNetworkInviteForm)}
                    method="post"
                    preventScrollReset
                    key={key}
                  >
                    <ListContainer
                      listKey={`${key}-list`}
                      hideAfter={3}
                      locales={locales}
                    >
                      {value.organization.receivedNetworkJoinInvites.map(
                        (invite, index) => {
                          return (
                            <ListItem
                              key={`${key}-network-invite-${invite.network.id}`}
                              listIndex={index}
                              entity={invite.network}
                              hideAfter={3}
                              locales={locales}
                              prefetch="intent"
                            >
                              <div className="flex items-center gap-4 w-full @lg:w-fit @lg:min-w-fit">
                                <Button
                                  variant="outline"
                                  fullSize
                                  type="submit"
                                  name="intent"
                                  value={`reject-network-invite-${invite.network.id}-${value.organization.id}`}
                                  className="text-wrap @lg:text-nowrap"
                                  disabled={isSubmitting}
                                >
                                  {locales.route.networkInvites.decline}
                                </Button>
                                <Button
                                  fullSize
                                  type="submit"
                                  name="intent"
                                  value={`accept-network-invite-${invite.network.id}-${value.organization.id}`}
                                  className="text-wrap @lg:text-nowrap"
                                  disabled={isSubmitting}
                                >
                                  {locales.route.networkInvites.accept}
                                </Button>
                              </div>
                            </ListItem>
                          );
                        }
                      )}
                    </ListContainer>
                    {typeof acceptOrRejectNetworkInviteForm.errors !==
                      "undefined" &&
                    acceptOrRejectNetworkInviteForm.errors.length > 0 ? (
                      <div>
                        {acceptOrRejectNetworkInviteForm.errors.map(
                          (error, index) => {
                            return (
                              <div
                                id={acceptOrRejectNetworkInviteForm.errorId}
                                key={index}
                                className="text-sm font-semibold text-negative-600"
                              >
                                {error}
                              </div>
                            );
                          }
                        )}
                      </div>
                    ) : null}
                  </Form>
                ) : null;
              })}
            </section>
          ) : null}
          {/* Organization team member requests section */}
          {organizationMemberRequests.length > 0 ? (
            <section className="py-6 px-4 @lg:px-6 flex flex-col gap-4 border border-neutral-200 bg-white rounded-2xl">
              <div className="flex flex-col gap-2">
                <h2 className="text-2xl font-bold text-primary leading-[26px] mb-0">
                  {locales.route.organizationMemberRequests.headline}
                </h2>
                <p className="text-sm text-neutral-700">
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
                            className="flex gap-1.5 items-center"
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
                    <Form
                      {...getFormProps(
                        acceptOrRejectOrganizationMemberRequestForm
                      )}
                      method="post"
                      preventScrollReset
                      key={key}
                    >
                      <ListContainer
                        listKey={`${key}-list`}
                        hideAfter={3}
                        locales={locales}
                      >
                        {value.organization.profileJoinRequests.map(
                          (request, index) => {
                            return (
                              <ListItem
                                key={`${key}-member-request-${request.profile.id}`}
                                listIndex={index}
                                entity={request.profile}
                                hideAfter={3}
                                locales={locales}
                                prefetch="intent"
                              >
                                <div className="flex items-center gap-4 w-full @lg:w-fit @lg:min-w-fit">
                                  <Button
                                    variant="outline"
                                    fullSize
                                    type="submit"
                                    name="intent"
                                    value={`reject-organization-member-request-${request.profile.id}-${value.organization.id}`}
                                    className="text-wrap @lg:text-nowrap"
                                    disabled={isSubmitting}
                                  >
                                    {
                                      locales.route.organizationMemberRequests
                                        .decline
                                    }
                                  </Button>
                                  <Button
                                    fullSize
                                    type="submit"
                                    name="intent"
                                    value={`accept-organization-member-request-${request.profile.id}-${value.organization.id}`}
                                    className="text-wrap @lg:text-nowrap"
                                    disabled={isSubmitting}
                                  >
                                    {
                                      locales.route.organizationMemberRequests
                                        .accept
                                    }
                                  </Button>
                                </div>
                              </ListItem>
                            );
                          }
                        )}
                      </ListContainer>
                      {typeof acceptOrRejectOrganizationMemberRequestForm.errors !==
                        "undefined" &&
                      acceptOrRejectOrganizationMemberRequestForm.errors
                        .length > 0 ? (
                        <div>
                          {acceptOrRejectOrganizationMemberRequestForm.errors.map(
                            (error, index) => {
                              return (
                                <div
                                  id={
                                    acceptOrRejectOrganizationMemberRequestForm.errorId
                                  }
                                  key={index}
                                  className="text-sm font-semibold text-negative-600"
                                >
                                  {error}
                                </div>
                              );
                            }
                          )}
                        </div>
                      ) : null}
                    </Form>
                  ) : null;
                }
              )}
            </section>
          ) : null}
          {/* Network requests section */}
          {networkRequests.length > 0 ? (
            <section className="py-6 px-4 @lg:px-6 flex flex-col gap-4 border border-neutral-200 bg-white rounded-2xl">
              <div className="flex flex-col gap-2">
                <h2 className="text-2xl font-bold text-primary leading-[26px] mb-0">
                  {locales.route.networkRequests.headline}
                </h2>
                <p className="text-sm text-neutral-700">
                  {locales.route.networkRequests.subline}
                </p>
              </div>
              <TabBar>
                {Object.entries(networkRequests).map(([key, value]) => {
                  return value.network.receivedNetworkJoinRequests.length >
                    0 ? (
                    <TabBar.Item
                      key={`${key}-network-requests-tab`}
                      active={value.active}
                    >
                      <Link
                        to={`?${value.searchParams.toString()}`}
                        onClick={(event) => {
                          event.preventDefault();
                          setActiveNetworkRequestsTab(value.network.name);
                          return;
                        }}
                        preventScrollReset
                      >
                        <div
                          id={`tab-description-${key}`}
                          className="flex gap-1.5 items-center"
                        >
                          <span>{value.network.name}</span>
                          <TabBar.Counter active={value.active}>
                            {value.network.receivedNetworkJoinRequests.length}
                          </TabBar.Counter>
                        </div>
                      </Link>
                    </TabBar.Item>
                  ) : null;
                })}
              </TabBar>

              {Object.entries(networkRequests).map(([key, value]) => {
                return value.active &&
                  value.network.receivedNetworkJoinRequests.length > 0 ? (
                  <Form
                    {...getFormProps(acceptOrRejectNetworkRequestForm)}
                    method="post"
                    preventScrollReset
                    key={key}
                  >
                    <ListContainer
                      listKey={`${key}-list`}
                      hideAfter={3}
                      locales={locales}
                    >
                      {value.network.receivedNetworkJoinRequests.map(
                        (request, index) => {
                          return (
                            <ListItem
                              key={`${key}-network-request-${request.organization.id}`}
                              listIndex={index}
                              entity={request.organization}
                              hideAfter={3}
                              locales={locales}
                              prefetch="intent"
                            >
                              <div className="flex items-center gap-4 w-full @lg:w-fit @lg:min-w-fit">
                                <Button
                                  variant="outline"
                                  fullSize
                                  type="submit"
                                  name="intent"
                                  value={`reject-network-request-${request.organization.id}-${value.network.id}`}
                                  className="text-wrap @lg:text-nowrap"
                                  disabled={isSubmitting}
                                >
                                  {locales.route.networkRequests.decline}
                                </Button>
                                <Button
                                  fullSize
                                  type="submit"
                                  name="intent"
                                  value={`accept-network-request-${request.organization.id}-${value.network.id}`}
                                  className="text-wrap @lg:text-nowrap"
                                  disabled={isSubmitting}
                                >
                                  {locales.route.networkRequests.accept}
                                </Button>
                              </div>
                            </ListItem>
                          );
                        }
                      )}
                    </ListContainer>
                    {typeof acceptOrRejectNetworkRequestForm.errors !==
                      "undefined" &&
                    acceptOrRejectNetworkRequestForm.errors.length > 0 ? (
                      <div>
                        {acceptOrRejectNetworkRequestForm.errors.map(
                          (error, index) => {
                            return (
                              <div
                                id={acceptOrRejectNetworkRequestForm.errorId}
                                key={index}
                                className="text-sm font-semibold text-negative-600"
                              >
                                {error}
                              </div>
                            );
                          }
                        )}
                      </div>
                    ) : null}
                  </Form>
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
                        <div className="flex gap-1.5 items-center">
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
              {Object.entries(organizations).map(([key, value]) => {
                return value.active && value.organizations.length > 0 ? (
                  <div key={`${key}-organizations`}>
                    <p className="text-sm text-neutral-700 mb-6">
                      {
                        locales.route.organizations.subline[
                          key as keyof typeof organizations
                        ]
                      }
                    </p>
                    <Form
                      {...getFormProps(quitOrganizationForm)}
                      method="post"
                      preventScrollReset
                    >
                      <CardContainer type="multi row" justification="start">
                        {value.organizations.map((organization) => {
                          const doubleCheckModalSearchParams =
                            new URLSearchParams(searchParams);
                          doubleCheckModalSearchParams.set(
                            `modal-quit-organization-${key}-${organization.id}`,
                            "true"
                          );
                          doubleCheckModalSearchParams.delete(
                            `overlay-menu-${key}-${organization.id}`
                          );
                          return (
                            <OrganizationCard
                              key={`${key}-organization-${organization.id}`}
                              organization={organization}
                              locales={locales}
                              prefetch="intent"
                            >
                              <OrganizationCard.Controls>
                                <OverlayMenu
                                  searchParam={`overlay-menu-${key}-${organization.id}`}
                                >
                                  {key === "admin" ? (
                                    <OverlayMenu.ListItem
                                      key={`edit-organization-${organization.slug}`}
                                    >
                                      <Link
                                        {...OverlayMenu.getListChildrenStyles()}
                                        {...OverlayMenu.getIdToFocusWhenOpening()}
                                        to={`/organization/${organization.slug}/settings/general`}
                                        prefetch="intent"
                                      >
                                        <svg
                                          width="20"
                                          height="20"
                                          viewBox="0 0 20 20"
                                          fill="none"
                                          xmlns="http://www.w3.org/2000/svg"
                                        >
                                          <path
                                            d="M15.1831 0.183058C15.4272 -0.0610194 15.8229 -0.0610194 16.067 0.183058L19.817 3.93306C20.061 4.17714 20.061 4.57286 19.817 4.81694L7.31696 17.3169C7.25711 17.3768 7.18573 17.4239 7.10714 17.4553L0.857137 19.9553C0.625002 20.0482 0.359866 19.9937 0.183076 19.8169C0.00628736 19.6402 -0.0481339 19.375 0.0447203 19.1429L2.54472 12.8929C2.57616 12.8143 2.62323 12.7429 2.68308 12.6831L15.1831 0.183058ZM14.0089 3.125L16.875 5.99112L18.4911 4.375L15.625 1.50888L14.0089 3.125ZM15.9911 6.875L13.125 4.00888L5.00002 12.1339V12.5H5.62502C5.9702 12.5 6.25002 12.7798 6.25002 13.125V13.75H6.87502C7.2202 13.75 7.50002 14.0298 7.50002 14.375V15H7.86613L15.9911 6.875ZM3.78958 13.3443L3.65767 13.4762L1.74693 18.2531L6.52379 16.3423L6.6557 16.2104C6.41871 16.1216 6.25002 15.893 6.25002 15.625V15H5.62502C5.27984 15 5.00002 14.7202 5.00002 14.375V13.75H4.37502C4.10701 13.75 3.87841 13.5813 3.78958 13.3443Z"
                                            fill="CurrentColor"
                                          />
                                        </svg>
                                        <span>
                                          {locales.organizationCard.edit}
                                        </span>
                                      </Link>
                                    </OverlayMenu.ListItem>
                                  ) : null}
                                  {key === "admin" ? (
                                    <OverlayMenu.Divider key="edit-quit-divider" />
                                  ) : null}
                                  <OverlayMenu.ListItem
                                    key={`quit-organization-${organization.slug}`}
                                  >
                                    <Link
                                      {...OverlayMenu.getListChildrenStyles()}
                                      to={`?${doubleCheckModalSearchParams.toString()}`}
                                      preventScrollReset
                                      prefetch="intent"
                                    >
                                      <svg
                                        width="20"
                                        height="20"
                                        viewBox="0 0 20 20"
                                        fill="none"
                                        xmlns="http://www.w3.org/2000/svg"
                                      >
                                        <path
                                          d="M10.625 12.5C10.2798 12.5 10 11.9404 10 11.25C10 10.5596 10.2798 10 10.625 10C10.9702 10 11.25 10.5596 11.25 11.25C11.25 11.9404 10.9702 12.5 10.625 12.5Z"
                                          fill="CurrentColor"
                                        />
                                        <path
                                          d="M13.5345 0.152845C13.6714 0.271556 13.75 0.443822 13.75 0.625004V1.25H14.375C15.4105 1.25 16.25 2.08947 16.25 3.125V18.75H18.125C18.4702 18.75 18.75 19.0298 18.75 19.375C18.75 19.7202 18.4702 20 18.125 20H1.875C1.52982 20 1.25 19.7202 1.25 19.375C1.25 19.0298 1.52982 18.75 1.875 18.75H3.75V1.875C3.75 1.56397 3.97871 1.30027 4.28661 1.25629L13.0366 0.00628568C13.216 -0.0193374 13.3976 0.0341345 13.5345 0.152845ZM14.375 2.5H13.75V18.75H15V3.125C15 2.77983 14.7202 2.5 14.375 2.5ZM5 2.41706V18.75H12.5V1.34564L5 2.41706Z"
                                          fill="CurrentColor"
                                        />
                                      </svg>

                                      <span>
                                        {locales.organizationCard.quit}
                                      </span>
                                    </Link>
                                  </OverlayMenu.ListItem>
                                </OverlayMenu>
                                <Modal
                                  searchParam={`modal-quit-organization-${key}-${organization.id}`}
                                >
                                  <Modal.Title>
                                    {
                                      locales.route.quit.modal[
                                        key as keyof typeof organizations
                                      ].headline
                                    }
                                  </Modal.Title>
                                  <Modal.Section>
                                    <p>
                                      {insertComponentsIntoLocale(
                                        insertParametersIntoLocale(
                                          locales.route.quit.modal[
                                            key as keyof typeof organizations
                                          ].subline,
                                          {
                                            name: organization.name,
                                          }
                                        ),
                                        [
                                          <span
                                            key="highlighted-organization-name"
                                            className="font-semibold"
                                          />,
                                        ]
                                      )}
                                    </p>
                                  </Modal.Section>
                                  <Modal.Section>
                                    {typeof quitOrganizationForm.errors !==
                                      "undefined" &&
                                    quitOrganizationForm.errors.length > 0 ? (
                                      <div>
                                        {quitOrganizationForm.errors.map(
                                          (error, index) => {
                                            return (
                                              <div
                                                id={
                                                  quitOrganizationForm.errorId
                                                }
                                                key={index}
                                                className="text-sm font-semibold text-negative-600"
                                              >
                                                {error}
                                              </div>
                                            );
                                          }
                                        )}
                                      </div>
                                    ) : null}
                                  </Modal.Section>
                                  <Modal.SubmitButton
                                    form={quitOrganizationForm.id}
                                    type="submit"
                                    name="intent"
                                    value={`quit-organization-${key}-${organization.id}`}
                                    disabled={
                                      isHydrated === true
                                        ? quitOrganizationForm.valid ===
                                            false || isSubmitting
                                        : false
                                    }
                                  >
                                    {
                                      locales.route.quit.modal[
                                        key as keyof typeof organizations
                                      ].cta
                                    }
                                  </Modal.SubmitButton>
                                  <Modal.CloseButton>
                                    {locales.route.quit.modal.cancelCta}
                                  </Modal.CloseButton>
                                </Modal>
                              </OrganizationCard.Controls>
                            </OrganizationCard>
                          );
                        })}
                      </CardContainer>
                    </Form>
                  </div>
                ) : null;
              })}
            </Section>
          ) : null}
        </div>
      </div>
    </>
  );
}
