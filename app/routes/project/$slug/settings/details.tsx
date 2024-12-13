import { conform, list, useFieldList, useForm } from "@conform-to/react";
import { getFieldsetConstraint, parse } from "@conform-to/zod";
import {
  json,
  redirect,
  type ActionFunctionArgs,
  type LinksFunction,
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
import quillStyles from "react-quill/dist/quill.snow.css?url";
import { z } from "zod";
import { createAuthClient, getSessionUser } from "~/auth.server";
import TextAreaWithCounter from "~/components/FormElements/TextAreaWithCounter/TextAreaWithCounter";
import { invariantResponse } from "~/lib/utils/response";
import {
  removeHtmlTags,
  replaceHtmlEntities,
  sanitizeUserHtml,
} from "~/lib/utils/sanitizeUserHtml";
import { createYoutubeEmbedSchema } from "~/lib/utils/schemas";
import { prismaClient } from "~/prisma.server";
import { redirectWithToast } from "~/toast.server";
import { BackButton, ButtonSelect } from "./__components";
import {
  getRedirectPathOnProtectedProjectRoute,
  getHash,
  updateFilterVectorOfProject,
} from "./utils.server";
import { type TFunction } from "i18next";
import i18next from "~/i18next.server";
import { useTranslation } from "react-i18next";
import { detectLanguage } from "~/root.server";
import { Section } from "@mint-vernetzt/components/src/organisms/containers/Section";
import { Chip } from "@mint-vernetzt/components/src/molecules/Chip";
import { Input } from "@mint-vernetzt/components/src/molecules/Input";
import { Button } from "@mint-vernetzt/components/src/molecules/Button";
import { Controls } from "@mint-vernetzt/components/src/organisms/containers/Controls";
import { Alert } from "@mint-vernetzt/components/src/molecules/Alert";

const i18nNS = [
  "routes-project-settings-details",
  "utils-schemas",
  "datasets-disciplines",
  "datasets-additionalDisciplines",
  "datasets-projectTargetGroups",
  "datasets-specialTargetGroups",
] as const;
export const handle = {
  i18n: i18nNS,
};

const createDetailSchema = (t: TFunction) =>
  z.object({
    disciplines: z.array(z.string().uuid()),
    additionalDisciplines: z.array(z.string().uuid()),
    furtherDisciplines: z.array(z.string().transform((value) => value.trim())),
    participantLimit: z
      .string()
      .optional()
      .transform((value) => {
        if (value === undefined) {
          return null;
        }
        const trimmedValue = value.trim();
        return trimmedValue === "" || trimmedValue === "<p></p>" ? null : value;
      }),
    projectTargetGroups: z.array(z.string().uuid()),
    specialTargetGroups: z.array(z.string().uuid()),
    targetGroupAdditions: z
      .string()
      .max(200, t("validation.targetGroupAdditions.max"))
      .optional()
      .transform((value) => {
        if (value === undefined) {
          return null;
        }
        const trimmedValue = value.trim();
        return trimmedValue === "" || trimmedValue === "<p></p>" ? null : value;
      }),
    excerpt: z
      .string()
      .max(250, t("validation.targetGroupAdditions.excerpt"))
      .optional()
      .transform((value) => {
        if (value === undefined) {
          return null;
        }
        const trimmedValue = value.trim();
        return trimmedValue === "" || trimmedValue === "<p></p>" ? null : value;
      }),
    idea: z
      .string()
      .optional()
      .transform((value) => {
        if (value === undefined) {
          return null;
        }
        const trimmedValue = value.trim();
        return trimmedValue === "" || trimmedValue === "<p></p>" ? null : value;
      })
      .refine(
        (value) => {
          return (
            // Entities are being replaced by "x" just to get the right count for them.
            replaceHtmlEntities(removeHtmlTags(value || ""), "x").length <= 2000
          );
        },
        {
          message: t("validation.idea.message"),
        }
      ),
    goals: z
      .string()
      .optional()
      .transform((value) => {
        if (value === undefined) {
          return null;
        }
        const trimmedValue = value.trim();
        return trimmedValue === "" || trimmedValue === "<p></p>" ? null : value;
      })
      .refine(
        (value) => {
          return (
            // Entities are being replaced by "x" just to get the right count for them.
            replaceHtmlEntities(removeHtmlTags(value || ""), "x").length <= 2000
          );
        },
        {
          message: t("validation.goals.message"),
        }
      ),
    implementation: z
      .string()
      .optional()
      .transform((value) => {
        if (value === undefined) {
          return null;
        }
        const trimmedValue = value.trim();
        return trimmedValue === "" || trimmedValue === "<p></p>" ? null : value;
      })
      .refine(
        (value) => {
          return (
            // Entities are being replaced by "x" just to get the right count for them.
            replaceHtmlEntities(removeHtmlTags(value || ""), "x").length <= 2000
          );
        },
        {
          message: t("validation.implementation.message"),
        }
      ),
    furtherDescription: z
      .string()
      .optional()
      .transform((value) => {
        if (value === undefined) {
          return null;
        }
        const trimmedValue = value.trim();
        return trimmedValue === "" || trimmedValue === "<p></p>" ? null : value;
      })
      .refine(
        (value) => {
          return (
            // Entities are being replaced by "x" just to get the right count for them.
            replaceHtmlEntities(removeHtmlTags(value || ""), "x").length <= 8000
          );
        },
        {
          message: t("validation.furtherDescription.message"),
        }
      ),
    targeting: z
      .string()
      .optional()
      .transform((value) => {
        if (value === undefined) {
          return null;
        }
        const trimmedValue = value.trim();
        return trimmedValue === "" || trimmedValue === "<p></p>" ? null : value;
      })
      .refine(
        (value) => {
          return (
            // Entities are being replaced by "x" just to get the right count for them.
            replaceHtmlEntities(removeHtmlTags(value || ""), "x").length <= 800
          );
        },
        {
          message: t("validation.targeting.message"),
        }
      ),
    hints: z
      .string()
      .optional()
      .transform((value) => {
        if (value === undefined) {
          return null;
        }
        const trimmedValue = value.trim();
        return trimmedValue === "" || trimmedValue === "<p></p>" ? null : value;
      })
      .refine(
        (value) => {
          return (
            // Entities are being replaced by "x" just to get the right count for them.
            replaceHtmlEntities(removeHtmlTags(value || ""), "x").length <= 800
          );
        },
        {
          message: t("validation.hints.message"),
        }
      ),
    video: createYoutubeEmbedSchema(t),
    videoSubline: z
      .string()
      .max(80, t("validation.videoSubline.max"))
      .optional()
      .transform((value) => {
        if (value === undefined) {
          return null;
        }
        const trimmedValue = value.trim();
        return trimmedValue === "" || trimmedValue === "<p></p>" ? null : value;
      }),
  });

export const links: LinksFunction = () => [
  { rel: "stylesheet", href: quillStyles },
];

export const loader = async (args: LoaderFunctionArgs) => {
  const { request, params } = args;

  const locale = await detectLanguage(request);
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
  invariantResponse(project !== null, t("error.projectNotFound"), {
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

  return json({
    project,
    allDisciplines,
    allAdditionalDisciplines,
    allProjectTargetGroups,
    allSpecialTargetGroups,
  });
};

export async function action({ request, params }: ActionFunctionArgs) {
  const { authClient } = createAuthClient(request);
  const sessionUser = await getSessionUser(authClient);
  const locale = await detectLanguage(request);
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
  const formData = await request.formData();
  const detailsSchema = createDetailSchema(t);

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
            message: t("validation.custom.message"),
          });
          return z.NEVER;
        }

        invariantResponse(
          sanitizeUserHtml !== undefined,
          "Server only module doesnt know we are on the server here.",
          { status: 500 }
        );

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
            message: t("error.storage"),
          });
          return z.NEVER;
        }

        return { ...data };
      }),
    async: true,
  });

  const hash = getHash(submission);

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

function Details() {
  const location = useLocation();
  const { t } = useTranslation(i18nNS);
  const loaderData = useLoaderData<typeof loader>();
  const {
    project,
    allDisciplines,
    allAdditionalDisciplines,
    allProjectTargetGroups,
    allSpecialTargetGroups,
  } = loaderData;
  const {
    disciplines,
    additionalDisciplines,
    projectTargetGroups,
    specialTargetGroups,
    ...rest
  } = project;
  const actionData = useActionData<typeof action>();
  const formId = "details-form";

  const detailsSchema = createDetailSchema(t);
  const [form, fields] = useForm({
    id: formId,
    constraint: getFieldsetConstraint(detailsSchema),
    defaultValue: {
      // TODO: Investigate: Why can i spread here (defaultValue also accepts null values) and not on web-social?
      ...rest,
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
                message: t("validation.custom.message"),
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
    const confirmed = confirm(t("content.nonPersistent"));
    if (confirmed === true) {
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
      <BackButton to={location.pathname}>{t("content.back")}</BackButton>
      <p className="mv-my-6 @md:mv-mt-0">{t("content.description")}</p>
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
              {t("content.disciplines.headline")}
            </h2>

            <ButtonSelect
              id={fields.disciplines.id}
              cta={t("content.disciplines.choose")}
            >
              <ButtonSelect.Label htmlFor={fields.disciplines.id}>
                {t("content.disciplines.intro")}
              </ButtonSelect.Label>
              <ButtonSelect.HelperText>
                {t("content.disciplines.helper")}
              </ButtonSelect.HelperText>
              {allDisciplines
                .filter((discipline) => {
                  return !disciplineList.some((listDiscipline) => {
                    return listDiscipline.defaultValue === discipline.id;
                  });
                })
                .map((filteredDiscipline) => {
                  return (
                    <button
                      key={filteredDiscipline.id}
                      {...list.insert(fields.disciplines.name, {
                        defaultValue: filteredDiscipline.id,
                      })}
                      className="mv-text-start mv-w-full mv-py-1 mv-px-2"
                    >
                      {t(`${filteredDiscipline.slug}.title`, {
                        ns: "datasets-disciplines",
                      })}
                    </button>
                  );
                })}
            </ButtonSelect>
            {disciplineList.length > 0 && (
              <Chip.Container>
                {disciplineList.map((listDiscipline, index) => {
                  return (
                    <Chip key={listDiscipline.key}>
                      {t(
                        `${
                          allDisciplines.find((discipline) => {
                            return (
                              discipline.id === listDiscipline.defaultValue
                            );
                          })?.slug
                        }.title`,
                        { ns: "datasets-disciplines" }
                      ) || "Not Found"}
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

            <ButtonSelect
              id={fields.additionalDisciplines.id}
              cta={t("content.additionalDisciplines.choose")}
            >
              <ButtonSelect.Label htmlFor={fields.additionalDisciplines.id}>
                {t("content.additionalDisciplines.headline")}
              </ButtonSelect.Label>
              <ButtonSelect.HelperText>
                {t("content.additionalDisciplines.helper")}
              </ButtonSelect.HelperText>
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
                  return (
                    <button
                      key={filteredAdditionalDiscipline.id}
                      {...list.insert(fields.additionalDisciplines.name, {
                        defaultValue: filteredAdditionalDiscipline.id,
                      })}
                      className="mv-text-start mv-w-full mv-py-1 mv-px-2"
                    >
                      {t(`${filteredAdditionalDiscipline.slug}.title`, {
                        ns: "datasets-additionalDisciplines",
                      })}
                    </button>
                  );
                })}
            </ButtonSelect>
            {additionalDisciplineList.length > 0 && (
              <Chip.Container>
                {additionalDisciplineList.map(
                  (listAdditionalDiscipline, index) => {
                    return (
                      <Chip key={listAdditionalDiscipline.key}>
                        {t(
                          `${
                            allAdditionalDisciplines.find(
                              (additionalDiscipline) => {
                                return (
                                  additionalDiscipline.id ===
                                  listAdditionalDiscipline.defaultValue
                                );
                              }
                            )?.slug
                          }.title`,
                          {
                            ns: "datasets-additionalDisciplines",
                          }
                        ) || t("error.notFound")}
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
                  {t("content.furtherDisciplines.headline")}
                </Input.Label>
                <Input.HelperText>
                  {t("content.furtherDisciplines.helper")}
                </Input.HelperText>
                <Input.Controls>
                  <Button
                    {...list.insert(fields.furtherDisciplines.name, {
                      defaultValue: furtherDiscipline,
                    })}
                    variant="ghost"
                    disabled={furtherDiscipline === ""}
                  >
                    {t("content.furtherDisciplines.choose")}
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
                        t("error.notFound")}
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
              {t("content.participants.headline")}
            </h2>

            <Input {...conform.input(fields.participantLimit)}>
              <Input.Label htmlFor={fields.participantLimit.id}>
                {t("content.participants.intro")}
              </Input.Label>
              {typeof fields.participantLimit.error !== "undefined" && (
                <Input.Error>{fields.participantLimit.error}</Input.Error>
              )}
              <Input.HelperText>
                {t("content.participants.helper")}
              </Input.HelperText>
            </Input>

            <ButtonSelect
              id={fields.projectTargetGroups.id}
              cta={t("content.projectTargetGroups.choose")}
            >
              <ButtonSelect.Label htmlFor={fields.projectTargetGroups.id}>
                {t("content.projectTargetGroups.intro")}
              </ButtonSelect.Label>
              <ButtonSelect.HelperText>
                {t("content.projectTargetGroups.helper")}
              </ButtonSelect.HelperText>
              {allProjectTargetGroups
                .filter((targetGroup) => {
                  return !targetGroupList.some((listTargetGroup) => {
                    return listTargetGroup.defaultValue === targetGroup.id;
                  });
                })
                .map((filteredTargetGroup) => {
                  return (
                    <button
                      key={filteredTargetGroup.id}
                      {...list.insert(fields.projectTargetGroups.name, {
                        defaultValue: filteredTargetGroup.id,
                      })}
                      className="mv-text-start mv-w-full mv-py-1 mv-px-2"
                    >
                      {t(`${filteredTargetGroup.slug}.title`, {
                        ns: "datasets-projectTargetGroups",
                      })}
                    </button>
                  );
                })}
            </ButtonSelect>
            {targetGroupList.length > 0 && (
              <Chip.Container>
                {targetGroupList.map((listTargetGroup, index) => {
                  return (
                    <Chip key={listTargetGroup.key}>
                      {t(
                        `${
                          allProjectTargetGroups.find((targetGroup) => {
                            return (
                              targetGroup.id === listTargetGroup.defaultValue
                            );
                          })?.slug
                        }.title`,
                        {
                          ns: "datasets-projectTargetGroups",
                        }
                      ) || t("error.notFound")}
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

            <ButtonSelect
              id={fields.specialTargetGroups.id}
              cta={t("content.specialTargetGroups.choose")}
            >
              <ButtonSelect.Label htmlFor={fields.specialTargetGroups.id}>
                {t("content.specialTargetGroups.intro")}
              </ButtonSelect.Label>
              <ButtonSelect.HelperText>
                {t("content.specialTargetGroups.helper")}
              </ButtonSelect.HelperText>
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
                  return (
                    <button
                      key={filteredSpecialTargetGroup.id}
                      {...list.insert(fields.specialTargetGroups.name, {
                        defaultValue: filteredSpecialTargetGroup.id,
                      })}
                      className="mv-text-start mv-w-full mv-py-1 mv-px-2"
                    >
                      {t(`${filteredSpecialTargetGroup.slug}.title`, {
                        ns: "datasets-specialTargetGroups",
                      })}
                    </button>
                  );
                })}
            </ButtonSelect>
            {specialTargetGroupList.length > 0 && (
              <Chip.Container>
                {specialTargetGroupList.map((listSpecialTargetGroup, index) => {
                  return (
                    <Chip key={listSpecialTargetGroup.key}>
                      {t(
                        `${
                          allSpecialTargetGroups.find((specialTargetGroup) => {
                            return (
                              specialTargetGroup.id ===
                              listSpecialTargetGroup.defaultValue
                            );
                          })?.slug
                        }.title`,
                        {
                          ns: "datasets-specialTargetGroups",
                        }
                      ) || t("error.notFound")}
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

            <Input {...conform.input(fields.targetGroupAdditions)}>
              <Input.Label htmlFor={fields.targetGroupAdditions.id}>
                {t("content.targetGroupAdditions.more")}
              </Input.Label>
              {typeof fields.targetGroupAdditions.error !== "undefined" && (
                <Input.Error>{fields.targetGroupAdditions.error}</Input.Error>
              )}
            </Input>
          </div>

          <div className="mv-flex mv-flex-col mv-gap-4 @md:mv-p-4 @md:mv-border @md:mv-rounded-lg @md:mv-border-gray-200">
            <h2 className="mv-text-primary mv-text-lg mv-font-semibold mv-mb-0">
              {t("content.shortDescription.headline")}
            </h2>
            <p>{t("content.shortDescription.intro")}</p>

            <Input {...conform.input(fields.excerpt)}>
              <Input.Label htmlFor={fields.excerpt.id}>
                {t("content.shortDescription.label")}
              </Input.Label>
              {typeof fields.excerpt.error !== "undefined" && (
                <Input.Error>{fields.excerpt.error}</Input.Error>
              )}
            </Input>
          </div>

          <div className="mv-flex mv-flex-col mv-gap-4 @md:mv-p-4 @md:mv-border @md:mv-rounded-lg @md:mv-border-gray-200">
            <h2 className="mv-text-primary mv-text-lg mv-font-semibold mv-mb-0">
              {t("content.extendedDescription.headline")}
            </h2>

            <p>{t("content.extendedDescription.intro")}</p>

            <TextAreaWithCounter
              {...conform.textarea(fields.idea)}
              id={fields.idea.id || ""}
              label={t("content.extendedDescription.idea.label")}
              helperText={t("content.extendedDescription.idea.helper")}
              errorMessage={fields.idea.error}
              maxCharacters={2000}
              rte
            />

            <TextAreaWithCounter
              {...conform.textarea(fields.goals)}
              id={fields.goals.id || ""}
              label={t("content.extendedDescription.goals.label")}
              helperText={t("content.extendedDescription.goals.helper")}
              errorMessage={fields.goals.error}
              maxCharacters={2000}
              rte
            />

            <TextAreaWithCounter
              {...conform.textarea(fields.implementation)}
              id={fields.implementation.id || ""}
              label={t("content.extendedDescription.implementation.label")}
              helperText={t(
                "content.extendedDescription.implementation.helper"
              )}
              errorMessage={fields.implementation.error}
              maxCharacters={2000}
              rte
            />

            <TextAreaWithCounter
              {...conform.textarea(fields.furtherDescription)}
              id={fields.furtherDescription.id || ""}
              label={t("content.extendedDescription.furtherDescription.label")}
              helperText={t(
                "content.extendedDescription.furtherDescription.helper"
              )}
              errorMessage={fields.furtherDescription.error}
              maxCharacters={8000}
              rte
            />

            <TextAreaWithCounter
              {...conform.textarea(fields.targeting)}
              id={fields.targeting.id || ""}
              label={t("content.extendedDescription.targeting.label")}
              helperText={t("content.extendedDescription.targeting.helper")}
              errorMessage={fields.targeting.error}
              maxCharacters={800}
              rte
            />

            <TextAreaWithCounter
              {...conform.textarea(fields.hints)}
              id={fields.hints.id || ""}
              label={t("content.extendedDescription.hints.label")}
              helperText={t("content.extendedDescription.hints.helper")}
              errorMessage={fields.hints.error}
              maxCharacters={800}
              rte
            />
          </div>

          <div className="mv-flex mv-flex-col mv-gap-4 @md:mv-p-4 @md:mv-border @md:mv-rounded-lg @md:mv-border-gray-200">
            <h2 className="mv-text-primary mv-text-lg mv-font-semibold mv-mb-0">
              {t("content.video.headline")}
            </h2>

            <Input
              {...conform.input(fields.video)}
              placeholder="youtube.com/watch?v=<videoCode>"
            >
              <Input.Label htmlFor={fields.video.id}>
                {t("content.video.video.label")}
              </Input.Label>
              {typeof fields.video.error !== "undefined" && (
                <Input.Error>{fields.video.error}</Input.Error>
              )}
              <Input.HelperText>
                {t("content.video.video.helper")}
              </Input.HelperText>
            </Input>

            <Input {...conform.input(fields.videoSubline)}>
              <Input.Label htmlFor={fields.videoSubline.id}>
                {t("content.video.videoSubline.label")}
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
                  {t("content.reset")}
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
                  {t("content.submit")}
                </Button>
              </Controls>
            </div>
          </div>
          {/* Workarround error messages because conform mapping and error displaying is not working yet with Select and RTE components */}
          {fields.additionalDisciplines.error !== undefined && (
            <Alert level="negative">
              {t("content.error.additionalDisciplines", {
                list: fields.additionalDisciplines.error,
              })}
            </Alert>
          )}
          {fields.idea.error !== undefined && (
            <Alert level="negative">
              {t("content.error.idea", { list: fields.idea.error })}
            </Alert>
          )}
          {fields.goals.error !== undefined && (
            <Alert level="negative">
              {t("content.error.goals", { list: fields.goals.error })}
            </Alert>
          )}
          {fields.implementation.error !== undefined && (
            <Alert level="negative">
              {t("content.error.implementation", {
                list: fields.implementation.error,
              })}
            </Alert>
          )}
          {fields.furtherDescription.error !== undefined && (
            <Alert level="negative">
              {t("content.error.furtherDescription", {
                list: fields.furtherDescription.error,
              })}
            </Alert>
          )}
          {fields.targeting.error !== undefined && (
            <Alert level="negative">
              {t("content.error.targeting", { list: fields.targeting.error })}
            </Alert>
          )}
          {fields.hints.error !== undefined && (
            <Alert level="negative">
              {t("content.error.hints", { list: fields.hints.error })}
            </Alert>
          )}
        </div>
      </Form>
    </Section>
  );
}

export default Details;
