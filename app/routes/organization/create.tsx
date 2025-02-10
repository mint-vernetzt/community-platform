import { getFormProps, getInputProps, useForm } from "@conform-to/react-v1";
import { getZodConstraint, parseWithZod } from "@conform-to/zod-v1";
import { Button } from "@mint-vernetzt/components/src/molecules/Button";
import { Chip } from "@mint-vernetzt/components/src/molecules/Chip";
import { Input } from "@mint-vernetzt/components/src/molecules/Input";
import { TextButton } from "@mint-vernetzt/components/src/molecules/TextButton";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { redirect } from "@remix-run/node";
import {
  Form,
  useActionData,
  useLoaderData,
  useNavigation,
  useSearchParams,
} from "@remix-run/react";
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
import { detectLanguage } from "~/i18n.server";
import { BlurFactor, ImageSizes, getImageURL } from "~/images.server";
import { insertParametersIntoLocale } from "~/lib/utils/i18n";
import { invariant, invariantResponse } from "~/lib/utils/response";
import { languageModuleMap } from "~/locales/.server";
import { getPublicURL } from "~/storage.server";
import { generateOrganizationSlug } from "~/utils.server";
import {
  countOrganizationsBySearchQuery,
  createOrganizationOnProfile,
  getAllNetworkTypes,
  getAllOrganizationTypes,
  getOrganizationTypesWithSlugs as getOrganizationTypeNetwork,
  searchForOrganizationsByName,
  type CreateOrganizationLocales,
} from "./create.server";

const createSchema = (locales: CreateOrganizationLocales) => {
  return z.object({
    organizationName: z
      .string({
        required_error: locales.route.validation.organizationName.required,
      })
      .min(3, locales.route.validation.organizationName.min)
      .max(80, locales.route.validation.organizationName.max),
    organizationTypes: z.array(z.string().uuid()),
    networkTypes: z.array(z.string().uuid()),
  });
};

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

  const url = new URL(request.url);

  const queryString = url.searchParams.get("search");
  const query =
    queryString !== null && queryString.length >= 3
      ? queryString.split(" ")
      : [];

  let searchResult: Awaited<ReturnType<typeof searchForOrganizationsByName>> =
    [];

  if (query.length > 0) {
    searchResult = await searchForOrganizationsByName(query);
    searchResult = searchResult.map((relation) => {
      let logo = relation.logo;
      let blurredLogo;
      if (logo !== null) {
        const publicURL = getPublicURL(authClient, logo);
        if (publicURL !== null) {
          logo = getImageURL(publicURL, {
            resize: {
              type: "fill",
              width:
                ImageSizes.Organization.ListItemCreateOrganization.Logo.width,
              height:
                ImageSizes.Organization.ListItemCreateOrganization.Logo.height,
            },
          });
          blurredLogo = getImageURL(publicURL, {
            resize: {
              type: "fill",
              width:
                ImageSizes.Organization.ListItemCreateOrganization.BlurredLogo
                  .width,
              height:
                ImageSizes.Organization.ListItemCreateOrganization.BlurredLogo
                  .height,
            },
            blur: BlurFactor,
          });
        }
      }
      return { ...relation, logo, blurredLogo };
    });
  }

  const allOrganizationTypes = await getAllOrganizationTypes();
  const allNetworkTypes = await getAllNetworkTypes();

  return {
    searchResult,
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

  const url = new URL(request.url);

  const queryString = url.searchParams.get("search");

  const language = await detectLanguage(request);
  const locales = languageModuleMap[language]["organization/create"];

  const formData = await request.formData();
  const submission = parseWithZod(formData, { schema: createSchema(locales) });

  if (submission.status !== "success") {
    return {
      submission: submission.reply(),
    };
  }

  const { organizationName } = submission.value;

  const query = organizationName.split(" ");
  const similarOrganizationsCount = await countOrganizationsBySearchQuery(
    query
  );

  if (
    similarOrganizationsCount === 0 ||
    // This condition is for the second submission, when the user wants to create the organization even if a similar exists
    (queryString !== null && queryString === organizationName)
  ) {
    const slug = generateOrganizationSlug(organizationName);
    const organizationTypeNetwork = await getOrganizationTypeNetwork();
    invariantResponse(
      organizationTypeNetwork !== null,
      locales.route.validation.organizationTypeNetworkNotFound,
      { status: 404 }
    );
    const isNetwork = submission.value.organizationTypes.some(
      (id) => id === organizationTypeNetwork.id
    );
    invariantResponse(
      (isNetwork === false && submission.value.networkTypes.length > 0) ===
        false,
      locales.route.validation.notANetwork,
      { status: 400 }
    );
    if (isNetwork === true && submission.value.networkTypes.length === 0) {
      const newSubmission = parseWithZod(formData, {
        schema: () =>
          createSchema(locales).transform(async (data, ctx) => {
            ctx.addIssue({
              code: "custom",
              message: locales.route.validation.networkTypesRequired,
              path: ["networkTypes"],
            });
            return z.NEVER;
          }),
      });
      return {
        submission: newSubmission.reply(),
        currentTimestamp: Date.now(),
      };
    }
    await createOrganizationOnProfile(sessionUser.id, submission.value, slug);
    return redirectWithAlert(`/organization/${slug}/detail/about`, {
      message: insertParametersIntoLocale(locales.route.successAlert, {
        name: submission.value.organizationName,
        slug: slug,
      }),
      isRichtext: true,
    });
  } else {
    const redirectURL = new URL(request.url);
    redirectURL.searchParams.set("search", submission.value.organizationName);
    return redirect(
      `${redirectURL.pathname}?${redirectURL.searchParams.toString()}`
    );
  }
}

function CreateOrganization() {
  const loaderData = useLoaderData<typeof loader>();
  const {
    searchResult,
    allOrganizationTypes,
    allNetworkTypes,
    locales,
    currentTimestamp,
  } = loaderData;
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isHydrated = useHydrated();
  const [searchParams] = useSearchParams();
  const searchQuery = searchParams.get("search") || undefined;

  const [form, fields] = useForm({
    id: `create-organization-${
      actionData?.currentTimestamp || currentTimestamp
    }`,
    constraint: getZodConstraint(createSchema(locales)),
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
          createSchema(locales).transform((data, ctx) => {
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

  return (
    <Container>
      <Form
        {...getFormProps(form)}
        method="post"
        preventScrollReset
        autoComplete="off"
        className="mv-absolute"
      />
      <button form={form.id} type="submit" hidden />
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
          <Input
            {...getInputProps(fields.organizationName, { type: "text" })}
            key="organizationName"
          >
            <Input.Label htmlFor={fields.organizationName.id}>
              {locales.route.form.organizationName.label}
            </Input.Label>
            {typeof fields.organizationName.errors !== "undefined" && (
              <Input.Error>{fields.organizationName.errors}</Input.Error>
            )}
          </Input>
          {/* Already existing organizations section */}
          {searchResult.length > 0 && (
            <div className="mv-flex mv-flex-col mv-gap-2 mv-mt-8">
              <p>
                {insertParametersIntoLocale(
                  locales.route.form.organizationName.sameOrganization,
                  {
                    searchQuery,
                  }
                )}
              </p>
              <ListContainer
                listKey="already-existing-organizations"
                locales={locales}
              >
                {searchResult.map((organization, index) => {
                  return (
                    <ListItem
                      key={`already-existing-organization-${organization.id}`}
                      listIndex={index}
                      entity={organization}
                      locales={locales}
                    />
                  );
                })}
              </ListContainer>
            </div>
          )}
        </div>
        {/* Organization types section */}
        <div className="mv-w-full mv-flex mv-flex-col mv-gap-4">
          <h2 className="mv-mb-0 mv-text-2xl mv-font-bold mv-leading-[26px]">
            {locales.route.form.organizationTypes.headline}
          </h2>
          <ConformSelect
            id={fields.organizationTypes.id}
            cta={locales.route.form.organizationTypes.cta}
          >
            <ConformSelect.Label htmlFor={fields.organizationTypes.id}>
              {locales.route.form.organizationTypes.label}
            </ConformSelect.Label>

            {typeof fields.organizationTypes.errors !== "undefined" ? (
              <ConformSelect.Error>
                {fields.organizationTypes.errors}
              </ConformSelect.Error>
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
                    {...form.insert.getButtonProps({
                      name: fields.organizationTypes.name,
                      defaultValue: filteredOrganizationType.id,
                    })}
                    form={form.id}
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
                    <Input
                      {...getInputProps(listOrganizationType, {
                        type: "hidden",
                      })}
                      key="organizationTypes"
                    />
                    {title || locales.route.form.organizationTypes.notFound}
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
            id={fields.networkTypes.id}
            cta={locales.route.form.networkTypes.cta}
            disabled={isNetwork === false}
          >
            <ConformSelect.Label htmlFor={fields.networkTypes.id}>
              <span
                className={isNetwork === false ? "mv-text-neutral-300" : ""}
              >
                {locales.route.form.networkTypes.label}
              </span>
            </ConformSelect.Label>
            {typeof fields.networkTypes.errors !== "undefined" ? (
              <ConformSelect.Error>
                {fields.networkTypes.errors}
              </ConformSelect.Error>
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
                    <Input
                      {...getInputProps(listNetworkType, {
                        type: "hidden",
                      })}
                      key="networkTypes"
                    />
                    {title || locales.route.form.networkTypes.notFound}
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
        </div>

        {/* TODO: FAQ Section */}
      </Section>
      {typeof form.errors !== "undefined" && form.errors.length > 0 ? (
        <div>
          {form.errors.map((error, index) => {
            return (
              <div
                id={form.errorId}
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
        <div className="mv-flex mv-gap-2 ">
          <Button as="a" href="/my/organizations" variant="outline">
            {locales.route.form.cancel}
          </Button>
          <Button
            form={form.id}
            type="submit"
            name="intent"
            defaultValue="submit"
            fullSize
            // Don't disable button when js is disabled
            disabled={
              isHydrated ? form.dirty === false || form.valid === false : false
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
