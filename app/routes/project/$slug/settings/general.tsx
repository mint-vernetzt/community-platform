import {
  redirect,
  useNavigation,
  type ActionFunctionArgs,
  type LoaderFunctionArgs,
} from "react-router";
import { Form, useActionData, useLoaderData, useLocation } from "react-router";
import React from "react";
import { z } from "zod";
import { createAuthClient, getSessionUser } from "~/auth.server";
import { invariantResponse } from "~/lib/utils/response";
import { createPhoneSchema } from "~/lib/utils/schemas";
import { prismaClient } from "~/prisma.server";
import { redirectWithToast } from "~/toast.server";
import { BackButton } from "~/components-next/BackButton";
import { ConformSelect } from "~/components-next/ConformSelect";
import {
  createAreaOptions,
  type GeneralProjectSettingsLocales,
} from "./general.server";
import {
  getRedirectPathOnProtectedProjectRoute,
  updateFilterVectorOfProject,
} from "./utils.server";
import * as Sentry from "@sentry/node";
import { Section } from "@mint-vernetzt/components/src/organisms/containers/Section";
import { Input } from "@mint-vernetzt/components/src/molecules/Input";
import { Chip } from "@mint-vernetzt/components/src/molecules/Chip";
import { Button } from "@mint-vernetzt/components/src/molecules/Button";
import { Controls } from "@mint-vernetzt/components/src/organisms/containers/Controls";
import { detectLanguage } from "~/i18n.server";
import { languageModuleMap } from "~/locales/.server";
import { insertParametersIntoLocale } from "~/lib/utils/i18n";
import { getZodConstraint, parseWithZod } from "@conform-to/zod-v1";
import { useHydrated } from "remix-utils/use-hydrated";
import { getFormProps, getInputProps, useForm } from "@conform-to/react-v1";
import { useUnsavedChangesBlockerWithModal } from "~/lib/hooks/useUnsavedChangesBlockerWithModal";

const NAME_MIN_LENGTH = 3;
const NAME_MAX_LENGTH = 80;
const SUBLINE_MAX_LENGTH = 90;

const createGeneralSchema = (locales: GeneralProjectSettingsLocales) =>
  z.object({
    name: z
      .string({
        required_error: locales.route.validation.name.required,
      })
      .min(
        NAME_MIN_LENGTH,
        insertParametersIntoLocale(locales.route.validation.name.min, {
          min: NAME_MIN_LENGTH,
        })
      )
      .max(
        NAME_MAX_LENGTH,
        insertParametersIntoLocale(locales.route.validation.name.max, {
          max: NAME_MAX_LENGTH,
        })
      ),
    subline: z
      .string()
      .max(
        90,
        insertParametersIntoLocale(locales.route.validation.subline.max, {
          max: SUBLINE_MAX_LENGTH,
        })
      )
      .optional()
      .transform((value) => {
        if (value === undefined || value === "") {
          return null;
        }
        return value.trim();
      }),
    formats: z.array(z.string().uuid()),
    furtherFormats: z.array(z.string().transform((value) => value.trim())),
    areas: z.array(z.string().uuid()),
    email: z
      .string()
      .email(locales.route.validation.email.email)
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
    contactName: z
      .string()
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
    streetNumberAddition: z
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
  });

export const loader = async (args: LoaderFunctionArgs) => {
  const { request, params } = args;
  const language = await detectLanguage(request);
  const locales = languageModuleMap[language]["project/$slug/settings/general"];

  // check slug exists (throw bad request if not)
  invariantResponse(
    params.slug !== undefined,
    locales.route.error.invalidRoute,
    {
      status: 400,
    }
  );

  const project = await prismaClient.project.findUnique({
    select: {
      name: true,
      subline: true,
      email: true,
      phone: true,
      contactName: true,
      street: true,
      streetNumber: true,
      streetNumberAddition: true,
      zipCode: true,
      city: true,
      furtherFormats: true,
      formats: {
        select: {
          format: {
            select: {
              id: true,
              slug: true,
            },
          },
        },
      },
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
    },
    where: {
      slug: params.slug,
    },
  });
  invariantResponse(project !== null, locales.route.error.projectNotFound, {
    status: 404,
  });

  const allFormats = await prismaClient.format.findMany({
    select: {
      id: true,
      slug: true,
    },
  });

  const allAreas = await prismaClient.area.findMany({
    select: {
      id: true,
      name: true,
      stateId: true,
      type: true,
    },
  });
  const areaOptions = await createAreaOptions(allAreas);

  const currentTimestamp = Date.now();

  return { project, allFormats, areaOptions, currentTimestamp, locales };
};

export async function action({ request, params }: ActionFunctionArgs) {
  const { authClient } = createAuthClient(request);
  const sessionUser = await getSessionUser(authClient);
  const language = await detectLanguage(request);
  const locales = languageModuleMap[language]["project/$slug/settings/general"];

  // check slug exists (throw bad request if not)
  invariantResponse(
    params.slug !== undefined,
    locales.route.error.invalidRoute,
    {
      status: 400,
    }
  );
  const redirectPath = await getRedirectPathOnProtectedProjectRoute({
    request,
    slug: params.slug,
    sessionUser,
    authClient,
  });
  if (redirectPath !== null) {
    return redirect(redirectPath);
  }
  const project = await prismaClient.project.findUnique({
    select: {
      id: true,
    },
    where: {
      slug: params.slug,
    },
  });
  invariantResponse(project !== null, locales.route.error.projectNotFound, {
    status: 404,
  });

  // Validation
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
        const { formats, areas, ...rest } = data;
        try {
          await prismaClient.project.update({
            where: {
              slug: params.slug,
            },
            data: {
              ...rest,
              formats: {
                deleteMany: {},
                connectOrCreate: formats.map((formatId: string) => {
                  return {
                    where: {
                      formatId_projectId: {
                        formatId,
                        projectId: project.id,
                      },
                    },
                    create: {
                      formatId,
                    },
                  };
                }),
              },
              areas: {
                deleteMany: {},
                connectOrCreate: areas.map((areaId: string) => {
                  return {
                    where: {
                      projectId_areaId: {
                        areaId: areaId,
                        projectId: project.id,
                      },
                    },
                    create: {
                      areaId: areaId,
                    },
                  };
                }),
              },
            },
          });

          updateFilterVectorOfProject(project.id);
        } catch (error) {
          Sentry.captureException(error);
          ctx.addIssue({
            code: "custom",
            message: locales.route.error.storage,
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
    message: locales.route.content.feedback,
  });
}

function General() {
  const location = useLocation();
  const isHydrated = useHydrated();
  const navigation = useNavigation();
  const loaderData = useLoaderData<typeof loader>();
  const { project, allFormats, areaOptions, locales } = loaderData;
  const actionData = useActionData<typeof action>();

  const { formats, areas, ...rest } = project;

  const defaultValues = {
    ...rest,
    formats: formats.map((relation) => relation.format.id),
    areas: areas.map((relation) => relation.area.id),
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
      setFurtherFormat("");
      return submission;
    },
  });

  const formatFieldList = fields.formats.getFieldList();
  const furtherFormatFieldList = fields.furtherFormats.getFieldList();
  const areaFieldList = fields.areas.getFieldList();

  const UnsavedChangesBlockerModal = useUnsavedChangesBlockerWithModal({
    searchParam: "modal-unsaved-changes",
    formMetadataToCheck: form,
    locales,
  });

  const [furtherFormat, setFurtherFormat] = React.useState<string>("");
  const handleFurtherFormatInputChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFurtherFormat(event.currentTarget.value);
  };

  return (
    <Section>
      {UnsavedChangesBlockerModal}
      <BackButton to={location.pathname}>
        {locales.route.content.back}
      </BackButton>
      <p className="mv-my-6 @md:mv-mt-0">{locales.route.content.intro}</p>
      <Form
        {...getFormProps(form)}
        method="post"
        preventScrollReset
        autoComplete="off"
      >
        {/* This button ensures submission via enter key. Always use a hidden button at top of the form when other submit buttons are inside it (f.e. the add/remove list buttons) */}
        <button type="submit" hidden />
        <div className="mv-flex mv-flex-col mv-gap-6 @md:mv-gap-4">
          <div className="@md:mv-p-4 @md:mv-border @md:mv-rounded-lg @md:mv-border-gray-200">
            <h2 className="mv-text-primary mv-text-lg mv-font-semibold mv-mb-4">
              {locales.route.content.projectTitle.headline}
            </h2>
            <Input
              {...getInputProps(fields.name, { type: "text" })}
              minLength={NAME_MIN_LENGTH}
              maxLength={NAME_MAX_LENGTH}
              key="name"
            >
              <Input.Label htmlFor={fields.name.id}>
                {locales.route.content.projectTitle.label}
              </Input.Label>
              {typeof fields.name.errors !== "undefined" && (
                <Input.Error>{fields.name.errors}</Input.Error>
              )}
              <Input.HelperText>
                {locales.route.content.projectTitle.helper}
              </Input.HelperText>
            </Input>
          </div>

          <div className="@md:mv-p-4 @md:mv-border @md:mv-rounded-lg @md:mv-border-gray-200">
            <h2 className="mv-text-primary mv-text-lg mv-font-semibold mv-mb-4">
              {locales.route.content.subline.headline}
            </h2>
            <Input
              {...getInputProps(fields.subline, { type: "text" })}
              maxLength={SUBLINE_MAX_LENGTH}
              key="subline"
            >
              <Input.Label>{locales.route.content.subline.label}</Input.Label>
              {typeof fields.subline.errors !== "undefined" && (
                <Input.Error>{fields.subline.errors}</Input.Error>
              )}
              <Input.HelperText>
                {locales.route.content.subline.helper}
              </Input.HelperText>
            </Input>
          </div>

          <div className="mv-flex mv-flex-col mv-gap-4 @md:mv-p-4 @md:mv-border @md:mv-rounded-lg @md:mv-border-gray-200">
            <h2 className="mv-text-primary mv-text-lg mv-font-semibold mv-mb-0">
              {locales.route.content.formats.headline}
            </h2>
            <ConformSelect
              id={fields.formats.id}
              cta={locales.route.content.formats.choose}
            >
              <ConformSelect.Label htmlFor={fields.formats.id}>
                {locales.route.content.formats.label}
              </ConformSelect.Label>
              <ConformSelect.HelperText>
                {locales.route.content.formats.helper}
              </ConformSelect.HelperText>
              {allFormats
                .filter((format) => {
                  return !formatFieldList.some((listFormat) => {
                    return listFormat.initialValue === format.id;
                  });
                })
                .map((format) => {
                  let title;
                  if (format.slug in locales.formats) {
                    type LocaleKey = keyof typeof locales.formats;
                    title = locales.formats[format.slug as LocaleKey].title;
                  } else {
                    console.error(`Format ${format.slug} not found in locales`);
                    title = format.slug;
                  }
                  return (
                    <button
                      key={format.id}
                      {...form.insert.getButtonProps({
                        name: fields.formats.name,
                        defaultValue: format.id,
                      })}
                      className="mv-text-start mv-w-full mv-py-1 mv-px-2"
                    >
                      {title}
                    </button>
                  );
                })}
            </ConformSelect>
            {formatFieldList.length > 0 && (
              <Chip.Container>
                {formatFieldList.map((listFormat, index) => {
                  const formatSlug = allFormats.find((format) => {
                    return format.id === listFormat.initialValue;
                  })?.slug;
                  let title;
                  if (formatSlug === undefined) {
                    console.error(
                      `Format with id ${listFormat.id} not found in allAdditionalDisciplines`
                    );
                    title = null;
                  } else {
                    if (formatSlug in locales.formats) {
                      type LocaleKey = keyof typeof locales.formats;
                      title = locales.formats[formatSlug as LocaleKey].title;
                    } else {
                      console.error(
                        `Format ${formatSlug} not found in locales`
                      );
                      title = formatSlug;
                    }
                  }
                  return (
                    <Chip key={listFormat.key}>
                      <Input
                        {...getInputProps(listFormat, { type: "hidden" })}
                        key="formats"
                      />
                      {title || locales.route.content.notFound}
                      <Chip.Delete>
                        <button
                          {...form.remove.getButtonProps({
                            name: fields.formats.name,
                            index,
                          })}
                        />
                      </Chip.Delete>
                    </Chip>
                  );
                })}
              </Chip.Container>
            )}
            {isHydrated === true ? (
              <>
                <div className="mv-flex mv-flex-row mv-gap-4 mv-items-center">
                  <Input
                    value={furtherFormat}
                    onChange={handleFurtherFormatInputChange}
                  >
                    <Input.Label htmlFor={fields.furtherFormats.id}>
                      {locales.route.content.furtherFormats.label}
                    </Input.Label>
                    <Input.HelperText>
                      {locales.route.content.furtherFormats.helper}
                    </Input.HelperText>
                    <Input.Controls>
                      <Button
                        variant="ghost"
                        disabled={furtherFormat === ""}
                        {...form.insert.getButtonProps({
                          name: fields.furtherFormats.name,
                          defaultValue: furtherFormat,
                        })}
                      >
                        {locales.route.content.furtherFormats.add}
                      </Button>
                    </Input.Controls>
                  </Input>
                </div>
                {furtherFormatFieldList.length > 0 && (
                  <Chip.Container>
                    {furtherFormatFieldList.map((listFormat, index) => {
                      return (
                        <Chip key={listFormat.key}>
                          <Input
                            {...getInputProps(listFormat, { type: "hidden" })}
                            key="furtherFormats"
                          />
                          {listFormat.initialValue || "Not Found"}
                          <Chip.Delete>
                            <button
                              {...form.remove.getButtonProps({
                                name: fields.furtherFormats.name,
                                index,
                              })}
                            />
                          </Chip.Delete>
                        </Chip>
                      );
                    })}
                  </Chip.Container>
                )}
              </>
            ) : (
              <>
                <Input.Label htmlFor={fields.furtherFormats.id}>
                  {locales.route.content.furtherFormats.label}
                </Input.Label>
                <Chip.Container>
                  {furtherFormatFieldList.map((listFormat, index) => {
                    return (
                      <Chip key={listFormat.key}>
                        <input
                          {...getInputProps(listFormat, { type: "text" })}
                          key="furtherFormats"
                          className="mv-pl-1"
                        />

                        <Chip.Delete>
                          <button
                            {...form.remove.getButtonProps({
                              name: fields.furtherFormats.name,
                              index,
                            })}
                          />
                        </Chip.Delete>
                      </Chip>
                    );
                  })}
                  <Chip key="add-further-format">
                    <button
                      {...form.insert.getButtonProps({
                        name: fields.furtherFormats.name,
                      })}
                    >
                      {locales.route.content.furtherFormats.add}
                    </button>
                  </Chip>
                </Chip.Container>
                <Input.HelperText>
                  {locales.route.content.furtherFormats.helper}
                </Input.HelperText>
              </>
            )}
          </div>

          <div className="mv-flex mv-flex-col mv-gap-4 @md:mv-p-4 @md:mv-border @md:mv-rounded-lg @md:mv-border-gray-200">
            <h2 className="mv-text-primary mv-text-lg mv-font-semibold mv-mb-0">
              {locales.route.content.areas.headline}
            </h2>
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
                    return !areaFieldList.some((listArea) => {
                      return listArea.initialValue === option.value;
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
                {areaFieldList.map((listArea, index) => {
                  return (
                    <Chip key={listArea.key}>
                      <Input
                        {...getInputProps(listArea, { type: "hidden" })}
                        key="areas"
                      />
                      {areaOptions.find((area) => {
                        return area.value === listArea.initialValue;
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
          </div>
          <div className="mv-flex mv-flex-col mv-gap-4 @md:mv-p-4 @md:mv-border @md:mv-rounded-lg @md:mv-border-gray-200">
            <h2 className="mv-text-primary mv-text-lg mv-font-semibold mv-mb-0">
              {locales.route.content.contact.headline}
            </h2>
            <Input
              {...getInputProps(fields.email, { type: "email" })}
              key="email"
            >
              <Input.Label htmlFor={fields.email.id}>
                {locales.route.content.contact.email.label}
              </Input.Label>
              {typeof fields.email.errors !== "undefined" && (
                <Input.Error>{fields.email.errors}</Input.Error>
              )}
            </Input>
            <Input
              {...getInputProps(fields.phone, { type: "tel" })}
              key="phone"
            >
              <Input.Label htmlFor={fields.phone.id}>
                {locales.route.content.contact.phone.label}
              </Input.Label>
              {typeof fields.phone.errors !== "undefined" && (
                <Input.Error>{fields.phone.errors}</Input.Error>
              )}
            </Input>
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
          <div className="mv-flex mv-flex-col mv-gap-4 @md:mv-p-4 @md:mv-border @md:mv-rounded-lg @md:mv-border-gray-200">
            <h2 className="mv-text-primary mv-text-lg mv-font-semibold mv-mb-0">
              {locales.route.content.address.headline}
            </h2>
            <Input
              {...getInputProps(fields.contactName, { type: "text" })}
              key="contactName"
            >
              <Input.Label htmlFor={fields.contactName.id}>
                {locales.route.content.address.contactName.label}
              </Input.Label>
              {typeof fields.contactName.errors !== "undefined" && (
                <Input.Error>{fields.contactName.errors}</Input.Error>
              )}
            </Input>
            <div className="@lg:mv-flex @lg:mv-gap-4">
              <div className="mv-w-full @lg:mv-w-1/3">
                <Input
                  {...getInputProps(fields.street, { type: "text" })}
                  key="street"
                >
                  <Input.Label htmlFor={fields.street.id}>
                    {locales.route.content.address.street.label}
                  </Input.Label>
                  {typeof fields.street.errors !== "undefined" && (
                    <Input.Error>{fields.street.errors}</Input.Error>
                  )}
                </Input>
              </div>
              <div className="mv-flex mv-w-full @lg:mv-w-2/3 mv-gap-4 mv-mt-4 @lg:mv-mt-0">
                <div className="mv-flex-1">
                  <Input
                    {...getInputProps(fields.streetNumber, { type: "text" })}
                    key="streetNumber"
                  >
                    <Input.Label htmlFor={fields.streetNumber.id}>
                      {locales.route.content.address.streetNumber.label}
                    </Input.Label>
                    {typeof fields.streetNumber.errors !== "undefined" && (
                      <Input.Error>{fields.streetNumber.errors}</Input.Error>
                    )}
                  </Input>
                </div>
                <div className="mv-flex-1">
                  <Input
                    {...getInputProps(fields.streetNumberAddition, {
                      type: "text",
                    })}
                    key="streetNumberAddition"
                  >
                    <Input.Label htmlFor={fields.streetNumberAddition.id}>
                      {locales.route.content.address.streetNumberAddition.label}
                    </Input.Label>
                    {typeof fields.streetNumberAddition.errors !==
                      "undefined" && (
                      <Input.Error>
                        {fields.streetNumberAddition.errors}
                      </Input.Error>
                    )}
                  </Input>
                </div>
              </div>
            </div>

            <div className="@lg:mv-flex @lg:mv-gap-4">
              <div className="mv-flex-1">
                <Input
                  {...getInputProps(fields.zipCode, { type: "text" })}
                  key="zipCode"
                >
                  <Input.Label htmlFor={fields.zipCode.id}>
                    {locales.route.content.address.zipCode.label}
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
                    {locales.route.content.address.city.label}
                  </Input.Label>
                  {typeof fields.city.errors !== "undefined" && (
                    <Input.Error>{fields.city.errors}</Input.Error>
                  )}
                </Input>
              </div>
            </div>
          </div>

          <p className="mv-text-sm mv-mt-4">{locales.route.content.hint}</p>
          <div className="mv-flex mv-w-full mv-justify-end">
            <div className="mv-flex mv-shrink mv-w-full @md:mv-max-w-fit @lg:mv-w-auto mv-items-center mv-justify-center @lg:mv-justify-end">
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
                    {locales.route.content.reset}
                  </Button>
                  <noscript className="mv-absolute mv-top-0">
                    <Button as="a" href="./general" variant="outline" fullSize>
                      {locales.route.content.reset}
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
                  {locales.route.content.submit}
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
