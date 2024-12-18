import { conform, list, useFieldList, useForm } from "@conform-to/react";
import { getFieldsetConstraint, parse } from "@conform-to/zod";
import { Button } from "@mint-vernetzt/components/src/molecules/Button";
import { Chip } from "@mint-vernetzt/components/src/molecules/Chip";
import { Input } from "@mint-vernetzt/components/src/molecules/Input";
import { TextButton } from "@mint-vernetzt/components/src/molecules/TextButton";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { redirect } from "@remix-run/node";
import {
  Form,
  Link,
  useActionData,
  useLoaderData,
  useSearchParams,
} from "@remix-run/react";
import { z } from "zod";
import {
  createAuthClient,
  getSessionUserOrRedirectPathToLogin,
  getSessionUserOrThrow,
} from "~/auth.server";
import { BlurFactor, ImageSizes, getImageURL } from "~/images.server";
import { detectLanguage } from "~/i18n.server";
import { Container } from "~/components-next/MyProjectsCreateOrganizationContainer";
import { ListContainer } from "~/components-next/ListContainer";
import { ListItem } from "~/components-next/ListItem";
import { Section } from "~/components-next/MyOrganizationsSection";
import { getPublicURL } from "~/storage.server";
import { generateOrganizationSlug } from "~/utils.server";
import {
  countOrganizationsBySearchQuery,
  type CreateOrganizationLocales,
  createOrganizationOnProfile,
  getAllNetworkTypes,
  getAllOrganizationTypes,
  getOrganizationTypesWithSlugs,
  searchForOrganizationsByName,
} from "./create.server";
import { ConformSelect } from "~/components-next/ConformSelect";
import { checkFeatureAbilitiesOrThrow } from "~/lib/utils/application";
import { redirectWithAlert } from "~/alert.server";
import { languageModuleMap } from "~/locales/.server";
import { insertParametersIntoLocale } from "~/lib/utils/i18n";

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

  await checkFeatureAbilitiesOrThrow(authClient, ["next-organization-create"]);

  const language = await detectLanguage(request);
  const locales = languageModuleMap[language]["next/organization/create"];

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

  return { searchResult, allOrganizationTypes, allNetworkTypes, locales };
}

export async function action(args: ActionFunctionArgs) {
  const { request } = args;

  const { authClient } = createAuthClient(request);
  const sessionUser = await getSessionUserOrThrow(authClient);

  await checkFeatureAbilitiesOrThrow(authClient, ["next-organization-create"]);

  const url = new URL(request.url);

  const queryString = url.searchParams.get("search");

  const language = await detectLanguage(request);
  const locales = languageModuleMap[language]["next/organization/create"];

  const formData = await request.formData();
  const submission = parse(formData, { schema: createSchema(locales) });

  if (typeof submission.value !== "undefined" && submission.value !== null) {
    if (submission.intent === "submit") {
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
        const organizationTypesWithSlugs = await getOrganizationTypesWithSlugs(
          submission.value.organizationTypes
        );
        const isNetwork = organizationTypesWithSlugs.some(
          (organizationType) => {
            return organizationType.slug === "network";
          }
        );
        if (isNetwork === false) {
          submission.value.networkTypes = [];
        }
        await createOrganizationOnProfile(
          sessionUser.id,
          submission.value,
          slug
        );
        return redirectWithAlert(`/organization/${slug}/detail/about`, {
          message: insertParametersIntoLocale(locales.route.successAlert, {
            name: submission.value.organizationName,
            slug: slug,
          }),
          isRichtext: true,
        });
      } else {
        const redirectURL = new URL(request.url);
        redirectURL.searchParams.set(
          "search",
          submission.value.organizationName
        );
        return redirect(
          `${redirectURL.pathname}?${redirectURL.searchParams.toString()}`
        );
      }
    }
  }

  return submission;
}

function CreateOrganization() {
  const loaderData = useLoaderData<typeof loader>();
  const { searchResult, allOrganizationTypes, allNetworkTypes, locales } =
    loaderData;
  const actionData = useActionData<typeof action>();

  const [searchParams] = useSearchParams();

  const searchQuery = searchParams.get("search") || "";

  const [form, fields] = useForm({
    id: "create-organization-form",
    constraint: getFieldsetConstraint(createSchema(locales)),
    lastSubmission: actionData,
    defaultValue: {
      organizationName: searchQuery,
    },
    shouldValidate: "onSubmit",
    shouldRevalidate: "onInput",
    onValidate({ formData }) {
      return parse(formData, { schema: createSchema(locales) });
    },
  });
  const organizationTypeList = useFieldList(form.ref, fields.organizationTypes);
  let networkTypeList = useFieldList(form.ref, fields.networkTypes);
  const organizationTypeNetwork = allOrganizationTypes.find(
    (organizationType) => {
      return organizationType.slug === "network";
    }
  );
  const isNetwork = organizationTypeList.some((organizationType) => {
    if (
      typeof organizationType.defaultValue === "undefined" ||
      typeof organizationTypeNetwork === "undefined"
    ) {
      return false;
    }
    return organizationType.defaultValue === organizationTypeNetwork.id;
  });
  if (isNetwork === false) {
    networkTypeList = [];
  }

  return (
    <Container>
      <Form method="post" {...form.props} className="mv-absolute" />
      <button form={form.id} type="submit" hidden />
      <TextButton weight="thin" variant="neutral" arrowLeft>
        <Link to="/my/organizations" prefetch="intent">
          {locales.route.back}
        </Link>
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
          <Input {...conform.input(fields.organizationName)}>
            <Input.Label htmlFor={fields.organizationName.id}>
              {locales.route.form.organizationName.label}
            </Input.Label>
            {typeof fields.organizationName.error !== "undefined" && (
              <Input.Error>{fields.organizationName.error}</Input.Error>
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
              <ListContainer listKey="already-existing-organizations">
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
            <ConformSelect.HelperText>
              {locales.route.form.organizationTypes.helperText}
            </ConformSelect.HelperText>
            {allOrganizationTypes
              .filter((organizationType) => {
                return !organizationTypeList.some((listOrganizationType) => {
                  return (
                    listOrganizationType.defaultValue === organizationType.id
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
                    {...list.insert(fields.organizationTypes.name, {
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
                return (
                  <Chip key={listOrganizationType.key}>
                    <Input
                      type="hidden"
                      {...conform.input(listOrganizationType)}
                    />
                    {(() => {
                      let value;
                      if (listOrganizationType.defaultValue === undefined) {
                        return null;
                      }
                      if (
                        listOrganizationType.defaultValue in
                        locales.organizationTypes
                      ) {
                        type LocaleKey = keyof typeof locales.organizationTypes;
                        value =
                          locales.organizationTypes[
                            listOrganizationType.defaultValue as LocaleKey
                          ].title;
                      } else {
                        console.error(
                          `Organization type ${listOrganizationType.defaultValue} not found in locales`
                        );
                        value = listOrganizationType.defaultValue;
                      }
                      return value;
                    })() || locales.route.form.organizationTypes.notFound}
                    <Chip.Delete>
                      <button
                        {...list.remove(fields.organizationTypes.name, {
                          index,
                        })}
                        form={form.id}
                      />
                    </Chip.Delete>
                  </Chip>
                );
              })}
            </Chip.Container>
          )}
        </div>
        {/* Network types section */}
        {/* TODO: Single or multiple choice? helper text, radios vs. checkboxes, chips or label to show currently selected, etc... */}
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
            <ConformSelect.HelperText>
              <span
                className={isNetwork === false ? "mv-text-neutral-300" : ""}
              >
                {locales.route.form.networkTypes.helperText}
              </span>
            </ConformSelect.HelperText>
            {allNetworkTypes
              .filter((networkType) => {
                return !networkTypeList.some((listNetworkType) => {
                  return listNetworkType.defaultValue === networkType.id;
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
                    {...list.insert(fields.networkTypes.name, {
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
                return (
                  <Chip key={listNetworkType.key}>
                    <Input type="hidden" {...conform.input(listNetworkType)} />
                    {(() => {
                      let value;
                      if (listNetworkType.defaultValue === undefined) {
                        return null;
                      }
                      if (
                        listNetworkType.defaultValue in locales.networkTypes
                      ) {
                        type LocaleKey = keyof typeof locales.networkTypes;
                        value =
                          locales.networkTypes[
                            listNetworkType.defaultValue as LocaleKey
                          ].title;
                      } else {
                        console.error(
                          `Organization type ${listNetworkType.defaultValue} not found in locales`
                        );
                        value = listNetworkType.defaultValue;
                      }
                      return value;
                    })() || locales.route.form.networkTypes.notFound}
                    <Chip.Delete>
                      <button
                        {...list.remove(fields.networkTypes.name, { index })}
                        form={form.id}
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

      <div className="mv-w-full mv-flex mv-flex-col @sm:mv-flex-row mv-justify-between mv-items-end @sm:mv-items-start mv-gap-4 @sm:mv-px-6">
        <p className="mv-text-neutral-700 mv-text-xs mv-leading-4">
          {locales.route.form.helperText}
        </p>
        <div className="mv-flex mv-gap-2 ">
          <Button as="a" href="/my/organizations" variant="outline">
            {locales.route.form.cancel}
          </Button>
          <Button form={form.id} type="submit">
            {locales.route.form.submit}
          </Button>
        </div>
      </div>
    </Container>
  );
}

export default CreateOrganization;
