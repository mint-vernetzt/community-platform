import {
  type ActionFunctionArgs,
  type LoaderFunctionArgs,
  redirect,
} from "@remix-run/node";
import { z } from "zod";
import { createAuthClient, getSessionUser } from "~/auth.server";
import { invariantResponse } from "~/lib/utils/response";
import { checkboxSchema, createPhoneSchema } from "~/lib/utils/schemas";
import { prismaClient } from "~/prisma.server";
import { detectLanguage } from "~/i18n.server";
import { getRedirectPathOnProtectedOrganizationRoute } from "~/routes/organization/$slug/utils.server";
import {
  createAreaOptions,
  type GeneralOrganizationSettingsLocales,
} from "./general.server";
import {
  Form,
  useActionData,
  useLoaderData,
  useLocation,
  useNavigation,
} from "@remix-run/react";
import { getFormProps, getInputProps, useForm } from "@conform-to/react-v1";
import { getZodConstraint, parseWithZod } from "@conform-to/zod-v1";
import { Button } from "@mint-vernetzt/components/src/molecules/Button";
import { Chip } from "@mint-vernetzt/components/src/molecules/Chip";
import { Controls } from "@mint-vernetzt/components/src/organisms/containers/Controls";
import { Input } from "@mint-vernetzt/components/src/molecules/Input";
import { Section } from "@mint-vernetzt/components/src/organisms/containers/Section";
import { BackButton } from "~/components-next/BackButton";
import { TextArea } from "~/components-next/TextArea";
import { ConformSelect } from "~/components-next/ConformSelect";
import React from "react";
import { useUnsavedChangesBlockerWithModal } from "~/lib/hooks/useUnsavedChangesBlockerWithModal";
import { VisibilityCheckbox } from "~/components-next/VisibilityCheckbox";
import { getParamValueOrThrow } from "~/lib/utils/routes";
import * as Sentry from "@sentry/remix";
import { redirectWithToast } from "~/toast.server";
import { useHydrated } from "remix-utils/use-hydrated";
import { languageModuleMap } from "~/locales/.server";

const createGeneralSchema = (locales: GeneralOrganizationSettingsLocales) => {
  return z.object({
    name: z
      .string({
        required_error: locales.route.validation.name.required,
      })
      .min(3, locales.route.validation.name.min)
      .max(50, locales.route.validation.name.max),
    email: z
      .string()
      .email(locales.route.validation.email)
      .optional()
      .transform((value) => {
        if (value === undefined || value === "") {
          return null;
        }
        return value.trim();
      }),
    phone: createPhoneSchema(locales)
      .optional()
      .transform((value) => {
        if (value === undefined || value === "") {
          return null;
        }
        return value.trim();
      }),
    street: z
      .string()
      .optional()
      .transform((value) => {
        if (value === undefined || value === "") {
          return null;
        }
        return value.trim();
      }),
    streetNumber: z
      .string()
      .optional()
      .transform((value) => {
        if (value === undefined || value === "") {
          return null;
        }
        return value.trim();
      }),
    zipCode: z
      .string()
      .optional()
      .transform((value) => {
        if (value === undefined || value === "") {
          return null;
        }
        return value.trim();
      }),
    city: z
      .string()
      .optional()
      .transform((value) => {
        if (value === undefined || value === "") {
          return null;
        }
        return value.trim();
      }),
    bio: z
      .string()
      .max(2000, locales.route.validation.bio.max)
      .optional()
      .transform((value) => {
        if (value === undefined || value === "" || value === "<p><br></p>") {
          return null;
        }
        return value.trim();
      }),
    supportedBy: z
      .array(z.string().transform((value) => value.trim()))
      .optional(),
    areas: z.array(z.string().uuid()),
    focuses: z.array(z.string().uuid()),
    visibilities: z.object({
      email: checkboxSchema,
      phone: checkboxSchema,
      bio: checkboxSchema,
      focuses: checkboxSchema,
    }),
  });
};

export async function loader(args: LoaderFunctionArgs) {
  const { request, params } = args;
  const language = await detectLanguage(request);
  const locales =
    languageModuleMap[language]["organization/$slug/settings/general"];

  // check slug exists (throw bad request if not)
  invariantResponse(
    params.slug !== undefined,
    locales.route.error.invalidRoute,
    {
      status: 400,
    }
  );

  const organization = await prismaClient.organization.findFirst({
    where: { slug: params.slug },
    select: {
      // Just selecting id for index performance
      id: true,
      name: true,
      email: true,
      phone: true,
      street: true,
      streetNumber: true,
      zipCode: true,
      city: true,
      bio: true,
      supportedBy: true,
      areas: {
        select: {
          area: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
      focuses: {
        select: {
          focus: {
            select: {
              id: true,
            },
          },
        },
      },
      organizationVisibility: {
        select: {
          email: true,
          phone: true,
          bio: true,
          focuses: true,
        },
      },
    },
  });
  invariantResponse(organization !== null, locales.route.error.notFound, {
    status: 404,
  });
  const { id: _id, ...rest } = organization;
  const filteredOrganization = rest;

  const allAreas = await prismaClient.area.findMany({
    select: {
      id: true,
      name: true,
      stateId: true,
      type: true,
    },
  });
  const areaOptions = createAreaOptions(allAreas);

  const allFocuses = await prismaClient.focus.findMany({
    select: {
      id: true,
      slug: true,
    },
  });

  const currentTimestamp = Date.now();

  return {
    organization: filteredOrganization,
    areaOptions,
    allFocuses,
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
    languageModuleMap[language]["organization/$slug/settings/general"];

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
    const submission = await parseWithZod(formData, {
      schema: createGeneralSchema(locales),
    });
    return {
      submission: submission.reply(),
    };
  }
  const submission = await parseWithZod(formData, {
    schema: () =>
      createGeneralSchema(locales).transform(async (data, ctx) => {
        const { visibilities, areas, focuses, ...organizationData } = data;
        try {
          await prismaClient.organization.update({
            where: {
              slug,
            },
            data: {
              ...organizationData,
              areas: {
                deleteMany: {},
                connectOrCreate: areas.map((areaId: string) => {
                  return {
                    where: {
                      organizationId_areaId: {
                        areaId,
                        organizationId: organization.id,
                      },
                    },
                    create: {
                      areaId,
                    },
                  };
                }),
              },
              focuses: {
                deleteMany: {},
                connectOrCreate: focuses.map((focusId: string) => {
                  return {
                    where: {
                      organizationId_focusId: {
                        focusId,
                        organizationId: organization.id,
                      },
                    },
                    create: {
                      focusId,
                    },
                  };
                }),
              },
            },
          });

          await prismaClient.organizationVisibility.update({
            where: {
              organizationId: organization.id,
            },
            data: {
              ...visibilities,
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
      currentTimestamp: Date.now(),
    };
  }

  return redirectWithToast(request.url, {
    id: "update-general-toast",
    key: `${new Date().getTime()}`,
    message: locales.route.content.success,
  });
}

function General() {
  const location = useLocation();
  const loaderData = useLoaderData<typeof loader>();
  const { locales } = loaderData;
  const actionData = useActionData<typeof action>();
  const { organization, allFocuses, areaOptions } = loaderData;
  const isHydrated = useHydrated();
  const navigation = useNavigation();

  const { areas, focuses, organizationVisibility, ...rest } = organization;

  const defaultValues = {
    ...rest,
    areas: areas.map((relation) => relation.area.id),
    focuses: focuses.map((relation) => relation.focus.id),
    visibilities: organizationVisibility,
  };

  const [form, fields] = useForm({
    id: `general-form-${
      actionData?.currentTimestamp || loaderData.currentTimestamp
    }`,
    constraint: getZodConstraint(createGeneralSchema(locales)),
    defaultValue: defaultValues,
    shouldValidate: "onInput",
    shouldRevalidate: "onInput",
    lastResult: navigation.state === "idle" ? actionData?.submission : null,
    onValidate: (args) => {
      const { formData } = args;
      const submission = parseWithZod(formData, {
        schema: createGeneralSchema(locales),
      });
      return submission;
    },
  });

  const areaFieldList = fields.areas.getFieldList();
  const focusFieldList = fields.focuses.getFieldList();
  const supportedByFieldList = fields.supportedBy.getFieldList();
  const visibilitiesFieldList = fields.visibilities.getFieldset();

  const UnsavedChangesBlockerModal = useUnsavedChangesBlockerWithModal({
    searchParam: "modal-unsaved-changes",
    formMetadataToCheck: form,
    locales,
  });

  const [supportedBy, setSupportedBy] = React.useState<string>("");
  const handleSupportedByInputChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setSupportedBy(event.currentTarget.value);
  };

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
              {locales.route.content.contact.headline}
            </h2>
            <div className="@lg:mv-flex @lg:mv-gap-4">
              <Input
                {...getInputProps(fields.name, { type: "text" })}
                key="name"
              >
                <Input.Label htmlFor={fields.name.id}>
                  {locales.route.content.contact.name.label}
                </Input.Label>
                {typeof fields.name.errors !== "undefined" && (
                  <Input.Error>{fields.name.errors}</Input.Error>
                )}
              </Input>
            </div>
            <div className="@lg:mv-flex @lg:mv-gap-4">
              <div className="mv-flex-1">
                <Input
                  {...getInputProps(fields.email, { type: "email" })}
                  key="email"
                >
                  <Input.Label htmlFor={fields.email.id}>
                    {locales.route.content.contact.email.label}
                  </Input.Label>
                  <Input.Controls>
                    <VisibilityCheckbox
                      {...getInputProps(visibilitiesFieldList.email, {
                        type: "checkbox",
                      })}
                      key={"email-visibility"}
                    />
                  </Input.Controls>
                  {typeof fields.email.errors !== "undefined" && (
                    <Input.Error>{fields.email.errors}</Input.Error>
                  )}
                </Input>
              </div>

              <div className="mv-flex-1">
                <Input
                  {...getInputProps(fields.phone, { type: "tel" })}
                  key="phone"
                >
                  <Input.Label htmlFor={fields.phone.id}>
                    {locales.route.content.contact.phone.label}
                  </Input.Label>
                  <Input.Controls>
                    <VisibilityCheckbox
                      {...getInputProps(visibilitiesFieldList.phone, {
                        type: "checkbox",
                      })}
                      key={"phone-visibility"}
                    />
                  </Input.Controls>
                  {typeof fields.phone.errors !== "undefined" && (
                    <Input.Error>{fields.phone.errors}</Input.Error>
                  )}
                </Input>
              </div>
            </div>

            <div className="@lg:mv-flex @lg:mv-gap-4">
              <div className="mv-flex-1">
                <Input
                  {...getInputProps(fields.street, { type: "text" })}
                  key="street"
                >
                  <Input.Label htmlFor={fields.street.id}>
                    {locales.route.content.contact.street.label}
                  </Input.Label>
                  {typeof fields.street.errors !== "undefined" && (
                    <Input.Error>{fields.street.errors}</Input.Error>
                  )}
                </Input>
              </div>
              <div className="mv-flex-1 mv-mt-4 @lg:mv-mt-0">
                <Input
                  {...getInputProps(fields.streetNumber, { type: "text" })}
                  key="streetNumber"
                >
                  <Input.Label htmlFor={fields.streetNumber.id}>
                    {locales.route.content.contact.streetNumber.label}
                  </Input.Label>
                  {typeof fields.streetNumber.errors !== "undefined" && (
                    <Input.Error>{fields.streetNumber.errors}</Input.Error>
                  )}
                </Input>
              </div>
            </div>
            <div className="@lg:mv-flex @lg:mv-gap-4">
              <div className="mv-flex-1">
                <Input
                  {...getInputProps(fields.zipCode, { type: "text" })}
                  key="zipCode"
                >
                  <Input.Label htmlFor={fields.zipCode.id}>
                    {locales.route.content.contact.zipCode.label}
                  </Input.Label>
                  {typeof fields.zipCode.errors !== "undefined" && (
                    <Input.Error>{fields.zipCode.errors}</Input.Error>
                  )}
                </Input>
              </div>
              <div className="mv-flex-1 mv-mt-4 @lg:mv-mt-0">
                <Input
                  {...getInputProps(fields.city, { type: "text" })}
                  key="city"
                >
                  <Input.Label htmlFor={fields.city.id}>
                    {locales.route.content.contact.city.label}
                  </Input.Label>
                  {typeof fields.city.errors !== "undefined" && (
                    <Input.Error>{fields.city.errors}</Input.Error>
                  )}
                </Input>
              </div>
            </div>
          </div>
          <div className="mv-flex mv-flex-col mv-gap-4 @md:mv-p-4 @md:mv-border @md:mv-rounded-lg @md:mv-border-gray-200">
            <h2 className="mv-text-primary mv-text-lg mv-font-semibold mv-mb-0">
              {locales.route.content.about.headline}
            </h2>
            <p>{locales.route.content.about.intro}</p>
            <div className="mv-flex mv-gap-2">
              <TextArea
                {...getInputProps(fields.bio, { type: "text" })}
                key="bio"
                id={fields.bio.id || ""}
                label={locales.route.content.bio.label}
                // withPublicPrivateToggle={true}
                // isPublic={organizationVisibility?.bio}
                errorMessage={
                  Array.isArray(fields.bio.errors)
                    ? fields.bio.errors.join(", ")
                    : undefined
                }
                maxLength={undefined}
                rte={{ locales: locales }}
              />
              <div className="mv-min-w-[44px] mv-pt-[32px]">
                <VisibilityCheckbox
                  {...getInputProps(visibilitiesFieldList.bio, {
                    type: "checkbox",
                  })}
                  key={"bio-visibility"}
                />
              </div>
            </div>

            <ConformSelect
              id={fields.areas.id}
              cta={locales.route.content.areas.option}
            >
              <ConformSelect.Label htmlFor={fields.areas.id}>
                {locales.route.content.areas.label}
              </ConformSelect.Label>
              <ConformSelect.HelperText>
                {locales.route.content.areas.helper}
              </ConformSelect.HelperText>
              {areaOptions
                .filter((option) => {
                  // All options that have a value should only be shown if they are not inside the current selected area list
                  if (option.value !== undefined) {
                    return !areaFieldList.some((field) => {
                      return field.initialValue === option.value;
                    });
                  }
                  // Divider, that have no value should be always shown
                  else {
                    return true;
                  }
                })
                .map((filteredOption, index) => {
                  // All options that have a value are created as options with a hidden add button thats clicked by the select onChange handler
                  if (filteredOption.value !== undefined) {
                    return (
                      <button
                        key={`${filteredOption.value}`}
                        {...form.insert.getButtonProps({
                          name: fields.areas.name,
                          defaultValue: filteredOption.value,
                        })}
                        className="mv-text-start mv-w-full mv-py-1 mv-px-2"
                      >
                        {filteredOption.label}
                      </button>
                    );
                  }
                  // Divider, that have no value are shown as a disabled option. Is this styleable? Is there a better way of doing this?
                  else {
                    return (
                      <div
                        key={`${filteredOption.label}-${index}-divider`}
                        className="mv-text-start mv-w-full mv-cursor-default mv-text-neutral-500 mv-py-1 mv-px-2"
                      >
                        {filteredOption.label}
                      </div>
                    );
                  }
                })}
            </ConformSelect>
            {areaFieldList.length > 0 && (
              <Chip.Container>
                {areaFieldList.map((field, index) => {
                  return (
                    <Chip key={field.key}>
                      <Input
                        {...getInputProps(field, { type: "hidden" })}
                        key="areas"
                      />
                      {areaOptions.find((option) => {
                        return option.value === field.initialValue;
                      })?.label || locales.route.content.notFound}
                      <Chip.Delete>
                        <button
                          {...form.remove.getButtonProps({
                            name: fields.areas.name,
                            index,
                          })}
                        />
                      </Chip.Delete>
                    </Chip>
                  );
                })}
              </Chip.Container>
            )}
            <ConformSelect
              id={fields.focuses.id}
              cta={locales.route.content.focuses.option}
            >
              <ConformSelect.Label htmlFor={fields.focuses.id}>
                {locales.route.content.focuses.label}
              </ConformSelect.Label>

              <ConformSelect.Controls>
                <VisibilityCheckbox
                  {...getInputProps(visibilitiesFieldList.focuses, {
                    type: "checkbox",
                  })}
                  key={"focuses-visibility"}
                />
              </ConformSelect.Controls>
              <ConformSelect.HelperText>
                {locales.route.content.focuses.helper}
              </ConformSelect.HelperText>
              {allFocuses
                .filter((focus) => {
                  return !focusFieldList.some((listFocus) => {
                    return listFocus.initialValue === focus.id;
                  });
                })
                .map((focus) => {
                  let title;
                  if (focus.slug in locales.focuses) {
                    type LocaleKey = keyof typeof locales.focuses;
                    title = locales.focuses[focus.slug as LocaleKey].title;
                  } else {
                    console.error(`Focus ${focus.slug} not found in locales`);
                    title = focus.slug;
                  }
                  return (
                    <button
                      key={focus.id}
                      {...form.insert.getButtonProps({
                        name: fields.focuses.name,
                        defaultValue: focus.id,
                      })}
                      className="mv-text-start mv-w-full mv-py-1 mv-px-2"
                    >
                      {title}
                    </button>
                  );
                })}
            </ConformSelect>
            {focusFieldList.length > 0 && (
              <Chip.Container>
                {focusFieldList.map((field, index) => {
                  let focusSlug = allFocuses.find((focus) => {
                    return focus.id === field.initialValue;
                  })?.slug;
                  let title;
                  if (focusSlug === undefined) {
                    console.error(
                      `Focus with id ${field.id} not found in allFocuses`
                    );
                    title = null;
                  } else {
                    if (focusSlug in locales.focuses) {
                      type LocaleKey = keyof typeof locales.focuses;
                      title = locales.focuses[focusSlug as LocaleKey].title;
                    } else {
                      console.error(`Focus ${focusSlug} not found in locales`);
                      title = focusSlug;
                    }
                  }
                  return (
                    <Chip key={field.key}>
                      <Input
                        {...getInputProps(field, { type: "hidden" })}
                        key="focuses"
                      />
                      {title || locales.route.content.notFound}
                      <Chip.Delete>
                        <button
                          {...form.remove.getButtonProps({
                            name: fields.focuses.name,
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
          <div className="mv-flex mv-flex-col mv-gap-4 @md:mv-p-4 @md:mv-border @md:mv-rounded-lg @md:mv-border-gray-200">
            <h2 className="mv-text-primary mv-text-lg mv-font-semibold mv-mb-0">
              {locales.route.content.supportedBy.headline}
            </h2>
            <div className="mv-flex mv-flex-row mv-gap-4 mv-items-center">
              <Input
                value={supportedBy}
                onChange={handleSupportedByInputChange}
              >
                <Input.Label htmlFor={fields.supportedBy.id}>
                  {locales.route.content.supportedBy.label}
                </Input.Label>
                <Input.Controls>
                  <Button
                    variant="ghost"
                    disabled={supportedBy === ""}
                    {...form.insert.getButtonProps({
                      name: fields.supportedBy.name,
                      defaultValue: supportedBy,
                    })}
                  >
                    {locales.route.content.supportedBy.add}
                  </Button>
                </Input.Controls>
              </Input>
            </div>
            {supportedByFieldList.length > 0 && (
              <Chip.Container>
                {supportedByFieldList.map((field, index) => {
                  return (
                    <Chip key={field.key}>
                      <Input
                        {...getInputProps(field, { type: "hidden" })}
                        key="supportedBy"
                      />
                      {field.initialValue || "Not Found"}
                      <Chip.Delete>
                        <button
                          {...form.remove.getButtonProps({
                            name: fields.supportedBy.name,
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
          <div className="mv-flex mv-flex-col @xl:mv-flex-row mv-w-full mv-justify-end @xl:mv-justify-between mv-items-start mv-gap-4">
            <div className="mv-flex mv-flex-col mv-gap-1">
              <p className="mv-text-xs mv-flex mv-items-center mv-gap-1">
                <span className="mv-w-4 mv-h-4">
                  <svg
                    viewBox="0 0 20 20"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M20 10C20 10 16.25 3.125 10 3.125C3.75 3.125 0 10 0 10C0 10 3.75 16.875 10 16.875C16.25 16.875 20 10 20 10ZM1.46625 10C2.07064 9.0814 2.7658 8.22586 3.54125 7.44625C5.15 5.835 7.35 4.375 10 4.375C12.65 4.375 14.8488 5.835 16.46 7.44625C17.2354 8.22586 17.9306 9.0814 18.535 10C18.4625 10.1087 18.3825 10.2287 18.2913 10.36C17.8725 10.96 17.2538 11.76 16.46 12.5538C14.8488 14.165 12.6488 15.625 10 15.625C7.35 15.625 5.15125 14.165 3.54 12.5538C2.76456 11.7741 2.0694 10.9186 1.465 10H1.46625Z"
                      fill="currentColor"
                    />
                    <path
                      d="M10 6.875C9.1712 6.875 8.37634 7.20424 7.79029 7.79029C7.20424 8.37634 6.875 9.1712 6.875 10C6.875 10.8288 7.20424 11.6237 7.79029 12.2097C8.37634 12.7958 9.1712 13.125 10 13.125C10.8288 13.125 11.6237 12.7958 12.2097 12.2097C12.7958 11.6237 13.125 10.8288 13.125 10C13.125 9.1712 12.7958 8.37634 12.2097 7.79029C11.6237 7.20424 10.8288 6.875 10 6.875ZM5.625 10C5.625 8.83968 6.08594 7.72688 6.90641 6.90641C7.72688 6.08594 8.83968 5.625 10 5.625C11.1603 5.625 12.2731 6.08594 13.0936 6.90641C13.9141 7.72688 14.375 8.83968 14.375 10C14.375 11.1603 13.9141 12.2731 13.0936 13.0936C12.2731 13.9141 11.1603 14.375 10 14.375C8.83968 14.375 7.72688 13.9141 6.90641 13.0936C6.08594 12.2731 5.625 11.1603 5.625 10Z"
                      fill="currentColor"
                    />
                  </svg>
                </span>
                <span>{locales.route.form.hint.public}</span>
              </p>
              <p className="mv-text-xs mv-flex mv-items-center mv-gap-1">
                <span className="mv-w-4 mv-h-4">
                  <svg
                    viewBox="0 0 20 20"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M16.6987 14.0475C18.825 12.15 20 10 20 10C20 10 16.25 3.125 10 3.125C8.79949 3.12913 7.61256 3.37928 6.5125 3.86L7.475 4.82375C8.28429 4.52894 9.13868 4.3771 10 4.375C12.65 4.375 14.8487 5.835 16.46 7.44625C17.2354 8.22586 17.9306 9.08141 18.535 10C18.4625 10.1088 18.3825 10.2288 18.2912 10.36C17.8725 10.96 17.2537 11.76 16.46 12.5538C16.2537 12.76 16.0387 12.9638 15.8137 13.1613L16.6987 14.0475Z"
                      fill="currentColor"
                    />
                    <path
                      d="M14.1212 11.47C14.4002 10.6898 14.4518 9.84643 14.2702 9.03803C14.0886 8.22962 13.6811 7.48941 13.0952 6.90352C12.5093 6.31764 11.7691 5.91018 10.9607 5.72854C10.1523 5.5469 9.30895 5.59856 8.52875 5.8775L9.5575 6.90625C10.0379 6.83749 10.5277 6.88156 10.9881 7.03495C11.4485 7.18835 11.8668 7.44687 12.21 7.79001C12.5531 8.13316 12.8116 8.55151 12.965 9.01191C13.1184 9.47231 13.1625 9.96211 13.0937 10.4425L14.1212 11.47ZM10.4425 13.0937L11.47 14.1212C10.6898 14.4002 9.84643 14.4518 9.03803 14.2702C8.22962 14.0886 7.48941 13.6811 6.90352 13.0952C6.31764 12.5093 5.91018 11.7691 5.72854 10.9607C5.5469 10.1523 5.59856 9.30895 5.8775 8.52875L6.90625 9.5575C6.83749 10.0379 6.88156 10.5277 7.03495 10.9881C7.18835 11.4485 7.44687 11.8668 7.79001 12.21C8.13316 12.5531 8.55151 12.8116 9.01191 12.965C9.47231 13.1184 9.96211 13.1625 10.4425 13.0937Z"
                      fill="currentColor"
                    />
                    <path
                      d="M4.1875 6.8375C3.9625 7.0375 3.74625 7.24 3.54 7.44625C2.76456 8.22586 2.0694 9.08141 1.465 10L1.70875 10.36C2.1275 10.96 2.74625 11.76 3.54 12.5538C5.15125 14.165 7.35125 15.625 10 15.625C10.895 15.625 11.7375 15.4588 12.525 15.175L13.4875 16.14C12.3874 16.6207 11.2005 16.8708 10 16.875C3.75 16.875 0 10 0 10C0 10 1.17375 7.84875 3.30125 5.9525L4.18625 6.83875L4.1875 6.8375ZM17.0575 17.9425L2.0575 2.9425L2.9425 2.0575L17.9425 17.0575L17.0575 17.9425Z"
                      fill="currentColor"
                    />
                  </svg>
                </span>
                <span>{locales.route.form.hint.private}</span>
              </p>
            </div>
            <div className="mv-flex mv-flex-col mv-w-full @xl:mv-w-fit mv-gap-2">
              <Controls>
                <div className="mv-relative mv-w-full">
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
                  <noscript className="mv-absolute mv-top-0">
                    <Button as="a" href="./general" variant="outline" fullSize>
                      {locales.route.form.reset}
                    </Button>
                  </noscript>
                </div>
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

export default General;
