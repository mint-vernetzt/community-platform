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
  useLoaderData,
  useLocation,
  useNavigation,
  useSearchParams,
  useSubmit,
} from "@remix-run/react";
import { useHydrated } from "remix-utils/use-hydrated";
import { z } from "zod";
import { createAuthClient, getSessionUser } from "~/auth.server";
import { BackButton } from "~/components-next/BackButton";
import { ConformSelect } from "~/components-next/ConformSelect";
import { ListContainer } from "~/components-next/ListContainer";
import { ListItem } from "~/components-next/ListItem";
import { detectLanguage } from "~/i18n.server";
import { useUnsavedChangesBlockerWithModal } from "~/lib/hooks/useUnsavedChangesBlockerWithModal";
import { decideBetweenSingularOrPlural } from "~/lib/utils/i18n";
import { invariantResponse } from "~/lib/utils/response";
import { getParamValueOrThrow } from "~/lib/utils/routes";
import { languageModuleMap } from "~/locales/.server";
import { prismaClient } from "~/prisma.server";
import { getRedirectPathOnProtectedOrganizationRoute } from "~/routes/organization/$slug/utils.server";
import { redirectWithToast } from "~/toast.server";
import {
  getOrganizationWithNetworksAndNetworkMembers,
  updateOrganization,
} from "./manage.server";
import { Deep, SearchOrganizations } from "~/lib/utils/searchParams";
import { searchOrganizationsSchema } from "~/form-helpers";
import { searchOrganizations } from "~/routes/utils.server";
import { deriveMode } from "~/utils.server";

export const manageSchema = z.object({
  organizationTypes: z.array(z.string().uuid()),
  networkTypes: z.array(z.string().uuid()),
});

export async function loader(args: LoaderFunctionArgs) {
  const { request, params } = args;
  const language = await detectLanguage(request);
  const locales =
    languageModuleMap[language]["next/organization/$slug/settings/manage"];

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

  // TODO: Add pending network join requests here to exclude them from the search
  const currentNetworkIds = [
    ...organization.memberOf.map((relation) => relation.network.id),
  ];

  const { searchedOrganizations: searchedNetworks, submission } =
    await searchOrganizations({
      searchParams: new URL(request.url).searchParams,
      idsToExclude: currentNetworkIds,
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
    submission,
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
    languageModuleMap[language]["next/organization/$slug/settings/manage"];

  const redirectPath = await getRedirectPathOnProtectedOrganizationRoute({
    request,
    slug,
    sessionUser,
    authClient,
  });
  if (redirectPath !== null) {
    return redirect(redirectPath);
  }

  invariantResponse(
    params.slug !== undefined,
    locales.route.error.invalidRoute,
    {
      status: 400,
    }
  );

  const organization = await prismaClient.organization.findFirst({
    where: { slug },
    select: { id: true },
  });

  invariantResponse(organization !== null, locales.route.error.notFound, {
    status: 404,
  });

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
      slug: params.slug,
      organizationId: organization.id,
      locales,
    });
    // TODO: Implement join and leave network
  } else if (intent.startsWith("join-network-")) {
    const joinNetworkFormData = new FormData();
    joinNetworkFormData.set(
      "organizationId",
      intent.replace("join-network-", "")
    );
    // result = await joinNetwork({
    //   formData: joinNetworkFormData,
    //   slug,
    //   locales,
    // });
  } else if (intent.startsWith("leave-network-")) {
    const leaveNetworkFormData = new FormData();
    leaveNetworkFormData.set(
      "organizationId",
      intent.replace("leave-network-", "")
    );
    // result = await leaveNetwork({
    //   formData: leaveNetworkFormData,
    //   slug,
    //   locales,
    // });
  } else {
    invariantResponse(false, locales.route.error.wrongIntent, {
      status: 400,
    });
  }

  // if (
  //   result.submission !== undefined &&
  //   result.submission.status === "success" &&
  //   result.toast !== undefined
  // ) {
  //   return redirectWithToast(request.url, result.toast);
  // }
  // return { submission: result.submission };
  return redirectWithToast(
    request.url,
    result?.toast || {
      id: "manage-organization-toast",
      key: `${new Date().getTime()}`,
      message: locales.route.content.success,
    }
  );
}

function Manage() {
  const loaderData = useLoaderData<typeof loader>();
  const {
    organization,
    allOrganizationTypes,
    allNetworkTypes,
    searchedNetworks,
    submission: loaderSubmission,
    locales,
  } = loaderData;
  const actionData = useActionData<typeof action>();

  const location = useLocation();
  const isHydrated = useHydrated();
  const navigation = useNavigation();
  const submit = useSubmit();
  const [searchParams] = useSearchParams();

  const {
    types: organizationTypes,
    networkTypes,
    memberOf,
    // networkMembers,
  } = organization;

  const defaultValues = {
    organizationTypes: organizationTypes.map(
      (relation) => relation.organizationType.id
    ),
    networkTypes: networkTypes.map((relation) => relation.networkType.id),
  };

  const [form, fields] = useForm({
    id: `manage-form-${loaderData.currentTimestamp}`,
    constraint: getZodConstraint(manageSchema),
    defaultValue: defaultValues,
    shouldValidate: "onInput",
    shouldRevalidate: "onInput",
    lastResult: navigation.state === "idle" ? actionData?.submission : null,
    onValidate: (args) => {
      const { formData } = args;
      const submission = parseWithZod(formData, {
        schema: manageSchema,
      });
      return submission;
    },
  });

  const [searchNetworksForm, searchNetworksFields] = useForm({
    id: "search-networks",
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

  const [joinNetworkForm] = useForm({
    id: "add-network",
    lastResult: navigation.state === "idle" ? actionData?.submission : null,
  });

  const [leaveNetworkForm] = useForm({
    id: "remove-network",
    lastResult: navigation.state === "idle" ? actionData?.submission : null,
  });

  const organizationTypeList = fields.organizationTypes.getFieldList();
  let networkTypeList = fields.networkTypes.getFieldList();
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

  const UnsavedChangesBlockerModal = useUnsavedChangesBlockerWithModal({
    searchParam: "modal-unsaved-changes",
    formMetadataToCheck: form,
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
          {...getFormProps(form)}
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
              id={fields.organizationTypes.id}
              cta={locales.route.content.types.option}
            >
              <ConformSelect.Label htmlFor={fields.organizationTypes.id}>
                {locales.route.content.types.label}
              </ConformSelect.Label>
              <ConformSelect.HelperText>
                {locales.route.content.types.helper}
              </ConformSelect.HelperText>
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
                      {...form.insert.getButtonProps({
                        name: fields.organizationTypes.name,
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
                          {...form.remove.getButtonProps({
                            name: fields.organizationTypes.name,
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
                isNetwork === false ? "mv-text-neutral-300" : "mv-text-primary"
              }`}
            >
              {locales.route.content.networkTypes.headline}
            </h2>
            <ConformSelect
              id={fields.networkTypes.id}
              cta={locales.route.content.networkTypes.option}
              disabled={isNetwork === false}
            >
              <ConformSelect.Label htmlFor={fields.networkTypes.id}>
                <span
                  className={isNetwork === false ? "mv-text-neutral-300" : ""}
                >
                  {locales.route.content.networkTypes.label}
                </span>
              </ConformSelect.Label>
              <ConformSelect.HelperText>
                <span
                  className={isNetwork === false ? "mv-text-neutral-300" : ""}
                >
                  {locales.route.content.networkTypes.helper}
                </span>
              </ConformSelect.HelperText>
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
                      {...form.insert.getButtonProps({
                        name: fields.networkTypes.name,
                        defaultValue: filteredNetworkType.id,
                      })}
                      form={form.id}
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
                          {...form.remove.getButtonProps({
                            name: fields.networkTypes.name,
                            index,
                          })}
                        />
                      </Chip.Delete>
                    </Chip>
                  );
                })}
              </Chip.Container>
            )}
            <div className="mv-flex mv-w-full mv-items-center mv-justify-center @xl:mv-justify-end">
              <div className="mv-flex mv-flex-col mv-w-full @xl:mv-w-fit mv-gap-2">
                <Controls>
                  <Button
                    type="reset"
                    onClick={() => {
                      setTimeout(() => form.reset(), 0);
                    }}
                    variant="outline"
                    fullSize
                    disabled={isHydrated ? form.dirty === false : false}
                  >
                    {locales.route.form.reset}
                  </Button>
                  <Button
                    type="submit"
                    name="intent"
                    value="submit"
                    fullSize
                    // Don't disable button when js is disabled
                    disabled={
                      isHydrated
                        ? form.dirty === false || form.valid === false
                        : false
                    }
                  >
                    {locales.route.form.submit}
                  </Button>
                </Controls>
                <noscript>
                  <Button as="a" href="./manage" variant="outline" fullSize>
                    {locales.route.form.reset}
                  </Button>
                </noscript>
              </div>
            </div>
          </div>
          <div className="mv-flex mv-flex-col mv-gap-4 @md:mv-p-4 @md:mv-border @md:mv-rounded-lg @md:mv-border-gray-200">
            {/* Current Networks and Remove Section */}
            {memberOf.length > 0 ? (
              <>
                <h2 className="mv-text-primary mv-text-lg mv-font-semibold mv-mb-0">
                  {decideBetweenSingularOrPlural(
                    locales.route.content.networks.current.headline_one,
                    locales.route.content.networks.current.headline_other,
                    organization.memberOf.length
                  )}
                </h2>
                <Form
                  {...getFormProps(leaveNetworkForm)}
                  method="post"
                  preventScrollReset
                >
                  <ListContainer locales={locales}>
                    {organization.memberOf.map((relation) => {
                      return (
                        <ListItem
                          key={`network-${relation.network.slug}`}
                          entity={relation.network}
                          locales={locales}
                        >
                          {organization.memberOf.length > 1 && (
                            <Button
                              name="intent"
                              variant="outline"
                              value={`leave-network-${relation.network.id}`}
                              type="submit"
                              fullSize
                            >
                              {locales.route.content.networks.current.leave}
                            </Button>
                          )}
                        </ListItem>
                      );
                    })}
                  </ListContainer>
                </Form>
              </>
            ) : null}
            {/* Search Networks To Add Section */}
            <h2 className="mv-text-primary mv-text-lg mv-font-semibold mv-mb-0">
              {locales.route.content.networks.join.headline}
            </h2>
            <p>{locales.route.content.networks.join.subline}</p>
            <Form
              {...getFormProps(searchNetworksForm)}
              method="get"
              onChange={(event) => {
                searchNetworksForm.validate();
                if (searchNetworksForm.valid) {
                  submit(event.currentTarget, { preventScrollReset: true });
                }
              }}
              autoComplete="off"
            >
              <Input name={Deep} defaultValue="true" type="hidden" />
              <Input
                {...getInputProps(searchNetworksFields[SearchOrganizations], {
                  type: "search",
                })}
                key={searchNetworksFields[SearchOrganizations].id}
                standalone
              >
                <Input.Label
                  htmlFor={searchNetworksFields[SearchOrganizations].id}
                >
                  {locales.route.content.networks.join.label}
                </Input.Label>
                <Input.SearchIcon />

                {typeof searchNetworksFields[SearchOrganizations].errors !==
                  "undefined" &&
                searchNetworksFields[SearchOrganizations].errors.length > 0 ? (
                  searchNetworksFields[SearchOrganizations].errors.map(
                    (error) => (
                      <Input.Error
                        id={searchNetworksFields[SearchOrganizations].errorId}
                        key={error}
                      >
                        {error}
                      </Input.Error>
                    )
                  )
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
            </Form>
            {searchedNetworks.length > 0 ? (
              <Form
                {...getFormProps(joinNetworkForm)}
                method="post"
                preventScrollReset
              >
                <ListContainer locales={locales}>
                  {searchedNetworks.map((organization) => {
                    return (
                      <ListItem
                        key={`network-search-result-${organization.slug}`}
                        entity={organization}
                        locales={locales}
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
              </Form>
            ) : null}
            {/* TODO: Add or remove network members section -> disable the section when orgTypeList does not have network */}
          </div>
        </div>
      </Section>
    </>
  );
}

export default Manage;
