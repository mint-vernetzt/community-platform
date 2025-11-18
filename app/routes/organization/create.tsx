import { getFormProps, getInputProps, useForm } from "@conform-to/react-v1";
import { getZodConstraint, parseWithZod } from "@conform-to/zod-v1";
import { Button } from "@mint-vernetzt/components/src/molecules/Button";
import { Chip } from "@mint-vernetzt/components/src/molecules/Chip";
import { Input } from "@mint-vernetzt/components/src/molecules/Input";
import { TextButton } from "@mint-vernetzt/components/src/molecules/TextButton";
import { useRef } from "react";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import {
  Form,
  Link,
  redirect,
  useActionData,
  useFetcher,
  useLoaderData,
  useNavigation,
  useSearchParams,
} from "react-router";
import { useHydrated } from "remix-utils/use-hydrated";
import { z } from "zod";
import { redirectWithAlert } from "~/alert.server";
import {
  createAuthClient,
  getSessionUserOrRedirectPathToLogin,
  getSessionUserOrThrow,
} from "~/auth.server";
import { handleClaimRequest } from "~/claim-request.server";
import { CLAIM_REQUEST_INTENTS } from "~/claim-request.shared";
import { ConformSelect } from "~/components-next/ConformSelect";
import { ListContainer } from "~/components-next/ListContainer";
import { ListItem } from "~/components-next/ListItem";
import { Section } from "~/components-next/MyOrganizationsSection";
import { Container } from "~/components-next/MyProjectsCreateOrganizationContainer";
import { INTENT_FIELD_NAME, searchOrganizationsSchema } from "~/form-helpers";
import { detectLanguage } from "~/i18n.server";
import { useIsSubmitting } from "~/lib/hooks/useIsSubmitting";
import {
  decideBetweenSingularOrPlural,
  insertComponentsIntoLocale,
  insertParametersIntoLocale,
} from "~/lib/utils/i18n";
import { invariant, invariantResponse } from "~/lib/utils/response";
import { SearchOrganizations } from "~/lib/utils/searchParams";
import { languageModuleMap } from "~/locales/.server";
import { prismaClient } from "~/prisma.server";
import { redirectWithToast } from "~/toast.server";
import { searchOrganizations } from "../utils.server";
import {
  addImageUrlToOrganizations,
  createOrganization,
  createOrganizationMemberRequest,
  flattenOrganizationRelations,
  getAllNetworkTypes,
  getAllOrganizationTypes,
  getOrganizationsFromProfile,
  getPendingRequestsToOrganizations,
} from "./create.server";
import { createOrganizationSchema } from "./create.shared";

export async function loader(args: LoaderFunctionArgs) {
  const { request } = args;
  const { authClient } = createAuthClient(request);
  const { sessionUser, redirectPath } =
    await getSessionUserOrRedirectPathToLogin(authClient, request);

  if (sessionUser === null && redirectPath !== null) {
    return redirect(redirectPath);
  }

  const language = await detectLanguage(request);
  const locales = languageModuleMap[language]["organization/create"];

  const allOrganizationTypes = await getAllOrganizationTypes();
  const allNetworkTypes = await getAllNetworkTypes();

  const organizations = await getOrganizationsFromProfile(sessionUser.id);
  const enhancedOrganizations = addImageUrlToOrganizations(
    authClient,
    organizations
  );
  const flattenedOrganizations = flattenOrganizationRelations(
    enhancedOrganizations
  );

  const pendingRequestsToOrganizations =
    await getPendingRequestsToOrganizations(sessionUser.id, authClient);

  const { searchedOrganizations, submission } = await searchOrganizations({
    searchParams: new URL(request.url).searchParams,
    authClient,
    locales,
    mode: "authenticated",
  });

  const enhancedSearchedOrganizations = await Promise.all(
    searchedOrganizations.map(async (organization) => {
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
      const alreadyRequestedToClaim =
        openClaimRequest !== null ? openClaimRequest.status === "open" : false;
      const allowedToClaimOrganization =
        organization.shadow === false
          ? false
          : openClaimRequest !== null
            ? openClaimRequest.status === "open" ||
              openClaimRequest.status === "withdrawn"
            : true;
      return {
        ...organization,
        alreadyRequestedToClaim,
        allowedToClaimOrganization,
      };
    })
  );

  return {
    organizations: flattenedOrganizations,
    pendingRequestsToOrganizations,
    searchedOrganizations: enhancedSearchedOrganizations,
    submission,
    allOrganizationTypes,
    allNetworkTypes,
    locales,
    currentTimestamp: Date.now(),
  };
}

export async function action(args: ActionFunctionArgs) {
  const { request } = args;

  const { authClient } = createAuthClient(request);
  const sessionUser = await getSessionUserOrThrow(authClient);

  const language = await detectLanguage(request);
  const locales = languageModuleMap[language]["organization/create"];

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
    result = await createOrganizationMemberRequest({
      formData: requestToJoinOrganizationFormData,
      locales,
      sessionUser,
    });
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
  } else if (intent === "create-organization") {
    // TODO: Same returns as above only with alert
    result = await createOrganization({
      formData,
      locales,
      sessionUser,
    });
    redirectUrl = result.redirectUrl || request.url;
  } else {
    invariantResponse(false, "Invalid intent", {
      status: 400,
    });
  }

  if (
    typeof result.submission !== "undefined" &&
    result.submission.status === "success" &&
    typeof result.toast !== "undefined" &&
    result.toast !== null
  ) {
    return redirectWithToast(redirectUrl, result.toast);
  }
  if (
    typeof result.submission !== "undefined" &&
    result.submission !== null &&
    result.submission.status === "success" &&
    typeof result.alert !== "undefined" &&
    result.alert !== null
  ) {
    return redirectWithAlert(redirectUrl, result.alert);
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
      error: result.submission.error || undefined,
    },
    currentTimestamp: Date.now(),
  };
}

function CreateOrganization() {
  const loaderData = useLoaderData<typeof loader>();
  const {
    organizations,
    pendingRequestsToOrganizations,
    searchedOrganizations: loaderSearchedOrganizations,
    allOrganizationTypes,
    allNetworkTypes,
    locales,
    currentTimestamp,
    submission: loaderSubmission,
  } = loaderData;
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isHydrated = useHydrated();
  const isSubmitting = useIsSubmitting();
  const [searchParams] = useSearchParams();

  const searchQuery = searchParams.get(SearchOrganizations) || undefined;
  const searchFetcher = useFetcher<typeof loader>();
  const searchedOrganizations =
    searchFetcher.data !== undefined
      ? searchFetcher.data.searchedOrganizations
      : loaderSearchedOrganizations;

  const searchFormRef = useRef<HTMLFormElement>(null);
  const [searchForm, searchFields] = useForm({
    id: "search-organizations",
    defaultValue: {
      [SearchOrganizations]: searchParams.get(SearchOrganizations) || undefined,
    },
    constraint: getZodConstraint(searchOrganizationsSchema(locales)),
    // Client side validation onInput, server side validation on submit
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

  const [createOrganizationForm, createOrganizationFields] = useForm({
    id: `create-organization-${
      actionData?.currentTimestamp || currentTimestamp
    }`,
    constraint: getZodConstraint(createOrganizationSchema(locales)),
    defaultValue: {
      organizationName: searchQuery,
      organizationTypes: [],
      networkTypes: [],
    },
    shouldValidate: "onBlur",
    shouldRevalidate: "onInput",
    lastResult: navigation.state === "idle" ? actionData?.submission : null,
    onValidate({ formData }) {
      const submission = parseWithZod(formData, {
        schema: () =>
          createOrganizationSchema(locales).transform((data, ctx) => {
            const { organizationTypes: types, networkTypes } = data;
            const organizationTypeNetwork = allOrganizationTypes.find(
              (organizationType) => {
                return organizationType.slug === "network";
              }
            );
            invariant(
              organizationTypeNetwork !== undefined,
              "Organization type network not found"
            );
            const isNetwork = types.some(
              (id) => id === organizationTypeNetwork.id
            );
            if (isNetwork === true && networkTypes.length === 0) {
              ctx.addIssue({
                code: "custom",
                message: locales.route.validation.networkTypesRequired,
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
  const organizationTypeList =
    createOrganizationFields.organizationTypes.getFieldList();
  let networkTypeList = createOrganizationFields.networkTypes.getFieldList();
  const organizationTypeNetwork = allOrganizationTypes.find(
    (organizationType) => {
      return organizationType.slug === "network";
    }
  );
  const isNetwork = organizationTypeList.some((organizationType) => {
    if (
      typeof organizationType.initialValue === "undefined" ||
      typeof organizationTypeNetwork === "undefined"
    ) {
      return false;
    }
    return organizationType.initialValue === organizationTypeNetwork.id;
  });
  if (isNetwork === false) {
    networkTypeList = [];
  }

  return (
    <Container>
      <Form
        {...getFormProps(createOrganizationForm)}
        method="post"
        preventScrollReset
        autoComplete="off"
        className="absolute"
      />
      <button
        form={createOrganizationForm.id}
        type="submit"
        hidden
        disabled={isSubmitting}
      />
      <TextButton
        as="link"
        to="/my/organizations"
        weight="thin"
        variant="neutral"
        arrowLeft
        prefetch="intent"
      >
        {locales.route.back}
      </TextButton>
      <h1 className="mb-0 text-primary text-5xl font-bold leading-9">
        {locales.route.headline}
      </h1>
      <Section>
        <div className="w-full flex flex-col gap-4">
          {/* Organization name Section */}
          <h2 className="mb-0 text-2xl font-bold leading-[26px]">
            {locales.route.form.organizationName.headline}
          </h2>
          <searchFetcher.Form
            {...getFormProps(searchForm)}
            method="get"
            ref={searchFormRef}
            autoComplete="off"
          />
          <Input
            {...getInputProps(createOrganizationFields.organizationName, {
              type: "text",
            })}
            onChange={(event) => {
              searchForm.validate();
              if (searchForm.valid) {
                const searchSearchParams = new URLSearchParams(searchParams);
                searchSearchParams.set(
                  SearchOrganizations,
                  event.currentTarget.value.trim()
                );
                searchFetcher.submit(searchSearchParams, {
                  preventScrollReset: true,
                });
              }
            }}
            key={createOrganizationFields.organizationName.id}
            standalone
          >
            <Input.Label htmlFor={createOrganizationFields.organizationName.id}>
              {
                locales.route.form.organizationName
                  .requestOrganizationMembership.label
              }
            </Input.Label>

            {typeof searchFields[SearchOrganizations].errors !== "undefined" &&
            searchFields[SearchOrganizations].errors.length > 0
              ? searchFields[SearchOrganizations].errors.map((error) => (
                  <Input.Error
                    id={searchFields[SearchOrganizations].errorId}
                    key={error}
                  >
                    {error}
                  </Input.Error>
                ))
              : null}
            {typeof createOrganizationFields.organizationName.errors !==
              "undefined" &&
            createOrganizationFields.organizationName.errors.length > 0
              ? createOrganizationFields.organizationName.errors.map(
                  (error) => (
                    <Input.Error
                      id={createOrganizationFields.organizationName.errorId}
                      key={error}
                    >
                      {error}
                    </Input.Error>
                  )
                )
              : null}
          </Input>
          {typeof searchForm.errors !== "undefined" &&
          searchForm.errors.length > 0 ? (
            <div>
              {searchForm.errors.map((error, index) => {
                return (
                  <div
                    id={searchForm.errorId}
                    key={index}
                    className="text-sm font-semibold text-negative-700"
                  >
                    {error}
                  </div>
                );
              })}
            </div>
          ) : null}
          <noscript>
            <Input
              {...getInputProps(searchFields[SearchOrganizations], {
                type: "text",
              })}
              placeholder={
                locales.route.form.organizationName.noJsSearchForm.placeholder
              }
              key={searchFields[SearchOrganizations].id}
              standalone
            >
              <Input.Label htmlFor={searchFields[SearchOrganizations].id}>
                {locales.route.form.organizationName.noJsSearchForm.label}
              </Input.Label>

              <Input.Controls>
                <Button form={searchForm.id} type="submit" variant="outline">
                  {locales.route.form.organizationName.noJsSearchForm.searchCta}
                </Button>
              </Input.Controls>
              <Input.SearchIcon />
              <Input.ClearIcon />

              {typeof searchFields[SearchOrganizations].errors !==
                "undefined" &&
              searchFields[SearchOrganizations].errors.length > 0
                ? searchFields[SearchOrganizations].errors.map((error) => (
                    <Input.Error
                      id={searchFields[SearchOrganizations].errorId}
                      key={error}
                    >
                      {error}
                    </Input.Error>
                  ))
                : null}
            </Input>
          </noscript>

          {searchedOrganizations.length > 0 ? (
            <>
              <div className="w-full flex justify-center pt-2 text-sm text-neutral-600 font-semibold leading-5 justify-self-center">
                <p>
                  {insertParametersIntoLocale(
                    decideBetweenSingularOrPlural(
                      locales.route.form.organizationName
                        .similarOrganizationsFound.singular,
                      locales.route.form.organizationName
                        .similarOrganizationsFound.plural,
                      searchedOrganizations.length
                    ),
                    { count: searchedOrganizations.length }
                  )}
                </p>
              </div>
              <Form
                {...getFormProps(createOrganizationMemberOrClaimRequestForm)}
                method="post"
                preventScrollReset
              >
                <ListContainer
                  locales={locales}
                  listKey="organizations-to-request-membership-or-claim-search-results"
                  // hideAfter={3}
                >
                  {searchedOrganizations.map((searchedOrganization, index) => {
                    return (
                      <ListItem
                        key={`organizations-to-request-membership-or-claim-search-result-${searchedOrganization.slug}`}
                        entity={searchedOrganization}
                        locales={locales}
                        listIndex={index}
                      >
                        {organizations.some((organization) => {
                          return organization.id === searchedOrganization.id;
                        }) ? (
                          <div className="w-full text-center text-nowrap text-positive-600 text-sm font-semibold leading-5">
                            {
                              locales.route.form.organizationName
                                .requestOrganizationMembership.alreadyMember
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
                              locales.route.form.organizationName
                                .requestOrganizationMembership.alreadyRequested
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
                            fullSize
                            disabled={isSubmitting}
                          >
                            {
                              locales.route.form.organizationName
                                .requestOrganizationMembership
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
                            className="text-sm font-semibold text-negative-700"
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
        {/* Organization types section */}
        <div className="w-full flex flex-col gap-4">
          <h2 className="mb-0 text-2xl font-bold leading-[26px]">
            {locales.route.form.organizationTypes.headline}
          </h2>
          <ConformSelect
            id={createOrganizationFields.organizationTypes.id}
            cta={locales.route.form.organizationTypes.cta}
          >
            <ConformSelect.Label
              htmlFor={createOrganizationFields.organizationTypes.id}
            >
              {locales.route.form.organizationTypes.label}
            </ConformSelect.Label>

            {typeof createOrganizationFields.organizationTypes.errors !==
              "undefined" &&
            createOrganizationFields.organizationTypes.errors.length > 0 ? (
              createOrganizationFields.organizationTypes.errors.map((error) => (
                <ConformSelect.Error
                  id={createOrganizationFields.organizationTypes.errorId}
                  key={error}
                >
                  {error}
                </ConformSelect.Error>
              ))
            ) : (
              <ConformSelect.HelperText>
                {locales.route.form.organizationTypes.helperText}
              </ConformSelect.HelperText>
            )}
            {allOrganizationTypes
              .filter((organizationType) => {
                return !organizationTypeList.some((listOrganizationType) => {
                  return (
                    listOrganizationType.initialValue === organizationType.id
                  );
                });
              })
              .map((filteredOrganizationType) => {
                let title;
                if (
                  filteredOrganizationType.slug in locales.organizationTypes
                ) {
                  type LocaleKey = keyof typeof locales.organizationTypes;
                  title =
                    locales.organizationTypes[
                      filteredOrganizationType.slug as LocaleKey
                    ].title;
                } else {
                  console.error(
                    `Organization type ${filteredOrganizationType.slug} not found in locales`
                  );
                  title = filteredOrganizationType.slug;
                }
                return (
                  <button
                    {...createOrganizationForm.insert.getButtonProps({
                      name: createOrganizationFields.organizationTypes.name,
                      defaultValue: filteredOrganizationType.id,
                    })}
                    form={createOrganizationForm.id}
                    key={filteredOrganizationType.id}
                    {...ConformSelect.getListItemChildrenStyles()}
                  >
                    {title}
                  </button>
                );
              })}
          </ConformSelect>
          {organizationTypeList.length > 0 && (
            <Chip.Container>
              {organizationTypeList.map((listOrganizationType, index) => {
                const organizationTypeSlug = allOrganizationTypes.find(
                  (organizationType) => {
                    return (
                      organizationType.id === listOrganizationType.initialValue
                    );
                  }
                )?.slug;
                let title;
                if (organizationTypeSlug === undefined) {
                  console.error(
                    `Organization type with id ${listOrganizationType.id} not found in allOrganizationTypes`
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
                  <Chip key={listOrganizationType.key}>
                    <input
                      {...getInputProps(listOrganizationType, {
                        type: "hidden",
                      })}
                      key="organizationTypes"
                    />
                    {title || locales.route.form.organizationTypes.notFound}
                    <Chip.Delete>
                      <button
                        {...createOrganizationForm.remove.getButtonProps({
                          name: createOrganizationFields.organizationTypes.name,
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
        {/* Network types section */}
        <div className="w-full flex flex-col gap-4">
          <h2
            className={`mb-0 text-2xl font-bold leading-[26px] ${
              isNetwork === false ? "text-neutral-300" : "text-primary"
            }`}
          >
            {locales.route.form.networkTypes.headline}
          </h2>
          <ConformSelect
            id={createOrganizationFields.networkTypes.id}
            cta={locales.route.form.networkTypes.cta}
            disabled={isNetwork === false}
          >
            <ConformSelect.Label
              htmlFor={createOrganizationFields.networkTypes.id}
            >
              <span className={isNetwork === false ? "text-neutral-300" : ""}>
                {locales.route.form.networkTypes.label}
              </span>
            </ConformSelect.Label>
            {typeof createOrganizationFields.networkTypes.errors !==
              "undefined" &&
            createOrganizationFields.networkTypes.errors.length > 0 ? (
              createOrganizationFields.networkTypes.errors.map((error) => (
                <ConformSelect.Error
                  id={createOrganizationFields.networkTypes.errorId}
                  key={error}
                >
                  {error}
                </ConformSelect.Error>
              ))
            ) : (
              <ConformSelect.HelperText>
                <span className={isNetwork === false ? "text-neutral-300" : ""}>
                  {isNetwork === false
                    ? locales.route.form.networkTypes.helperWithoutNetwork
                    : locales.route.form.networkTypes.helper}
                </span>
              </ConformSelect.HelperText>
            )}
            {allNetworkTypes
              .filter((networkType) => {
                return !networkTypeList.some((listNetworkType) => {
                  return listNetworkType.initialValue === networkType.id;
                });
              })
              .map((filteredNetworkType) => {
                let title;
                if (filteredNetworkType.slug in locales.networkTypes) {
                  type LocaleKey = keyof typeof locales.networkTypes;
                  title =
                    locales.networkTypes[filteredNetworkType.slug as LocaleKey]
                      .title;
                } else {
                  console.error(
                    `Network type ${filteredNetworkType.slug} not found in locales`
                  );
                  title = filteredNetworkType.slug;
                }
                return (
                  <button
                    {...createOrganizationForm.insert.getButtonProps({
                      name: createOrganizationFields.networkTypes.name,
                      defaultValue: filteredNetworkType.id,
                    })}
                    form={createOrganizationForm.id}
                    key={filteredNetworkType.id}
                    disabled={!isNetwork}
                    {...ConformSelect.getListItemChildrenStyles()}
                  >
                    {title}
                  </button>
                );
              })}
          </ConformSelect>
          {networkTypeList.length > 0 && (
            <Chip.Container>
              {networkTypeList.map((listNetworkType, index) => {
                const networkTypeSlug = allNetworkTypes.find((networkType) => {
                  return networkType.id === listNetworkType.initialValue;
                })?.slug;
                let title;
                if (networkTypeSlug === undefined) {
                  console.error(
                    `Network type with id ${listNetworkType.id} not found in allNetworkTypes`
                  );
                  title = null;
                } else {
                  if (networkTypeSlug in locales.networkTypes) {
                    type LocaleKey = keyof typeof locales.networkTypes;
                    title =
                      locales.networkTypes[networkTypeSlug as LocaleKey].title;
                  } else {
                    console.error(
                      `Network type ${networkTypeSlug} not found in locales`
                    );
                    title = networkTypeSlug;
                  }
                }
                return (
                  <Chip key={listNetworkType.key}>
                    <input
                      {...getInputProps(listNetworkType, {
                        type: "hidden",
                      })}
                      key="networkTypes"
                    />
                    {title || locales.route.form.networkTypes.notFound}
                    <Chip.Delete>
                      <button
                        {...createOrganizationForm.remove.getButtonProps({
                          name: createOrganizationFields.networkTypes.name,
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

        {/* TODO: FAQ Section */}
      </Section>
      <Section>
        <div>
          <h2 className="w-full text-2xl font-bold leading-[26px] mb-2 @md:mb-4">
            {locales.route.form.address.headline}
          </h2>
          <p className="w-full text-neutral-700 mb-2 @md:mb-4">
            {locales.route.form.address.subline}
          </p>
          <div className="grid grid-rows-5 grid-cols-1 @md:grid-rows-3 @md:grid-cols-2 gap-x-2 gap-y-2 @md:gap-x-6 @md:gap-y-4">
            <div className="w-full @md:col-span-2">
              <Input
                {...getInputProps(createOrganizationFields.addressSupplement, {
                  type: "text",
                })}
                key="addressSupplement"
              >
                <Input.Label
                  htmlFor={createOrganizationFields.addressSupplement.id}
                >
                  {locales.route.form.address.addressSupplement.label}
                </Input.Label>
                {typeof createOrganizationFields.addressSupplement.errors !==
                  "undefined" &&
                createOrganizationFields.addressSupplement.errors.length > 0
                  ? createOrganizationFields.addressSupplement.errors.map(
                      (error) => (
                        <Input.Error
                          id={
                            createOrganizationFields.addressSupplement.errorId
                          }
                          key={error}
                        >
                          {error}
                        </Input.Error>
                      )
                    )
                  : null}
              </Input>
            </div>
            <div className="w-full @md:col-span-2">
              <Input
                {...getInputProps(createOrganizationFields.street, {
                  type: "text",
                })}
                key="street"
              >
                <Input.Label htmlFor={createOrganizationFields.street.id}>
                  {locales.route.form.address.street.label}
                </Input.Label>
                {typeof createOrganizationFields.street.errors !==
                  "undefined" &&
                createOrganizationFields.street.errors.length > 0
                  ? createOrganizationFields.street.errors.map((error) => (
                      <Input.Error
                        id={createOrganizationFields.street.errorId}
                        key={error}
                      >
                        {error}
                      </Input.Error>
                    ))
                  : null}
              </Input>
            </div>
            <div className="w-full">
              <Input
                {...getInputProps(createOrganizationFields.zipCode, {
                  type: "text",
                })}
                key="zipCode"
              >
                <Input.Label htmlFor={createOrganizationFields.zipCode.id}>
                  {locales.route.form.address.zipCode.label}
                </Input.Label>
                {typeof createOrganizationFields.zipCode.errors !==
                  "undefined" &&
                createOrganizationFields.zipCode.errors.length > 0
                  ? createOrganizationFields.zipCode.errors.map((error) => (
                      <Input.Error
                        id={createOrganizationFields.zipCode.errorId}
                        key={error}
                      >
                        {error}
                      </Input.Error>
                    ))
                  : null}
              </Input>
            </div>
            <div className="w-full">
              <Input
                {...getInputProps(createOrganizationFields.city, {
                  type: "text",
                })}
                key="city"
              >
                <Input.Label htmlFor={createOrganizationFields.city.id}>
                  {locales.route.form.address.city.label}
                </Input.Label>
                {typeof createOrganizationFields.city.errors !== "undefined" &&
                createOrganizationFields.city.errors.length > 0
                  ? createOrganizationFields.city.errors.map((error) => (
                      <Input.Error
                        id={createOrganizationFields.city.errorId}
                        key={error}
                      >
                        {error}
                      </Input.Error>
                    ))
                  : null}
              </Input>
            </div>
          </div>
        </div>
      </Section>
      {typeof createOrganizationForm.errors !== "undefined" &&
      createOrganizationForm.errors.length > 0 ? (
        <div>
          {createOrganizationForm.errors.map((error, index) => {
            return (
              <div
                id={createOrganizationForm.errorId}
                key={index}
                className="text-sm font-semibold text-negative-700"
              >
                {error}
              </div>
            );
          })}
        </div>
      ) : null}

      <div className="w-full flex flex-col @sm:flex-row justify-between gap-4">
        <p className="text-neutral-700 text-xs leading-4 text-nowrap">
          {locales.route.form.helperText}
        </p>
        <div className="flex flex-col @sm:flex-row-reverse @sm:items-end w-full gap-2">
          <div className="w-full @sm:w-fit">
            <Button
              form={createOrganizationForm.id}
              type="submit"
              name="intent"
              value="create-organization"
              fullSize
              // Don't disable button when js is disabled
              disabled={
                isHydrated
                  ? createOrganizationForm.dirty === false ||
                    createOrganizationForm.valid === false ||
                    isSubmitting
                  : false
              }
            >
              {locales.route.form.submit}
            </Button>
          </div>
          <div className="w-full @sm:w-fit">
            <Button
              as="link"
              to="/my/organizations"
              variant="outline"
              prefetch="intent"
              fullSize
            >
              {locales.route.form.cancel}
            </Button>
          </div>
        </div>
      </div>
    </Container>
  );
}

export default CreateOrganization;
