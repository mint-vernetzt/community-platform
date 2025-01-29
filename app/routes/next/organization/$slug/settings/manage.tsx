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

  const allTypes = await prismaClient.organizationType.findMany({
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
    allTypes,
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
  const { organization, allTypes, allNetworkTypes } = loaderData;
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

  const typeFieldList = fields.types.getFieldList();
  const networkTypeFieldList = fields.networkTypes.getFieldList();

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
              {allTypes
                .filter((type) => {
                  return !typeFieldList.some((listType) => {
                    return listType.initialValue === type.id;
                  });
                })
                .map((type) => {
                  let title;
                  if (type.slug in locales.types) {
                    type LocaleKey = keyof typeof locales.types;
                    title = locales.types[type.slug as LocaleKey].title;
                  } else {
                    console.error(
                      `Organization type ${type.slug} not found in locales`
                    );
                    title = type.slug;
                  }
                  return (
                    <button
                      key={type.id}
                      {...form.insert.getButtonProps({
                        name: fields.types.name,
                        defaultValue: type.id,
                      })}
                      className="mv-text-start mv-w-full mv-py-1 mv-px-2"
                    >
                      {title}
                    </button>
                  );
                })}
            </ConformSelect>
            {typeFieldList.length > 0 && (
              <Chip.Container>
                {typeFieldList.map((field, index) => {
                  let typeSlug = allTypes.find((type) => {
                    return type.id === field.initialValue;
                  })?.slug;
                  let title;
                  if (typeSlug === undefined) {
                    console.error(
                      `Organization type with id ${field.id} not found in allTypes`
                    );
                    title = null;
                  } else {
                    if (typeSlug in locales.types) {
                      type LocaleKey = keyof typeof locales.types;
                      title = locales.types[typeSlug as LocaleKey].title;
                    } else {
                      console.error(
                        `Organization type ${typeSlug} not found in locales`
                      );
                      title = typeSlug;
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

            {/* TODO: Only enable this when orgTypeList has network -> see next create */}
            <h2 className="mv-text-primary mv-text-lg mv-font-semibold mv-mb-0">
              {locales.route.content.networkTypes.headline}
            </h2>
            <ConformSelect
              id={fields.networkTypes.id}
              cta={locales.route.content.networkTypes.option}
            >
              <ConformSelect.Label htmlFor={fields.networkTypes.id}>
                {locales.route.content.networkTypes.label}
              </ConformSelect.Label>
              <ConformSelect.HelperText>
                {locales.route.content.networkTypes.helper}
              </ConformSelect.HelperText>
              {allNetworkTypes
                .filter((networkType) => {
                  return !networkTypeFieldList.some((listNetworkType) => {
                    return listNetworkType.initialValue === networkType.id;
                  });
                })
                .map((networkType) => {
                  let title;
                  if (networkType.slug in locales.networkTypes) {
                    type LocaleKey = keyof typeof locales.networkTypes;
                    title =
                      locales.networkTypes[networkType.slug as LocaleKey].title;
                  } else {
                    console.error(
                      `Network type ${networkType.slug} not found in locales`
                    );
                    title = networkType.slug;
                  }
                  return (
                    <button
                      key={networkType.id}
                      {...form.insert.getButtonProps({
                        name: fields.networkTypes.name,
                        defaultValue: networkType.id,
                      })}
                      className="mv-text-start mv-w-full mv-py-1 mv-px-2"
                    >
                      {title}
                    </button>
                  );
                })}
            </ConformSelect>
            {networkTypeFieldList.length > 0 && (
              <Chip.Container>
                {networkTypeFieldList.map((field, index) => {
                  let networkTypeSlug = allNetworkTypes.find((networkType) => {
                    return networkType.id === field.initialValue;
                  })?.slug;
                  let title;
                  if (networkTypeSlug === undefined) {
                    console.error(
                      `Network type with id ${field.id} not found in allTypes`
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
                        {...getInputProps(field, { type: "hidden" })}
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
            <div className="mv-w-full @xl:mv-w-fit">
              <Controls>
                <Button
                  type="reset"
                  onClick={() => {
                    setTimeout(() => form.reset(), 0);
                  }}
                  variant="outline"
                  fullSize
                  // Don't disable button when js is disabled
                  disabled={isHydrated ? form.dirty === false : false}
                >
                  {locales.route.form.reset}
                </Button>
                <Button
                  type="submit"
                  name="intent"
                  defaultValue="submit"
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
            </div>
          </div>
        </div>
      </Form>
    </Section>
  );
}

export default Manage;
