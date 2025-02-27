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
import { TextArea } from "~/components-next/TextArea";
import { invariantResponse } from "~/lib/utils/response";
import { removeHtmlTags, replaceHtmlEntities } from "~/lib/utils/transformHtml";
import { sanitizeUserHtml } from "~/utils.server";
import { createYoutubeEmbedSchema } from "~/lib/utils/schemas";
import { prismaClient } from "~/prisma.server";
import { redirectWithToast } from "~/toast.server";
import { BackButton } from "~/components-next/BackButton";
import { ConformSelect } from "~/components-next/ConformSelect";
import {
  getRedirectPathOnProtectedProjectRoute,
  getHash,
  updateFilterVectorOfProject,
} from "./utils.server";
import { detectLanguage } from "~/i18n.server";
import { Section } from "@mint-vernetzt/components/src/organisms/containers/Section";
import { Chip } from "@mint-vernetzt/components/src/molecules/Chip";
import { Input } from "@mint-vernetzt/components/src/molecules/Input";
import { Button } from "@mint-vernetzt/components/src/molecules/Button";
import { Controls } from "@mint-vernetzt/components/src/organisms/containers/Controls";
import { Alert } from "@mint-vernetzt/components/src/molecules/Alert";
import { type ProjectDetailsSettingsLocales } from "./details.server";
import { languageModuleMap } from "~/locales/.server";
import { insertParametersIntoLocale } from "~/lib/utils/i18n";

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
      video: true,
      videoSubline: true,
      hints: true,
      targeting: true,
      furtherDescription: true,
      implementation: true,
      goals: true,
      idea: true,
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

  return {
    project,
    allDisciplines,
    allAdditionalDisciplines,
    allProjectTargetGroups,
    allSpecialTargetGroups,
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
  const detailsSchema = createDetailSchema(locales);

  const submission = await parse(formData, {
    schema: (intent) =>
      detailsSchema.transform(async (data, ctx) => {
        if (intent !== "submit") return { ...data };

        if (
          data.disciplines.length === 0 &&
          data.additionalDisciplines.length > 0
        ) {
          ctx.addIssue({
            code: "custom",
            // TODO: Investigate why auto scroll to error is not working on lists
            // Its working if you map this error to a normal input (f.e. path: ["excerpt"])
            // Current workarround is to show an alert below the save button
            path: ["additionalDisciplines"],
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

  const hash = getHash(submission);

  if (submission.intent !== "submit") {
    return { status: "idle", submission, hash };
  }
  if (!submission.value) {
    return { status: "error", submission, hash };
  }

  return redirectWithToast(request.url, {
    id: "change-project-details-toast",
    key: hash,
    message: locales.route.content.feedback,
  });
}

function Details() {
  const location = useLocation();
  const loaderData = useLoaderData<typeof loader>();
  const {
    project,
    allDisciplines,
    allAdditionalDisciplines,
    allProjectTargetGroups,
    allSpecialTargetGroups,
    locales,
  } = loaderData;
  const actionData = useActionData<typeof action>();
  const formId = "details-form";

  const detailsSchema = createDetailSchema(locales);
  const [form, fields] = useForm({
    id: formId,
    constraint: getFieldsetConstraint(detailsSchema),
    defaultValue: {
      // TODO: On old conform version null values are not converted to undefined -> use conform v1
      participantLimit: project.participantLimit || undefined,
      video: project.video || undefined,
      furtherDisciplines: project.furtherDisciplines || undefined,
      targetGroupAdditions: project.targetGroupAdditions || undefined,
      excerpt: project.excerpt || undefined,
      idea: project.idea || undefined,
      goals: project.goals || undefined,
      implementation: project.implementation || undefined,
      furtherDescription: project.furtherDescription || undefined,
      targeting: project.targeting || undefined,
      hints: project.hints || undefined,
      videoSubline: project.videoSubline || undefined,
      disciplines: project.disciplines.map(
        (relation) => relation.discipline.id
      ),
      additionalDisciplines: project.additionalDisciplines.map(
        (relation) => relation.additionalDiscipline.id
      ),
      projectTargetGroups: project.projectTargetGroups.map(
        (relation) => relation.projectTargetGroup.id
      ),
      specialTargetGroups: project.specialTargetGroups.map(
        (relation) => relation.specialTargetGroup.id
      ),
    },
    lastSubmission: actionData?.submission,
    shouldValidate: "onSubmit",
    shouldRevalidate: "onInput",
    onValidate({ formData }) {
      return parse(formData, {
        schema: (intent) =>
          detailsSchema.transform((data, ctx) => {
            if (intent !== "submit") return { ...data };

            if (
              data.disciplines.length === 0 &&
              data.additionalDisciplines.length > 0
            ) {
              ctx.addIssue({
                code: "custom",
                // TODO: Investigate why auto scroll to error is not working on lists
                // Its working if you map this error to a normal input (f.e. path: ["excerpt"])
                path: ["additionalDisciplines"],
                message: locales.route.validation.custom.message,
              });
              return z.NEVER;
            }
            return { ...data };
          }),
      });
    },
  });

  const disciplineList = useFieldList(form.ref, fields.disciplines);
  const additionalDisciplineList = useFieldList(
    form.ref,
    fields.additionalDisciplines
  );
  const furtherDisciplinesList = useFieldList(
    form.ref,
    fields.furtherDisciplines
  );
  const targetGroupList = useFieldList(form.ref, fields.projectTargetGroups);
  const specialTargetGroupList = useFieldList(
    form.ref,
    fields.specialTargetGroups
  );

  const [furtherDiscipline, setFurtherDiscipline] = React.useState<string>("");
  const handleFurtherDisciplineInputChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFurtherDiscipline(event.currentTarget.value);
  };
  const [isDirty, setIsDirty] = React.useState(false);
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      isDirty && currentLocation.pathname !== nextLocation.pathname
  );
  if (blocker.state === "blocked") {
    const confirmed = confirm(locales.route.content.nonPersistent);
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

  // AKI stop
  return (
    <Section>
      <BackButton to={location.pathname}>
        {locales.route.content.back}
      </BackButton>
      <p className="mv-my-6 @md:mv-mt-0">{locales.route.content.description}</p>
      <Form
        method="post"
        {...form.props}
        onChange={(event) => {
          // On RTE the onChange is called during first render
          // That breaks our logic that the form is dirty when it got changed
          // Therefore we check textarea elements specifically
          // TODO: How can we get arround this assertions?
          const input = event.target as HTMLInputElement;
          if (
            input.type === "textarea" &&
            input.value === project[input.name as keyof typeof project]
          ) {
            setIsDirty(false);
          } else {
            setIsDirty(true);
          }
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
              <ConformSelect.HelperText>
                {locales.route.content.disciplines.helper}
              </ConformSelect.HelperText>
              {allDisciplines
                .filter((discipline) => {
                  return !disciplineList.some((listDiscipline) => {
                    return listDiscipline.defaultValue === discipline.id;
                  });
                })
                .map((filteredDiscipline) => {
                  let title;
                  if (filteredDiscipline.slug in locales.disciplines) {
                    type LocaleKey = keyof typeof locales.disciplines;
                    title =
                      locales.disciplines[filteredDiscipline.slug as LocaleKey]
                        .title;
                  } else {
                    console.error(
                      `Focus ${filteredDiscipline.slug} not found in locales`
                    );
                    title = filteredDiscipline.slug;
                  }
                  return (
                    <button
                      key={filteredDiscipline.id}
                      {...list.insert(fields.disciplines.name, {
                        defaultValue: filteredDiscipline.id,
                      })}
                      className="mv-text-start mv-w-full mv-py-1 mv-px-2"
                    >
                      {title}
                    </button>
                  );
                })}
            </ConformSelect>
            {disciplineList.length > 0 && (
              <Chip.Container>
                {disciplineList.map((listDiscipline, index) => {
                  const disciplineSlug = allDisciplines.find((discipline) => {
                    return discipline.id === listDiscipline.defaultValue;
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
                      <Input type="hidden" {...conform.input(listDiscipline)} />
                      <Chip.Delete>
                        <button
                          {...list.remove(fields.disciplines.name, { index })}
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
            >
              <ConformSelect.Label htmlFor={fields.additionalDisciplines.id}>
                {locales.route.content.additionalDisciplines.headline}
              </ConformSelect.Label>
              <ConformSelect.HelperText>
                {locales.route.content.additionalDisciplines.helper}
              </ConformSelect.HelperText>
              {allAdditionalDisciplines
                .filter((additionalDiscipline) => {
                  return !additionalDisciplineList.some(
                    (listAdditionalDiscipline) => {
                      return (
                        listAdditionalDiscipline.defaultValue ===
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
                      {...list.insert(fields.additionalDisciplines.name, {
                        defaultValue: filteredAdditionalDiscipline.id,
                      })}
                      className="mv-text-start mv-w-full mv-py-1 mv-px-2"
                    >
                      {title}
                    </button>
                  );
                })}
            </ConformSelect>
            {additionalDisciplineList.length > 0 && (
              <Chip.Container>
                {additionalDisciplineList.map(
                  (listAdditionalDiscipline, index) => {
                    const disciplineSlug = allAdditionalDisciplines.find(
                      (discipline) => {
                        return (
                          discipline.id ===
                          listAdditionalDiscipline.defaultValue
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
                      if (disciplineSlug in locales.disciplines) {
                        type LocaleKey = keyof typeof locales.disciplines;
                        title =
                          locales.disciplines[disciplineSlug as LocaleKey]
                            .title;
                      } else {
                        console.error(
                          `Discipline ${disciplineSlug} not found in locales`
                        );
                        title = disciplineSlug;
                      }
                    }
                    return (
                      <Chip key={listAdditionalDiscipline.key}>
                        {title || locales.route.error.notFound}
                        <Input
                          type="hidden"
                          {...conform.input(listAdditionalDiscipline)}
                        />
                        <Chip.Delete>
                          <button
                            {...list.remove(fields.additionalDisciplines.name, {
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

            <div className="mv-flex mv-flex-row mv-gap-4 mv-items-center">
              <Input
                id={fields.furtherDisciplines.id}
                value={furtherDiscipline}
                onChange={handleFurtherDisciplineInputChange}
              >
                <Input.Label htmlFor={fields.furtherDisciplines.id}>
                  {locales.route.content.furtherDisciplines.headline}
                </Input.Label>
                <Input.HelperText>
                  {locales.route.content.furtherDisciplines.helper}
                </Input.HelperText>
                <Input.Controls>
                  <Button
                    {...list.insert(fields.furtherDisciplines.name, {
                      defaultValue: furtherDiscipline,
                    })}
                    variant="ghost"
                    disabled={furtherDiscipline === ""}
                  >
                    {locales.route.content.furtherDisciplines.choose}
                  </Button>
                </Input.Controls>
              </Input>
              {/* <div className="-mv-mt-1">
              </div> */}
            </div>
            {furtherDisciplinesList.length > 0 && (
              <Chip.Container>
                {furtherDisciplinesList.map((listFurtherDiscipline, index) => {
                  return (
                    <Chip key={listFurtherDiscipline.key}>
                      {listFurtherDiscipline.defaultValue ||
                        locales.route.error.notFound}
                      <Input
                        type="hidden"
                        {...conform.input(listFurtherDiscipline)}
                      />
                      <Chip.Delete>
                        <button
                          {...list.remove(fields.furtherDisciplines.name, {
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
              {locales.route.content.participants.headline}
            </h2>

            <Input {...conform.input(fields.participantLimit)}>
              <Input.Label htmlFor={fields.participantLimit.id}>
                {locales.route.content.participants.intro}
              </Input.Label>
              {typeof fields.participantLimit.error !== "undefined" && (
                <Input.Error>{fields.participantLimit.error}</Input.Error>
              )}
              <Input.HelperText>
                {locales.route.content.participants.helper}
              </Input.HelperText>
            </Input>

            <ConformSelect
              id={fields.projectTargetGroups.id}
              cta={locales.route.content.projectTargetGroups.choose}
            >
              <ConformSelect.Label htmlFor={fields.projectTargetGroups.id}>
                {locales.route.content.projectTargetGroups.intro}
              </ConformSelect.Label>
              <ConformSelect.HelperText>
                {locales.route.content.projectTargetGroups.helper}
              </ConformSelect.HelperText>
              {allProjectTargetGroups
                .filter((targetGroup) => {
                  return !targetGroupList.some((listTargetGroup) => {
                    return listTargetGroup.defaultValue === targetGroup.id;
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
                      {...list.insert(fields.projectTargetGroups.name, {
                        defaultValue: filteredTargetGroup.id,
                      })}
                      className="mv-text-start mv-w-full mv-py-1 mv-px-2"
                    >
                      {title}
                    </button>
                  );
                })}
            </ConformSelect>
            {targetGroupList.length > 0 && (
              <Chip.Container>
                {targetGroupList.map((listTargetGroup, index) => {
                  const targetGroupSlug = allProjectTargetGroups.find(
                    (targetGroup) => {
                      return targetGroup.id === listTargetGroup.defaultValue;
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
                      <Input
                        type="hidden"
                        {...conform.input(listTargetGroup)}
                      />
                      <Chip.Delete>
                        <button
                          {...list.remove(fields.projectTargetGroups.name, {
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
              <ConformSelect.HelperText>
                {locales.route.content.specialTargetGroups.helper}
              </ConformSelect.HelperText>
              {allSpecialTargetGroups
                .filter((specialTargetGroup) => {
                  return !specialTargetGroupList.some(
                    (listSpecialTargetGroup) => {
                      return (
                        listSpecialTargetGroup.defaultValue ===
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
                      {...list.insert(fields.specialTargetGroups.name, {
                        defaultValue: filteredSpecialTargetGroup.id,
                      })}
                      className="mv-text-start mv-w-full mv-py-1 mv-px-2"
                    >
                      {title}
                    </button>
                  );
                })}
            </ConformSelect>
            {specialTargetGroupList.length > 0 && (
              <Chip.Container>
                {specialTargetGroupList.map((listSpecialTargetGroup, index) => {
                  const specialTargetGroupSlug = allSpecialTargetGroups.find(
                    (specialTargetGroup) => {
                      return (
                        specialTargetGroup.id ===
                        listSpecialTargetGroup.defaultValue
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
                    if (specialTargetGroupSlug in locales.specialTargetGroups) {
                      type LocaleKey = keyof typeof locales.specialTargetGroups;
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
                      <Input
                        type="hidden"
                        {...conform.input(listSpecialTargetGroup)}
                      />
                      <Chip.Delete>
                        <button
                          {...list.remove(fields.specialTargetGroups.name, {
                            index,
                          })}
                        />
                      </Chip.Delete>
                    </Chip>
                  );
                })}
              </Chip.Container>
            )}

            <Input
              {...conform.input(fields.targetGroupAdditions)}
              maxLength={TARGET_GROUP_ADDITIONS_MAX_LENGTH}
            >
              <Input.Label htmlFor={fields.targetGroupAdditions.id}>
                {locales.route.content.targetGroupAdditions.more}
              </Input.Label>
              {typeof fields.targetGroupAdditions.error !== "undefined" && (
                <Input.Error>{fields.targetGroupAdditions.error}</Input.Error>
              )}
            </Input>
          </div>

          <div className="mv-flex mv-flex-col mv-gap-4 @md:mv-p-4 @md:mv-border @md:mv-rounded-lg @md:mv-border-gray-200">
            <h2 className="mv-text-primary mv-text-lg mv-font-semibold mv-mb-0">
              {locales.route.content.shortDescription.headline}
            </h2>
            <p>{locales.route.content.shortDescription.intro}</p>

            <Input
              {...conform.input(fields.excerpt)}
              maxLength={EXCERPT_MAX_LENGTH}
            >
              <Input.Label htmlFor={fields.excerpt.id}>
                {locales.route.content.shortDescription.label}
              </Input.Label>
              {typeof fields.excerpt.error !== "undefined" && (
                <Input.Error>{fields.excerpt.error}</Input.Error>
              )}
            </Input>
          </div>

          <div className="mv-flex mv-flex-col mv-gap-4 @md:mv-p-4 @md:mv-border @md:mv-rounded-lg @md:mv-border-gray-200">
            <h2 className="mv-text-primary mv-text-lg mv-font-semibold mv-mb-0">
              {locales.route.content.extendedDescription.headline}
            </h2>

            <p>{locales.route.content.extendedDescription.intro}</p>

            <TextArea
              {...conform.textarea(fields.idea)}
              id={fields.idea.id || ""}
              label={locales.route.content.extendedDescription.idea.label}
              helperText={locales.route.content.extendedDescription.idea.helper}
              errorMessage={fields.idea.error}
              maxLength={IDEA_MAX_LENGTH}
              rte={{ locales: locales }}
            />

            <TextArea
              {...conform.textarea(fields.goals)}
              id={fields.goals.id || ""}
              label={locales.route.content.extendedDescription.goals.label}
              helperText={
                locales.route.content.extendedDescription.goals.helper
              }
              errorMessage={fields.goals.error}
              maxLength={GOALS_MAX_LENGTH}
              rte={{ locales: locales }}
            />

            <TextArea
              {...conform.textarea(fields.implementation)}
              id={fields.implementation.id || ""}
              label={
                locales.route.content.extendedDescription.implementation.label
              }
              helperText={
                locales.route.content.extendedDescription.implementation.helper
              }
              errorMessage={fields.implementation.error}
              maxLength={IMPLEMENTATION_MAX_LENGTH}
              rte={{ locales: locales }}
            />

            <TextArea
              {...conform.textarea(fields.furtherDescription)}
              id={fields.furtherDescription.id || ""}
              label={
                locales.route.content.extendedDescription.furtherDescription
                  .label
              }
              helperText={
                locales.route.content.extendedDescription.furtherDescription
                  .helper
              }
              errorMessage={fields.furtherDescription.error}
              maxLength={FURTHER_DESCRIPTION_MAX_LENGTH}
              rte={{ locales: locales }}
            />

            <TextArea
              {...conform.textarea(fields.targeting)}
              id={fields.targeting.id || ""}
              label={locales.route.content.extendedDescription.targeting.label}
              helperText={
                locales.route.content.extendedDescription.targeting.helper
              }
              errorMessage={fields.targeting.error}
              maxLength={TARGETING_MAX_LENGTH}
              rte={{ locales: locales }}
            />

            <TextArea
              {...conform.textarea(fields.hints)}
              id={fields.hints.id || ""}
              label={locales.route.content.extendedDescription.hints.label}
              helperText={
                locales.route.content.extendedDescription.hints.helper
              }
              errorMessage={fields.hints.error}
              maxLength={HINTS_MAX_LENGTH}
              rte={{ locales: locales }}
            />
          </div>

          <div className="mv-flex mv-flex-col mv-gap-4 @md:mv-p-4 @md:mv-border @md:mv-rounded-lg @md:mv-border-gray-200">
            <h2 className="mv-text-primary mv-text-lg mv-font-semibold mv-mb-0">
              {locales.route.content.video.headline}
            </h2>

            <Input
              {...conform.input(fields.video)}
              placeholder="youtube.com/watch?v=<videoCode>"
            >
              <Input.Label htmlFor={fields.video.id}>
                {locales.route.content.video.video.label}
              </Input.Label>
              {typeof fields.video.error !== "undefined" && (
                <Input.Error>{fields.video.error}</Input.Error>
              )}
              <Input.HelperText>
                {locales.route.content.video.video.helper}
              </Input.HelperText>
            </Input>

            <Input
              {...conform.input(fields.videoSubline)}
              maxLength={VIDEO_SUBLINE_MAX_LENGTH}
            >
              <Input.Label htmlFor={fields.videoSubline.id}>
                {locales.route.content.video.videoSubline.label}
              </Input.Label>
              {typeof fields.videoSubline.error !== "undefined" && (
                <Input.Error>{fields.videoSubline.error}</Input.Error>
              )}
            </Input>
          </div>

          <div className="mv-flex mv-w-full mv-justify-end">
            <div className="mv-flex mv-shrink mv-w-full @md:mv-max-w-fit @lg:mv-w-auto mv-items-center mv-justify-center @lg:mv-justify-end">
              <Controls>
                {/* <Link
                  to="."
                  reloadDocument
                  className="mv-btn mv-btn-sm mv-font-semibold mv-whitespace-nowrap mv-h-10 mv-text-sm mv-px-6 mv-py-2.5 mv-border mv-w-full mv-bg-neutral-50 mv-border-primary mv-text-primary hover:mv-bg-primary-50 focus:mv-bg-primary-50 active:mv-bg-primary-100"
                >
                  Änderungen verwerfen
                </Link> */}
                <Button
                  as="a"
                  href="./details"
                  variant="outline"
                  onClick={() => {
                    setIsDirty(false);
                  }}
                  className="mv-btn mv-btn-sm mv-font-semibold mv-whitespace-nowrap mv-h-10 mv-text-sm mv-px-6 mv-py-2.5 mv-border mv-w-full mv-bg-neutral-50 mv-border-primary mv-text-primary hover:mv-bg-primary-50 focus:mv-bg-primary-50 active:mv-bg-primary-100"
                >
                  {locales.route.content.reset}
                </Button>
                {/* TODO: Use Button type reset when RTE is resetable. Currently the rte does not reset via button type reset */}
                {/* <Button type="reset" variant="outline" fullSize>
                  Änderungen verwerfen
                </Button> */}
                {/* TODO: Add disabled attribute. Note: I'd like to use a hook from kent that needs remix v2 here. see /app/lib/utils/hooks.ts  */}

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
          {/* Workarround error messages because conform mapping and error displaying is not working yet with Select and RTE components */}
          {fields.additionalDisciplines.errors !== undefined &&
            fields.additionalDisciplines.errors.length > 0 && (
              <Alert level="negative">
                {insertParametersIntoLocale(
                  locales.route.content.error.additionalDisciplines,
                  {
                    list: fields.additionalDisciplines.errors.join(", "),
                  }
                )}
              </Alert>
            )}
          {fields.idea.errors !== undefined &&
            fields.idea.errors.length > 0 && (
              <Alert level="negative">
                {insertParametersIntoLocale(locales.route.content.error.idea, {
                  list: fields.idea.errors.join(", "),
                })}
              </Alert>
            )}
          {fields.goals.errors !== undefined &&
            fields.goals.errors.length > 0 && (
              <Alert level="negative">
                {insertParametersIntoLocale(locales.route.content.error.goals, {
                  list: fields.goals.errors.join(", "),
                })}
              </Alert>
            )}
          {fields.implementation.errors !== undefined &&
            fields.implementation.errors.length > 0 && (
              <Alert level="negative">
                {insertParametersIntoLocale(
                  locales.route.content.error.implementation,
                  {
                    list: fields.implementation.errors.join(", "),
                  }
                )}
              </Alert>
            )}
          {fields.furtherDescription.errors !== undefined &&
            fields.furtherDescription.errors.length > 0 && (
              <Alert level="negative">
                {insertParametersIntoLocale(
                  locales.route.content.error.furtherDescription,
                  {
                    list: fields.furtherDescription.errors.join(", "),
                  }
                )}
              </Alert>
            )}
          {fields.targeting.errors !== undefined &&
            fields.targeting.errors.length > 0 && (
              <Alert level="negative">
                {insertParametersIntoLocale(
                  locales.route.content.error.targeting,
                  {
                    list: fields.targeting.errors.join(", "),
                  }
                )}
              </Alert>
            )}
          {fields.hints.errors !== undefined &&
            fields.hints.errors.length > 0 && (
              <Alert level="negative">
                {insertParametersIntoLocale(locales.route.content.error.hints, {
                  list: fields.hints.errors.join(", "),
                })}
              </Alert>
            )}
        </div>
      </Form>
    </Section>
  );
}

export default Details;
