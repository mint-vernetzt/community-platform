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
} from "@remix-run/react";
import * as Sentry from "@sentry/remix";
import { useHydrated } from "remix-utils/use-hydrated";
import { z } from "zod";
import { createAuthClient, getSessionUser } from "~/auth.server";
import { BackButton } from "~/components-next/BackButton";
import { ConformSelect } from "~/components-next/ConformSelect";
import { detectLanguage } from "~/i18n.server";
import { useUnsavedChangesBlockerWithModal } from "~/lib/hooks/useUnsavedChangesBlockerWithModal";
import { invariantResponse } from "~/lib/utils/response";
import { getParamValueOrThrow } from "~/lib/utils/routes";
import { languageModuleMap } from "~/locales/.server";
import { prismaClient } from "~/prisma.server";
import { getRedirectPathOnProtectedOrganizationRoute } from "~/routes/organization/$slug/utils.server";
import { redirectWithToast } from "~/toast.server";

const manageSchema = z.object({
  types: z.array(z.string().uuid()),
  networkTypes: z.array(z.string().uuid()),
});

export async function loader(args: LoaderFunctionArgs) {
  const { request, params } = args;
  const language = await detectLanguage(request);
  const locales =
    languageModuleMap[language]["next/organization/$slug/settings/manage"];

  const { authClient } = createAuthClient(request);

  const sessionUser = await getSessionUser(authClient);

  // check slug exists (throw bad request if not)
  invariantResponse(
    params.slug !== undefined,
    locales.route.error.invalidRoute,
    {
      status: 400,
    }
  );

  const redirectPath = await getRedirectPathOnProtectedOrganizationRoute({
    request,
    slug: params.slug,
    sessionUser,
    authClient,
  });

  if (redirectPath !== null) {
    return redirect(redirectPath);
  }

  const organization = await prismaClient.organization.findFirst({
    where: { slug: params.slug },
    select: {
      // Just selecting id for index performance
      id: true,
      types: {
        select: {
          organizationType: {
            select: {
              id: true,
            },
          },
        },
      },
      networkTypes: {
        select: {
          networkType: {
            select: {
              id: true,
            },
          },
        },
      },
    },
  });
  invariantResponse(organization !== null, locales.route.error.notFound, {
    status: 404,
  });
  const { id: _id, ...rest } = organization;
  const filteredOrganization = rest;

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

  const currentTimestamp = Date.now();

  return {
    organization: filteredOrganization,
    allOrganizationTypes,
    allNetworkTypes,
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

  const organization = await prismaClient.organization.findFirst({
    where: { slug },
    select: { id: true },
  });

  invariantResponse(organization !== null, locales.route.error.notFound, {
    status: 404,
  });

  const formData = await request.formData();
  const conformIntent = formData.get("__intent__");
  if (conformIntent !== null) {
    const submission = await parseWithZod(formData, { schema: manageSchema });
    return {
      submission: submission.reply(),
    };
  }
  const submission = await parseWithZod(formData, {
    schema: () =>
      manageSchema.transform(async (data, ctx) => {
        const { types, networkTypes } = data;
        // TODO: When network not in types -> remove all connections to network members
        try {
          await prismaClient.organization.update({
            where: {
              slug,
            },
            data: {
              types: {
                deleteMany: {},
                connectOrCreate: types.map((organizationTypeId: string) => {
                  return {
                    where: {
                      organizationId_organizationTypeId: {
                        organizationId: organization.id,
                        organizationTypeId,
                      },
                    },
                    create: {
                      organizationTypeId,
                    },
                  };
                }),
              },
              networkTypes: {
                deleteMany: {},
                connectOrCreate: networkTypes.map((networkTypeId: string) => {
                  return {
                    where: {
                      organizationId_networkTypeId: {
                        organizationId: organization.id,
                        networkTypeId,
                      },
                    },
                    create: {
                      networkTypeId,
                    },
                  };
                }),
              },
            },
          });
        } catch (error) {
          Sentry.captureException(error);
          ctx.addIssue({
            code: "custom",
            message: locales.route.error.updateFailed,
          });
          return z.NEVER;
        }

        return { ...data };
      }),
    async: true,
  });

  if (submission.status !== "success") {
    return {
      submission: submission.reply(),
    };
  }

  return redirectWithToast(request.url, {
    id: "manage-organization-toast",
    key: `${new Date().getTime()}`,
    message: locales.route.content.success,
  });
}

function Manage() {
  const location = useLocation();
  const loaderData = useLoaderData<typeof loader>();
  const { locales } = loaderData;
  const actionData = useActionData<typeof action>();
  const { organization, allOrganizationTypes, allNetworkTypes } = loaderData;
  const isHydrated = useHydrated();
  const navigation = useNavigation();

  const { types, networkTypes } = organization;

  const defaultValues = {
    types: types.map((relation) => relation.organizationType.id),
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

  const organizationTypeList = fields.types.getFieldList();
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
      >
        <div className="mv-flex mv-flex-col mv-gap-6 @md:mv-gap-4">
          <div className="mv-flex mv-flex-col mv-gap-4 @md:mv-p-4 @md:mv-border @md:mv-rounded-lg @md:mv-border-gray-200">
            <h2 className="mv-text-primary mv-text-lg mv-font-semibold mv-mb-0">
              {locales.route.content.types.headline}
            </h2>
            {/* TODO: When removing network from this list and there are networkMembers -> Show modal on submit by switching the submit button. Modal text: something like -> Are you sure? The connections will be lost. */}
            <ConformSelect
              id={fields.types.id}
              cta={locales.route.content.types.option}
            >
              <ConformSelect.Label htmlFor={fields.types.id}>
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
                  if (organizationType.slug in locales.types) {
                    type LocaleKey = keyof typeof locales.types;
                    title =
                      locales.types[organizationType.slug as LocaleKey].title;
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
                        name: fields.types.name,
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
                    if (organizationTypeSlug in locales.types) {
                      type LocaleKey = keyof typeof locales.types;
                      title =
                        locales.types[organizationTypeSlug as LocaleKey].title;
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
                        key="types"
                      />
                      {title || locales.route.content.notFound}
                      <Chip.Delete>
                        <button
                          {...form.remove.getButtonProps({
                            name: fields.types.name,
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
            {/* TODO: Add or remove networks section */}
            {/* TODO: Add or remove network members section -> disable the section when orgTypeList does not have network */}
          </div>

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
      </Form>
    </Section>
  );
}

export default Manage;
