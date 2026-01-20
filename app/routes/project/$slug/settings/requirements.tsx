import { getFormProps, getInputProps, useForm } from "@conform-to/react";
import { getZodConstraint, parseWithZod } from "@conform-to/zod";
import { Button } from "@mint-vernetzt/components/src/molecules/Button";
import { Chip } from "@mint-vernetzt/components/src/molecules/Chip";
import { Input } from "@mint-vernetzt/components/src/molecules/Input";
import { Controls } from "@mint-vernetzt/components/src/organisms/containers/Controls";
import { Section } from "@mint-vernetzt/components/src/organisms/containers/Section";
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
import { TextArea } from "~/components-next/TextArea";
import { UnsavedChangesModal } from "~/components/next/UnsavedChangesModal";
import { detectLanguage } from "~/i18n.server";
import { useIsSubmitting } from "~/lib/hooks/useIsSubmitting";
import { invariantResponse } from "~/lib/utils/response";
import {
  LastTimeStamp,
  UnsavedChangesModalParam,
} from "~/lib/utils/searchParams";
import { languageModuleMap } from "~/locales/.server";
import { prismaClient } from "~/prisma.server";
import { redirectWithToast } from "~/toast.server";
import { getFormPersistenceTimestamp, sanitizeUserHtml } from "~/utils.server";
import {
  createRequirementsSchema,
  FURTHER_FINANCINGS_MAX_LENGTH,
  FURTHER_JOB_FILLINGS_MAX_LENGTH,
  FURTHER_ROOM_SITUATION_MAX_LENGTH,
  FURTHER_TECHNICAL_REQUIREMENTS_MAX_LENGTH,
  JOB_FILLINGS_MAX_LENGTH,
  ROOM_SITUATION_MAX_LENGTH,
  TECHNICAL_REQUIREMENTS_MAX_LENGTH,
  TIMEFRAME_MAX_LENGTH,
  YEARLY_BUDGET_MAX_LENGTH,
} from "./requirements.shared";
import {
  getRedirectPathOnProtectedProjectRoute,
  updateFilterVectorOfProject,
} from "./utils.server";

export const loader = async (args: LoaderFunctionArgs) => {
  const { request, params } = args;

  const language = await detectLanguage(request);
  const locales =
    languageModuleMap[language]["project/$slug/settings/requirements"];

  const project = await prismaClient.project.findUnique({
    select: {
      timeframe: true,
      timeframeRTEState: true,
      jobFillings: true,
      jobFillingsRTEState: true,
      furtherJobFillings: true,
      furtherJobFillingsRTEState: true,
      yearlyBudget: true,
      furtherFinancings: true,
      furtherFinancingsRTEState: true,
      technicalRequirements: true,
      technicalRequirementsRTEState: true,
      furtherTechnicalRequirements: true,
      furtherTechnicalRequirementsRTEState: true,
      roomSituation: true,
      roomSituationRTEState: true,
      furtherRoomSituation: true,
      furtherRoomSituationRTEState: true,
      financings: {
        select: {
          financing: {
            select: {
              id: true,
              slug: true,
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

  const allFinancings = await prismaClient.financing.findMany({
    select: {
      id: true,
      slug: true,
    },
  });

  const url = new URL(request.url);
  const lastTimeStampParam = url.searchParams.get(LastTimeStamp);
  const currentTimestamp = getFormPersistenceTimestamp(lastTimeStampParam);

  return { project, allFinancings, currentTimestamp, locales };
};

export async function action({ request, params }: ActionFunctionArgs) {
  const { authClient } = createAuthClient(request);

  const language = await detectLanguage(request);
  const locales =
    languageModuleMap[language]["project/$slug/settings/requirements"];

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
      schema: createRequirementsSchema(locales),
    });
    return submission.reply();
  }
  const submission = await parseWithZod(formData, {
    schema: () =>
      createRequirementsSchema(locales).transform(async (data, ctx) => {
        const {
          financings,
          timeframe,
          jobFillings,
          furtherJobFillings,
          furtherFinancings,
          technicalRequirements,
          furtherTechnicalRequirements,
          roomSituation,
          furtherRoomSituation,
          ...rest
        } = data;
        const sanitizedTimeFrame = sanitizeUserHtml(timeframe);
        const trimmedTimeFrame =
          sanitizedTimeFrame !== null
            ? sanitizedTimeFrame
                .replaceAll(/^(?:<p><br><\/p>)+|(?:<p><br><\/p>)+$/g, "")
                .trim()
            : null;
        const sanitizedJobFillings = sanitizeUserHtml(jobFillings);
        const trimmedJobFillings =
          sanitizedJobFillings !== null
            ? sanitizedJobFillings
                .replaceAll(/^(?:<p><br><\/p>)+|(?:<p><br><\/p>)+$/g, "")
                .trim()
            : null;
        const sanitizedFurtherJobFillings =
          sanitizeUserHtml(furtherJobFillings);
        const trimmedFurtherJobFillings =
          sanitizedFurtherJobFillings !== null
            ? sanitizedFurtherJobFillings
                .replaceAll(/^(?:<p><br><\/p>)+|(?:<p><br><\/p>)+$/g, "")
                .trim()
            : null;
        const sanitizedFurtherFinancings = sanitizeUserHtml(furtherFinancings);
        const trimmedFurtherFinancings =
          sanitizedFurtherFinancings !== null
            ? sanitizedFurtherFinancings
                .replaceAll(/^(?:<p><br><\/p>)+|(?:<p><br><\/p>)+$/g, "")
                .trim()
            : null;
        const sanitizedTechnicalRequirements = sanitizeUserHtml(
          technicalRequirements
        );
        const trimmedTechnicalRequirements =
          sanitizedTechnicalRequirements !== null
            ? sanitizedTechnicalRequirements
                .replaceAll(/^(?:<p><br><\/p>)+|(?:<p><br><\/p>)+$/g, "")
                .trim()
            : null;
        const sanitizedFurtherTechnicalRequirements = sanitizeUserHtml(
          furtherTechnicalRequirements
        );
        const trimmedFurtherTechnicalRequirements =
          sanitizedFurtherTechnicalRequirements !== null
            ? sanitizedFurtherTechnicalRequirements
                .replaceAll(/^(?:<p><br><\/p>)+|(?:<p><br><\/p>)+$/g, "")
                .trim()
            : null;
        const sanitizedRoomSituation = sanitizeUserHtml(roomSituation);
        const trimmedRoomSituation =
          sanitizedRoomSituation !== null
            ? sanitizedRoomSituation
                .replaceAll(/^(?:<p><br><\/p>)+|(?:<p><br><\/p>)+$/g, "")
                .trim()
            : null;
        const sanitizedFurtherRoomSituation =
          sanitizeUserHtml(furtherRoomSituation);
        const trimmedFurtherRoomSituation =
          sanitizedFurtherRoomSituation !== null
            ? sanitizedFurtherRoomSituation
                .replaceAll(/^(?:<p><br><\/p>)+|(?:<p><br><\/p>)+$/g, "")
                .trim()
            : null;

        try {
          await prismaClient.project.update({
            where: {
              slug: params.slug,
            },
            data: {
              ...rest,
              timeframe: trimmedTimeFrame,
              jobFillings: trimmedJobFillings,
              furtherJobFillings: trimmedFurtherJobFillings,
              furtherFinancings: trimmedFurtherFinancings,
              technicalRequirements: trimmedTechnicalRequirements,
              furtherTechnicalRequirements: trimmedFurtherTechnicalRequirements,
              roomSituation: trimmedRoomSituation,
              furtherRoomSituation: trimmedFurtherRoomSituation,
              financings: {
                deleteMany: {},
                connectOrCreate: financings.map((financingId: string) => {
                  return {
                    where: {
                      financingId_projectId: {
                        financingId: financingId,
                        projectId: project.id,
                      },
                    },
                    create: {
                      financingId,
                    },
                  };
                }),
              },
            },
          });
          void updateFilterVectorOfProject(project.id);
        } catch (e) {
          console.warn(e);
          ctx.addIssue({
            code: "custom",
            message: locales.route.error.custom,
          });
          return z.NEVER;
        }

        return { ...data };
      }),
    async: true,
  });

  if (submission.status !== "success") {
    return submission.reply();
  }

  return redirectWithToast(request.url, {
    id: "update-requirements-toast",
    key: `${new Date().getTime()}`,
    message: locales.route.content.success,
  });
}

function Requirements() {
  const location = useLocation();
  const isHydrated = useHydrated();
  const navigation = useNavigation();
  const isSubmitting = useIsSubmitting();
  const loaderData = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const { project, allFinancings, locales } = loaderData;

  const { financings, ...rest } = project;

  const defaultValues = {
    ...rest,
    financings: financings.map((relation) => relation.financing.id),
  };

  const [form, fields] = useForm({
    id: `requirements-form-${loaderData.currentTimestamp}`,
    constraint: getZodConstraint(createRequirementsSchema(locales)),
    defaultValue: defaultValues,
    shouldValidate: "onBlur",
    shouldRevalidate: "onInput",
    lastResult: navigation.state === "idle" ? actionData : null,
    onValidate: (args) => {
      const { formData } = args;
      const submission = parseWithZod(formData, {
        schema: createRequirementsSchema(locales),
      });
      return submission;
    },
  });

  const financingList = fields.financings.getFieldList();

  return (
    <>
      <Section>
        <UnsavedChangesModal
          searchParam={UnsavedChangesModalParam}
          formMetadataToCheck={form}
          locales={locales.components.UnsavedChangesModal}
          lastTimeStamp={loaderData.currentTimestamp}
        />
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
            <div className="flex flex-col gap-4 @md:p-4 @md:border @md:rounded-lg @md:border-gray-200">
              <h2 className="text-primary text-lg font-semibold mb-0">
                {locales.route.form.timeframe.headline}
              </h2>

              <TextArea
                {...getInputProps(fields.timeframe, { type: "text" })}
                key="timeframe"
                id={fields.timeframe.id || ""}
                label={locales.route.form.timeframe.label}
                errorMessage={
                  Array.isArray(fields.timeframe.errors)
                    ? fields.timeframe.errors.join(", ")
                    : undefined
                }
                errorId={fields.timeframe.errorId}
                maxLength={TIMEFRAME_MAX_LENGTH}
                rte={{
                  locales: locales,
                  defaultValue: fields.timeframeRTEState.initialValue,
                  isFormDirty: form.dirty,
                }}
              />
            </div>

            <div className="flex flex-col gap-4 @md:p-4 @md:border @md:rounded-lg @md:border-gray-200">
              <h2 className="text-primary text-lg font-semibold mb-0">
                {locales.route.form.personellSituation.headline}
              </h2>

              <TextArea
                {...getInputProps(fields.jobFillings, { type: "text" })}
                key="jobFillings"
                id={fields.jobFillings.id || ""}
                label={locales.route.form.personellSituation.jobFillings.label}
                helperText={
                  locales.route.form.personellSituation.jobFillings.helper
                }
                errorMessage={
                  Array.isArray(fields.jobFillings.errors)
                    ? fields.jobFillings.errors.join(", ")
                    : undefined
                }
                errorId={fields.jobFillings.errorId}
                maxLength={JOB_FILLINGS_MAX_LENGTH}
                rte={{
                  locales: locales,
                  defaultValue: fields.jobFillingsRTEState.initialValue,
                  isFormDirty: form.dirty,
                }}
              />

              <TextArea
                {...getInputProps(fields.furtherJobFillings, { type: "text" })}
                key="furtherJobFillings"
                id={fields.furtherJobFillings.id || ""}
                label={
                  locales.route.form.personellSituation.furtherJobFillings.label
                }
                helperText={
                  locales.route.form.personellSituation.furtherJobFillings
                    .helper
                }
                errorMessage={
                  Array.isArray(fields.furtherJobFillings.errors)
                    ? fields.furtherJobFillings.errors.join(", ")
                    : undefined
                }
                errorId={fields.furtherJobFillings.errorId}
                maxLength={FURTHER_JOB_FILLINGS_MAX_LENGTH}
                rte={{
                  locales: locales,
                  defaultValue: fields.furtherJobFillingsRTEState.initialValue,
                  isFormDirty: form.dirty,
                }}
              />
            </div>

            <div className="flex flex-col gap-4 @md:p-4 @md:border @md:rounded-lg @md:border-gray-200">
              <h2 className="text-primary text-lg font-semibold mb-0">
                {locales.route.form.budget.headline}
              </h2>

              <Input
                {...getInputProps(fields.yearlyBudget, { type: "text" })}
                key="yearlyBudget"
                maxLength={YEARLY_BUDGET_MAX_LENGTH}
              >
                <Input.Label htmlFor={fields.yearlyBudget.id}>
                  {locales.route.form.budget.yearlyBudget.label}
                </Input.Label>
                {typeof fields.yearlyBudget.errors !== "undefined" &&
                fields.yearlyBudget.errors.length > 0
                  ? fields.yearlyBudget.errors.map((error) => (
                      <Input.Error id={fields.yearlyBudget.errorId} key={error}>
                        {error}
                      </Input.Error>
                    ))
                  : null}
                <Input.HelperText>
                  {locales.route.form.budget.yearlyBudget.helper}
                </Input.HelperText>
              </Input>

              <ConformSelect
                id={fields.financings.id}
                cta={locales.route.form.budget.financings.option}
              >
                <ConformSelect.Label htmlFor={fields.financings.id}>
                  {locales.route.form.budget.financings.label}
                </ConformSelect.Label>
                {typeof fields.financings.errors !== "undefined" &&
                fields.financings.errors.length > 0 ? (
                  fields.financings.errors.map((error) => (
                    <ConformSelect.Error
                      id={fields.financings.errorId}
                      key={error}
                    >
                      {error}
                    </ConformSelect.Error>
                  ))
                ) : (
                  <ConformSelect.HelperText>
                    {locales.route.form.budget.financings.helper}
                  </ConformSelect.HelperText>
                )}
                {allFinancings
                  .filter((financing) => {
                    return !financingList.some((listFinancing) => {
                      return listFinancing.initialValue === financing.id;
                    });
                  })
                  .map((filteredFinancing) => {
                    let title;
                    if (filteredFinancing.slug in locales.financings) {
                      type LocaleKey = keyof typeof locales.financings;
                      title =
                        locales.financings[filteredFinancing.slug as LocaleKey]
                          .title;
                    } else {
                      console.error(
                        `Financing ${filteredFinancing.slug} not found in locales`
                      );
                      title = filteredFinancing.slug;
                    }
                    return (
                      <button
                        key={filteredFinancing.id}
                        {...form.insert.getButtonProps({
                          name: fields.financings.name,
                          defaultValue: filteredFinancing.id,
                        })}
                        {...ConformSelect.getListItemChildrenStyles()}
                      >
                        {title}
                      </button>
                    );
                  })}
              </ConformSelect>
              {financingList.length > 0 && (
                <Chip.Container>
                  {financingList.map((listFinancing, index) => {
                    const financingSlug = allFinancings.find((financing) => {
                      return financing.id === listFinancing.initialValue;
                    })?.slug;
                    let title;
                    if (financingSlug === undefined) {
                      console.error(
                        `Financing with id ${listFinancing.id} not found in allAdditionalDisciplines`
                      );
                      title = null;
                    } else {
                      if (financingSlug in locales.financings) {
                        type LocaleKey = keyof typeof locales.financings;
                        title =
                          locales.financings[financingSlug as LocaleKey].title;
                      } else {
                        console.error(
                          `Financing ${financingSlug} not found in locales`
                        );
                        title = financingSlug;
                      }
                    }
                    return (
                      <Chip key={listFinancing.key}>
                        {title || locales.route.content.notFound}
                        <input
                          {...getInputProps(listFinancing, { type: "hidden" })}
                          key={listFinancing.id}
                        />
                        <Chip.Delete>
                          <button
                            {...form.remove.getButtonProps({
                              name: fields.financings.name,
                              index,
                            })}
                          />
                        </Chip.Delete>
                      </Chip>
                    );
                  })}
                </Chip.Container>
              )}

              <TextArea
                {...getInputProps(fields.furtherFinancings, { type: "text" })}
                key="furtherFinancings"
                id={fields.furtherFinancings.id || ""}
                label={locales.route.form.budget.furtherFinancings.label}
                helperText={locales.route.form.budget.furtherFinancings.helper}
                errorMessage={
                  Array.isArray(fields.furtherFinancings.errors)
                    ? fields.furtherFinancings.errors.join(", ")
                    : undefined
                }
                errorId={fields.furtherFinancings.errorId}
                maxLength={FURTHER_FINANCINGS_MAX_LENGTH}
                rte={{
                  locales: locales,
                  defaultValue: fields.furtherFinancingsRTEState.initialValue,
                  isFormDirty: form.dirty,
                }}
              />
            </div>

            <div className="flex flex-col gap-4 @md:p-4 @md:border @md:rounded-lg @md:border-gray-200">
              <h2 className="text-primary text-lg font-semibold mb-0">
                {locales.route.form.technicalFrame.headline}
              </h2>

              <TextArea
                {...getInputProps(fields.technicalRequirements, {
                  type: "text",
                })}
                key="technicalRequirements"
                id={fields.technicalRequirements.id || ""}
                label={
                  locales.route.form.technicalFrame.technicalRequirements.label
                }
                errorMessage={
                  Array.isArray(fields.technicalRequirements.errors)
                    ? fields.technicalRequirements.errors.join(", ")
                    : undefined
                }
                errorId={fields.technicalRequirements.errorId}
                maxLength={TECHNICAL_REQUIREMENTS_MAX_LENGTH}
                rte={{
                  locales: locales,
                  defaultValue:
                    fields.technicalRequirementsRTEState.initialValue,
                  isFormDirty: form.dirty,
                }}
              />

              <TextArea
                {...getInputProps(fields.furtherTechnicalRequirements, {
                  type: "text",
                })}
                key="furtherTechnicalRequirements"
                id={fields.furtherTechnicalRequirements.id || ""}
                label={
                  locales.route.form.technicalFrame.furtherTechnicalRequirements
                    .label
                }
                errorMessage={
                  Array.isArray(fields.furtherTechnicalRequirements.errors)
                    ? fields.furtherTechnicalRequirements.errors.join(", ")
                    : undefined
                }
                errorId={fields.furtherTechnicalRequirements.errorId}
                maxLength={FURTHER_TECHNICAL_REQUIREMENTS_MAX_LENGTH}
                rte={{
                  locales: locales,
                  defaultValue:
                    fields.furtherTechnicalRequirementsRTEState.initialValue,
                  isFormDirty: form.dirty,
                }}
              />
            </div>

            <div className="flex flex-col gap-4 @md:p-4 @md:border @md:rounded-lg @md:border-gray-200">
              <h2 className="text-primary text-lg font-semibold mb-0">
                {locales.route.form.spatialSituation.headline}
              </h2>

              <TextArea
                {...getInputProps(fields.roomSituation, { type: "text" })}
                key="roomSituation"
                id={fields.roomSituation.id || ""}
                label={locales.route.form.spatialSituation.roomSituation.label}
                helperText={
                  locales.route.form.spatialSituation.roomSituation.helper
                }
                errorMessage={
                  Array.isArray(fields.roomSituation.errors)
                    ? fields.roomSituation.errors.join(", ")
                    : undefined
                }
                errorId={fields.roomSituation.errorId}
                maxLength={ROOM_SITUATION_MAX_LENGTH}
                rte={{
                  locales: locales,
                  defaultValue: fields.roomSituationRTEState.initialValue,
                  isFormDirty: form.dirty,
                }}
              />

              <TextArea
                {...getInputProps(fields.furtherRoomSituation, {
                  type: "text",
                })}
                key="furtherRoomSituation"
                id={fields.furtherRoomSituation.id || ""}
                label={
                  locales.route.form.spatialSituation.furtherRoomSituation.label
                }
                errorMessage={
                  Array.isArray(fields.furtherRoomSituation.errors)
                    ? fields.furtherRoomSituation.errors.join(", ")
                    : undefined
                }
                errorId={fields.furtherRoomSituation.errorId}
                maxLength={FURTHER_ROOM_SITUATION_MAX_LENGTH}
                rte={{
                  locales: locales,
                  defaultValue:
                    fields.furtherRoomSituationRTEState.initialValue,
                  isFormDirty: form.dirty,
                }}
              />
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

            <div className="flex w-full justify-end">
              <div className="flex shrink w-full @md:max-w-fit @lg:w-auto items-center justify-center @lg:justify-end">
                <Controls>
                  <div className="relative w-full">
                    <Button
                      type="reset"
                      onClick={() => {
                        form.reset();
                      }}
                      variant="outline"
                      fullSize
                      // Don't disable button when js is disabled
                      disabled={isHydrated ? form.dirty === false : false}
                    >
                      {locales.route.form.reset}
                    </Button>
                    <noscript className="absolute top-0">
                      <Button as="link" to="." variant="outline" fullSize>
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
                        ? form.dirty === false ||
                          form.valid === false ||
                          isSubmitting
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
    </>
  );
}

export default Requirements;
