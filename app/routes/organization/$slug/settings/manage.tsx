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
} from "@remix-run/node";
import {
  Form,
  useActionData,
  useFetcher,
  useLoaderData,
  useLocation,
  useNavigation,
  useSearchParams,
} from "@remix-run/react";
import { useHydrated } from "remix-utils/use-hydrated";
import { z } from "zod";
import { createAuthClient, getSessionUser } from "~/auth.server";
import { BackButton } from "~/components-next/BackButton";
import { ConformSelect } from "~/components-next/ConformSelect";
import { ListContainer } from "~/components-next/ListContainer";
import { ListItem } from "~/components-next/ListItem";
import {
  searchNetworkMembersSchema,
  searchNetworksSchema,
} from "~/form-helpers";
import { detectLanguage } from "~/i18n.server";
import { useUnsavedChangesBlockerWithModal } from "~/lib/hooks/useUnsavedChangesBlockerWithModal";
import { decideBetweenSingularOrPlural } from "~/lib/utils/i18n";
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
import { deriveMode } from "~/utils.server";
import {
  addNetworkMember,
  getOrganizationWithNetworksAndNetworkMembers,
  joinNetwork,
  leaveNetwork,
  removeNetworkMember,
  updateOrganization,
} from "./manage.server";

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
  // TODO: Add pending network join requests here to exclude them from the search
  const currentNetworkIds = [
    ...organization.memberOf.map((relation) => relation.network.id),
  ];
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
    idsToExclude: currentNetworkIds,
    authClient,
    locales,
    mode,
  });

  // TODO: Add pending network member invites here to exclude them from the search
  const currentNetworkMemberIds = [
    ...organization.networkMembers.map((relation) => relation.networkMember.id),
  ];
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
    idsToExclude: currentNetworkMemberIds,
    authClient,
    locales,
    mode,
  });

  const currentTimestamp = Date.now();

  return {
    organization,
    allOrganizationTypes,
    allNetworkTypes,
    searchedNetworks,
    searchNetworksSubmission,
    searchedNetworkMembers,
    searchNetworkMembersSubmission,
    currentTimestamp,
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
  } else if (intent.startsWith("join-network-")) {
    const joinNetworkFormData = new FormData();
    joinNetworkFormData.set(
      "organizationId",
      intent.replace("join-network-", "")
    );
    result = await joinNetwork({
      formData: joinNetworkFormData,
      organization,
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
  } else if (intent.startsWith("add-network-member-")) {
    const leaveNetworkFormData = new FormData();
    leaveNetworkFormData.set(
      "organizationId",
      intent.replace("add-network-member-", "")
    );
    result = await addNetworkMember({
      formData: leaveNetworkFormData,
      organization,
      organizationTypeNetwork,
      locales,
    });
  } else if (intent.startsWith("remove-network-member-")) {
    const leaveNetworkFormData = new FormData();
    leaveNetworkFormData.set(
      "organizationId",
      intent.replace("remove-network-member-", "")
    );
    result = await removeNetworkMember({
      formData: leaveNetworkFormData,
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
    return redirectWithToast(request.url, result.toast);
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
  let searchedNetworks =
    searchNetworksFetcher.data !== undefined
      ? searchNetworksFetcher.data.searchedNetworks
      : loaderData.searchedNetworks;
  const searchNetworkMembersFetcher = useFetcher<typeof loader>();
  let searchedNetworkMembers =
    searchNetworkMembersFetcher.data !== undefined
      ? searchNetworkMembersFetcher.data.searchedNetworkMembers
      : loaderData.searchedNetworkMembers;

  const location = useLocation();
  const isHydrated = useHydrated();
  const navigation = useNavigation();
  const [searchParams] = useSearchParams();

  const {
    types: organizationTypes,
    networkTypes,
    memberOf,
    networkMembers,
  } = organization;

  const defaultValues = {
    organizationTypes: organizationTypes.map(
      (relation) => relation.organizationType.id
    ),
    networkTypes: networkTypes.map((relation) => relation.networkType.id),
  };

  const [manageForm, manageFields] = useForm({
    id: `manage-form-${
      actionData?.currentTimestamp || loaderData.currentTimestamp
    }`,
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

  const [joinNetworkForm] = useForm({
    id: `join-network-${
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

  const [addNetworkMemberForm] = useForm({
    id: `add-network-member-${
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
      console.log("initialValue is undefined");
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
            <h2 className="mv-text-primary mv-text-lg mv-font-semibold mv-mb-0">
              {locales.route.content.types.headline}
            </h2>
            {/* TODO: When removing network from this list and there are networkMembers -> Show modal on submit by switching the submit button. Modal text: something like -> Are you sure? The connections will be lost. */}
            <ConformSelect
              id={manageFields.organizationTypes.id}
              cta={locales.route.content.types.option}
            >
              <ConformSelect.Label htmlFor={manageFields.organizationTypes.id}>
                {locales.route.content.types.label}
              </ConformSelect.Label>
              {typeof manageFields.organizationTypes.errors !== "undefined" ? (
                <ConformSelect.Error>
                  {manageFields.organizationTypes.errors}
                </ConformSelect.Error>
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
                  let organizationTypeSlug = allOrganizationTypes.find(
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
                      type LocaleKey = keyof typeof locales.organizationTypes;
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
                      <Input
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

            <h2
              className={`mv-mb-0 mv-text-2xl mv-font-bold mv-leading-[26px] ${
                hasSelectedNetwork === false
                  ? "mv-text-neutral-300"
                  : "mv-text-primary"
              }`}
            >
              {locales.route.content.networkTypes.headline}
            </h2>
            <ConformSelect
              id={manageFields.networkTypes.id}
              cta={locales.route.content.networkTypes.option}
              disabled={hasSelectedNetwork === false}
            >
              <ConformSelect.Label htmlFor={manageFields.networkTypes.id}>
                <span
                  className={
                    hasSelectedNetwork === false ? "mv-text-neutral-300" : ""
                  }
                >
                  {locales.route.content.networkTypes.label}
                </span>
              </ConformSelect.Label>

              {typeof manageFields.networkTypes.errors !== "undefined" ? (
                <ConformSelect.Error>
                  {manageFields.networkTypes.errors}
                </ConformSelect.Error>
              ) : (
                <ConformSelect.HelperText>
                  <span
                    className={
                      hasSelectedNetwork === false ? "mv-text-neutral-300" : ""
                    }
                  >
                    {hasSelectedNetwork === false
                      ? locales.route.content.networkTypes.helperWithoutNetwork
                      : locales.route.content.networkTypes.helper}
                  </span>
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
                  let networkTypeSlug = allNetworkTypes.find((networkType) => {
                    return networkType.id === field.initialValue;
                  })?.slug;
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
                      <Input
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
                </Controls>
              </div>
            </div>
          </div>
          {/* Current Networks and Leave Network Section */}
          <div className="mv-flex mv-flex-col mv-gap-4 @md:mv-p-4 @md:mv-border @md:mv-rounded-lg @md:mv-border-gray-200">
            {memberOf.length > 0 ? (
              <>
                <h2 className="mv-text-primary mv-text-lg mv-font-semibold mv-mb-0">
                  {decideBetweenSingularOrPlural(
                    locales.route.content.networks.current.headline_one,
                    locales.route.content.networks.current.headline_other,
                    memberOf.length
                  )}
                </h2>
                <p>
                  {decideBetweenSingularOrPlural(
                    locales.route.content.networks.current.subline_one,
                    locales.route.content.networks.current.subline_other,
                    memberOf.length
                  )}
                </p>
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
              </>
            ) : null}
            {/* Search Networks To Join Section */}
            <h2 className="mv-text-primary mv-text-lg mv-font-semibold mv-mb-0">
              {memberOf.length === 0
                ? locales.route.content.networks.join.headline_zero
                : locales.route.content.networks.join.headline_other}
            </h2>
            <p>{locales.route.content.networks.join.subline}</p>
            <searchNetworksFetcher.Form
              {...getFormProps(searchNetworksForm)}
              method="get"
              onChange={(event) => {
                searchNetworksForm.validate();
                if (searchNetworksForm.valid) {
                  console.log("Fetcher submit");
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
                  {locales.route.content.networks.join.label}
                </Input.Label>
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
                    {locales.route.content.networks.join.helper}
                  </Input.HelperText>
                )}
                <Input.Controls>
                  <noscript>
                    <Button type="submit" variant="outline">
                      {locales.route.content.networks.join.searchCta}
                    </Button>
                  </noscript>
                </Input.Controls>
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
                  {searchedNetworks.map((organization, index) => {
                    return (
                      <ListItem
                        key={`network-search-result-${organization.slug}`}
                        entity={organization}
                        locales={locales}
                        listIndex={index}
                        hideAfter={3}
                      >
                        <Button
                          name="intent"
                          variant="outline"
                          value={`join-network-${organization.id}`}
                          type="submit"
                          fullSize
                        >
                          {locales.route.content.networks.join.cta}
                        </Button>
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
          </div>
          {/* Current Network Members and Remove Network Member Section */}
          <div className="mv-flex mv-flex-col mv-gap-4 @md:mv-p-4 @md:mv-border @md:mv-rounded-lg @md:mv-border-gray-200">
            {networkMembers.length > 0 ? (
              <>
                <h2
                  className={`mv-text-lg mv-font-semibold mv-mb-0 ${
                    isNetwork === false
                      ? "mv-text-neutral-300"
                      : "mv-text-primary"
                  }`}
                >
                  {decideBetweenSingularOrPlural(
                    locales.route.content.networkMembers.current.headline_one,
                    locales.route.content.networkMembers.current.headline_other,
                    networkMembers.length
                  )}
                </h2>
                <p>
                  {decideBetweenSingularOrPlural(
                    locales.route.content.networkMembers.current.subline_one,
                    locales.route.content.networkMembers.current.subline_other,
                    networkMembers.length
                  )}
                </p>
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
                              locales.route.content.networkMembers.current
                                .remove.cta
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
              </>
            ) : null}
            {/* Search Network Members To Add Section */}
            <h2
              className={`mv-text-lg mv-font-semibold mv-mb-0 ${
                isNetwork === false ? "mv-text-neutral-300" : "mv-text-primary"
              }`}
            >
              {locales.route.content.networkMembers.add.headline}
            </h2>
            <p className={isNetwork === false ? "mv-text-neutral-300" : ""}>
              {locales.route.content.networkMembers.add.subline}
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
                  {locales.route.content.networkMembers.add.label}
                </Input.Label>
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
                  <Input.HelperText disabled={isNetwork === false}>
                    {isNetwork !== false
                      ? locales.route.content.networkMembers.add.helper
                      : locales.route.content.networkMembers.add
                          .helperWithoutNetwork}
                  </Input.HelperText>
                )}
                <Input.Controls>
                  <noscript>
                    <Button
                      type="submit"
                      variant="outline"
                      disabled={isNetwork === false}
                    >
                      {locales.route.content.networkMembers.add.searchCta}
                    </Button>
                  </noscript>
                </Input.Controls>
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
                  {searchedNetworkMembers.map((organization, index) => {
                    return (
                      <ListItem
                        key={`network-member-search-result-${organization.slug}`}
                        entity={organization}
                        locales={locales}
                        listIndex={index}
                        hideAfter={3}
                      >
                        <Button
                          name="intent"
                          variant="outline"
                          value={`add-network-member-${organization.id}`}
                          type="submit"
                          fullSize
                        >
                          {locales.route.content.networkMembers.add.cta}
                        </Button>
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
          </div>
        </div>
      </Section>
    </>
  );
}

export default Manage;
