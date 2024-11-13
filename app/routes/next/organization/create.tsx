import { conform, list, useFieldList, useForm } from "@conform-to/react";
import { getFieldsetConstraint, parse } from "@conform-to/zod";
import { Button, Chip, Input, TextButton } from "@mint-vernetzt/components";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import {
  Form,
  Link,
  useActionData,
  useLoaderData,
  useSearchParams,
} from "@remix-run/react";
import { type TFunction } from "i18next";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import {
  createAuthClient,
  getSessionUserOrRedirectPathToLogin,
  getSessionUserOrThrow,
} from "~/auth.server";
import i18next from "~/i18next.server";
import { BlurFactor, ImageSizes, getImageURL } from "~/images.server";
import { detectLanguage } from "~/root.server";
import {
  Container,
  ListContainer,
  ListItem,
  Section,
} from "~/routes/my/__components";
import { getPublicURL } from "~/storage.server";
import { generateOrganizationSlug } from "~/utils.server";
import {
  countOrganizationsBySearchQuery,
  createOrganizationOnProfile,
  getAllNetworkTypes,
  getAllOrganizationTypes,
  getOrganizationTypesWithSlugs,
  searchForOrganizationsByName,
} from "./create.server";
import { ButtonSelect } from "~/routes/project/$slug/settings/__components";
import { checkFeatureAbilitiesOrThrow } from "~/lib/utils/application";

const i18nNS = [
  "routes/next/organization/create",
  "datasets/organizationTypes",
  "datasets/networkTypes",
];
export const handle = {
  i18n: i18nNS,
};

const createSchema = (t: TFunction) => {
  return z.object({
    organizationName: z
      .string({
        required_error: t("validation.organizationName.required"),
      })
      .min(3, t("validation.organizationName.min"))
      .max(80, t("validation.organizationName.max")),
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

  return json({ searchResult, allOrganizationTypes, allNetworkTypes });
}

export async function action(args: ActionFunctionArgs) {
  const { request } = args;

  const { authClient } = createAuthClient(request);
  const sessionUser = await getSessionUserOrThrow(authClient);

  await checkFeatureAbilitiesOrThrow(authClient, ["next-organization-create"]);

  const url = new URL(request.url);

  const queryString = url.searchParams.get("search");

  const locale = detectLanguage(request);
  const t = await i18next.getFixedT(locale, i18nNS);

  const formData = await request.formData();
  const submission = parse(formData, { schema: createSchema(t) });

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
        return redirect(`/organization/${slug}`);
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

  return json(submission);
}

function CreateOrganization() {
  const loaderData = useLoaderData<typeof loader>();
  const { searchResult, allOrganizationTypes, allNetworkTypes } = loaderData;
  const actionData = useActionData<typeof action>();

  const [searchParams] = useSearchParams();

  const searchQuery = searchParams.get("search") || "";

  const { t } = useTranslation(i18nNS);
  const [form, fields] = useForm({
    id: "create-organization-form",
    constraint: getFieldsetConstraint(createSchema(t)),
    lastSubmission: actionData,
    defaultValue: {
      organizationName: searchQuery,
    },
    shouldValidate: "onSubmit",
    shouldRevalidate: "onInput",
    onValidate({ formData }) {
      return parse(formData, { schema: createSchema(t) });
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
    <Form method="post" {...form.props}>
      <Container>
        <TextButton weight="thin" variant="neutral" arrowLeft>
          <Link to="/my/organizations" prefetch="intent">
            {t("back")}
          </Link>
        </TextButton>
        <h1 className="mv-mb-0 mv-text-primary mv-text-5xl mv-font-bold mv-leading-9">
          {t("headline")}
        </h1>
        <Section>
          <div className="mv-w-full mv-flex mv-flex-col mv-gap-4">
            {/* Organization name Section */}
            <h2 className="mv-mb-0 mv-text-2xl mv-font-bold mv-leading-[26px]">
              {t("form.organizationName.headline")}
            </h2>
            <Input {...conform.input(fields.organizationName)}>
              <Input.Label htmlFor={fields.organizationName.id}>
                {t("form.organizationName.label")}
              </Input.Label>
              {typeof fields.organizationName.error !== "undefined" && (
                <Input.Error>{fields.organizationName.error}</Input.Error>
              )}
            </Input>
            {/* Already existing organizations section */}
            {searchResult.length > 0 && (
              <div className="mv-flex mv-flex-col mv-gap-2 mv-mt-8">
                <p>
                  {t("form.organizationName.sameOrganization", {
                    searchQuery,
                  })}
                </p>
                <ListContainer listKey="already-existing-organizations">
                  {searchResult.map((organization, index) => {
                    return (
                      <ListItem
                        key={`already-existing-organization-${organization.id}`}
                        listIndex={index}
                        entity={organization}
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
              {t("form.organizationTypes.headline")}
            </h2>
            <ButtonSelect
              id={fields.organizationTypes.id}
              cta={t("form.organizationTypes.cta")}
            >
              <ButtonSelect.Label htmlFor={fields.organizationTypes.id}>
                {t("form.organizationTypes.label")}
              </ButtonSelect.Label>
              <ButtonSelect.HelperText>
                {t("form.organizationTypes.helperText")}
              </ButtonSelect.HelperText>
              {allOrganizationTypes
                .filter((organizationType) => {
                  return !organizationTypeList.some((listOrganizationType) => {
                    return (
                      listOrganizationType.defaultValue === organizationType.id
                    );
                  });
                })
                .map((filteredOrganizationType) => {
                  return (
                    <button
                      key={filteredOrganizationType.id}
                      {...list.insert(fields.organizationTypes.name, {
                        defaultValue: filteredOrganizationType.id,
                      })}
                      className="mv-text-start mv-w-full mv-py-1 mv-px-2"
                    >
                      {t(`${filteredOrganizationType.slug}.title`, {
                        ns: "datasets/organizationTypes",
                      })}
                    </button>
                  );
                })}
            </ButtonSelect>
            {organizationTypeList.length > 0 && (
              <Chip.Container>
                {organizationTypeList.map((listOrganizationType, index) => {
                  return (
                    <Chip key={listOrganizationType.key}>
                      <Input
                        type="hidden"
                        {...conform.input(listOrganizationType)}
                      />
                      {t(
                        `${
                          allOrganizationTypes.find((organizationType) => {
                            return (
                              organizationType.id ===
                              listOrganizationType.defaultValue
                            );
                          })?.slug
                        }.title`,
                        { ns: "datasets/organizationTypes" }
                      ) || t("form.organizationTypes.notFound")}
                      <Chip.Delete>
                        <button
                          {...list.remove(fields.organizationTypes.name, {
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
          {/* TODO: Single or multiple choice? helper text, radios vs. checkboxes, chips or label to show currently selected, etc... */}
          <div className="mv-w-full mv-flex mv-flex-col mv-gap-4">
            <h2
              className={`mv-mb-0 mv-text-2xl mv-font-bold mv-leading-[26px] ${
                isNetwork === false ? "mv-text-neutral-300" : "mv-text-primary"
              }`}
            >
              {t("form.networkTypes.headline")}
            </h2>
            <ButtonSelect
              id={fields.networkTypes.id}
              cta={t("form.networkTypes.cta")}
              disabled={isNetwork === false}
            >
              <ButtonSelect.Label htmlFor={fields.networkTypes.id}>
                <span
                  className={isNetwork === false ? "mv-text-neutral-300" : ""}
                >
                  {t("form.networkTypes.label")}
                </span>
              </ButtonSelect.Label>
              <ButtonSelect.HelperText>
                <span
                  className={isNetwork === false ? "mv-text-neutral-300" : ""}
                >
                  {t("form.networkTypes.helperText")}
                </span>
              </ButtonSelect.HelperText>
              {allNetworkTypes
                .filter((networkType) => {
                  return !networkTypeList.some((listNetworkType) => {
                    return listNetworkType.defaultValue === networkType.id;
                  });
                })
                .map((filteredNetworkType) => {
                  return (
                    <button
                      key={filteredNetworkType.id}
                      {...list.insert(fields.networkTypes.name, {
                        defaultValue: filteredNetworkType.id,
                      })}
                      disabled={!isNetwork}
                      className="mv-text-start mv-w-full mv-py-1 mv-px-2"
                    >
                      {t(`${filteredNetworkType.slug}.title`, {
                        ns: "datasets/networkTypes",
                      })}
                    </button>
                  );
                })}
            </ButtonSelect>
            {networkTypeList.length > 0 && (
              <Chip.Container>
                {networkTypeList.map((listNetworkType, index) => {
                  return (
                    <Chip key={listNetworkType.key}>
                      <Input
                        type="hidden"
                        {...conform.input(listNetworkType)}
                      />
                      {t(
                        `${
                          allNetworkTypes.find((networkType) => {
                            return (
                              networkType.id === listNetworkType.defaultValue
                            );
                          })?.slug
                        }.title`,
                        { ns: "datasets/networkTypes" }
                      ) || t("form.networkTypes.notFound")}
                      <Chip.Delete>
                        <button
                          {...list.remove(fields.networkTypes.name, { index })}
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

        <div className="mv-w-full mv-flex mv-flex-col @sm:mv-flex-row mv-justify-between mv-gap-4 @sm:mv-px-6">
          <p className="mv-text-neutral-700 mv-text-xs mv-leading-4">
            {t("form.helperText")}
          </p>
          <div className="mv-flex mv-gap-2 ">
            <Button form={form.id} type="reset" variant="outline">
              {t("form.reset")}
            </Button>
            <Button form={form.id} type="submit">
              {t("form.submit")}
            </Button>
          </div>
        </div>
      </Container>
    </Form>
  );
}

export default CreateOrganization;
