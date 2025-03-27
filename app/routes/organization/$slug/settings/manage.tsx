import { getFormProps, getInputProps, useForm } from "@conform-to/react-v1";
import { getZodConstraint, parseWithZod } from "@conform-to/zod-v1";
import { Button } from "@mint-vernetzt/components/src/molecules/Button";
import { Chip } from "@mint-vernetzt/components/src/molecules/Chip";
import { Input } from "@mint-vernetzt/components/src/molecules/Input";
import { Controls } from "@mint-vernetzt/components/src/organisms/containers/Controls";
import { Section } from "@mint-vernetzt/components/src/organisms/containers/Section";
import {
  type ActionFunctionArgs,
  type LoaderFunctionArgs,
  redirect,
} from "react-router";
import {
  Form,
  Link,
  useActionData,
  useFetcher,
  useLoaderData,
  useLocation,
  useNavigation,
  useSearchParams,
} from "react-router";
import { useHydrated } from "remix-utils/use-hydrated";
import { z } from "zod";
import { createAuthClient, getSessionUser } from "~/auth.server";
import { BackButton } from "~/components-next/BackButton";
import { ConformSelect } from "~/components-next/ConformSelect";
import { ListContainer } from "~/components-next/ListContainer";
import { ListItem } from "~/components-next/ListItem";
import { Modal } from "~/components-next/Modal";
import {
  searchNetworkMembersSchema,
  searchNetworksSchema,
} from "~/form-helpers";
import { detectLanguage } from "~/i18n.server";
import { useUnsavedChangesBlockerWithModal } from "~/lib/hooks/useUnsavedChangesBlockerWithModal";
import {
  decideBetweenSingularOrPlural,
  insertParametersIntoLocale,
} from "~/lib/utils/i18n";
import { invariant, invariantResponse } from "~/lib/utils/response";
import { getParamValueOrThrow } from "~/lib/utils/routes";
import {
  Deep,
  SearchNetworkMembers,
  SearchNetworks,
  SearchOrganizations,
} from "~/lib/utils/searchParams";
import { languageModuleMap } from "~/locales/.server";
import { prismaClient } from "~/prisma.server";
import { getRedirectPathOnProtectedOrganizationRoute } from "~/routes/organization/$slug/utils.server";
import { searchOrganizations } from "~/routes/utils.server";
import { redirectWithToast } from "~/toast.server";
import { deriveMode, createHashFromObject } from "~/utils.server";
import {
  updateNetworkMemberInvite,
  getOrganizationWithNetworksAndNetworkMembers,
  updateJoinNetworkRequest,
  leaveNetwork,
  removeNetworkMember,
  updateOrganization,
} from "./manage.server";
import { QuestionMark } from "~/components-next/icons/QuestionMark";

export const manageSchema = z.object({
  organizationTypes: z.array(z.string().uuid()),
  networkTypes: z.array(z.string().uuid()),
});

export const updateNetworkSchema = z.object({
  organizationId: z.string(),
});

export async function loader(args: LoaderFunctionArgs) {
  const { request, params } = args;
  const language = await detectLanguage(request);
  const locales =
    languageModuleMap[language]["organization/$slug/settings/manage"];

  const { authClient } = createAuthClient(request);
  const sessionUser = await getSessionUser(authClient);
  const mode = deriveMode(sessionUser);

  // check slug exists (throw bad request if not)
  invariantResponse(
    params.slug !== undefined,
    locales.route.error.invalidRoute,
    {
      status: 400,
    }
  );

  const organization = await getOrganizationWithNetworksAndNetworkMembers({
    slug: params.slug,
    authClient,
  });
  invariantResponse(organization !== null, locales.route.error.notFound, {
    status: 404,
  });

  const allOrganizationTypes = await prismaClient.organizationType.findMany({
    select: {
      id: true,
      slug: true,
    },
  });

  const allNetworkTypes = await prismaClient.networkType.findMany({
    select: {
      id: true,
      slug: true,
    },
  });

  const searchParams = new URL(request.url).searchParams;
  const networkSearchParams = new URLSearchParams(searchParams);
  const searchNetworksParam = networkSearchParams.get(SearchNetworks);
  if (searchNetworksParam !== null) {
    networkSearchParams.append(SearchOrganizations, searchNetworksParam);
    networkSearchParams.delete(SearchNetworks);
  }
  const {
    searchedOrganizations: searchedNetworks,
    submission: searchNetworksSubmission,
  } = await searchOrganizations({
    searchParams: networkSearchParams,
    authClient,
    locales,
    mode,
  });

  const networkMemberSearchParams = new URLSearchParams(searchParams);
  const searchNetworkMembersParam =
    networkMemberSearchParams.get(SearchNetworkMembers);
  if (searchNetworkMembersParam !== null) {
    networkMemberSearchParams.append(
      SearchOrganizations,
      searchNetworkMembersParam
    );
    networkMemberSearchParams.delete(SearchNetworkMembers);
  }
  const {
    searchedOrganizations: searchedNetworkMembers,
    submission: searchNetworkMembersSubmission,
  } = await searchOrganizations({
    searchParams: networkMemberSearchParams,
    authClient,
    locales,
    mode,
  });

  const currentTimestamp = Date.now();

  const currentHash = createHashFromObject(organization);

  return {
    organization,
    allOrganizationTypes,
    allNetworkTypes,
    searchedNetworks,
    searchNetworksSubmission,
    searchedNetworkMembers,
    searchNetworkMembersSubmission,
    currentTimestamp,
    currentHash,
    locales,
  };
}

export async function action(args: ActionFunctionArgs) {
  const { request, params } = args;
  const slug = getParamValueOrThrow(params, "slug");
  const { authClient } = createAuthClient(request);
  const sessionUser = await getSessionUser(authClient);
  const language = await detectLanguage(request);
  const locales =
    languageModuleMap[language]["organization/$slug/settings/manage"];

  const redirectPath = await getRedirectPathOnProtectedOrganizationRoute({
    request,
    slug,
    sessionUser,
    authClient,
  });
  if (redirectPath !== null) {
    return redirect(redirectPath);
  }

  invariantResponse(slug !== undefined, locales.route.error.invalidRoute, {
    status: 400,
  });
  const [organization, organizationTypeNetwork] =
    await prismaClient.$transaction([
      prismaClient.organization.findFirst({
        where: { slug },
        select: {
          id: true,
          name: true,
          types: {
            select: {
              organizationType: {
                select: {
                  id: true,
                },
              },
            },
          },
          networkMembers: {
            select: {
              networkMember: {
                select: {
                  id: true,
                },
              },
            },
          },
        },
      }),
      prismaClient.organizationType.findFirst({
        select: {
          id: true,
        },
        where: {
          slug: "network",
        },
      }),
    ]);
  invariantResponse(organization !== null, locales.route.error.notFound, {
    status: 404,
  });
  invariantResponse(
    organizationTypeNetwork !== null,
    locales.route.error.organizationTypeNetworkNotFound,
    { status: 404 }
  );

  let result;
  const formData = await request.formData();
  // This intent is used for field list manipulation by conform
  const conformIntent = formData.get("__intent__");
  if (conformIntent !== null) {
    const submission = await parseWithZod(formData, { schema: manageSchema });
    return {
      submission: submission.reply(),
    };
  }
  const intent = formData.get("intent");
  invariantResponse(
    typeof intent === "string",
    locales.route.error.noStringIntent,
    {
      status: 400,
    }
  );

  if (intent === "submit") {
    result = await updateOrganization({
      formData,
      organization,
      organizationTypeNetwork,
      locales,
    });
  } else if (intent.startsWith("request-to-join-network-")) {
    const requestToJoinNetworkFormData = new FormData();
    requestToJoinNetworkFormData.set(
      "organizationId",
      intent.replace("request-to-join-network-", "")
    );
    result = await updateJoinNetworkRequest({
      formData: requestToJoinNetworkFormData,
      organization,
      intent: "requestToJoinNetwork",
      locales,
    });
  } else if (intent.startsWith("cancel-network-join-request-")) {
    const cancelNetworkJoinRequestFormData = new FormData();
    cancelNetworkJoinRequestFormData.set(
      "organizationId",
      intent.replace("cancel-network-join-request-", "")
    );
    result = await updateJoinNetworkRequest({
      formData: cancelNetworkJoinRequestFormData,
      organization,
      intent: "cancelNetworkJoinRequest",
      locales,
    });
  } else if (intent.startsWith("leave-network-")) {
    const leaveNetworkFormData = new FormData();
    leaveNetworkFormData.set(
      "organizationId",
      intent.replace("leave-network-", "")
    );
    result = await leaveNetwork({
      formData: leaveNetworkFormData,
      organization,
      locales,
    });
  } else if (intent.startsWith("invite-network-member-")) {
    const inviteNetworkMemberFormData = new FormData();
    inviteNetworkMemberFormData.set(
      "organizationId",
      intent.replace("invite-network-member-", "")
    );
    result = await updateNetworkMemberInvite({
      formData: inviteNetworkMemberFormData,
      organization,
      organizationTypeNetwork,
      intent: "inviteNetworkMember",
      locales,
    });
  } else if (intent.startsWith("cancel-network-member-invitation-")) {
    const cancelNetworkMemberInvitationFormData = new FormData();
    cancelNetworkMemberInvitationFormData.set(
      "organizationId",
      intent.replace("cancel-network-member-invitation-", "")
    );
    result = await updateNetworkMemberInvite({
      formData: cancelNetworkMemberInvitationFormData,
      organization,
      organizationTypeNetwork,
      intent: "cancelNetworkMemberInvitation",
      locales,
    });
  } else if (intent.startsWith("remove-network-member-")) {
    const removeNetworkMemberFormData = new FormData();
    removeNetworkMemberFormData.set(
      "organizationId",
      intent.replace("remove-network-member-", "")
    );
    result = await removeNetworkMember({
      formData: removeNetworkMemberFormData,
      organization,
      locales,
    });
  } else {
    invariantResponse(false, locales.route.error.wrongIntent, {
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
    if (searchParams.get("modal-network-remove") === "true") {
      searchParams.delete("modal-network-remove");
    }
    const redirectUrl = `${process.env.COMMUNITY_BASE_URL}${
      url.pathname
    }?${searchParams.toString()}`;
    return redirectWithToast(redirectUrl, result.toast);
  }
  return { submission: result.submission, currentTimestamp: Date.now() };
}

function Manage() {
  const loaderData = useLoaderData<typeof loader>();
  const {
    organization,
    allOrganizationTypes,
    allNetworkTypes,
    searchNetworksSubmission,
    searchNetworkMembersSubmission,
    locales,
  } = loaderData;
  const actionData = useActionData<typeof action>();
  const searchNetworksFetcher = useFetcher<typeof loader>();
  const searchedNetworks =
    searchNetworksFetcher.data !== undefined
      ? searchNetworksFetcher.data.searchedNetworks
      : loaderData.searchedNetworks;
  const searchNetworkMembersFetcher = useFetcher<typeof loader>();
  const searchedNetworkMembers =
    searchNetworkMembersFetcher.data !== undefined
      ? searchNetworkMembersFetcher.data.searchedNetworkMembers
      : loaderData.searchedNetworkMembers;

  const location = useLocation();
  const isHydrated = useHydrated();
  const navigation = useNavigation();
  const [searchParams] = useSearchParams();
  const doubleCheckModalSearchParams = new URLSearchParams(searchParams);
  doubleCheckModalSearchParams.set("modal-network-remove", "true");

  const {
    types: organizationTypes,
    networkTypes,
    sentNetworkJoinRequests,
    memberOf,
    sentNetworkJoinInvites,
    networkMembers,
  } = organization;

  const defaultValues = {
    organizationTypes: organizationTypes.map(
      (relation) => relation.organizationType.id
    ),
    networkTypes: networkTypes.map((relation) => relation.networkType.id),
  };

  const [manageForm, manageFields] = useForm({
    id: `manage-form-${actionData?.currentTimestamp || loaderData.currentHash}`,
    constraint: getZodConstraint(manageSchema),
    defaultValue: defaultValues,
    shouldValidate: "onInput",
    shouldRevalidate: "onInput",
    lastResult: navigation.state === "idle" ? actionData?.submission : null,
    onValidate: (args) => {
      const { formData } = args;
      const submission = parseWithZod(formData, {
        schema: () =>
          manageSchema.transform((data, ctx) => {
            const { networkTypes } = data;
            const organizationTypeNetwork = allOrganizationTypes.find(
              (organizationType) => {
                return organizationType.slug === "network";
              }
            );
            invariant(
              typeof organizationTypeNetwork !== "undefined",
              "Organization type network not found"
            );
            if (hasSelectedNetwork === true && networkTypes.length === 0) {
              ctx.addIssue({
                code: "custom",
                message: locales.route.error.networkTypesRequired,
                path: ["networkTypes"],
              });
              return z.NEVER;
            }
            return { ...data };
          }),
      });
      return submission;
    },
  });

  const [searchNetworksForm, searchNetworksFields] = useForm({
    id: "search-networks",
    constraint: getZodConstraint(searchNetworksSchema(locales)),
    // Client side validation onInput, server side validation on submit
    shouldValidate: "onInput",
    onValidate: (values) => {
      return parseWithZod(values.formData, {
        schema: searchNetworksSchema(locales),
      });
    },
    shouldRevalidate: "onInput",
    lastResult: navigation.state === "idle" ? searchNetworksSubmission : null,
  });
  const clearNetworkQuerySearchParams = new URLSearchParams(searchParams);
  clearNetworkQuerySearchParams.delete(SearchNetworks);

  const [joinNetworkForm] = useForm({
    id: `request-to-join-network-${
      actionData?.currentTimestamp || loaderData.currentTimestamp
    }`,
    lastResult: navigation.state === "idle" ? actionData?.submission : null,
  });

  const [leaveNetworkForm] = useForm({
    id: `leave-network-${
      actionData?.currentTimestamp || loaderData.currentTimestamp
    }`,
    lastResult: navigation.state === "idle" ? actionData?.submission : null,
  });

  const [cancelNetworkJoinRequestForm] = useForm({
    id: `cancel-network-join-request-${
      actionData?.currentTimestamp || loaderData.currentTimestamp
    }`,
    lastResult: navigation.state === "idle" ? actionData?.submission : null,
  });

  const [searchNetworkMembersForm, searchNetworkMembersFields] = useForm({
    id: "search-network-members",
    constraint: getZodConstraint(searchNetworkMembersSchema(locales)),
    // Client side validation onInput, server side validation on submit
    shouldValidate: "onInput",
    onValidate: (values) => {
      return parseWithZod(values.formData, {
        schema: searchNetworkMembersSchema(locales),
      });
    },
    shouldRevalidate: "onInput",
    lastResult:
      navigation.state === "idle" ? searchNetworkMembersSubmission : null,
  });
  const clearNetworkMemberQuerySearchParams = new URLSearchParams(searchParams);
  clearNetworkMemberQuerySearchParams.delete(SearchNetworks);

  const [addNetworkMemberForm] = useForm({
    id: `invite-network-member-${
      actionData?.currentTimestamp || loaderData.currentTimestamp
    }`,
    lastResult: navigation.state === "idle" ? actionData?.submission : null,
  });

  const [removeNetworkMemberForm] = useForm({
    id: `remove-network-member-${
      actionData?.currentTimestamp || loaderData.currentTimestamp
    }`,
    lastResult: navigation.state === "idle" ? actionData?.submission : null,
  });

  const [cancelNetworkJoinInviteForm] = useForm({
    id: `cancel-network-member-invitation-${
      actionData?.currentTimestamp || loaderData.currentTimestamp
    }`,
    lastResult: navigation.state === "idle" ? actionData?.submission : null,
  });

  const organizationTypeList = manageFields.organizationTypes.getFieldList();
  let networkTypeList = manageFields.networkTypes.getFieldList();
  const organizationTypeNetwork = allOrganizationTypes.find(
    (organizationType) => {
      return organizationType.slug === "network";
    }
  );
  invariant(
    typeof organizationTypeNetwork !== "undefined",
    "Organization type network not found"
  );
  const hasSelectedNetwork = organizationTypeList.some((organizationType) => {
    if (typeof organizationType.initialValue === "undefined") {
      return false;
    }
    return organizationType.initialValue === organizationTypeNetwork.id;
  });
  if (hasSelectedNetwork === false) {
    networkTypeList = [];
  }
  const isNetwork = organization.types.some((relation) => {
    return relation.organizationType.id === organizationTypeNetwork.id;
  });

  const UnsavedChangesBlockerModal = useUnsavedChangesBlockerWithModal({
    searchParam: "modal-unsaved-changes",
    formMetadataToCheck: manageForm,
    locales,
  });

  return (
    <>
      <Section>
        {UnsavedChangesBlockerModal}
        <BackButton to={location.pathname}>
          {locales.route.content.headline}
        </BackButton>
        <Form
          {...getFormProps(manageForm)}
          method="post"
          preventScrollReset
          autoComplete="off"
          hidden
        />
        <div className="mv-flex mv-flex-col mv-gap-6 @md:mv-gap-4">
          <div className="mv-flex mv-flex-col mv-gap-4 @md:mv-p-4 @md:mv-border @md:mv-rounded-lg @md:mv-border-gray-200">
            <div className="mv-flex mv-flex-col mv-gap-6">
              <div className="mv-flex mv-flex-col mv-gap-4">
                <div className="mv-flex mv-items-center mv-justify-between">
                  <h2 className="mv-text-primary mv-text-lg mv-font-semibold mv-mb-0">
                    {locales.route.content.types.headline}
                  </h2>
                  <Link
                    // TODO: Link to specific question when its available
                    to="/help"
                    className="mv-grid mv-grid-cols-1 mv-grid-rows-1 mv-pl-[1px] mv-pt-[1px] mv-place-items-center mv-rounded-full mv-text-primary mv-w-5 mv-h-5 mv-border mv-border-primary mv-bg-neutral-50 hover:mv-bg-primary-50 focus:mv-bg-primary-50 active:mv-bg-primary-100"
                  >
                    <QuestionMark />
                  </Link>
                </div>
                <ConformSelect
                  id={manageFields.organizationTypes.id}
                  cta={locales.route.content.types.option}
                >
                  <ConformSelect.Label
                    htmlFor={manageFields.organizationTypes.id}
                  >
                    {locales.route.content.types.label}
                  </ConformSelect.Label>
                  {typeof manageFields.organizationTypes.errors !==
                    "undefined" &&
                  manageFields.organizationTypes.errors.length > 0 ? (
                    manageFields.organizationTypes.errors.map((error) => (
                      <ConformSelect.Error
                        id={manageFields.organizationTypes.errorId}
                        key={error}
                      >
                        {error}
                      </ConformSelect.Error>
                    ))
                  ) : (
                    <ConformSelect.HelperText>
                      {locales.route.content.types.helper}
                    </ConformSelect.HelperText>
                  )}
                  {allOrganizationTypes
                    .filter((organizationType) => {
                      return !organizationTypeList.some((field) => {
                        return field.initialValue === organizationType.id;
                      });
                    })
                    .map((organizationType) => {
                      let title;
                      if (organizationType.slug in locales.organizationTypes) {
                        type LocaleKey = keyof typeof locales.organizationTypes;
                        title =
                          locales.organizationTypes[
                            organizationType.slug as LocaleKey
                          ].title;
                      } else {
                        console.error(
                          `Organization type ${organizationType.slug} not found in locales`
                        );
                        title = organizationType.slug;
                      }
                      return (
                        <button
                          key={organizationType.id}
                          {...manageForm.insert.getButtonProps({
                            name: manageFields.organizationTypes.name,
                            defaultValue: organizationType.id,
                          })}
                          className="mv-text-start mv-w-full mv-py-1 mv-px-2"
                        >
                          {title}
                        </button>
                      );
                    })}
                </ConformSelect>
                {organizationTypeList.length > 0 && (
                  <Chip.Container>
                    {organizationTypeList.map((field, index) => {
                      const organizationTypeSlug = allOrganizationTypes.find(
                        (organizationType) => {
                          return organizationType.id === field.initialValue;
                        }
                      )?.slug;
                      let title;
                      if (organizationTypeSlug === undefined) {
                        console.error(
                          `Organization type with id ${field.id} not found in allTypes`
                        );
                        title = null;
                      } else {
                        if (organizationTypeSlug in locales.organizationTypes) {
                          type LocaleKey =
                            keyof typeof locales.organizationTypes;
                          title =
                            locales.organizationTypes[
                              organizationTypeSlug as LocaleKey
                            ].title;
                        } else {
                          console.error(
                            `Organization type ${organizationTypeSlug} not found in locales`
                          );
                          title = organizationTypeSlug;
                        }
                      }
                      return (
                        <Chip key={field.key}>
                          <input
                            {...getInputProps(field, { type: "hidden" })}
                            key="organizationTypes"
                          />
                          {title || locales.route.content.notFound}
                          <Chip.Delete>
                            <button
                              {...manageForm.remove.getButtonProps({
                                name: manageFields.organizationTypes.name,
                                index,
                              })}
                            />
                          </Chip.Delete>
                        </Chip>
                      );
                    })}
                  </Chip.Container>
                )}
              </div>
              <div className="mv-flex mv-flex-col mv-gap-4">
                <div className="mv-flex mv-items-center mv-justify-between">
                  <h2
                    className={`mv-text-lg mv-font-semibold mv-mb-0 ${
                      hasSelectedNetwork === false
                        ? "mv-text-neutral-300"
                        : "mv-text-primary"
                    }`}
                  >
                    {locales.route.content.networkTypes.headline}
                  </h2>
                  <Link
                    // TODO: Link to specific question when its available
                    to="/help"
                    className="mv-grid mv-grid-cols-1 mv-grid-rows-1 mv-pl-[1px] mv-pt-[1px] mv-place-items-center mv-rounded-full mv-text-primary mv-w-5 mv-h-5 mv-border mv-border-primary mv-bg-neutral-50 hover:mv-bg-primary-50 focus:mv-bg-primary-50 active:mv-bg-primary-100"
                  >
                    <QuestionMark />
                  </Link>
                </div>
                <ConformSelect
                  id={manageFields.networkTypes.id}
                  cta={locales.route.content.networkTypes.option}
                  disabled={hasSelectedNetwork === false}
                >
                  <ConformSelect.Label htmlFor={manageFields.networkTypes.id}>
                    <span
                      className={
                        hasSelectedNetwork === false
                          ? "mv-text-neutral-300"
                          : ""
                      }
                    >
                      {locales.route.content.networkTypes.label}
                    </span>
                  </ConformSelect.Label>

                  {typeof manageFields.networkTypes.errors !== "undefined" &&
                  manageFields.networkTypes.errors.length > 0 ? (
                    manageFields.networkTypes.errors.map((error) => (
                      <ConformSelect.Error
                        id={manageFields.networkTypes.errorId}
                        key={error}
                      >
                        {error}
                      </ConformSelect.Error>
                    ))
                  ) : (
                    <ConformSelect.HelperText>
                      {hasSelectedNetwork === false
                        ? locales.route.content.networkTypes
                            .helperWithoutNetwork
                        : locales.route.content.networkTypes.helper}
                    </ConformSelect.HelperText>
                  )}
                  {allNetworkTypes
                    .filter((networkType) => {
                      return !networkTypeList.some((field) => {
                        return field.initialValue === networkType.id;
                      });
                    })
                    .map((filteredNetworkType) => {
                      let title;
                      if (filteredNetworkType.slug in locales.networkTypes) {
                        type LocaleKey = keyof typeof locales.networkTypes;
                        title =
                          locales.networkTypes[
                            filteredNetworkType.slug as LocaleKey
                          ].title;
                      } else {
                        console.error(
                          `Network type ${filteredNetworkType.slug} not found in locales`
                        );
                        title = filteredNetworkType.slug;
                      }
                      return (
                        <button
                          {...manageForm.insert.getButtonProps({
                            name: manageFields.networkTypes.name,
                            defaultValue: filteredNetworkType.id,
                          })}
                          form={manageForm.id}
                          key={filteredNetworkType.id}
                          disabled={!hasSelectedNetwork}
                          className="mv-text-start mv-w-full mv-py-1 mv-px-2"
                        >
                          {title}
                        </button>
                      );
                    })}
                </ConformSelect>
                {networkTypeList.length > 0 && (
                  <Chip.Container>
                    {networkTypeList.map((field, index) => {
                      const networkTypeSlug = allNetworkTypes.find(
                        (networkType) => {
                          return networkType.id === field.initialValue;
                        }
                      )?.slug;
                      let title;
                      if (networkTypeSlug === undefined) {
                        console.error(
                          `Network type with id ${field.id} not found in allNetworkTypes`
                        );
                        title = null;
                      } else {
                        if (networkTypeSlug in locales.networkTypes) {
                          type LocaleKey = keyof typeof locales.networkTypes;
                          title =
                            locales.networkTypes[networkTypeSlug as LocaleKey]
                              .title;
                        } else {
                          console.error(
                            `Network type ${networkTypeSlug} not found in locales`
                          );
                          title = networkTypeSlug;
                        }
                      }
                      return (
                        <Chip key={field.key}>
                          <input
                            {...getInputProps(field, {
                              type: "hidden",
                            })}
                            key="networkTypes"
                          />
                          {title || locales.route.content.notFound}
                          <Chip.Delete>
                            <button
                              {...manageForm.remove.getButtonProps({
                                name: manageFields.networkTypes.name,
                                index,
                              })}
                            />
                          </Chip.Delete>
                        </Chip>
                      );
                    })}
                  </Chip.Container>
                )}
                {typeof manageForm.errors !== "undefined" &&
                manageForm.errors.length > 0 ? (
                  <div>
                    {manageForm.errors.map((error, index) => {
                      return (
                        <div
                          id={manageForm.errorId}
                          key={index}
                          className="mv-text-sm mv-font-semibold mv-text-negative-600"
                        >
                          {error}
                        </div>
                      );
                    })}
                  </div>
                ) : null}
              </div>
            </div>
            <div className="mv-flex mv-w-full mv-items-center mv-justify-center @xl:mv-justify-end">
              <div className="mv-flex mv-flex-col mv-w-full @xl:mv-w-fit mv-gap-2">
                <Controls>
                  <div className="mv-relative mv-w-full">
                    <Button
                      form={manageForm.id}
                      type="reset"
                      onClick={() => {
                        setTimeout(() => manageForm.reset(), 0);
                      }}
                      variant="outline"
                      fullSize
                      disabled={isHydrated ? manageForm.dirty === false : false}
                    >
                      {locales.route.form.reset}
                    </Button>
                    <noscript className="mv-absolute mv-top-0">
                      <Button as="a" href="./manage" variant="outline" fullSize>
                        {locales.route.form.reset}
                      </Button>
                    </noscript>
                  </div>
                  {isNetwork === true &&
                  hasSelectedNetwork === false &&
                  networkMembers.length > 0 ? (
                    <>
                      <Button
                        fullSize
                        className="mv-pb-0 mv-pt-0 mv-pl-0 mv-pr-0"
                        // Don't disable button when js is disabled
                        disabled={
                          isHydrated
                            ? manageForm.dirty === false ||
                              manageForm.valid === false
                            : false
                        }
                      >
                        <Link
                          to={`?${doubleCheckModalSearchParams.toString()}`}
                          className="mv-w-full mv-h-full mv-flex mv-justify-center mv-items-center"
                          // preventScrollReset
                        >
                          <span>{locales.route.form.submit}</span>
                        </Link>
                      </Button>
                      <Modal searchParam="modal-network-remove">
                        <Modal.Title>
                          {locales.route.content.types.doubleCheck.title}
                        </Modal.Title>
                        <Modal.Section>
                          {insertParametersIntoLocale(
                            locales.route.content.types.doubleCheck.description,
                            {
                              organizations: networkMembers
                                .map((relation) => {
                                  return relation.networkMember.name;
                                })
                                .join(", "),
                            }
                          )}
                        </Modal.Section>
                        <Modal.SubmitButton
                          form={manageForm.id}
                          name="intent"
                          value="submit"
                        >
                          {locales.route.content.types.doubleCheck.submit}
                        </Modal.SubmitButton>
                        <Modal.CloseButton>
                          {locales.route.content.types.doubleCheck.abort}
                        </Modal.CloseButton>
                      </Modal>
                    </>
                  ) : (
                    <Button
                      form={manageForm.id}
                      type="submit"
                      name="intent"
                      value="submit"
                      fullSize
                      // Don't disable button when js is disabled
                      disabled={
                        isHydrated
                          ? manageForm.dirty === false ||
                            manageForm.valid === false
                          : false
                      }
                    >
                      {locales.route.form.submit}
                    </Button>
                  )}
                </Controls>
              </div>
            </div>
          </div>
          {/* Current Network Members and Remove Network Member Section */}
          <div className="mv-flex mv-flex-col mv-gap-4 @md:mv-p-4 @md:mv-border @md:mv-rounded-lg @md:mv-border-gray-200">
            <h2
              className={`mv-text-lg mv-font-semibold mv-mb-0 ${
                isNetwork === false ? "mv-text-neutral-300" : "mv-text-primary"
              }`}
            >
              {decideBetweenSingularOrPlural(
                locales.route.content.networkMembers.current.headline_one,
                locales.route.content.networkMembers.current.headline_other,
                networkMembers.length
              )}
            </h2>
            <p
              className={
                isNetwork === false ? "mv-text-neutral-300" : undefined
              }
            >
              {decideBetweenSingularOrPlural(
                locales.route.content.networkMembers.current.subline_one,
                locales.route.content.networkMembers.current.subline_other,
                networkMembers.length
              )}
            </p>
            {networkMembers.length > 0 ? (
              <Form
                {...getFormProps(removeNetworkMemberForm)}
                method="post"
                preventScrollReset
              >
                <ListContainer
                  locales={locales}
                  listKey="network-members"
                  hideAfter={3}
                >
                  {networkMembers.map((relation, index) => {
                    return (
                      <ListItem
                        key={`network-member-${relation.networkMember.slug}`}
                        entity={relation.networkMember}
                        locales={locales}
                        listIndex={index}
                        hideAfter={3}
                      >
                        <Button
                          name="intent"
                          variant="outline"
                          value={`remove-network-member-${relation.networkMember.id}`}
                          type="submit"
                          fullSize
                          disabled={isNetwork === false}
                        >
                          {
                            locales.route.content.networkMembers.current.remove
                              .cta
                          }
                        </Button>
                      </ListItem>
                    );
                  })}
                </ListContainer>
                {typeof removeNetworkMemberForm.errors !== "undefined" &&
                removeNetworkMemberForm.errors.length > 0 ? (
                  <div>
                    {removeNetworkMemberForm.errors.map((error, index) => {
                      return (
                        <div
                          id={removeNetworkMemberForm.errorId}
                          key={index}
                          className="mv-text-sm mv-font-semibold mv-text-negative-600"
                        >
                          {error}
                        </div>
                      );
                    })}
                  </div>
                ) : null}
              </Form>
            ) : (
              <div
                className={`mv-w-full mv-p-4 mv-text-center mv-bg-neutral-100 mv-border mv-border-neutral-200 mv-rounded-lg mv-text-base leading-5 mv-font-normal ${
                  isNetwork === false
                    ? "mv-text-neutral-300"
                    : "mv-text-neutral-700"
                }`}
              >
                {locales.route.content.networkMembers.current.blankState}
              </div>
            )}
            {/* Search Network Members To Invite Section */}
            <h2
              className={`mv-text-lg mv-font-semibold mv-mb-0 ${
                isNetwork === false ? "mv-text-neutral-300" : "mv-text-primary"
              }`}
            >
              {locales.route.content.networkMembers.invite.headline}
            </h2>
            <p className={isNetwork === false ? "mv-text-neutral-300" : ""}>
              {locales.route.content.networkMembers.invite.subline}
            </p>
            <searchNetworkMembersFetcher.Form
              {...getFormProps(searchNetworkMembersForm)}
              method="get"
              onChange={(event) => {
                searchNetworkMembersForm.validate();
                if (searchNetworkMembersForm.valid) {
                  searchNetworkMembersFetcher.submit(event.currentTarget, {
                    preventScrollReset: true,
                  });
                }
              }}
              autoComplete="off"
            >
              <Input name={Deep} defaultValue="true" type="hidden" />
              <Input
                name={SearchNetworks}
                defaultValue={searchParams.get(SearchNetworks) || undefined}
                type="hidden"
              />
              <Input
                {...getInputProps(
                  searchNetworkMembersFields[SearchNetworkMembers],
                  {
                    type: "search",
                  }
                )}
                defaultValue={
                  searchParams.get(SearchNetworkMembers) || undefined
                }
                disabled={isNetwork === false}
                key={searchNetworkMembersFields[SearchNetworkMembers].id}
                standalone
              >
                <Input.Label
                  htmlFor={searchNetworkMembersFields[SearchNetworkMembers].id}
                  disabled={isNetwork === false}
                >
                  {locales.route.content.networkMembers.invite.label}
                </Input.Label>
                {/* TODO: Replace search icon when new one is usable */}
                <Input.SearchIcon />

                {typeof searchNetworkMembersFields[SearchNetworkMembers]
                  .errors !== "undefined" &&
                searchNetworkMembersFields[SearchNetworkMembers].errors.length >
                  0 ? (
                  searchNetworkMembersFields[SearchNetworkMembers].errors.map(
                    (error) => (
                      <Input.Error
                        id={
                          searchNetworkMembersFields[SearchNetworkMembers]
                            .errorId
                        }
                        key={error}
                      >
                        {error}
                      </Input.Error>
                    )
                  )
                ) : (
                  <Input.HelperText>
                    {isNetwork !== false
                      ? locales.route.content.networkMembers.invite.helper
                      : locales.route.content.networkMembers.invite
                          .helperWithoutNetwork}
                  </Input.HelperText>
                )}
                <Input.ClearIcon formMetaData={searchNetworksForm} />
                {isHydrated === false ? (
                  <Input.Controls>
                    <noscript>
                      <Button
                        type="submit"
                        variant="outline"
                        disabled={isNetwork === false}
                      >
                        {locales.route.content.networkMembers.invite.searchCta}
                      </Button>
                    </noscript>
                  </Input.Controls>
                ) : null}
              </Input>
              {typeof searchNetworksForm.errors !== "undefined" &&
              searchNetworksForm.errors.length > 0 ? (
                <div>
                  {searchNetworksForm.errors.map((error, index) => {
                    return (
                      <div
                        id={searchNetworksForm.errorId}
                        key={index}
                        className="mv-text-sm mv-font-semibold mv-text-negative-600"
                      >
                        {error}
                      </div>
                    );
                  })}
                </div>
              ) : null}
            </searchNetworkMembersFetcher.Form>
            {isNetwork === true && searchedNetworkMembers.length > 0 ? (
              <Form
                {...getFormProps(addNetworkMemberForm)}
                method="post"
                preventScrollReset
              >
                <ListContainer
                  locales={locales}
                  listKey="network-member-search-results"
                  hideAfter={3}
                >
                  {searchedNetworkMembers.map((searchedOrganization, index) => {
                    return (
                      <ListItem
                        key={`network-member-search-result-${searchedOrganization.slug}`}
                        entity={searchedOrganization}
                        locales={locales}
                        listIndex={index}
                        hideAfter={3}
                      >
                        {networkMembers.some((relation) => {
                          return (
                            relation.networkMember.id ===
                            searchedOrganization.id
                          );
                        }) ? (
                          <div className="mv-w-full mv-text-center mv-text-nowrap mv-text-positive-600 mv-text-sm mv-font-semibold mv-leading-5">
                            {
                              locales.route.content.networkMembers.invite
                                .alreadyMember
                            }
                          </div>
                        ) : sentNetworkJoinInvites.some((relation) => {
                            return (
                              relation.organization.id ===
                              searchedOrganization.id
                            );
                          }) ? (
                          <div className="mv-w-full mv-text-center mv-text-nowrap mv-text-neutral-700 mv-text-sm mv-font-semibold mv-leading-5">
                            {
                              locales.route.content.networkMembers.invite
                                .alreadyInvited
                            }
                          </div>
                        ) : searchedOrganization.id === organization.id ? (
                          <div className="mv-w-full mv-text-center mv-text-nowrap mv-text-negative-700 mv-text-sm mv-font-semibold mv-leading-5">
                            {
                              locales.route.content.networkMembers.invite
                                .thisOrganization
                            }
                          </div>
                        ) : (
                          <Button
                            name="intent"
                            variant="outline"
                            value={`invite-network-member-${searchedOrganization.id}`}
                            type="submit"
                            fullSize
                          >
                            {locales.route.content.networkMembers.invite.cta}
                          </Button>
                        )}
                      </ListItem>
                    );
                  })}
                </ListContainer>
                {typeof addNetworkMemberForm.errors !== "undefined" &&
                addNetworkMemberForm.errors.length > 0 ? (
                  <div>
                    {addNetworkMemberForm.errors.map((error, index) => {
                      return (
                        <div
                          id={addNetworkMemberForm.errorId}
                          key={index}
                          className="mv-text-sm mv-font-semibold mv-text-negative-600"
                        >
                          {error}
                        </div>
                      );
                    })}
                  </div>
                ) : null}
              </Form>
            ) : null}
            {/* Pending invited network members section */}
            {sentNetworkJoinInvites.length > 0 ? (
              <>
                <h2 className="mv-text-primary mv-text-lg mv-font-semibold mv-mb-0">
                  {locales.route.content.networkMembers.pendingInvites.headline}
                </h2>
                <Form
                  {...getFormProps(cancelNetworkJoinInviteForm)}
                  method="post"
                  preventScrollReset
                >
                  <ListContainer
                    locales={locales}
                    listKey="pending-network-member-invitations"
                    hideAfter={3}
                  >
                    {sentNetworkJoinInvites.map((relation, index) => {
                      return (
                        <ListItem
                          key={`network-member-invitation-${relation.organization.slug}`}
                          entity={relation.organization}
                          locales={locales}
                          listIndex={index}
                          hideAfter={3}
                        >
                          <Button
                            name="intent"
                            variant="outline"
                            value={`cancel-network-member-invitation-${relation.organization.id}`}
                            type="submit"
                            fullSize
                          >
                            {
                              locales.route.content.networkMembers
                                .pendingInvites.cancel.cta
                            }
                          </Button>
                        </ListItem>
                      );
                    })}
                  </ListContainer>
                  {typeof cancelNetworkJoinInviteForm.errors !== "undefined" &&
                  cancelNetworkJoinInviteForm.errors.length > 0 ? (
                    <div>
                      {cancelNetworkJoinInviteForm.errors.map(
                        (error, index) => {
                          return (
                            <div
                              id={cancelNetworkJoinInviteForm.errorId}
                              key={index}
                              className="mv-text-sm mv-font-semibold mv-text-negative-600"
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
          </div>
          {/* Current Networks and Leave Network Section */}
          <div className="mv-flex mv-flex-col mv-gap-4 @md:mv-p-4 @md:mv-border @md:mv-rounded-lg @md:mv-border-gray-200">
            <h2 className="mv-text-primary mv-text-lg mv-font-semibold mv-mb-0">
              {decideBetweenSingularOrPlural(
                locales.route.content.networks.current.headline_one,
                locales.route.content.networks.current.headline_other,
                memberOf.length
              )}
            </h2>
            {memberOf.length > 0 ? (
              <Form
                {...getFormProps(leaveNetworkForm)}
                method="post"
                preventScrollReset
              >
                <ListContainer
                  locales={locales}
                  listKey="networks"
                  hideAfter={3}
                >
                  {memberOf.map((relation, index) => {
                    return (
                      <ListItem
                        key={`network-${relation.network.slug}`}
                        entity={relation.network}
                        locales={locales}
                        listIndex={index}
                        hideAfter={3}
                      >
                        <Button
                          name="intent"
                          variant="outline"
                          value={`leave-network-${relation.network.id}`}
                          type="submit"
                          fullSize
                        >
                          {locales.route.content.networks.current.leave.cta}
                        </Button>
                      </ListItem>
                    );
                  })}
                </ListContainer>
                {typeof leaveNetworkForm.errors !== "undefined" &&
                leaveNetworkForm.errors.length > 0 ? (
                  <div>
                    {leaveNetworkForm.errors.map((error, index) => {
                      return (
                        <div
                          id={leaveNetworkForm.errorId}
                          key={index}
                          className="mv-text-sm mv-font-semibold mv-text-negative-600"
                        >
                          {error}
                        </div>
                      );
                    })}
                  </div>
                ) : null}
              </Form>
            ) : (
              <div className="mv-w-full mv-p-4 mv-text-center mv-bg-neutral-100 mv-border mv-border-neutral-200 mv-rounded-lg mv-text-neutral-700 mv-text-base leading-5 mv-font-normal">
                {locales.route.content.networks.current.blankState}
              </div>
            )}
            {/* Search Networks To Join Section */}
            <h2 className="mv-text-primary mv-text-lg mv-font-semibold mv-mb-0">
              {locales.route.content.networks.requestToJoin.headline}
            </h2>
            <p>{locales.route.content.networks.requestToJoin.subline}</p>
            <searchNetworksFetcher.Form
              {...getFormProps(searchNetworksForm)}
              method="get"
              onChange={(event) => {
                searchNetworksForm.validate();
                if (searchNetworksForm.valid) {
                  searchNetworksFetcher.submit(event.currentTarget, {
                    preventScrollReset: true,
                  });
                }
              }}
              autoComplete="off"
            >
              <Input name={Deep} defaultValue="true" type="hidden" />
              <Input
                name={SearchNetworkMembers}
                defaultValue={
                  searchParams.get(SearchNetworkMembers) || undefined
                }
                type="hidden"
              />
              <Input
                {...getInputProps(searchNetworksFields[SearchNetworks], {
                  type: "search",
                })}
                defaultValue={searchParams.get(SearchNetworks) || undefined}
                key={searchNetworksFields[SearchNetworks].id}
                standalone
              >
                <Input.Label htmlFor={searchNetworksFields[SearchNetworks].id}>
                  {locales.route.content.networks.requestToJoin.label}
                </Input.Label>
                {/* TODO: Replace search icon when new one is usable */}
                <Input.SearchIcon />

                {typeof searchNetworksFields[SearchNetworks].errors !==
                  "undefined" &&
                searchNetworksFields[SearchNetworks].errors.length > 0 ? (
                  searchNetworksFields[SearchNetworks].errors.map((error) => (
                    <Input.Error
                      id={searchNetworksFields[SearchNetworks].errorId}
                      key={error}
                    >
                      {error}
                    </Input.Error>
                  ))
                ) : (
                  <Input.HelperText>
                    {locales.route.content.networks.requestToJoin.helper}
                  </Input.HelperText>
                )}
                <Input.ClearIcon formMetaData={searchNetworkMembersForm} />
                {isHydrated === false ? (
                  <Input.Controls>
                    <noscript>
                      <Button type="submit" variant="outline">
                        {locales.route.content.networks.requestToJoin.searchCta}
                      </Button>
                    </noscript>
                  </Input.Controls>
                ) : null}
              </Input>
              {typeof searchNetworksForm.errors !== "undefined" &&
              searchNetworksForm.errors.length > 0 ? (
                <div>
                  {searchNetworksForm.errors.map((error, index) => {
                    return (
                      <div
                        id={searchNetworksForm.errorId}
                        key={index}
                        className="mv-text-sm mv-font-semibold mv-text-negative-600"
                      >
                        {error}
                      </div>
                    );
                  })}
                </div>
              ) : null}
            </searchNetworksFetcher.Form>
            {searchedNetworks.length > 0 ? (
              <Form
                {...getFormProps(joinNetworkForm)}
                method="post"
                preventScrollReset
              >
                <ListContainer
                  locales={locales}
                  listKey="network-search-results"
                  hideAfter={3}
                >
                  {searchedNetworks.map((searchedOrganization, index) => {
                    return (
                      <ListItem
                        key={`network-search-result-${searchedOrganization.slug}`}
                        entity={searchedOrganization}
                        locales={locales}
                        listIndex={index}
                        hideAfter={3}
                      >
                        {memberOf.some((relation) => {
                          return (
                            relation.network.id === searchedOrganization.id
                          );
                        }) ? (
                          <div className="mv-w-full mv-text-center mv-text-nowrap mv-text-positive-600 mv-text-sm mv-font-semibold mv-leading-5">
                            {
                              locales.route.content.networks.requestToJoin
                                .alreadyMemberOf
                            }
                          </div>
                        ) : sentNetworkJoinRequests.some((relation) => {
                            return (
                              relation.network.id === searchedOrganization.id
                            );
                          }) ? (
                          <div className="mv-w-full mv-text-center mv-text-nowrap mv-text-neutral-700 mv-text-sm mv-font-semibold mv-leading-5">
                            {
                              locales.route.content.networks.requestToJoin
                                .alreadyRequested
                            }
                          </div>
                        ) : searchedOrganization.id === organization.id ? (
                          <div className="mv-w-full mv-text-center mv-text-nowrap mv-text-negative-700 mv-text-sm mv-font-semibold mv-leading-5">
                            {
                              locales.route.content.networkMembers.invite
                                .thisOrganization
                            }
                          </div>
                        ) : searchedOrganization.types.some((relation) => {
                            return relation.organizationType.slug === "network";
                          }) === false ? (
                          <div className="mv-w-full mv-text-center mv-text-nowrap mv-text-negative-700 mv-text-sm mv-font-semibold mv-leading-5">
                            {
                              locales.route.content.networks.requestToJoin
                                .noNetwork
                            }
                          </div>
                        ) : (
                          <Button
                            name="intent"
                            variant="outline"
                            value={`request-to-join-network-${searchedOrganization.id}`}
                            type="submit"
                            fullSize
                          >
                            {locales.route.content.networks.requestToJoin.cta}
                          </Button>
                        )}
                      </ListItem>
                    );
                  })}
                </ListContainer>
                {typeof joinNetworkForm.errors !== "undefined" &&
                joinNetworkForm.errors.length > 0 ? (
                  <div>
                    {joinNetworkForm.errors.map((error, index) => {
                      return (
                        <div
                          id={joinNetworkForm.errorId}
                          key={index}
                          className="mv-text-sm mv-font-semibold mv-text-negative-600"
                        >
                          {error}
                        </div>
                      );
                    })}
                  </div>
                ) : null}
              </Form>
            ) : null}
            {/* Pending requests to be member of network section */}
            {sentNetworkJoinRequests.length > 0 ? (
              <>
                <h2 className="mv-text-primary mv-text-lg mv-font-semibold mv-mb-0">
                  {locales.route.content.networks.pendingRequests.headline}
                </h2>
                <Form
                  {...getFormProps(cancelNetworkJoinRequestForm)}
                  method="post"
                  preventScrollReset
                >
                  <ListContainer
                    locales={locales}
                    listKey="pending-join-network-requests"
                    hideAfter={3}
                  >
                    {sentNetworkJoinRequests.map((relation, index) => {
                      return (
                        <ListItem
                          key={`join-network-request-${relation.network.slug}`}
                          entity={relation.network}
                          locales={locales}
                          listIndex={index}
                          hideAfter={3}
                        >
                          <Button
                            name="intent"
                            variant="outline"
                            value={`cancel-network-join-request-${relation.network.id}`}
                            type="submit"
                            fullSize
                          >
                            {
                              locales.route.content.networks.pendingRequests
                                .cancel.cta
                            }
                          </Button>
                        </ListItem>
                      );
                    })}
                  </ListContainer>
                  {typeof cancelNetworkJoinRequestForm.errors !== "undefined" &&
                  cancelNetworkJoinRequestForm.errors.length > 0 ? (
                    <div>
                      {cancelNetworkJoinRequestForm.errors.map(
                        (error, index) => {
                          return (
                            <div
                              id={cancelNetworkJoinRequestForm.errorId}
                              key={index}
                              className="mv-text-sm mv-font-semibold mv-text-negative-600"
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
          </div>
        </div>
      </Section>
    </>
  );
}

export default Manage;
