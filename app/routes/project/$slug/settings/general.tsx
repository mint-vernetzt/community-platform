import { conform, list, useFieldList, useForm } from "@conform-to/react";
import { getFieldsetConstraint, parse } from "@conform-to/zod";
import {
  redirect,
  type ActionFunctionArgs,
  type LoaderFunctionArgs,
} from "react-router";
import {
  Form,
  useActionData,
  useBlocker,
  useLoaderData,
  useLocation,
} from "react-router";
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
  getHash,
  updateFilterVectorOfProject,
} from "./utils.server";
import { Section } from "@mint-vernetzt/components/src/organisms/containers/Section";
import { Input } from "@mint-vernetzt/components/src/molecules/Input";
import { Chip } from "@mint-vernetzt/components/src/molecules/Chip";
import { Button } from "@mint-vernetzt/components/src/molecules/Button";
import { Controls } from "@mint-vernetzt/components/src/organisms/containers/Controls";
import { detectLanguage } from "~/i18n.server";
import { languageModuleMap } from "~/locales/.server";

const createGeneralSchema = (locales: GeneralProjectSettingsLocales) =>
  z.object({
    name: z
      .string({
        required_error: locales.route.validation.name.required,
      })
      .max(80, locales.route.validation.name.max),
    subline: z
      .string()
      .max(90, locales.route.validation.subline.max)
      .optional()
      .transform((value) => {
        if (value === undefined) {
          return null;
        }
        const trimmedValue = value.trim();
        return trimmedValue === "" || trimmedValue === "<p></p>" ? null : value;
      }),
    formats: z.array(z.string().uuid()),
    furtherFormats: z.array(z.string().transform((value) => value.trim())),
    areas: z.array(z.string().uuid()),
    email: z
      .string()
      .email(locales.route.validation.email.email)
      .optional()
      .transform((value) => {
        if (value === undefined) {
          return null;
        }
        const trimmedValue = value.trim();
        return trimmedValue === "" || trimmedValue === "<p></p>" ? null : value;
      }),
    phone: createPhoneSchema(locales)
      .optional()
      .transform((value) => {
        if (value === undefined) {
          return null;
        }
        const trimmedValue = value.trim();
        return trimmedValue === "" || trimmedValue === "<p></p>" ? null : value;
      }),
    contactName: z
      .string()
      .optional()
      .transform((value) => {
        if (value === undefined) {
          return null;
        }
        const trimmedValue = value.trim();
        return trimmedValue === "" || trimmedValue === "<p></p>" ? null : value;
      }),
    street: z
      .string()
      .optional()
      .transform((value) => {
        if (value === undefined) {
          return null;
        }
        const trimmedValue = value.trim();
        return trimmedValue === "" || trimmedValue === "<p></p>" ? null : value;
      }),
    streetNumber: z
      .string()
      .optional()
      .transform((value) => {
        if (value === undefined) {
          return null;
        }
        const trimmedValue = value.trim();
        return trimmedValue === "" || trimmedValue === "<p></p>" ? null : value;
      }),
    streetNumberAddition: z
      .string()
      .optional()
      .transform((value) => {
        if (value === undefined) {
          return null;
        }
        const trimmedValue = value.trim();
        return trimmedValue === "" || trimmedValue === "<p></p>" ? null : value;
      }),
    zipCode: z
      .string()
      .optional()
      .transform((value) => {
        if (value === undefined) {
          return null;
        }
        const trimmedValue = value.trim();
        return trimmedValue === "" || trimmedValue === "<p></p>" ? null : value;
      }),
    city: z
      .string()
      .optional()
      .transform((value) => {
        if (value === undefined) {
          return null;
        }
        const trimmedValue = value.trim();
        return trimmedValue === "" || trimmedValue === "<p></p>" ? null : value;
      }),
  });

export const loader = async (args: LoaderFunctionArgs) => {
  const { request, params } = args;
  const language = await detectLanguage(request);
  const locales = languageModuleMap[language]["project/$slug/settings/general"];

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

  return { project, allFormats, areaOptions, locales };
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
  const generalSchema = createGeneralSchema(locales);
  const formData = await request.formData();
  const submission = await parse(formData, {
    schema: (intent) =>
      generalSchema.transform(async (data, ctx) => {
        if (intent !== "submit") return { ...data };
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
        } catch (e) {
          console.warn(e);
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

  const hash = getHash(submission);

  if (submission.intent !== "submit") {
    return { status: "idle", submission, hash };
  }
  if (!submission.value) {
    return { status: "error", submission, hash };
  }

  return redirectWithToast(request.url, {
    id: "change-project-general-settings-toast",
    key: hash,
    message: locales.route.content.feedback,
  });
}

function General() {
  const location = useLocation();
  const loaderData = useLoaderData<typeof loader>();
  const { project, allFormats, areaOptions, locales } = loaderData;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { formats, areas, ...rest } = project;
  const actionData = useActionData<typeof action>();
  const generalSchema = createGeneralSchema(locales);

  const defaultValues = {
    // TODO: Investigate: Why can i spread here (defaultValue also accepts null values) and not on web-social?
    ...rest,
    formats: project.formats.map((relation) => relation.format.id),
    areas: project.areas.map((relation) => relation.area.id),
  };
  const [form, fields] = useForm({
    id: "general-form",
    constraint: getFieldsetConstraint(generalSchema),
    defaultValue: defaultValues,
    // TODO: Remove assertion by using conform v1
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    lastSubmission: actionData?.submission,
    shouldValidate: "onSubmit",
    shouldRevalidate: "onInput",
    onValidate({ formData }) {
      return parse(formData, { schema: generalSchema });
    },
  });

  const formatList = useFieldList(form.ref, fields.formats);
  const furtherFormatList = useFieldList(form.ref, fields.furtherFormats);
  const areaList = useFieldList(form.ref, fields.areas);

  const [furtherFormat, setFurtherFormat] = React.useState<string>("");
  const handleFurtherFormatInputChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFurtherFormat(event.currentTarget.value);
  };

  const [isDirty, setIsDirty] = React.useState(false);
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      (actionData?.submission.error !== undefined || isDirty) &&
      currentLocation.pathname !== nextLocation.pathname
  );
  if (blocker.state === "blocked") {
    const confirmed = confirm(locales.route.content.prompt);
    if (confirmed === true) {
      // TODO: fix blocker -> use org settings as blueprint
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore - The blocker type may not be correct. Sentry logged an error that claims invalid blocker state transition from proceeding to proceeding
      if (blocker.state !== "proceeding") {
        blocker.proceed();
      }
    } else {
      blocker.reset();
    }
  }

  return (
    <Section>
      <BackButton to={location.pathname}>
        {locales.route.content.back}
      </BackButton>
      <p className="mv-my-6 @md:mv-mt-0">{locales.route.content.intro}</p>
      <Form
        method="post"
        {...form.props}
        onChange={() => {
          setIsDirty(true);
        }}
        onSubmit={() => {
          setIsDirty(false);
        }}
        onReset={() => {
          setIsDirty(false);
        }}
      >
        {/* This button ensures submission via enter key. Always use a hidden button at top of the form when other submit buttons are inside it (f.e. the add/remove list buttons) */}
        <button type="submit" hidden />
        <div className="mv-flex mv-flex-col mv-gap-6 @md:mv-gap-4">
          <div className="@md:mv-p-4 @md:mv-border @md:mv-rounded-lg @md:mv-border-gray-200">
            <h2 className="mv-text-primary mv-text-lg mv-font-semibold mv-mb-4">
              {locales.route.content.projectTitle.headline}
            </h2>
            <Input {...conform.input(fields.name)}>
              <Input.Label htmlFor={fields.name.id}>
                {locales.route.content.projectTitle.label}
              </Input.Label>
              {typeof fields.name.error !== "undefined" && (
                <Input.Error>{fields.name.error}</Input.Error>
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
            <Input {...conform.input(fields.subline)}>
              <Input.Label>{locales.route.content.subline.label}</Input.Label>
              {typeof fields.subline.error !== "undefined" && (
                <Input.Error>{fields.subline.error}</Input.Error>
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
                  return !formatList.some((listFormat) => {
                    return listFormat.defaultValue === format.id;
                  });
                })
                .map((filteredFormat) => {
                  let title;
                  if (filteredFormat.slug in locales.formats) {
                    type LocaleKey = keyof typeof locales.formats;
                    title =
                      locales.formats[filteredFormat.slug as LocaleKey].title;
                  } else {
                    console.error(
                      `Format ${filteredFormat.slug} not found in locales`
                    );
                    title = filteredFormat.slug;
                  }
                  return (
                    <button
                      key={filteredFormat.id}
                      {...list.insert(fields.formats.name, {
                        defaultValue: filteredFormat.id,
                      })}
                      className="mv-text-start mv-w-full mv-py-1 mv-px-2"
                    >
                      {title}
                    </button>
                  );
                })}
            </ConformSelect>
            {formatList.length > 0 && (
              <Chip.Container>
                {formatList.map((listFormat, index) => {
                  const formatSlug = allFormats.find((format) => {
                    return format.id === listFormat.defaultValue;
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
                      <Input type="hidden" {...conform.input(listFormat)} />
                      {title || locales.route.content.notFound}
                      <Chip.Delete>
                        <button
                          {...list.remove(fields.formats.name, { index })}
                        />
                      </Chip.Delete>
                    </Chip>
                  );
                })}
              </Chip.Container>
            )}
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
                    id={fields.furtherFormats.id}
                    {...list.insert(fields.furtherFormats.name, {
                      defaultValue: furtherFormat,
                    })}
                    variant="ghost"
                    disabled={furtherFormat === ""}
                  >
                    {locales.route.content.furtherFormats.add}
                  </Button>
                </Input.Controls>
              </Input>
            </div>
            {furtherFormatList.length > 0 && (
              <Chip.Container>
                {furtherFormatList.map((listFormat, index) => {
                  return (
                    <Chip key={listFormat.key}>
                      <Input type="hidden" {...conform.input(listFormat)} />
                      {listFormat.defaultValue || "Not Found"}
                      <Chip.Delete>
                        <button
                          {...list.remove(fields.furtherFormats.name, {
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
                    return !areaList.some((listArea) => {
                      return listArea.defaultValue === option.value;
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
                        {...list.insert(fields.areas.name, {
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
            {areaList.length > 0 && (
              <Chip.Container>
                {areaList.map((listArea, index) => {
                  return (
                    <Chip key={listArea.key}>
                      <Input type="hidden" {...conform.input(listArea)} />
                      {areaOptions.find((area) => {
                        return area.value === listArea.defaultValue;
                      })?.label || locales.route.content.notFound}
                      <Chip.Delete>
                        <button
                          {...list.remove(fields.areas.name, { index })}
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
            <Input {...conform.input(fields.email)}>
              <Input.Label htmlFor={fields.email.id}>
                {locales.route.content.contact.email.label}
              </Input.Label>
              {typeof fields.email.error !== "undefined" && (
                <Input.Error>{fields.email.error}</Input.Error>
              )}
            </Input>
            <Input {...conform.input(fields.phone)}>
              <Input.Label htmlFor={fields.phone.id}>
                {locales.route.content.contact.phone.label}
              </Input.Label>
              {typeof fields.phone.error !== "undefined" && (
                <Input.Error>{fields.phone.error}</Input.Error>
              )}
            </Input>
          </div>
          <div className="mv-flex mv-flex-col mv-gap-4 @md:mv-p-4 @md:mv-border @md:mv-rounded-lg @md:mv-border-gray-200">
            <h2 className="mv-text-primary mv-text-lg mv-font-semibold mv-mb-0">
              {locales.route.content.address.headline}
            </h2>
            <Input {...conform.input(fields.contactName)}>
              <Input.Label htmlFor={fields.contactName.id}>
                {locales.route.content.address.contactName.label}
              </Input.Label>
              {typeof fields.contactName.error !== "undefined" && (
                <Input.Error>{fields.contactName.error}</Input.Error>
              )}
            </Input>
            <div className="@lg:mv-flex @lg:mv-gap-4">
              <div className="mv-w-full @lg:mv-w-1/3">
                <Input {...conform.input(fields.street)}>
                  <Input.Label htmlFor={fields.street.id}>
                    {locales.route.content.address.street.label}
                  </Input.Label>
                  {typeof fields.street.error !== "undefined" && (
                    <Input.Error>{fields.street.error}</Input.Error>
                  )}
                </Input>
              </div>
              <div className="mv-flex mv-w-full @lg:mv-w-2/3 mv-gap-4 mv-mt-4 @lg:mv-mt-0">
                <div className="mv-flex-1">
                  <Input {...conform.input(fields.streetNumber)}>
                    <Input.Label htmlFor={fields.streetNumber.id}>
                      {locales.route.content.address.streetNumber.label}
                    </Input.Label>
                    {typeof fields.streetNumber.error !== "undefined" && (
                      <Input.Error>{fields.streetNumber.error}</Input.Error>
                    )}
                  </Input>
                </div>
                <div className="mv-flex-1">
                  <Input {...conform.input(fields.streetNumberAddition)}>
                    <Input.Label htmlFor={fields.streetNumberAddition.id}>
                      {locales.route.content.address.streetNumberAddition.label}
                    </Input.Label>
                    {typeof fields.streetNumberAddition.error !==
                      "undefined" && (
                      <Input.Error>
                        {fields.streetNumberAddition.error}
                      </Input.Error>
                    )}
                  </Input>
                </div>
              </div>
            </div>

            <div className="@lg:mv-flex @lg:mv-gap-4">
              <div className="mv-flex-1">
                <Input {...conform.input(fields.zipCode)}>
                  <Input.Label htmlFor={fields.zipCode.id}>
                    {locales.route.content.address.zipCode.label}
                  </Input.Label>
                  {typeof fields.zipCode.error !== "undefined" && (
                    <Input.Error>{fields.zipCode.error}</Input.Error>
                  )}
                </Input>
              </div>
              <div className="mv-flex-1 mv-mt-4 @lg:mv-mt-0">
                <Input {...conform.input(fields.city)}>
                  <Input.Label htmlFor={fields.city.id}>
                    {locales.route.content.address.city.label}
                  </Input.Label>
                  {typeof fields.city.error !== "undefined" && (
                    <Input.Error>{fields.city.error}</Input.Error>
                  )}
                </Input>
              </div>
            </div>
          </div>

          <p className="mv-text-sm mv-mt-4">{locales.route.content.hint}</p>
          <div className="mv-flex mv-w-full mv-justify-end">
            <div className="mv-flex mv-shrink mv-w-full @md:mv-max-w-fit @lg:mv-w-auto mv-items-center mv-justify-center @lg:mv-justify-end">
              <Controls>
                <Button type="reset" variant="outline" fullSize>
                  {locales.route.content.reset}
                </Button>
                <Button
                  type="submit"
                  fullSize
                  onClick={() => {
                    setIsDirty(false);
                  }}
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
