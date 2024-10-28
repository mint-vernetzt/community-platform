import { conform, list, useFieldList, useForm } from "@conform-to/react";
import { getFieldsetConstraint, parse } from "@conform-to/zod";
import {
  Button,
  Chip,
  Controls,
  Input,
  Section,
} from "@mint-vernetzt/components";
import {
  json,
  redirect,
  type ActionFunctionArgs,
  type LoaderFunctionArgs,
} from "@remix-run/node";
import {
  Form,
  useActionData,
  useBlocker,
  useLoaderData,
  useLocation,
} from "@remix-run/react";
import React from "react";
import { z } from "zod";
import { createAuthClient, getSessionUser } from "~/auth.server";
import { invariantResponse } from "~/lib/utils/response";
import { createPhoneSchema } from "~/lib/utils/schemas";
import { prismaClient } from "~/prisma.server";
import { redirectWithToast } from "~/toast.server";
import { BackButton, ButtonSelect } from "./__components";
import { createAreaOptions } from "./general.server";
import {
  getRedirectPathOnProtectedProjectRoute,
  getSubmissionHash,
  updateFilterVectorOfProject,
} from "./utils.server";
import { type TFunction } from "i18next";
import i18next from "~/i18next.server";
import { useTranslation } from "react-i18next";
import { detectLanguage } from "~/root.server";

const i18nNS = [
  "routes/project/settings/general",
  "utils/schemas",
  "datasets/formats",
];
export const handle = {
  i18n: i18nNS,
};

const createGeneralSchema = (t: TFunction) =>
  z.object({
    name: z
      .string({
        required_error: t("validation.name.required"),
      })
      .max(80, t("validation.name.max")),
    subline: z
      .string()
      .max(90, t("validation.subline.max"))
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
      .email(t("validation.email.email"))
      .optional()
      .transform((value) => {
        if (value === undefined) {
          return null;
        }
        const trimmedValue = value.trim();
        return trimmedValue === "" || trimmedValue === "<p></p>" ? null : value;
      }),
    phone: createPhoneSchema(t)
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
  const locale = detectLanguage(request);
  const t = await i18next.getFixedT(locale, i18nNS);

  const { authClient } = createAuthClient(request);

  const sessionUser = await getSessionUser(authClient);

  // check slug exists (throw bad request if not)
  invariantResponse(params.slug !== undefined, t("error.invalidRoute"), {
    status: 400,
  });

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
  invariantResponse(project !== null, t("error.projectNotFound"), {
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

  return json({ project, allFormats, areaOptions });
};

export async function action({ request, params }: ActionFunctionArgs) {
  const { authClient } = createAuthClient(request);
  const sessionUser = await getSessionUser(authClient);
  const locale = detectLanguage(request);
  const t = await i18next.getFixedT(locale, i18nNS);

  // check slug exists (throw bad request if not)
  invariantResponse(params.slug !== undefined, t("error.invalidRoute"), {
    status: 400,
  });
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
  invariantResponse(project !== null, t("error.projectNotFound"), {
    status: 404,
  });

  // Validation
  const generalSchema = createGeneralSchema(t);
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
            message: t("error.storage"),
          });
          return z.NEVER;
        }

        return { ...data };
      }),
    async: true,
  });

  const hash = getSubmissionHash(submission);

  if (submission.intent !== "submit") {
    return json({ status: "idle", submission, hash } as const);
  }
  if (!submission.value) {
    return json({ status: "error", submission, hash } as const, {
      status: 400,
    });
  }

  return redirectWithToast(
    request.url,
    { id: "settings-toast", key: hash, message: t("content.feedback") },
    { scrollToToast: true }
  );
}

function General() {
  const location = useLocation();
  const loaderData = useLoaderData<typeof loader>();
  const { project, allFormats, areaOptions } = loaderData;
  const { formats, areas, ...rest } = project;
  const actionData = useActionData<typeof action>();

  const { t } = useTranslation(i18nNS);
  const generalSchema = createGeneralSchema(t);

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
      isDirty && currentLocation.pathname !== nextLocation.pathname
  );
  if (blocker.state === "blocked") {
    const confirmed = confirm(t("content.prompt"));
    if (confirmed) {
      blocker.proceed();
    } else {
      blocker.reset();
    }
  }

  return (
    <Section>
      <BackButton to={location.pathname}>{t("content.back")}</BackButton>
      <p className="mv-my-6 @md:mv-mt-0">{t("content.intro")}</p>
      <Form
        method="post"
        {...form.props}
        onChange={() => {
          setIsDirty(true);
        }}
        onReset={() => {
          setIsDirty(false);
        }}
      >
        {/* This button ensures submission via enter key. Always use a hidden button at top of the form when other submit buttons are inside it (f.e. the add/remove list buttons) */}
        <Button type="submit" hidden />
        <div className="mv-flex mv-flex-col mv-gap-6 @md:mv-gap-4">
          <div className="@md:mv-p-4 @md:mv-border @md:mv-rounded-lg @md:mv-border-gray-200">
            <h2 className="mv-text-primary mv-text-lg mv-font-semibold mv-mb-4">
              {t("content.projectTitle.headline")}
            </h2>
            <Input {...conform.input(fields.name)}>
              <Input.Label htmlFor={fields.name.id}>
                {t("content.projectTitle.label")}
              </Input.Label>
              {typeof fields.name.error !== "undefined" && (
                <Input.Error>{fields.name.error}</Input.Error>
              )}
              <Input.HelperText>
                {t("content.projectTitle.helper")}
              </Input.HelperText>
            </Input>
          </div>

          <div className="@md:mv-p-4 @md:mv-border @md:mv-rounded-lg @md:mv-border-gray-200">
            <h2 className="mv-text-primary mv-text-lg mv-font-semibold mv-mb-4">
              {t("content.subline.headline")}
            </h2>
            <Input {...conform.input(fields.subline)}>
              <Input.Label>{t("content.subline.label")}</Input.Label>
              {typeof fields.subline.error !== "undefined" && (
                <Input.Error>{fields.subline.error}</Input.Error>
              )}
              <Input.HelperText>{t("content.subline.helper")}</Input.HelperText>
            </Input>
          </div>

          <div className="mv-flex mv-flex-col mv-gap-4 @md:mv-p-4 @md:mv-border @md:mv-rounded-lg @md:mv-border-gray-200">
            <h2 className="mv-text-primary mv-text-lg mv-font-semibold mv-mb-0">
              {t("content.formats.headline")}
            </h2>
            <ButtonSelect
              id={fields.formats.id}
              cta={t("content.formats.choose")}
            >
              <ButtonSelect.Label htmlFor={fields.formats.id}>
                {t("content.formats.label")}
              </ButtonSelect.Label>
              <ButtonSelect.HelperText>
                {t("content.formats.helper")}
              </ButtonSelect.HelperText>
              {allFormats
                .filter((format) => {
                  return !formatList.some((listFormat) => {
                    return listFormat.defaultValue === format.id;
                  });
                })
                .map((filteredFormat) => {
                  return (
                    <button
                      key={filteredFormat.id}
                      {...list.insert(fields.formats.name, {
                        defaultValue: filteredFormat.id,
                      })}
                      className="mv-text-start mv-w-full mv-py-1 mv-px-2"
                    >
                      {t(`${filteredFormat.slug}.title`, {
                        ns: "datasets/formats",
                      })}
                    </button>
                  );
                })}
            </ButtonSelect>
            {formatList.length > 0 && (
              <Chip.Container>
                {formatList.map((listFormat, index) => {
                  return (
                    <Chip key={listFormat.key}>
                      <Input type="hidden" {...conform.input(listFormat)} />
                      {t(
                        `${
                          allFormats.find((format) => {
                            return format.id === listFormat.defaultValue;
                          })?.slug
                        }.title`,
                        { ns: "datasets/formats" }
                      ) || t("content.notFound")}
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
                  {t("content.furtherFormats.label")}
                </Input.Label>
                <Input.HelperText>
                  {t("content.furtherFormats.helper")}
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
                    {t("content.furtherFormats.add")}
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
              {t("content.areas.headline")}
            </h2>
            <ButtonSelect id={fields.areas.id} cta={t("content.areas.option")}>
              <ButtonSelect.Label htmlFor={fields.areas.id}>
                {t("content.areas.label")}
              </ButtonSelect.Label>
              <ButtonSelect.HelperText>
                {t("content.areas.helper")}
              </ButtonSelect.HelperText>
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
            </ButtonSelect>
            {areaList.length > 0 && (
              <Chip.Container>
                {areaList.map((listArea, index) => {
                  return (
                    <Chip key={listArea.key}>
                      <Input type="hidden" {...conform.input(listArea)} />
                      {areaOptions.find((area) => {
                        return area.value === listArea.defaultValue;
                      })?.label || t("content.notFound")}
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
              {t("content.contact.headline")}
            </h2>
            <Input {...conform.input(fields.email)}>
              <Input.Label htmlFor={fields.email.id}>
                {t("content.contact.email.label")}
              </Input.Label>
              {typeof fields.email.error !== "undefined" && (
                <Input.Error>{fields.email.error}</Input.Error>
              )}
            </Input>
            <Input {...conform.input(fields.phone)}>
              <Input.Label htmlFor={fields.phone.id}>
                {t("content.contact.phone.label")}
              </Input.Label>
              {typeof fields.phone.error !== "undefined" && (
                <Input.Error>{fields.phone.error}</Input.Error>
              )}
            </Input>
          </div>
          <div className="mv-flex mv-flex-col mv-gap-4 @md:mv-p-4 @md:mv-border @md:mv-rounded-lg @md:mv-border-gray-200">
            <h2 className="mv-text-primary mv-text-lg mv-font-semibold mv-mb-0">
              {t("content.address.headline")}
            </h2>
            <Input {...conform.input(fields.contactName)}>
              <Input.Label htmlFor={fields.contactName.id}>
                {t("content.address.contactName.label")}
              </Input.Label>
              {typeof fields.contactName.error !== "undefined" && (
                <Input.Error>{fields.contactName.error}</Input.Error>
              )}
            </Input>
            <div className="@lg:mv-flex @lg:mv-gap-4">
              <div className="mv-w-full @lg:mv-w-1/3">
                <Input {...conform.input(fields.street)}>
                  <Input.Label htmlFor={fields.street.id}>
                    {t("content.address.street.label")}
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
                      {t("content.address.streetNumber.label")}
                    </Input.Label>
                    {typeof fields.streetNumber.error !== "undefined" && (
                      <Input.Error>{fields.streetNumber.error}</Input.Error>
                    )}
                  </Input>
                </div>
                <div className="mv-flex-1">
                  <Input {...conform.input(fields.streetNumberAddition)}>
                    <Input.Label htmlFor={fields.streetNumberAddition.id}>
                      {t("content.address.streetNumberAddition.label")}
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
                    {t("content.address.zipCode.label")}
                  </Input.Label>
                  {typeof fields.zipCode.error !== "undefined" && (
                    <Input.Error>{fields.zipCode.error}</Input.Error>
                  )}
                </Input>
              </div>
              <div className="mv-flex-1 mv-mt-4 @lg:mv-mt-0">
                <Input {...conform.input(fields.city)}>
                  <Input.Label htmlFor={fields.city.id}>
                    {t("content.address.city.label")}
                  </Input.Label>
                  {typeof fields.city.error !== "undefined" && (
                    <Input.Error>{fields.city.error}</Input.Error>
                  )}
                </Input>
              </div>
            </div>
          </div>

          <p className="mv-text-sm mv-mt-4">{t("content.hint")}</p>
          <div className="mv-flex mv-w-full mv-justify-end">
            <div className="mv-flex mv-shrink mv-w-full @md:mv-max-w-fit @lg:mv-w-auto mv-items-center mv-justify-center @lg:mv-justify-end">
              <Controls>
                <Button type="reset" variant="outline" fullSize>
                  {t("content.reset")}
                </Button>
                <Button
                  type="submit"
                  fullSize
                  onClick={() => {
                    setIsDirty(false);
                  }}
                >
                  {t("content.submit")}
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
