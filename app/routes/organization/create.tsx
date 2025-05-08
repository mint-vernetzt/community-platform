import { getFormProps, getInputProps, useForm } from "@conform-to/react-v1";
import { getZodConstraint, parseWithZod } from "@conform-to/zod-v1";
import { Button } from "@mint-vernetzt/components/src/molecules/Button";
import { Chip } from "@mint-vernetzt/components/src/molecules/Chip";
import { Input } from "@mint-vernetzt/components/src/molecules/Input";
import { TextButton } from "@mint-vernetzt/components/src/molecules/TextButton";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import {
  Form,
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
import { ConformSelect } from "~/components-next/ConformSelect";
import { ListContainer } from "~/components-next/ListContainer";
import { ListItem } from "~/components-next/ListItem";
import { Section } from "~/components-next/MyOrganizationsSection";
import { Container } from "~/components-next/MyProjectsCreateOrganizationContainer";
import { searchOrganizationsSchema } from "~/form-helpers";
import { detectLanguage } from "~/i18n.server";
import { insertParametersIntoLocale } from "~/lib/utils/i18n";
import { invariant, invariantResponse } from "~/lib/utils/response";
import { SearchOrganizations } from "~/lib/utils/searchParams";
import { languageModuleMap } from "~/locales/.server";
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
  type CreateOrganizationLocales,
} from "./create.server";
import { useRef } from "react";

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

  return {
    organizations: flattenedOrganizations,
    pendingRequestsToOrganizations,
    searchedOrganizations,
    submission,
    allOrganizationTypes,
    allNetworkTypes,
    locales,
    currentTimestamp: Date.now(),
  };
}

export const createOrganizationMemberRequestSchema = z.object({
  organizationId: z.string(),
});

const NAME_MIN_LENGTH = 3;
const NAME_MAX_LENGTH = 80;

export const createOrganizationSchema = (
  locales: CreateOrganizationLocales
) => {
  return z.object({
    organizationName: z
      .string({
        required_error: locales.route.validation.organizationName.required,
      })
      .min(
        NAME_MIN_LENGTH,
        insertParametersIntoLocale(
          locales.route.validation.organizationName.min,
          {
            min: NAME_MIN_LENGTH,
          }
        )
      )
      .max(
        NAME_MAX_LENGTH,
        insertParametersIntoLocale(
          locales.route.validation.organizationName.max,
          {
            max: NAME_MAX_LENGTH,
          }
        )
      ),
    organizationTypes: z.array(z.string().uuid()),
    networkTypes: z.array(z.string().uuid()),
  });
};

export async function action(args: ActionFunctionArgs) {
  const { request } = args;

  const { authClient } = createAuthClient(request);
  const sessionUser = await getSessionUserOrThrow(authClient);

  const language = await detectLanguage(request);
  const locales = languageModuleMap[language]["organization/create"];

  let result;
  let redirectUrl = request.url;
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
    result = await createOrganizationMemberRequest({
      formData: requestToJoinOrganizationFormData,
      locales,
      sessionUser,
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
    result.submission !== undefined &&
    result.submission.status === "success" &&
    typeof result.toast !== "undefined"
  ) {
    return redirectWithToast(redirectUrl, result.toast);
  }
  if (
    result.submission !== undefined &&
    result.submission.status === "success" &&
    typeof result.alert !== "undefined"
  ) {
    return redirectWithAlert(redirectUrl, result.alert);
  }
  return { submission: result.submission, currentTimestamp: Date.now() };
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
    shouldValidate: "onInput",
    onValidate: (values) => {
      return parseWithZod(values.formData, {
        schema: searchOrganizationsSchema(locales),
      });
    },
    shouldRevalidate: "onInput",
    lastResult: navigation.state === "idle" ? loaderSubmission : null,
  });
  const [createOrganizationMemberRequestForm] = useForm({
    id: `create-organization-member-request-${
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
    shouldValidate: "onInput",
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
        className="mv-absolute"
      />
      <button form={createOrganizationForm.id} type="submit" hidden />
      <TextButton
        as="a"
        href="/my/organizations"
        weight="thin"
        variant="neutral"
        arrowLeft
      >
        {locales.route.back}
      </TextButton>
      <h1 className="mv-mb-0 mv-text-primary mv-text-5xl mv-font-bold mv-leading-9">
        {locales.route.headline}
      </h1>
      <Section>
        <div className="mv-w-full mv-flex mv-flex-col mv-gap-4">
          {/* Organization name Section */}
          <h2 className="mv-mb-0 mv-text-2xl mv-font-bold mv-leading-[26px]">
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
                    className="mv-text-sm mv-font-semibold mv-text-negative-600"
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
                type: "search",
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
            <Form
              {...getFormProps(createOrganizationMemberRequestForm)}
              method="post"
              preventScrollReset
            >
              <ListContainer
                locales={locales}
                listKey="organizations-to-request-membership-search-results"
                hideAfter={3}
              >
                {searchedOrganizations.map((searchedOrganization, index) => {
                  return (
                    <ListItem
                      key={`organizations-to-request-membership-search-result-${searchedOrganization.slug}`}
                      entity={searchedOrganization}
                      locales={locales}
                      listIndex={index}
                      hideAfter={3}
                    >
                      {organizations.some((organization) => {
                        return organization.id === searchedOrganization.id;
                      }) ? (
                        <div className="mv-w-full mv-text-center mv-text-nowrap mv-text-positive-600 mv-text-sm mv-font-semibold mv-leading-5">
                          {
                            locales.route.form.organizationName
                              .requestOrganizationMembership.alreadyMember
                          }
                        </div>
                      ) : pendingRequestsToOrganizations.some(
                          (organization) => {
                            return organization.id === searchedOrganization.id;
                          }
                        ) ? (
                        <div className="mv-w-full mv-text-center mv-text-nowrap mv-text-neutral-700 mv-text-sm mv-font-semibold mv-leading-5">
                          {
                            locales.route.form.organizationName
                              .requestOrganizationMembership.alreadyRequested
                          }
                        </div>
                      ) : (
                        <Button
                          name="intent"
                          variant="outline"
                          value={`create-organization-member-request-${searchedOrganization.id}`}
                          type="submit"
                          fullSize
                        >
                          {
                            locales.route.form.organizationName
                              .requestOrganizationMembership
                              .createOrganizationMemberRequestCta
                          }
                        </Button>
                      )}
                    </ListItem>
                  );
                })}
              </ListContainer>
              {typeof createOrganizationMemberRequestForm.errors !==
                "undefined" &&
              createOrganizationMemberRequestForm.errors.length > 0 ? (
                <div>
                  {createOrganizationMemberRequestForm.errors.map(
                    (error, index) => {
                      return (
                        <div
                          id={createOrganizationMemberRequestForm.errorId}
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
          ) : null}
        </div>
        {/* Organization types section */}
        <div className="mv-w-full mv-flex mv-flex-col mv-gap-4">
          <h2 className="mv-mb-0 mv-text-2xl mv-font-bold mv-leading-[26px]">
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
                    className="mv-text-start mv-w-full mv-py-1 mv-px-2"
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
        <div className="mv-w-full mv-flex mv-flex-col mv-gap-4">
          <h2
            className={`mv-mb-0 mv-text-2xl mv-font-bold mv-leading-[26px] ${
              isNetwork === false ? "mv-text-neutral-300" : "mv-text-primary"
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
              <span
                className={isNetwork === false ? "mv-text-neutral-300" : ""}
              >
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
                <span
                  className={isNetwork === false ? "mv-text-neutral-300" : ""}
                >
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
                    className="mv-text-start mv-w-full mv-py-1 mv-px-2"
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
      {typeof createOrganizationForm.errors !== "undefined" &&
      createOrganizationForm.errors.length > 0 ? (
        <div>
          {createOrganizationForm.errors.map((error, index) => {
            return (
              <div
                id={createOrganizationForm.errorId}
                key={index}
                className="mv-text-sm mv-font-semibold mv-text-negative-600"
              >
                {error}
              </div>
            );
          })}
        </div>
      ) : null}

      <div className="mv-w-full mv-flex mv-flex-col @sm:mv-flex-row mv-justify-between mv-items-end @sm:mv-items-start mv-gap-4 @sm:mv-px-6">
        <p className="mv-text-neutral-700 mv-text-xs mv-leading-4">
          {locales.route.form.helperText}
        </p>
        <div className="mv-flex mv-gap-2">
          <Button as="a" href="/my/organizations" variant="outline">
            {locales.route.form.cancel}
          </Button>
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
                  createOrganizationForm.valid === false
                : false
            }
          >
            {locales.route.form.submit}
          </Button>
        </div>
      </div>
    </Container>
  );
}

export default CreateOrganization;
