import {
  json,
  LinksFunction,
  LoaderFunctionArgs,
  redirect,
} from "@remix-run/node";
import { TFunction } from "i18next";
import { z } from "zod";
import { createAuthClient, getSessionUser } from "~/auth.server";
import i18next from "~/i18next.server";
import { invariantResponse } from "~/lib/utils/response";
import { createPhoneSchema } from "~/lib/utils/schemas";
import { prismaClient } from "~/prisma.server";
import { detectLanguage } from "~/root.server";
import { getRedirectPathOnProtectedOrganizationRoute } from "~/routes/organization/$slug/utils.server";
import { createAreaOptions } from "./general.server";
import { useLoaderData, useLocation } from "@remix-run/react";
import { useTranslation } from "react-i18next";
import { getInputProps, getTextareaProps, useForm } from "@conform-to/react-v1";
import { getFieldsetConstraint } from "@conform-to/zod";
import { parseWithZod } from "@conform-to/zod-v1";
import { Button, Chip, Input, Section } from "@mint-vernetzt/components";
import { BackButton } from "./__components";
import TextAreaWithCounter from "~/components/FormElements/TextAreaWithCounter/TextAreaWithCounter";
import quillStyles from "react-quill/dist/quill.snow.css";
import { ButtonSelect } from "~/routes/project/$slug/settings/__components";
import { s } from "vitest/dist/reporters-LqC_WI4d.js";
import React from "react";

const i18nNS = ["routes/next/organization/settings/general"];

export const handle = {
  i18n: i18nNS,
};

const createGeneralSchema = (t: TFunction) => {
  return z.object({
    name: z
      .string({
        required_error: t("validation.name.required"),
      })
      .min(3, t("validation.name.min"))
      .max(50, t("validation.name.max")),
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
    bio: z
      .string()
      .max(2000, t("validation.bio.max"))
      .optional()
      .transform((value) => {
        if (value === undefined) {
          return null;
        }
        const trimmedValue = value.trim();
        return trimmedValue === "" || trimmedValue === "<p></p>" ? null : value;
      }),
    supportedBy: z
      .array(z.string().transform((value) => value.trim()))
      .optional(),
    areas: z.array(z.string().uuid()),
    focuses: z.array(z.string().uuid()),
    // visibilities: z.array(z.string()),
  });
};

export async function loader(args: LoaderFunctionArgs) {
  const { request, params } = args;
  const locale = detectLanguage(request);
  const t = await i18next.getFixedT(locale, i18nNS);

  const { authClient } = createAuthClient(request);

  const sessionUser = await getSessionUser(authClient);

  // check slug exists (throw bad request if not)
  invariantResponse(params.slug !== undefined, t("error.invalidRoute"), {
    status: 400,
  });

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
              title: true,
            },
          },
        },
      },
    },
  });
  invariantResponse(organization !== null, t("error.notFound"), {
    status: 404,
  });
  const visibilities = await prismaClient.organizationVisibility.findFirst({
    where: { organizationId: organization.id },
    select: {
      email: true,
      phone: true,
      bio: true,
      focuses: true,
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
  const areaOptions = createAreaOptions(allAreas);

  const allFocuses = await prismaClient.focus.findMany({
    select: {
      id: true,
      slug: true,
    },
  });

  return json({
    organization,
    areaOptions,
    allFocuses,
    visibilities,
  });
}

export const links: LinksFunction = () => [
  { rel: "stylesheet", href: quillStyles },
];

function General() {
  const location = useLocation();
  const loaderData = useLoaderData<typeof loader>();
  const { organization, allFocuses, areaOptions } = loaderData;

  const [supportedBy, setSupportedBy] = React.useState<string>("");

  const { t } = useTranslation(i18nNS);
  const generalSchema = createGeneralSchema(t);

  const { areas, focuses, ...rest } = organization;
  const defaultValues = {
    ...rest,
    areas: areas.map((relation) => relation.area.id),
    focuses: focuses.map((relation) => relation.focus.id),
    // visibilities: loaderData.visibilities.keys((visibility) => visibility.id),
  };

  console.log("defaultValues", defaultValues);

  const [form, fields] = useForm({
    id: "general-form",
    constraint: getFieldsetConstraint(generalSchema),
    defaultValue: defaultValues,
    shouldValidate: "onSubmit",
    shouldRevalidate: "onInput",
    onValidate: (args) => {
      const { formData } = args;
      return parseWithZod(formData, { schema: generalSchema });
    },
  });

  console.log(form.dirty);

  console.log("defaultValues.areas", defaultValues.areas);

  const areaFieldList = fields.areas.getFieldList();
  const focusFieldList = fields.focuses.getFieldList();
  const supportedByFieldList = fields.supportedBy.getFieldList();

  return (
    <Section>
      <BackButton to={location.pathname}>{t("content.back")}</BackButton>
      <div className="mv-flex mv-flex-col mv-gap-6 @md:mv-gap-4">
        <div className="mv-flex mv-flex-col mv-gap-4 @md:mv-p-4 @md:mv-border @md:mv-rounded-lg @md:mv-border-gray-200">
          <h2 className="mv-text-primary mv-text-lg mv-font-semibold mv-mb-0">
            {t("content.contact.headline")}
          </h2>
          <div className="@lg:mv-flex @lg:mv-gap-4">
            <Input {...getInputProps(fields.name, { type: "text" })}>
              <Input.Label htmlFor={fields.name.id}>
                {t("content.contact.name.label")}
              </Input.Label>
              {typeof fields.name.errors !== "undefined" && (
                <Input.Error>{fields.name.errors}</Input.Error>
              )}
            </Input>
          </div>
          <div className="@lg:mv-flex @lg:mv-gap-4">
            <div className="mv-flex-1">
              <Input {...getInputProps(fields.email, { type: "email" })}>
                <Input.Label htmlFor={fields.email.id}>
                  {t("content.contact.email.label")}
                </Input.Label>
                {typeof fields.email.errors !== "undefined" && (
                  <Input.Error>{fields.email.errors}</Input.Error>
                )}
              </Input>
            </div>

            <div className="mv-flex-1">
              <Input {...getInputProps(fields.phone, { type: "tel" })}>
                <Input.Label htmlFor={fields.phone.id}>
                  {t("content.contact.phone.label")}
                </Input.Label>
                {typeof fields.phone.errors !== "undefined" && (
                  <Input.Error>{fields.phone.errors}</Input.Error>
                )}
              </Input>
            </div>
          </div>

          <div className="@lg:mv-flex @lg:mv-gap-4">
            <div className="mv-flex-1">
              <Input {...getInputProps(fields.zipCode, { type: "text" })}>
                <Input.Label htmlFor={fields.zipCode.id}>
                  {t("content.contact.zipCode.label")}
                </Input.Label>
                {typeof fields.zipCode.errors !== "undefined" && (
                  <Input.Error>{fields.zipCode.errors}</Input.Error>
                )}
              </Input>
            </div>
            <div className="mv-flex-1 mv-mt-4 @lg:mv-mt-0">
              <Input {...getInputProps(fields.city, { type: "text" })}>
                <Input.Label htmlFor={fields.city.id}>
                  {t("content.contact.city.label")}
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
            {t("content.about.headline")}
          </h2>
          <p>{t("content.about.intro")}</p>
          <TextAreaWithCounter
            {...getTextareaProps(fields.bio)}
            id={fields.bio.id || ""}
            label={t("content.extendedDescription.idea.label")}
            helperText={t("content.extendedDescription.idea.helper")}
            errorMessage={
              Array.isArray(fields.bio.errors)
                ? fields.bio.errors.join(", ")
                : undefined
            }
            maxCharacters={2000}
            rte
          />
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
          </ButtonSelect>
          {areaFieldList.length > 0 && (
            <Chip.Container>
              {areaFieldList.map((field, index) => {
                return (
                  <Chip key={field.key}>
                    <Input {...getInputProps(field, { type: "hidden" })} />
                    {areaOptions.find((option) => {
                      return option.value === field.initialValue;
                    })?.label || t("content.notFound")}
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
          <ButtonSelect
            id={fields.focuses.id}
            cta={t("content.focuses.option")}
          >
            <ButtonSelect.Label htmlFor={fields.areas.id}>
              {t("content.focuses.label")}
            </ButtonSelect.Label>
            <ButtonSelect.HelperText>
              {t("content.focuses.helper")}
            </ButtonSelect.HelperText>
            {allFocuses
              .filter((option) => {
                return !focusFieldList.some((listFormat) => {
                  return listFormat.initialValue === option.id;
                });
              })
              .map((option) => {
                return (
                  <button
                    key={option.id}
                    {...form.insert.getButtonProps({
                      name: fields.focuses.name,
                      defaultValue: option.id,
                    })}
                    className="mv-text-start mv-w-full mv-py-1 mv-px-2"
                  >
                    {t(`${option.slug}.title`, {
                      ns: "datasets/formats",
                    })}
                  </button>
                );
              })}
          </ButtonSelect>
          {focusFieldList.length > 0 && (
            <Chip.Container>
              {focusFieldList.map((field, index) => {
                return (
                  <Chip key={field.key}>
                    <Input {...getInputProps(field, { type: "hidden" })} />
                    {t(
                      `${
                        allFocuses.find((option) => {
                          return option.id === field.initialValue;
                        })?.slug
                      }.title`,
                      { ns: "datasets/formats" }
                    ) || t("content.notFound")}
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
            {t("content.supportedBy.headline")}
          </h2>
          <div className="mv-flex mv-flex-row mv-gap-4 mv-items-center">
            <Input value={supportedBy} onChange={console.log}>
              <Input.Label htmlFor={fields.supportedBy.id}>
                {t("content.supportedBy.label")}
              </Input.Label>
              <Input.HelperText>
                {t("content.supportedBy.helper")}
              </Input.HelperText>
              <Input.Controls>
                <Button
                  id={fields.supportedBy.id}
                  {...form.insert.getButtonProps({
                    name: fields.supportedBy.name,
                    defaultValue: supportedBy,
                  })}
                  variant="ghost"
                  disabled={supportedBy === ""}
                >
                  {t("content.furtherFormats.add")}
                </Button>
              </Input.Controls>
            </Input>
          </div>
          {supportedByFieldList.length > 0 && (
            <Chip.Container>
              {supportedByFieldList.map((field, index) => {
                return (
                  <Chip key={field.key}>
                    <Input {...getInputProps(field, { type: "hidden" })} />
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
      </div>
    </Section>
  );
}

export default General;
