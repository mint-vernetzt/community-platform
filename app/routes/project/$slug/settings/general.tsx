import { getFormProps, getInputProps, useForm } from "@conform-to/react";
import { getZodConstraint, parseWithZod } from "@conform-to/zod";
import { Button } from "@mint-vernetzt/components/src/molecules/Button";
import { Chip } from "@mint-vernetzt/components/src/molecules/Chip";
import { Input } from "@mint-vernetzt/components/src/molecules/Input";
import { Controls } from "@mint-vernetzt/components/src/organisms/containers/Controls";
import { Section } from "@mint-vernetzt/components/src/organisms/containers/Section";
import { captureException } from "@sentry/node";
import { useState } from "react";
import {
  Form,
  redirect,
  useActionData,
  useLoaderData,
  useLocation,
  useNavigation,
  type ActionFunctionArgs,
  type LoaderFunctionArgs,
} from "react-router";
import { useHydrated } from "remix-utils/use-hydrated";
import { z } from "zod";
import { createAuthClient, getSessionUser } from "~/auth.server";
import { ConformSelect } from "~/components-next/ConformSelect";
import { SettingsMenuBackButton } from "~/components-next/SettingsMenuBackButton";
import { detectLanguage } from "~/i18n.server";
import { useIsSubmitting } from "~/lib/hooks/useIsSubmitting";
import { useUnsavedChangesBlockerWithModal } from "~/lib/hooks/useUnsavedChangesBlockerWithModal";
import { invariantResponse } from "~/lib/utils/response";
import { languageModuleMap } from "~/locales/.server";
import { prismaClient } from "~/prisma.server";
import { redirectWithToast } from "~/toast.server";
import { createAreaOptions } from "./general.server";
import {
  getRedirectPathOnProtectedProjectRoute,
  updateFilterVectorOfProject,
} from "./utils.server";
import {
  createGeneralSchema,
  NAME_MAX_LENGTH,
  NAME_MIN_LENGTH,
  SUBLINE_MAX_LENGTH,
} from "./general.shared";
import { getCoordinatesFromAddress } from "~/utils.server";
import { insertParametersIntoLocale } from "~/lib/utils/i18n";

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
      street: true,
      zipCode: true,
      city: true,
      longitude: true,
      latitude: true,
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
  let addressError;
  const submission = await parseWithZod(formData, {
    schema: () =>
      createGeneralSchema(locales).transform(async (data, ctx) => {
        const { formats, areas, ...projectData } = data;
        let longitude = project.longitude;
        let latitude = project.latitude;
        if (
          data.street !== project.street ||
          data.city !== project.city ||
          data.zipCode !== project.zipCode
        ) {
          const result = await getCoordinatesFromAddress({
            id: project.id,
            street: projectData.street,
            city: projectData.city,
            zipCode: projectData.zipCode,
          });
          if (result.error !== null) {
            console.error(result.error);
            addressError = result.error;
          }
          longitude = result.longitude;
          latitude = result.latitude;
        } else {
          if (
            (project.street !== null ||
              project.city !== null ||
              project.zipCode !== null) &&
            project.longitude === null &&
            project.latitude === null
          ) {
            addressError =
              "Address not changed but coordinates still not found";
          }
        }

        try {
          await prismaClient.project.update({
            where: {
              slug: params.slug,
            },
            data: {
              ...projectData,
              longitude,
              latitude,
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
          captureException(error);
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

  if (typeof addressError !== "undefined") {
    return redirectWithToast(request.url, {
      key: "address-error-toast",
      level: "attention",
      message: insertParametersIntoLocale(
        locales.route.error.coordinatesNotFound,
        {
          street: submission.value.street,
          city: submission.value.city,
          zipCode: submission.value.zipCode,
        }
      ),
      isRichtext: true,
      delayInMillis: 60000,
    });
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
  const isSubmitting = useIsSubmitting();
  const loaderData = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const { project, allFormats, areaOptions, locales } = loaderData;

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
    shouldValidate: "onBlur",
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

  const [furtherFormat, setFurtherFormat] = useState<string>("");
  const handleFurtherFormatInputChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFurtherFormat(event.currentTarget.value);
  };

  return (
    <Section>
      {UnsavedChangesBlockerModal}
      <SettingsMenuBackButton to={location.pathname} prefetch="intent">
        {locales.route.content.back}
      </SettingsMenuBackButton>
      <p className="my-6 @md:mt-0">{locales.route.content.intro}</p>
      <Form
        {...getFormProps(form)}
        method="post"
        preventScrollReset
        autoComplete="off"
      >
        {/* This button ensures submission via enter key. Always use a hidden button at top of the form when other submit buttons are inside it (f.e. the add/remove list buttons) */}
        <button type="submit" hidden disabled={isSubmitting} />
        <div className="flex flex-col gap-6 @md:gap-4">
          <div className="@md:p-4 @md:border @md:rounded-lg @md:border-gray-200">
            <h2 className="text-primary text-lg font-semibold mb-4">
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
              <Input.HelperText>
                {locales.route.content.projectTitle.helper}
              </Input.HelperText>
              {typeof fields.name.errors !== "undefined" &&
              fields.name.errors.length > 0
                ? fields.name.errors.map((error) => (
                    <Input.Error id={fields.name.errorId} key={error}>
                      {error}
                    </Input.Error>
                  ))
                : null}
            </Input>
          </div>

          <div className="@md:p-4 @md:border @md:rounded-lg @md:border-gray-200">
            <h2 className="text-primary text-lg font-semibold mb-4">
              {locales.route.content.subline.headline}
            </h2>
            <Input
              {...getInputProps(fields.subline, { type: "text" })}
              maxLength={SUBLINE_MAX_LENGTH}
              key="subline"
            >
              <Input.Label>{locales.route.content.subline.label}</Input.Label>
              <Input.HelperText>
                {locales.route.content.subline.helper}
              </Input.HelperText>
              {typeof fields.subline.errors !== "undefined" &&
              fields.subline.errors.length > 0
                ? fields.subline.errors.map((error) => (
                    <Input.Error id={fields.subline.errorId} key={error}>
                      {error}
                    </Input.Error>
                  ))
                : null}
            </Input>
          </div>

          <div className="flex flex-col gap-4 @md:p-4 @md:border @md:rounded-lg @md:border-gray-200">
            <h2 className="text-primary text-lg font-semibold mb-0">
              {locales.route.content.formats.headline}
            </h2>
            <ConformSelect
              id={fields.formats.id}
              cta={locales.route.content.formats.choose}
            >
              <ConformSelect.Label htmlFor={fields.formats.id}>
                {locales.route.content.formats.label}
              </ConformSelect.Label>
              {typeof fields.formats.errors !== "undefined" &&
              fields.formats.errors.length > 0 ? (
                fields.formats.errors.map((error) => (
                  <ConformSelect.Error id={fields.formats.errorId} key={error}>
                    {error}
                  </ConformSelect.Error>
                ))
              ) : (
                <ConformSelect.HelperText>
                  {locales.route.content.formats.helper}
                </ConformSelect.HelperText>
              )}
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
                      {...ConformSelect.getListItemChildrenStyles()}
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
                      <input
                        {...getInputProps(listFormat, { type: "hidden" })}
                        key={listFormat.id}
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
                <div className="flex flex-row gap-4 items-center">
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
                    {typeof fields.furtherFormats.errors !== "undefined" &&
                    fields.furtherFormats.errors.length > 0
                      ? fields.furtherFormats.errors.map((error) => (
                          <Input.Error
                            id={fields.furtherFormats.errorId}
                            key={error}
                          >
                            {error}
                          </Input.Error>
                        ))
                      : null}
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
                          <input
                            {...getInputProps(listFormat, { type: "hidden" })}
                            key={listFormat.id}
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
                          key={listFormat.id}
                          className="pl-1"
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
                {typeof fields.furtherFormats.errors !== "undefined" &&
                fields.furtherFormats.errors.length > 0
                  ? fields.furtherFormats.errors.map((error) => (
                      <Input.Error
                        id={fields.furtherFormats.errorId}
                        key={error}
                      >
                        {error}
                      </Input.Error>
                    ))
                  : null}
              </>
            )}
          </div>

          <div className="flex flex-col gap-4 @md:p-4 @md:border @md:rounded-lg @md:border-gray-200">
            <h2 className="text-primary text-lg font-semibold mb-0">
              {locales.route.content.areas.headline}
            </h2>
            <ConformSelect
              id={fields.areas.id}
              cta={locales.route.content.areas.option}
            >
              <ConformSelect.Label htmlFor={fields.areas.id}>
                {locales.route.content.areas.label}
              </ConformSelect.Label>
              {typeof fields.areas.errors !== "undefined" &&
              fields.areas.errors.length > 0 ? (
                fields.areas.errors.map((error) => (
                  <ConformSelect.Error id={fields.areas.errorId} key={error}>
                    {error}
                  </ConformSelect.Error>
                ))
              ) : (
                <ConformSelect.HelperText>
                  {locales.route.content.areas.helper}
                </ConformSelect.HelperText>
              )}
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
                        {...ConformSelect.getListItemChildrenStyles()}
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
                        className="text-start w-full cursor-default text-neutral-600 font-semibold py-1 px-2"
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
                      <input
                        {...getInputProps(listArea, { type: "hidden" })}
                        key={listArea.id}
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
          <div className="flex flex-col gap-4 @md:p-4 @md:border @md:rounded-lg @md:border-gray-200">
            <h2 className="text-primary text-lg font-semibold mb-0">
              {locales.route.content.contact.headline}
            </h2>
            <Input
              {...getInputProps(fields.email, { type: "email" })}
              key="email"
            >
              <Input.Label htmlFor={fields.email.id}>
                {locales.route.content.contact.email.label}
              </Input.Label>
              {typeof fields.email.errors !== "undefined" &&
              fields.email.errors.length > 0
                ? fields.email.errors.map((error) => (
                    <Input.Error id={fields.email.errorId} key={error}>
                      {error}
                    </Input.Error>
                  ))
                : null}
            </Input>
            <Input
              {...getInputProps(fields.phone, { type: "tel" })}
              key="phone"
            >
              <Input.Label htmlFor={fields.phone.id}>
                {locales.route.content.contact.phone.label}
              </Input.Label>
              {typeof fields.phone.errors !== "undefined" &&
              fields.phone.errors.length > 0
                ? fields.phone.errors.map((error) => (
                    <Input.Error id={fields.phone.errorId} key={error}>
                      {error}
                    </Input.Error>
                  ))
                : null}
            </Input>
          </div>
          {typeof form.errors !== "undefined" && form.errors.length > 0 ? (
            <div>
              {form.errors.map((error) => {
                return (
                  <div
                    id={form.errorId}
                    key={form.errorId}
                    className="text-sm font-semibold text-negative-700"
                  >
                    {error}
                  </div>
                );
              })}
            </div>
          ) : null}
          <div className="flex flex-col gap-4 @md:p-4 @md:border @md:rounded-lg @md:border-gray-200">
            <h2 className="text-primary text-lg font-semibold mb-0">
              {locales.route.content.address.headline}
            </h2>
            <Input
              {...getInputProps(fields.contactName, { type: "text" })}
              key="contactName"
            >
              <Input.Label htmlFor={fields.contactName.id}>
                {locales.route.content.address.contactName.label}
              </Input.Label>
              {typeof fields.contactName.errors !== "undefined" &&
              fields.contactName.errors.length > 0
                ? fields.contactName.errors.map((error) => (
                    <Input.Error id={fields.contactName.errorId} key={error}>
                      {error}
                    </Input.Error>
                  ))
                : null}
            </Input>

            <Input
              {...getInputProps(fields.street, { type: "text" })}
              key="street"
            >
              <Input.Label htmlFor={fields.street.id}>
                {locales.route.content.address.street.label}
              </Input.Label>
              {typeof fields.street.errors !== "undefined" &&
              fields.street.errors.length > 0
                ? fields.street.errors.map((error) => (
                    <Input.Error id={fields.street.errorId} key={error}>
                      {error}
                    </Input.Error>
                  ))
                : null}
            </Input>

            <div className="@lg:flex @lg:gap-4">
              <div className="flex-1">
                <Input
                  {...getInputProps(fields.zipCode, { type: "text" })}
                  key="zipCode"
                >
                  <Input.Label htmlFor={fields.zipCode.id}>
                    {locales.route.content.address.zipCode.label}
                  </Input.Label>
                  {typeof fields.zipCode.errors !== "undefined" &&
                  fields.zipCode.errors.length > 0
                    ? fields.zipCode.errors.map((error) => (
                        <Input.Error id={fields.zipCode.errorId} key={error}>
                          {error}
                        </Input.Error>
                      ))
                    : null}
                </Input>
              </div>
              <div className="flex-1 mt-4 @lg:mt-0">
                <Input
                  {...getInputProps(fields.city, { type: "text" })}
                  key="city"
                >
                  <Input.Label htmlFor={fields.city.id}>
                    {locales.route.content.address.city.label}
                  </Input.Label>
                  {typeof fields.city.errors !== "undefined" &&
                  fields.city.errors.length > 0
                    ? fields.city.errors.map((error) => (
                        <Input.Error id={fields.city.errorId} key={error}>
                          {error}
                        </Input.Error>
                      ))
                    : null}
                </Input>
              </div>
            </div>
          </div>
          {typeof form.errors !== "undefined" && form.errors.length > 0 ? (
            <div>
              {form.errors.map((error) => {
                return (
                  <div
                    id={form.errorId}
                    key={form.errorId}
                    className="text-sm font-semibold text-negative-700"
                  >
                    {error}
                  </div>
                );
              })}
            </div>
          ) : null}
          <p className="text-sm mt-4">{locales.route.content.hint}</p>
          <div className="flex w-full justify-end">
            <div className="flex shrink w-full @md:max-w-fit @lg:w-auto items-center justify-center @lg:justify-end">
              <Controls>
                <div className="relative w-full">
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
                  <noscript className="absolute top-0">
                    <Button as="link" to="." variant="outline" fullSize>
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
                      ? form.dirty === false ||
                        form.valid === false ||
                        isSubmitting
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
