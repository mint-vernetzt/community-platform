import { getFormProps, getInputProps, useForm } from "@conform-to/react-v1";
import { getZodConstraint, parseWithZod } from "@conform-to/zod-v1";
import { Button } from "@mint-vernetzt/components/src/molecules/Button";
import { Chip } from "@mint-vernetzt/components/src/molecules/Chip";
import { Input } from "@mint-vernetzt/components/src/molecules/Input";
import { Controls } from "@mint-vernetzt/components/src/organisms/containers/Controls";
import { Section } from "@mint-vernetzt/components/src/organisms/containers/Section";
import React from "react";
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
import { BackButton } from "~/components-next/BackButton";
import { ConformSelect } from "~/components-next/ConformSelect";
import { TextArea } from "~/components-next/TextArea";
import { detectLanguage } from "~/i18n.server";
import { useUnsavedChangesBlockerWithModal } from "~/lib/hooks/useUnsavedChangesBlockerWithModal";
import { insertParametersIntoLocale } from "~/lib/utils/i18n";
import { invariantResponse } from "~/lib/utils/response";
import { createYoutubeEmbedSchema } from "~/lib/utils/schemas";
import { removeHtmlTags, replaceHtmlEntities } from "~/lib/utils/transformHtml";
import { languageModuleMap } from "~/locales/.server";
import { prismaClient } from "~/prisma.server";
import { redirectWithToast } from "~/toast.server";
import { sanitizeUserHtml } from "~/utils.server";
import { type ProjectDetailsSettingsLocales } from "./details.server";
import {
  getRedirectPathOnProtectedProjectRoute,
  updateFilterVectorOfProject,
} from "./utils.server";

const TARGET_GROUP_ADDITIONS_MAX_LENGTH = 200;
const EXCERPT_MAX_LENGTH = 250;
const IDEA_MAX_LENGTH = 2000;
const GOALS_MAX_LENGTH = 2000;
const IMPLEMENTATION_MAX_LENGTH = 2000;
const FURTHER_DESCRIPTION_MAX_LENGTH = 8000;
const TARGETING_MAX_LENGTH = 800;
const HINTS_MAX_LENGTH = 800;
const VIDEO_SUBLINE_MAX_LENGTH = 80;

const createDetailSchema = (locales: ProjectDetailsSettingsLocales) =>
  z.object({
    disciplines: z.array(z.string().uuid()),
    additionalDisciplines: z.array(z.string().uuid()),
    furtherDisciplines: z.array(z.string().transform((value) => value.trim())),
    participantLimit: z
      .string()
      .optional()
      .transform((value) => {
        if (value === undefined || value === "") {
          return null;
        }
        return value.trim();
      }),
    projectTargetGroups: z.array(z.string().uuid()),
    specialTargetGroups: z.array(z.string().uuid()),
    targetGroupAdditions: z
      .string()
      .max(
        TARGET_GROUP_ADDITIONS_MAX_LENGTH,
        insertParametersIntoLocale(
          locales.route.validation.targetGroupAdditions.max,
          { max: TARGET_GROUP_ADDITIONS_MAX_LENGTH }
        )
      )
      .optional()
      .transform((value) => {
        if (value === undefined || value === "") {
          return null;
        }
        return value.trim();
      }),
    excerpt: z
      .string()
      .max(
        EXCERPT_MAX_LENGTH,
        insertParametersIntoLocale(
          locales.route.validation.targetGroupAdditions.max,
          {
            max: EXCERPT_MAX_LENGTH,
          }
        )
      )
      .optional()
      .transform((value) => {
        if (value === undefined || value === "") {
          return null;
        }
        return value.trim();
      }),
    idea: z
      .string()
      .optional()
      .refine(
        (value) => {
          return (
            replaceHtmlEntities(removeHtmlTags(value || ""), "x").length <=
            IDEA_MAX_LENGTH
          );
        },
        {
          message: insertParametersIntoLocale(
            locales.route.validation.idea.message,
            { max: IDEA_MAX_LENGTH }
          ),
        }
      )
      .transform((value) => {
        if (value === undefined || value === "") {
          return null;
        }
        return value.trim();
      }),
    ideaRTEState: z.string().optional(),
    goals: z
      .string()
      .optional()
      .refine(
        (value) => {
          return (
            replaceHtmlEntities(removeHtmlTags(value || ""), "x").length <=
            GOALS_MAX_LENGTH
          );
        },
        {
          message: insertParametersIntoLocale(
            locales.route.validation.goals.message,
            { max: GOALS_MAX_LENGTH }
          ),
        }
      )
      .transform((value) => {
        if (value === undefined || value === "") {
          return null;
        }
        return value.trim();
      }),
    goalsRTEState: z.string().optional(),
    implementation: z
      .string()
      .optional()
      .refine(
        (value) => {
          return (
            replaceHtmlEntities(removeHtmlTags(value || ""), "x").length <=
            IMPLEMENTATION_MAX_LENGTH
          );
        },
        {
          message: insertParametersIntoLocale(
            locales.route.validation.implementation.message,
            { max: IMPLEMENTATION_MAX_LENGTH }
          ),
        }
      )
      .transform((value) => {
        if (value === undefined || value === "") {
          return null;
        }
        return value.trim();
      }),
    implementationRTEState: z.string().optional(),
    furtherDescription: z
      .string()
      .optional()
      .refine(
        (value) => {
          return (
            replaceHtmlEntities(removeHtmlTags(value || ""), "x").length <=
            FURTHER_DESCRIPTION_MAX_LENGTH
          );
        },
        {
          message: insertParametersIntoLocale(
            locales.route.validation.furtherDescription.message,
            { max: FURTHER_DESCRIPTION_MAX_LENGTH }
          ),
        }
      )
      .transform((value) => {
        if (value === undefined || value === "") {
          return null;
        }
        return value.trim();
      }),
    furtherDescriptionRTEState: z.string().optional(),
    targeting: z
      .string()
      .optional()
      .refine(
        (value) => {
          return (
            replaceHtmlEntities(removeHtmlTags(value || ""), "x").length <=
            TARGETING_MAX_LENGTH
          );
        },
        {
          message: insertParametersIntoLocale(
            locales.route.validation.targeting.message,
            { max: TARGETING_MAX_LENGTH }
          ),
        }
      )
      .transform((value) => {
        if (value === undefined || value === "") {
          return null;
        }
        return value.trim();
      }),
    targetingRTEState: z.string().optional(),
    hints: z
      .string()
      .optional()
      .refine(
        (value) => {
          return (
            replaceHtmlEntities(removeHtmlTags(value || ""), "x").length <=
            HINTS_MAX_LENGTH
          );
        },
        {
          message: insertParametersIntoLocale(
            locales.route.validation.hints.message,
            { max: HINTS_MAX_LENGTH }
          ),
        }
      )
      .transform((value) => {
        if (value === undefined || value === "") {
          return null;
        }
        return value.trim();
      }),
    hintsRTEState: z.string().optional(),
    video: createYoutubeEmbedSchema(locales),
    videoSubline: z
      .string()
      .max(
        VIDEO_SUBLINE_MAX_LENGTH,
        insertParametersIntoLocale(locales.route.validation.videoSubline.max, {
          max: VIDEO_SUBLINE_MAX_LENGTH,
        })
      )
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
  const locales = languageModuleMap[language]["project/$slug/settings/details"];

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
      video: true,
      videoSubline: true,
      hints: true,
      hintsRTEState: true,
      targeting: true,
      targetingRTEState: true,
      furtherDescription: true,
      furtherDescriptionRTEState: true,
      implementation: true,
      implementationRTEState: true,
      goals: true,
      goalsRTEState: true,
      idea: true,
      ideaRTEState: true,
      excerpt: true,
      participantLimit: true,
      furtherDisciplines: true,
      targetGroupAdditions: true,
      disciplines: {
        select: {
          discipline: {
            select: {
              id: true,
              slug: true,
            },
          },
        },
      },
      additionalDisciplines: {
        select: {
          additionalDiscipline: {
            select: {
              id: true,
              slug: true,
            },
          },
        },
      },
      projectTargetGroups: {
        select: {
          projectTargetGroup: {
            select: {
              id: true,
              slug: true,
            },
          },
        },
      },
      specialTargetGroups: {
        select: {
          specialTargetGroup: {
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

  const allDisciplines = await prismaClient.discipline.findMany({
    select: {
      id: true,
      slug: true,
    },
  });

  const allAdditionalDisciplines =
    await prismaClient.additionalDiscipline.findMany({
      select: {
        id: true,
        slug: true,
      },
    });

  const allProjectTargetGroups = await prismaClient.projectTargetGroup.findMany(
    {
      select: {
        id: true,
        slug: true,
      },
    }
  );

  const allSpecialTargetGroups = await prismaClient.specialTargetGroup.findMany(
    {
      select: {
        id: true,
        slug: true,
      },
    }
  );

  const currentTimestamp = Date.now();

  return {
    project,
    allDisciplines,
    allAdditionalDisciplines,
    allProjectTargetGroups,
    allSpecialTargetGroups,
    currentTimestamp,
    locales,
  };
};

export async function action({ request, params }: ActionFunctionArgs) {
  const { authClient } = createAuthClient(request);
  const sessionUser = await getSessionUser(authClient);
  const language = await detectLanguage(request);
  const locales = languageModuleMap[language]["project/$slug/settings/details"];

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
      schema: createDetailSchema(locales),
    });
    return {
      submission: submission.reply(),
    };
  }

  const submission = await parseWithZod(formData, {
    schema: () =>
      createDetailSchema(locales).transform(async (data, ctx) => {
        if (
          data.disciplines.length === 0 &&
          data.additionalDisciplines.length > 0
        ) {
          ctx.addIssue({
            code: "custom",
            message: locales.route.validation.custom.message,
          });
          return z.NEVER;
        }

        const {
          disciplines,
          additionalDisciplines,
          projectTargetGroups,
          specialTargetGroups,
          idea,
          goals,
          implementation,
          furtherDescription,
          targeting,
          hints,
          ...rest
        } = data;

        try {
          await prismaClient.project.update({
            where: {
              slug: params.slug,
            },
            data: {
              ...rest,
              idea: sanitizeUserHtml(idea),
              goals: sanitizeUserHtml(goals),
              implementation: sanitizeUserHtml(implementation),
              furtherDescription: sanitizeUserHtml(furtherDescription),
              targeting: sanitizeUserHtml(targeting),
              hints: sanitizeUserHtml(hints),
              disciplines: {
                deleteMany: {},
                connectOrCreate: disciplines.map((disciplineId: string) => {
                  return {
                    where: {
                      disciplineId_projectId: {
                        disciplineId: disciplineId,
                        projectId: project.id,
                      },
                    },
                    create: {
                      disciplineId,
                    },
                  };
                }),
              },
              additionalDisciplines: {
                deleteMany: {},
                connectOrCreate: additionalDisciplines.map(
                  (additionalDisciplineId: string) => {
                    return {
                      where: {
                        additionalDisciplineId_projectId: {
                          additionalDisciplineId: additionalDisciplineId,
                          projectId: project.id,
                        },
                      },
                      create: {
                        additionalDisciplineId,
                      },
                    };
                  }
                ),
              },
              projectTargetGroups: {
                deleteMany: {},
                connectOrCreate: projectTargetGroups.map(
                  (projectTargetGroupId: string) => {
                    return {
                      where: {
                        projectTargetGroupId_projectId: {
                          projectTargetGroupId: projectTargetGroupId,
                          projectId: project.id,
                        },
                      },
                      create: {
                        projectTargetGroupId: projectTargetGroupId,
                      },
                    };
                  }
                ),
              },
              specialTargetGroups: {
                deleteMany: {},
                connectOrCreate: specialTargetGroups.map(
                  (specialTargetGroupId: string) => {
                    return {
                      where: {
                        specialTargetGroupId_projectId: {
                          specialTargetGroupId: specialTargetGroupId,
                          projectId: project.id,
                        },
                      },
                      create: {
                        specialTargetGroupId,
                      },
                    };
                  }
                ),
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

  if (submission.status !== "success") {
    return {
      submission: submission.reply(),
      currentTimestamp: Date.now(),
    };
  }

  return redirectWithToast(request.url, {
    id: "update-details-toast",
    key: `${new Date().getTime()}`,
    message: locales.route.content.feedback,
  });
}

function Details() {
  const location = useLocation();
  const isHydrated = useHydrated();
  const navigation = useNavigation();
  const loaderData = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const {
    project,
    allDisciplines,
    allAdditionalDisciplines,
    allProjectTargetGroups,
    allSpecialTargetGroups,
    locales,
  } = loaderData;

  const {
    disciplines,
    additionalDisciplines,
    projectTargetGroups,
    specialTargetGroups,
    ...rest
  } = project;

  const defaultValues = {
    ...rest,
    disciplines: disciplines.map((relation) => relation.discipline.id),
    additionalDisciplines: additionalDisciplines.map(
      (relation) => relation.additionalDiscipline.id
    ),
    projectTargetGroups: projectTargetGroups.map(
      (relation) => relation.projectTargetGroup.id
    ),
    specialTargetGroups: specialTargetGroups.map(
      (relation) => relation.specialTargetGroup.id
    ),
  };

  const [form, fields] = useForm({
    id: `details-form-${
      actionData?.currentTimestamp || loaderData.currentTimestamp
    }`,
    constraint: getZodConstraint(createDetailSchema(locales)),
    defaultValue: defaultValues,
    shouldValidate: "onInput",
    shouldRevalidate: "onInput",
    lastResult: navigation.state === "idle" ? actionData?.submission : null,
    onValidate({ formData }) {
      setFurtherDiscipline("");
      return parseWithZod(formData, {
        schema: () =>
          createDetailSchema(locales).transform((data, ctx) => {
            if (
              data.disciplines.length === 0 &&
              data.additionalDisciplines.length > 0
            ) {
              ctx.addIssue({
                code: "custom",
                message: locales.route.validation.custom.message,
              });
              return z.NEVER;
            }
            return { ...data };
          }),
      });
    },
  });

  const disciplineFieldList = fields.disciplines.getFieldList();
  let additionalDisciplineFieldList =
    fields.additionalDisciplines.getFieldList();
  const furtherDisciplinesFieldList = fields.furtherDisciplines.getFieldList();
  const targetGroupFieldList = fields.projectTargetGroups.getFieldList();
  const specialTargetGroupFieldList = fields.specialTargetGroups.getFieldList();

  const UnsavedChangesBlockerModal = useUnsavedChangesBlockerWithModal({
    searchParam: "modal-unsaved-changes",
    formMetadataToCheck: form,
    locales,
  });

  const hasDisciplines = disciplineFieldList.length > 0;
  if (hasDisciplines === false) {
    additionalDisciplineFieldList = [];
  }
  const [furtherDiscipline, setFurtherDiscipline] = React.useState<string>("");
  const handleFurtherDisciplineInputChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFurtherDiscipline(event.currentTarget.value);
  };

  return (
    <Section>
      {UnsavedChangesBlockerModal}
      <BackButton to={location.pathname}>
        {locales.route.content.back}
      </BackButton>
      <p className="mv-my-6 @md:mv-mt-0">{locales.route.content.description}</p>
      <Form
        {...getFormProps(form)}
        method="post"
        preventScrollReset
        autoComplete="off"
      >
        {/* This button ensures submission via enter key. Always use a hidden button at top of the form when other submit buttons are inside it (f.e. the add/remove list buttons) */}
        <button type="submit" hidden />
        <div className="mv-flex mv-flex-col mv-gap-6 @md:mv-gap-4">
          <div className="mv-flex mv-flex-col mv-gap-4 @md:mv-p-4 @md:mv-border @md:mv-rounded-lg @md:mv-border-gray-200">
            <h2 className="mv-text-primary mv-text-lg mv-font-semibold mv-mb-0">
              {locales.route.content.disciplines.headline}
            </h2>

            <ConformSelect
              id={fields.disciplines.id}
              cta={locales.route.content.disciplines.choose}
            >
              <ConformSelect.Label htmlFor={fields.disciplines.id}>
                {locales.route.content.disciplines.intro}
              </ConformSelect.Label>
              {typeof fields.disciplines.errors !== "undefined" &&
              fields.disciplines.errors.length > 0 ? (
                fields.disciplines.errors.map((error) => (
                  <ConformSelect.Error
                    id={fields.disciplines.errorId}
                    key={error}
                  >
                    {error}
                  </ConformSelect.Error>
                ))
              ) : (
                <ConformSelect.HelperText>
                  {locales.route.content.disciplines.helper}
                </ConformSelect.HelperText>
              )}
              {allDisciplines
                .filter((discipline) => {
                  return !disciplineFieldList.some((listDiscipline) => {
                    return listDiscipline.initialValue === discipline.id;
                  });
                })
                .map((discipline) => {
                  let title;
                  if (discipline.slug in locales.disciplines) {
                    type LocaleKey = keyof typeof locales.disciplines;
                    title =
                      locales.disciplines[discipline.slug as LocaleKey].title;
                  } else {
                    console.error(
                      `Discipline ${discipline.slug} not found in locales`
                    );
                    title = discipline.slug;
                  }
                  return (
                    <button
                      key={discipline.id}
                      {...form.insert.getButtonProps({
                        name: fields.disciplines.name,
                        defaultValue: discipline.id,
                      })}
                      className="mv-text-start mv-w-full mv-py-1 mv-px-2"
                    >
                      {title}
                    </button>
                  );
                })}
            </ConformSelect>
            {disciplineFieldList.length > 0 && (
              <Chip.Container>
                {disciplineFieldList.map((listDiscipline, index) => {
                  const disciplineSlug = allDisciplines.find((discipline) => {
                    return discipline.id === listDiscipline.initialValue;
                  })?.slug;
                  let title;
                  if (disciplineSlug === undefined) {
                    console.error(
                      `Discipline with id ${listDiscipline.id} not found in allDisciplines`
                    );
                    title = null;
                  } else {
                    if (disciplineSlug in locales.disciplines) {
                      type LocaleKey = keyof typeof locales.disciplines;
                      title =
                        locales.disciplines[disciplineSlug as LocaleKey].title;
                    } else {
                      console.error(
                        `Discipline ${disciplineSlug} not found in locales`
                      );
                      title = disciplineSlug;
                    }
                  }
                  return (
                    <Chip key={listDiscipline.key}>
                      {title || locales.route.error.notFound}
                      <input
                        {...getInputProps(listDiscipline, { type: "hidden" })}
                        key={listDiscipline.id}
                      />
                      <Chip.Delete>
                        <button
                          {...form.remove.getButtonProps({
                            name: fields.disciplines.name,
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
              id={fields.additionalDisciplines.id}
              cta={locales.route.content.additionalDisciplines.choose}
              disabled={hasDisciplines === false}
            >
              <ConformSelect.Label htmlFor={fields.additionalDisciplines.id}>
                <span
                  className={
                    hasDisciplines === false ? "mv-text-neutral-300" : ""
                  }
                >
                  {locales.route.content.additionalDisciplines.headline}
                </span>
              </ConformSelect.Label>
              {typeof fields.additionalDisciplines.errors !== "undefined" &&
              fields.additionalDisciplines.errors.length > 0 ? (
                fields.additionalDisciplines.errors.map((error) => (
                  <ConformSelect.Error
                    id={fields.additionalDisciplines.errorId}
                    key={error}
                  >
                    {error}
                  </ConformSelect.Error>
                ))
              ) : (
                <ConformSelect.HelperText>
                  <span
                    className={
                      hasDisciplines === false ? "mv-text-neutral-300" : ""
                    }
                  >
                    {hasDisciplines === false
                      ? locales.route.content.additionalDisciplines
                          .helperWithoutDisciplines
                      : locales.route.content.additionalDisciplines.helper}
                  </span>
                </ConformSelect.HelperText>
              )}
              {allAdditionalDisciplines
                .filter((additionalDiscipline) => {
                  return !additionalDisciplineFieldList.some(
                    (listAdditionalDiscipline) => {
                      return (
                        listAdditionalDiscipline.initialValue ===
                        additionalDiscipline.id
                      );
                    }
                  );
                })
                .map((filteredAdditionalDiscipline) => {
                  let title;
                  if (
                    filteredAdditionalDiscipline.slug in
                    locales.additionalDisciplines
                  ) {
                    type LocaleKey = keyof typeof locales.additionalDisciplines;
                    title =
                      locales.additionalDisciplines[
                        filteredAdditionalDiscipline.slug as LocaleKey
                      ].title;
                  } else {
                    console.error(
                      `Additional discipline ${filteredAdditionalDiscipline.slug} not found in locales`
                    );
                    title = filteredAdditionalDiscipline.slug;
                  }
                  return (
                    <button
                      key={filteredAdditionalDiscipline.id}
                      {...form.insert.getButtonProps({
                        name: fields.additionalDisciplines.name,
                        defaultValue: filteredAdditionalDiscipline.id,
                      })}
                      disabled={hasDisciplines === false}
                      className="mv-text-start mv-w-full mv-py-1 mv-px-2"
                    >
                      {title}
                    </button>
                  );
                })}
            </ConformSelect>
            {additionalDisciplineFieldList.length > 0 && (
              <Chip.Container>
                {additionalDisciplineFieldList.map(
                  (listAdditionalDiscipline, index) => {
                    const disciplineSlug = allAdditionalDisciplines.find(
                      (discipline) => {
                        return (
                          discipline.id ===
                          listAdditionalDiscipline.initialValue
                        );
                      }
                    )?.slug;
                    let title;
                    if (disciplineSlug === undefined) {
                      console.error(
                        `Additional discipline with id ${listAdditionalDiscipline.id} not found in allAdditionalDisciplines`
                      );
                      title = null;
                    } else {
                      if (disciplineSlug in locales.additionalDisciplines) {
                        type LocaleKey =
                          keyof typeof locales.additionalDisciplines;
                        title =
                          locales.additionalDisciplines[
                            disciplineSlug as LocaleKey
                          ].title;
                      } else {
                        console.error(
                          `Additional Discipline ${disciplineSlug} not found in locales`
                        );
                        title = disciplineSlug;
                      }
                    }
                    return (
                      <Chip key={listAdditionalDiscipline.key}>
                        {title || locales.route.error.notFound}
                        <input
                          {...getInputProps(listAdditionalDiscipline, {
                            type: "hidden",
                          })}
                          key={listAdditionalDiscipline.id}
                        />
                        <Chip.Delete>
                          <button
                            {...form.remove.getButtonProps({
                              name: fields.additionalDisciplines.name,
                              index,
                            })}
                          />
                        </Chip.Delete>
                      </Chip>
                    );
                  }
                )}
              </Chip.Container>
            )}
            {isHydrated === true ? (
              <>
                <div className="mv-flex mv-flex-row mv-gap-4 mv-items-center">
                  <Input
                    value={furtherDiscipline}
                    onChange={handleFurtherDisciplineInputChange}
                  >
                    <Input.Label htmlFor={fields.furtherDisciplines.id}>
                      {locales.route.content.furtherDisciplines.headline}
                    </Input.Label>
                    <Input.HelperText>
                      {locales.route.content.furtherDisciplines.helper}
                    </Input.HelperText>
                    {typeof fields.furtherDisciplines.errors !== "undefined" &&
                    fields.furtherDisciplines.errors.length > 0
                      ? fields.furtherDisciplines.errors.map((error) => (
                          <Input.Error
                            id={fields.furtherDisciplines.errorId}
                            key={error}
                          >
                            {error}
                          </Input.Error>
                        ))
                      : null}
                    <Input.Controls>
                      <Button
                        variant="ghost"
                        disabled={furtherDiscipline === ""}
                        {...form.insert.getButtonProps({
                          name: fields.furtherDisciplines.name,
                          defaultValue: furtherDiscipline,
                        })}
                      >
                        {locales.route.content.furtherDisciplines.choose}
                      </Button>
                    </Input.Controls>
                  </Input>
                </div>
                {furtherDisciplinesFieldList.length > 0 && (
                  <Chip.Container>
                    {furtherDisciplinesFieldList.map((field, index) => {
                      return (
                        <Chip key={field.key}>
                          <input
                            {...getInputProps(field, { type: "hidden" })}
                            key={field.id}
                          />
                          {field.initialValue || "Not Found"}
                          <Chip.Delete>
                            <button
                              {...form.remove.getButtonProps({
                                name: fields.furtherDisciplines.name,
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
                <Input.Label htmlFor={fields.furtherDisciplines.id}>
                  {locales.route.content.furtherDisciplines.headline}
                </Input.Label>
                <Chip.Container>
                  {furtherDisciplinesFieldList.map((field, index) => {
                    return (
                      <Chip key={field.key}>
                        <input
                          {...getInputProps(field, { type: "text" })}
                          key={field.id}
                          className="mv-pl-1"
                        />

                        <Chip.Delete>
                          <button
                            {...form.remove.getButtonProps({
                              name: fields.furtherDisciplines.name,
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
                        name: fields.furtherDisciplines.name,
                      })}
                    >
                      {locales.route.content.furtherDisciplines.choose}
                    </button>
                  </Chip>
                </Chip.Container>
                <Input.HelperText>
                  {locales.route.content.furtherDisciplines.helper}
                </Input.HelperText>
                {typeof fields.furtherDisciplines.errors !== "undefined" &&
                fields.furtherDisciplines.errors.length > 0
                  ? fields.furtherDisciplines.errors.map((error) => (
                      <Input.Error
                        id={fields.furtherDisciplines.errorId}
                        key={error}
                      >
                        {error}
                      </Input.Error>
                    ))
                  : null}
              </>
            )}
          </div>

          <div className="mv-flex mv-flex-col mv-gap-4 @md:mv-p-4 @md:mv-border @md:mv-rounded-lg @md:mv-border-gray-200">
            <h2 className="mv-text-primary mv-text-lg mv-font-semibold mv-mb-0">
              {locales.route.content.participants.headline}
            </h2>

            <Input
              {...getInputProps(fields.participantLimit, { type: "text" })}
              key="participantLimit"
            >
              <Input.Label htmlFor={fields.participantLimit.id}>
                {locales.route.content.participants.intro}
              </Input.Label>
              {typeof fields.participantLimit.errors !== "undefined" && (
                <Input.Error>{fields.participantLimit.errors}</Input.Error>
              )}
              <Input.HelperText>
                {locales.route.content.participants.helper}
              </Input.HelperText>
              {typeof fields.participantLimit.errors !== "undefined" &&
              fields.participantLimit.errors.length > 0
                ? fields.participantLimit.errors.map((error) => (
                    <Input.Error
                      id={fields.participantLimit.errorId}
                      key={error}
                    >
                      {error}
                    </Input.Error>
                  ))
                : null}
            </Input>

            <ConformSelect
              id={fields.projectTargetGroups.id}
              cta={locales.route.content.projectTargetGroups.choose}
            >
              <ConformSelect.Label htmlFor={fields.projectTargetGroups.id}>
                {locales.route.content.projectTargetGroups.intro}
              </ConformSelect.Label>
              {typeof fields.projectTargetGroups.errors !== "undefined" &&
              fields.projectTargetGroups.errors.length > 0 ? (
                fields.projectTargetGroups.errors.map((error) => (
                  <ConformSelect.Error
                    id={fields.projectTargetGroups.errorId}
                    key={error}
                  >
                    {error}
                  </ConformSelect.Error>
                ))
              ) : (
                <ConformSelect.HelperText>
                  {locales.route.content.projectTargetGroups.helper}
                </ConformSelect.HelperText>
              )}
              {allProjectTargetGroups
                .filter((targetGroup) => {
                  return !targetGroupFieldList.some((listTargetGroup) => {
                    return listTargetGroup.initialValue === targetGroup.id;
                  });
                })
                .map((filteredTargetGroup) => {
                  let title;
                  if (filteredTargetGroup.slug in locales.projectTargetGroups) {
                    type LocaleKey = keyof typeof locales.projectTargetGroups;
                    title =
                      locales.projectTargetGroups[
                        filteredTargetGroup.slug as LocaleKey
                      ].title;
                  } else {
                    console.error(
                      `Project target group ${filteredTargetGroup.slug} not found in locales`
                    );
                    title = filteredTargetGroup.slug;
                  }
                  return (
                    <button
                      key={filteredTargetGroup.id}
                      {...form.insert.getButtonProps({
                        name: fields.projectTargetGroups.name,
                        defaultValue: filteredTargetGroup.id,
                      })}
                      className="mv-text-start mv-w-full mv-py-1 mv-px-2"
                    >
                      {title}
                    </button>
                  );
                })}
            </ConformSelect>
            {targetGroupFieldList.length > 0 && (
              <Chip.Container>
                {targetGroupFieldList.map((listTargetGroup, index) => {
                  const targetGroupSlug = allProjectTargetGroups.find(
                    (targetGroup) => {
                      return targetGroup.id === listTargetGroup.initialValue;
                    }
                  )?.slug;
                  let title;
                  if (targetGroupSlug === undefined) {
                    console.error(
                      `Project target group with id ${listTargetGroup.id} not found in allAdditionalDisciplines`
                    );
                    title = null;
                  } else {
                    if (targetGroupSlug in locales.projectTargetGroups) {
                      type LocaleKey = keyof typeof locales.projectTargetGroups;
                      title =
                        locales.projectTargetGroups[
                          targetGroupSlug as LocaleKey
                        ].title;
                    } else {
                      console.error(
                        `Project target group ${targetGroupSlug} not found in locales`
                      );
                      title = targetGroupSlug;
                    }
                  }
                  return (
                    <Chip key={listTargetGroup.key}>
                      {title || locales.route.error.notFound}
                      <input
                        {...getInputProps(listTargetGroup, { type: "hidden" })}
                        key={listTargetGroup.id}
                      />
                      <Chip.Delete>
                        <button
                          {...form.remove.getButtonProps({
                            name: fields.projectTargetGroups.name,
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
              id={fields.specialTargetGroups.id}
              cta={locales.route.content.specialTargetGroups.choose}
            >
              <ConformSelect.Label htmlFor={fields.specialTargetGroups.id}>
                {locales.route.content.specialTargetGroups.intro}
              </ConformSelect.Label>
              {typeof fields.specialTargetGroups.errors !== "undefined" &&
              fields.specialTargetGroups.errors.length > 0 ? (
                fields.specialTargetGroups.errors.map((error) => (
                  <ConformSelect.Error
                    id={fields.specialTargetGroups.errorId}
                    key={error}
                  >
                    {error}
                  </ConformSelect.Error>
                ))
              ) : (
                <ConformSelect.HelperText>
                  {locales.route.content.specialTargetGroups.helper}
                </ConformSelect.HelperText>
              )}
              {allSpecialTargetGroups
                .filter((specialTargetGroup) => {
                  return !specialTargetGroupFieldList.some(
                    (listSpecialTargetGroup) => {
                      return (
                        listSpecialTargetGroup.initialValue ===
                        specialTargetGroup.id
                      );
                    }
                  );
                })
                .map((filteredSpecialTargetGroup) => {
                  let title;
                  if (
                    filteredSpecialTargetGroup.slug in
                    locales.specialTargetGroups
                  ) {
                    type LocaleKey = keyof typeof locales.specialTargetGroups;
                    title =
                      locales.specialTargetGroups[
                        filteredSpecialTargetGroup.slug as LocaleKey
                      ].title;
                  } else {
                    console.error(
                      `Special target group ${filteredSpecialTargetGroup.slug} not found in locales`
                    );
                    title = filteredSpecialTargetGroup.slug;
                  }
                  return (
                    <button
                      key={filteredSpecialTargetGroup.id}
                      {...form.insert.getButtonProps({
                        name: fields.specialTargetGroups.name,
                        defaultValue: filteredSpecialTargetGroup.id,
                      })}
                      className="mv-text-start mv-w-full mv-py-1 mv-px-2"
                    >
                      {title}
                    </button>
                  );
                })}
            </ConformSelect>
            {specialTargetGroupFieldList.length > 0 && (
              <Chip.Container>
                {specialTargetGroupFieldList.map(
                  (listSpecialTargetGroup, index) => {
                    const specialTargetGroupSlug = allSpecialTargetGroups.find(
                      (specialTargetGroup) => {
                        return (
                          specialTargetGroup.id ===
                          listSpecialTargetGroup.initialValue
                        );
                      }
                    )?.slug;
                    let title;
                    if (specialTargetGroupSlug === undefined) {
                      console.error(
                        `Special target group with id ${listSpecialTargetGroup.id} not found in allAdditionalDisciplines`
                      );
                      title = null;
                    } else {
                      if (
                        specialTargetGroupSlug in locales.specialTargetGroups
                      ) {
                        type LocaleKey =
                          keyof typeof locales.specialTargetGroups;
                        title =
                          locales.specialTargetGroups[
                            specialTargetGroupSlug as LocaleKey
                          ].title;
                      } else {
                        console.error(
                          `Special target group ${specialTargetGroupSlug} not found in locales`
                        );
                        title = specialTargetGroupSlug;
                      }
                    }
                    return (
                      <Chip key={listSpecialTargetGroup.key}>
                        {title || locales.route.error.notFound}
                        <input
                          {...getInputProps(listSpecialTargetGroup, {
                            type: "hidden",
                          })}
                          key={listSpecialTargetGroup.id}
                        />
                        <Chip.Delete>
                          <button
                            {...form.remove.getButtonProps({
                              name: fields.specialTargetGroups.name,
                              index,
                            })}
                          />
                        </Chip.Delete>
                      </Chip>
                    );
                  }
                )}
              </Chip.Container>
            )}

            <Input
              {...getInputProps(fields.targetGroupAdditions, { type: "text" })}
              key="targetGroupAdditions"
              maxLength={TARGET_GROUP_ADDITIONS_MAX_LENGTH}
            >
              <Input.Label htmlFor={fields.targetGroupAdditions.id}>
                {locales.route.content.targetGroupAdditions.more}
              </Input.Label>
              {typeof fields.targetGroupAdditions.errors !== "undefined" &&
              fields.targetGroupAdditions.errors.length > 0
                ? fields.targetGroupAdditions.errors.map((error) => (
                    <Input.Error
                      id={fields.targetGroupAdditions.errorId}
                      key={error}
                    >
                      {error}
                    </Input.Error>
                  ))
                : null}
            </Input>
          </div>

          <div className="mv-flex mv-flex-col mv-gap-4 @md:mv-p-4 @md:mv-border @md:mv-rounded-lg @md:mv-border-gray-200">
            <h2 className="mv-text-primary mv-text-lg mv-font-semibold mv-mb-0">
              {locales.route.content.shortDescription.headline}
            </h2>
            <p>{locales.route.content.shortDescription.intro}</p>

            <Input
              {...getInputProps(fields.excerpt, { type: "text" })}
              key="excerpt"
              maxLength={EXCERPT_MAX_LENGTH}
            >
              <Input.Label htmlFor={fields.excerpt.id}>
                {locales.route.content.shortDescription.label}
              </Input.Label>
              {typeof fields.excerpt.errors !== "undefined" &&
              fields.excerpt.errors.length > 0
                ? fields.excerpt.errors.map((error) => (
                    <Input.Error id={fields.excerpt.errorId} key={error}>
                      {error}
                    </Input.Error>
                  ))
                : null}
            </Input>
          </div>

          <div className="mv-flex mv-flex-col mv-gap-4 @md:mv-p-4 @md:mv-border @md:mv-rounded-lg @md:mv-border-gray-200">
            <h2 className="mv-text-primary mv-text-lg mv-font-semibold mv-mb-0">
              {locales.route.content.extendedDescription.headline}
            </h2>

            <p>{locales.route.content.extendedDescription.intro}</p>

            <TextArea
              {...getInputProps(fields.idea, { type: "text" })}
              key="idea"
              id={fields.idea.id || ""}
              label={locales.route.content.extendedDescription.idea.label}
              helperText={locales.route.content.extendedDescription.idea.helper}
              errorMessage={
                Array.isArray(fields.idea.errors)
                  ? fields.idea.errors.join(", ")
                  : undefined
              }
              errorId={fields.idea.errorId}
              maxLength={IDEA_MAX_LENGTH}
              rte={{
                locales: locales,
                defaultValue: fields.ideaRTEState.initialValue,
              }}
            />

            <TextArea
              {...getInputProps(fields.goals, { type: "text" })}
              key="goals"
              id={fields.goals.id || ""}
              label={locales.route.content.extendedDescription.goals.label}
              helperText={
                locales.route.content.extendedDescription.goals.helper
              }
              errorMessage={
                Array.isArray(fields.goals.errors)
                  ? fields.goals.errors.join(", ")
                  : undefined
              }
              errorId={fields.goals.errorId}
              maxLength={GOALS_MAX_LENGTH}
              rte={{
                locales: locales,
                defaultValue: fields.goalsRTEState.initialValue,
              }}
            />

            <TextArea
              {...getInputProps(fields.implementation, { type: "text" })}
              key="implementation"
              id={fields.implementation.id || ""}
              label={
                locales.route.content.extendedDescription.implementation.label
              }
              helperText={
                locales.route.content.extendedDescription.implementation.helper
              }
              errorMessage={
                Array.isArray(fields.implementation.errors)
                  ? fields.implementation.errors.join(", ")
                  : undefined
              }
              errorId={fields.implementation.errorId}
              maxLength={IMPLEMENTATION_MAX_LENGTH}
              rte={{
                locales: locales,
                defaultValue: fields.implementationRTEState.initialValue,
              }}
            />

            <TextArea
              {...getInputProps(fields.furtherDescription, { type: "text" })}
              key="furtherDescription"
              id={fields.furtherDescription.id || ""}
              label={
                locales.route.content.extendedDescription.furtherDescription
                  .label
              }
              helperText={
                locales.route.content.extendedDescription.furtherDescription
                  .helper
              }
              errorMessage={
                Array.isArray(fields.furtherDescription.errors)
                  ? fields.furtherDescription.errors.join(", ")
                  : undefined
              }
              errorId={fields.furtherDescription.errorId}
              maxLength={FURTHER_DESCRIPTION_MAX_LENGTH}
              rte={{
                locales: locales,
                defaultValue: fields.furtherDescriptionRTEState.initialValue,
              }}
            />

            <TextArea
              {...getInputProps(fields.targeting, { type: "text" })}
              key="targeting"
              id={fields.targeting.id || ""}
              label={locales.route.content.extendedDescription.targeting.label}
              helperText={
                locales.route.content.extendedDescription.targeting.helper
              }
              errorMessage={
                Array.isArray(fields.targeting.errors)
                  ? fields.targeting.errors.join(", ")
                  : undefined
              }
              errorId={fields.targeting.errorId}
              maxLength={TARGETING_MAX_LENGTH}
              rte={{
                locales: locales,
                defaultValue: fields.targetingRTEState.initialValue,
              }}
            />

            <TextArea
              {...getInputProps(fields.hints, { type: "text" })}
              key="hints"
              id={fields.hints.id || ""}
              label={locales.route.content.extendedDescription.hints.label}
              helperText={
                locales.route.content.extendedDescription.hints.helper
              }
              errorMessage={
                Array.isArray(fields.hints.errors)
                  ? fields.hints.errors.join(", ")
                  : undefined
              }
              errorId={fields.hints.errorId}
              maxLength={HINTS_MAX_LENGTH}
              rte={{
                locales: locales,
                defaultValue: fields.hintsRTEState.initialValue,
              }}
            />
          </div>

          <div className="mv-flex mv-flex-col mv-gap-4 @md:mv-p-4 @md:mv-border @md:mv-rounded-lg @md:mv-border-gray-200">
            <h2 className="mv-text-primary mv-text-lg mv-font-semibold mv-mb-0">
              {locales.route.content.video.headline}
            </h2>

            <Input
              {...getInputProps(fields.video, { type: "text" })}
              key="video"
              placeholder="youtube.com/watch?v=<videoCode>"
            >
              <Input.Label htmlFor={fields.video.id}>
                {locales.route.content.video.video.label}
              </Input.Label>
              <Input.HelperText>
                {locales.route.content.video.video.helper}
              </Input.HelperText>
              {typeof fields.video.errors !== "undefined" &&
              fields.video.errors.length > 0
                ? fields.video.errors.map((error) => (
                    <Input.Error id={fields.video.errorId} key={error}>
                      {error}
                    </Input.Error>
                  ))
                : null}
            </Input>

            <Input
              {...getInputProps(fields.videoSubline, { type: "text" })}
              key="videoSubline"
              maxLength={VIDEO_SUBLINE_MAX_LENGTH}
            >
              <Input.Label htmlFor={fields.videoSubline.id}>
                {locales.route.content.video.videoSubline.label}
              </Input.Label>
              {typeof fields.videoSubline.errors !== "undefined" &&
              fields.videoSubline.errors.length > 0
                ? fields.videoSubline.errors.map((error) => (
                    <Input.Error id={fields.videoSubline.errorId} key={error}>
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
                    className="mv-text-sm mv-font-semibold mv-text-negative-600"
                  >
                    {error}
                  </div>
                );
              })}
            </div>
          ) : null}
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
                    <Button as="a" href="./details" variant="outline" fullSize>
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

export default Details;
