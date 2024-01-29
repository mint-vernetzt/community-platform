import { conform, list, useFieldList, useForm } from "@conform-to/react";
import { getFieldsetConstraint, parse } from "@conform-to/zod";
import {
  Alert,
  Button,
  Chip,
  Controls,
  Input,
  Section,
  Select,
} from "@mint-vernetzt/components";
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
import quillStyles from "react-quill/dist/quill.snow.css";
import { z } from "zod";
import { createAuthClient, getSessionUser } from "~/auth.server";
import TextAreaWithCounter from "~/components/FormElements/TextAreaWithCounter/TextAreaWithCounter";
import { invariantResponse } from "~/lib/utils/response";
import {
  removeHtmlTags,
  replaceHtmlEntities,
  sanitizeUserHtml,
} from "~/lib/utils/sanitizeUserHtml";
import { youtubeEmbedSchema } from "~/lib/utils/schemas";
import { prismaClient } from "~/prisma.server";
import { redirectWithToast } from "~/toast.server";
import { BackButton } from "./__components";
import {
  getRedirectPathOnProtectedProjectRoute,
  getSubmissionHash,
} from "./utils.server";

const detailsSchema = z.object({
  disciplines: z.array(z.string().uuid()),
  additionalDisciplines: z.array(z.string().uuid()),
  furtherDisciplines: z.array(z.string()),
  participantLimit: z
    .string()
    .optional()
    .transform((value) => (value === undefined || value === "" ? null : value)),
  projectTargetGroups: z.array(z.string().uuid()),
  specialTargetGroups: z.array(z.string().uuid()),
  targetGroupAdditions: z
    .string()
    .max(
      200,
      "Deine Eingabe übersteigt die maximal zulässige Zeichenzahl von 200."
    )
    .optional()
    .transform((value) => (value === undefined || value === "" ? null : value)),
  excerpt: z
    .string()
    .max(
      250,
      "Deine Eingabe übersteigt die maximal zulässige Zeichenzahl von 250."
    )
    .optional()
    .transform((value) => (value === undefined || value === "" ? null : value)),
  idea: z
    .string()
    .optional()
    .transform((value) => (value === undefined || value === "" ? null : value))
    .refine(
      (value) => {
        return (
          // Entities are being replaced by "x" just to get the right count for them.
          replaceHtmlEntities(removeHtmlTags(value || ""), "x").length <= 2000
        );
      },
      {
        message:
          "Deine Eingabe übersteigt die maximal zulässige Zeichenzahl von 2000.",
      }
    ),
  goals: z
    .string()
    .optional()
    .transform((value) => (value === undefined || value === "" ? null : value))
    .refine(
      (value) => {
        return (
          // Entities are being replaced by "x" just to get the right count for them.
          replaceHtmlEntities(removeHtmlTags(value || ""), "x").length <= 2000
        );
      },
      {
        message:
          "Deine Eingabe übersteigt die maximal zulässige Zeichenzahl von 2000.",
      }
    ),
  implementation: z
    .string()
    .optional()
    .transform((value) => (value === undefined || value === "" ? null : value))
    .refine(
      (value) => {
        return (
          // Entities are being replaced by "x" just to get the right count for them.
          replaceHtmlEntities(removeHtmlTags(value || ""), "x").length <= 2000
        );
      },
      {
        message:
          "Deine Eingabe übersteigt die maximal zulässige Zeichenzahl von 2000.",
      }
    ),
  furtherDescription: z
    .string()
    .optional()
    .transform((value) => (value === undefined || value === "" ? null : value))
    .refine(
      (value) => {
        return (
          // Entities are being replaced by "x" just to get the right count for them.
          replaceHtmlEntities(removeHtmlTags(value || ""), "x").length <= 8000
        );
      },
      {
        message:
          "Deine Eingabe übersteigt die maximal zulässige Zeichenzahl von 8000.",
      }
    ),
  targeting: z
    .string()
    .optional()
    .transform((value) => (value === undefined || value === "" ? null : value))
    .refine(
      (value) => {
        return (
          // Entities are being replaced by "x" just to get the right count for them.
          replaceHtmlEntities(removeHtmlTags(value || ""), "x").length <= 800
        );
      },
      {
        message:
          "Deine Eingabe übersteigt die maximal zulässige Zeichenzahl von 800.",
      }
    ),
  hints: z
    .string()
    .optional()
    .transform((value) => (value === undefined || value === "" ? null : value))
    .refine(
      (value) => {
        return (
          // Entities are being replaced by "x" just to get the right count for them.
          replaceHtmlEntities(removeHtmlTags(value || ""), "x").length <= 800
        );
      },
      {
        message:
          "Deine Eingabe übersteigt die maximal zulässige Zeichenzahl von 800.",
      }
    ),
  video: youtubeEmbedSchema,
  videoSubline: z
    .string()
    .max(
      80,
      "Deine Eingabe übersteigt die maximal zulässige Zeichenzahl von 80."
    )
    .optional()
    .transform((value) => (value === undefined || value === "" ? null : value)),
});

export const links: LinksFunction = () => [
  { rel: "stylesheet", href: quillStyles },
];

export const loader = async (args: LoaderFunctionArgs) => {
  const { request, params } = args;
  const { authClient } = createAuthClient(request);

  const sessionUser = await getSessionUser(authClient);

  // check slug exists (throw bad request if not)
  invariantResponse(params.slug !== undefined, "No valid route", {
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
              title: true,
            },
          },
        },
      },
      additionalDisciplines: {
        select: {
          additionalDiscipline: {
            select: {
              id: true,
              title: true,
            },
          },
        },
      },
      projectTargetGroups: {
        select: {
          projectTargetGroup: {
            select: {
              id: true,
              title: true,
            },
          },
        },
      },
      specialTargetGroups: {
        select: {
          specialTargetGroup: {
            select: {
              id: true,
              title: true,
            },
          },
        },
      },
    },
    where: {
      slug: params.slug,
    },
  });
  invariantResponse(project !== null, "Project not found", {
    status: 404,
  });

  const allDisciplines = await prismaClient.discipline.findMany({
    select: {
      id: true,
      title: true,
    },
  });

  const allAdditionalDisciplines =
    await prismaClient.additionalDiscipline.findMany({
      select: {
        id: true,
        title: true,
      },
    });

  const allProjectTargetGroups = await prismaClient.projectTargetGroup.findMany(
    {
      select: {
        id: true,
        title: true,
      },
    }
  );

  const allSpecialTargetGroups = await prismaClient.specialTargetGroup.findMany(
    {
      select: {
        id: true,
        title: true,
        description: true,
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
  // check slug exists (throw bad request if not)
  invariantResponse(params.slug !== undefined, "No valid route", {
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
  invariantResponse(project !== null, "Project not found", {
    status: 404,
  });
  // Validation
  const formData = await request.formData();
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
            message:
              "Zusätzliche Disziplinen können nur gewählt werden, wenn mindestens eine Hauptdisziplin ausgewählt wurde.",
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
        } catch (e) {
          console.warn(e);
          ctx.addIssue({
            code: "custom",
            message:
              "Die Daten konnten nicht gespeichert werden. Bitte versuche es erneut oder wende dich an den Support.",
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
    { id: "settings-toast", key: hash, message: "Daten gespeichert!" },
    { scrollToToast: true }
  );
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
                message:
                  "Zusätzliche Disziplinen können nur gewählt werden, wenn mindestens eine Hauptdisziplin ausgewählt wurde.",
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
  const handleSelectChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    for (const child of event.currentTarget.children) {
      const value = child.getAttribute("value");
      if (
        child.localName === "button" &&
        value !== null &&
        value.includes(event.currentTarget.value)
      ) {
        const button = child as HTMLButtonElement;
        button.click();
      }
    }
  };
  const [isDirty, setIsDirty] = React.useState(false);
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      isDirty && currentLocation.pathname !== nextLocation.pathname
  );
  if (blocker.state === "blocked") {
    const confirmed = confirm(
      "Du hast ungespeicherte Änderungen. Diese gehen verloren, wenn Du jetzt einen Schritt weiter gehst."
    );
    if (confirmed) {
      blocker.proceed();
    } else {
      blocker.reset();
    }
  }

  return (
    <Section>
      <BackButton to={location.pathname}>Projekt-Details</BackButton>
      <p className="mv-my-6 md:mv-mt-0">
        Teile der Community mehr über Dein Projekt oder Bildungsangebot mit.
      </p>
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
        onReset={() => {
          setIsDirty(false);
        }}
      >
        {/* This button ensures submission via enter key. Always use a hidden button at top of the form when other submit buttons are inside it (f.e. the add/remove list buttons) */}
        <Button type="submit" hidden />
        <div className="mv-flex mv-flex-col mv-gap-6 md:mv-gap-4">
          <div className="mv-flex mv-flex-col mv-gap-4 md:mv-p-4 md:mv-border md:mv-rounded-lg md:mv-border-gray-200">
            <h2 className="mv-text-primary mv-text-lg mv-font-semibold mv-mb-0">
              MINT-Disziplinen
            </h2>

            <Select onChange={handleSelectChange}>
              <Select.Label htmlFor={fields.disciplines.id}>
                Welche MINT-Disziplinen spielen in Deinem Projekt eine Rolle?
              </Select.Label>
              <Select.HelperText>
                Mehrfachnennungen sind möglich.
              </Select.HelperText>
              <option selected hidden>
                Bitte auswählen
              </option>
              {allDisciplines
                .filter((discipline) => {
                  return !disciplineList.some((listDiscipline) => {
                    return listDiscipline.defaultValue === discipline.id;
                  });
                })
                .map((filteredDiscipline) => {
                  return (
                    <React.Fragment key={`${filteredDiscipline.id}-fragment`}>
                      <button
                        hidden
                        {...list.insert(fields.disciplines.name, {
                          defaultValue: filteredDiscipline.id,
                        })}
                      >
                        {filteredDiscipline.title}
                      </button>
                      <option
                        key={filteredDiscipline.id}
                        value={filteredDiscipline.id}
                        className="my-2"
                      >
                        {filteredDiscipline.title}
                      </option>
                    </React.Fragment>
                  );
                })}
            </Select>
            {disciplineList.length > 0 && (
              <Chip.Container>
                {disciplineList.map((listDiscipline, index) => {
                  return (
                    <Chip key={listDiscipline.key}>
                      {allDisciplines.find((discipline) => {
                        return discipline.id === listDiscipline.defaultValue;
                      })?.title || "Not Found"}
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

            <Select onChange={handleSelectChange}>
              <Select.Label htmlFor={fields.additionalDisciplines.id}>
                Welche zusätzlichen Disziplinen spielen in Deinem Projekt eine
                Rolle?
              </Select.Label>
              <Select.HelperText>
                Mehrfachnennungen sind möglich.
              </Select.HelperText>
              <option selected hidden>
                Bitte auswählen
              </option>
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
                    <React.Fragment
                      key={`${filteredAdditionalDiscipline.id}-fragment`}
                    >
                      <button
                        hidden
                        {...list.insert(fields.additionalDisciplines.name, {
                          defaultValue: filteredAdditionalDiscipline.id,
                        })}
                      >
                        {filteredAdditionalDiscipline.title}
                      </button>
                      <option
                        key={filteredAdditionalDiscipline.id}
                        value={filteredAdditionalDiscipline.id}
                        className="my-2"
                      >
                        {filteredAdditionalDiscipline.title}
                      </option>
                    </React.Fragment>
                  );
                })}
            </Select>
            {additionalDisciplineList.length > 0 && (
              <Chip.Container>
                {additionalDisciplineList.map(
                  (listAdditionalDiscipline, index) => {
                    return (
                      <Chip key={listAdditionalDiscipline.key}>
                        {allAdditionalDisciplines.find(
                          (additionalDiscipline) => {
                            return (
                              additionalDiscipline.id ===
                              listAdditionalDiscipline.defaultValue
                            );
                          }
                        )?.title || "Not Found"}
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
                  Welche weiteren Teildisziplinen (oder Techniken, Verfahren)
                  spielen eine Rolle?
                </Input.Label>
                <Input.HelperText>
                  Bitte füge die Begriffe jeweils einzeln hinzu.
                </Input.HelperText>
                <Input.Controls>
                  <Button
                    {...list.insert(fields.furtherDisciplines.name, {
                      defaultValue: furtherDiscipline,
                    })}
                    variant="ghost"
                    disabled={furtherDiscipline === ""}
                  >
                    Hinzufügen
                  </Button>
                </Input.Controls>
              </Input>
              {/* <div className="mv--mt-1">
              </div> */}
            </div>
            {furtherDisciplinesList.length > 0 && (
              <Chip.Container>
                {furtherDisciplinesList.map((listFurtherDiscipline, index) => {
                  return (
                    <Chip key={listFurtherDiscipline.key}>
                      {listFurtherDiscipline.defaultValue || "Not Found"}
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

          <div className="mv-flex mv-flex-col mv-gap-4 md:mv-p-4 md:mv-border md:mv-rounded-lg md:mv-border-gray-200">
            <h2 className="mv-text-primary mv-text-lg mv-font-semibold mv-mb-0">
              Teilnehmer:innen
            </h2>

            <Input {...conform.input(fields.participantLimit)}>
              <Input.Label htmlFor={fields.participantLimit.id}>
                Wenn Dein Projekt für eine konkrete Teilnehmer:innenzahl bspw.
                pro Kurs konzipiert ist, gib diese bitte an.
              </Input.Label>
              {typeof fields.participantLimit.error !== "undefined" && (
                <Input.Error>{fields.participantLimit.error}</Input.Error>
              )}
              <Input.HelperText>
                Hier kannst du Zahlen aber auch zusätzliche Informationen
                eingeben.
              </Input.HelperText>
            </Input>

            <Select onChange={handleSelectChange}>
              <Select.Label htmlFor={fields.projectTargetGroups.id}>
                Welche Zielgruppe spricht das Projekt an?
              </Select.Label>
              <Select.HelperText>
                Mehrfachnennungen sind möglich.
              </Select.HelperText>
              <option selected hidden>
                Bitte auswählen
              </option>
              {allProjectTargetGroups
                .filter((targetGroup) => {
                  return !targetGroupList.some((listTargetGroup) => {
                    return listTargetGroup.defaultValue === targetGroup.id;
                  });
                })
                .map((filteredTargetGroup) => {
                  return (
                    <React.Fragment key={`${filteredTargetGroup.id}-fragment`}>
                      <button
                        hidden
                        {...list.insert(fields.projectTargetGroups.name, {
                          defaultValue: filteredTargetGroup.id,
                        })}
                      >
                        {filteredTargetGroup.title}
                      </button>
                      <option
                        key={filteredTargetGroup.id}
                        value={filteredTargetGroup.id}
                        className="my-2"
                      >
                        {filteredTargetGroup.title}
                      </option>
                    </React.Fragment>
                  );
                })}
            </Select>
            {targetGroupList.length > 0 && (
              <Chip.Container>
                {targetGroupList.map((listTargetGroup, index) => {
                  return (
                    <Chip key={listTargetGroup.key}>
                      {allProjectTargetGroups.find((targetGroup) => {
                        return targetGroup.id === listTargetGroup.defaultValue;
                      })?.title || "Not Found"}
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

            <Select onChange={handleSelectChange}>
              <Select.Label htmlFor={fields.specialTargetGroups.id}>
                Wird eine bestimmte (geschlechtsspezifische, soziale, kulturelle
                oder demografische etc.) Gruppe innerhalb der Zielgruppe
                angesprochen?
              </Select.Label>
              <Select.HelperText>
                Mehrfachnennungen sind möglich.
              </Select.HelperText>
              <option selected hidden>
                Bitte auswählen
              </option>
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
                    <React.Fragment
                      key={`${filteredSpecialTargetGroup.id}-fragment`}
                    >
                      <button
                        hidden
                        {...list.insert(fields.specialTargetGroups.name, {
                          defaultValue: filteredSpecialTargetGroup.id,
                        })}
                      >
                        {filteredSpecialTargetGroup.title}
                      </button>
                      <option
                        key={filteredSpecialTargetGroup.id}
                        value={filteredSpecialTargetGroup.id}
                        className="my-2"
                      >
                        {filteredSpecialTargetGroup.title}
                      </option>
                    </React.Fragment>
                  );
                })}
            </Select>
            {specialTargetGroupList.length > 0 && (
              <Chip.Container>
                {specialTargetGroupList.map((listSpecialTargetGroup, index) => {
                  return (
                    <Chip key={listSpecialTargetGroup.key}>
                      {allSpecialTargetGroups.find((specialTargetGroup) => {
                        return (
                          specialTargetGroup.id ===
                          listSpecialTargetGroup.defaultValue
                        );
                      })?.title || "Not Found"}
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
                Weitere
              </Input.Label>
              {typeof fields.targetGroupAdditions.error !== "undefined" && (
                <Input.Error>{fields.targetGroupAdditions.error}</Input.Error>
              )}
            </Input>
          </div>

          <div className="mv-flex mv-flex-col mv-gap-4 md:mv-p-4 md:mv-border md:mv-rounded-lg md:mv-border-gray-200">
            <h2 className="mv-text-primary mv-text-lg mv-font-semibold mv-mb-0">
              Kurztext zu Deinem Projekt
            </h2>

            <p>
              Fasse Dein Projekt in einem Satz zusammen. Dieser Text wird als
              Teaser angezeigt.
            </p>

            <Input {...conform.input(fields.excerpt)}>
              <Input.Label htmlFor={fields.excerpt.id}>
                Kurzbeschreibung
              </Input.Label>
              {typeof fields.excerpt.error !== "undefined" && (
                <Input.Error>{fields.excerpt.error}</Input.Error>
              )}
            </Input>
          </div>

          <div className="mv-flex mv-flex-col mv-gap-4 md:mv-p-4 md:mv-border md:mv-rounded-lg md:mv-border-gray-200">
            <h2 className="mv-text-primary mv-text-lg mv-font-semibold mv-mb-0">
              Ausführliche Beschreibung
            </h2>

            <p>
              Nutze für Deine Beschreibungen die vorgegebenen Felder oder
              strukturiere Deine Projektbeschreibung mit Hilfe von
              selbstgewählten Überschriften in Feld “Sonstiges”.
            </p>

            <TextAreaWithCounter
              {...conform.textarea(fields.idea)}
              id={fields.idea.id || ""}
              label="Idee"
              helperText="Beschreibe die Idee hinter Deinem Projekt."
              errorMessage={fields.idea.error}
              maxCharacters={2000}
              rte
            />

            <TextAreaWithCounter
              {...conform.textarea(fields.goals)}
              id={fields.goals.id || ""}
              label="Ziele"
              helperText="Beschreibe Lernziele oder mögliche Ergebnisse."
              errorMessage={fields.goals.error}
              maxCharacters={2000}
              rte
            />

            <TextAreaWithCounter
              {...conform.textarea(fields.implementation)}
              id={fields.implementation.id || ""}
              label="Durchführung"
              helperText="Welche Schritte werden durchgeführt?"
              errorMessage={fields.implementation.error}
              maxCharacters={2000}
              rte
            />

            <TextAreaWithCounter
              {...conform.textarea(fields.furtherDescription)}
              id={fields.furtherDescription.id || ""}
              label="Sonstiges"
              helperText="Was möchtest Du außerdem der Community mitgeben? Nutze dieses Feld
              um Deine Projekt-Beschreibung mit Überschriften selbst zu
              strukturieren."
              errorMessage={fields.furtherDescription.error}
              maxCharacters={8000}
              rte
            />

            <TextAreaWithCounter
              {...conform.textarea(fields.targeting)}
              id={fields.targeting.id || ""}
              label="Wie wird die Zielgruppe erreicht?"
              helperText="Welche Maßnahmen werden durchgeführt um die Zielgruppe
              anzusprechen? Womit wird geworben? Gibt es neben dem Erlernten
              weitere Benefits?"
              errorMessage={fields.targeting.error}
              maxCharacters={800}
              rte
            />

            <TextAreaWithCounter
              {...conform.textarea(fields.hints)}
              id={fields.hints.id || ""}
              label="Tipps zum Nachahmen"
              helperText="Was kannst Du Akteur:innen mitgeben, die ein ähnliches Projekt auf
              die Beine stellen wollen. Was gibt es zu beachten?"
              errorMessage={fields.hints.error}
              maxCharacters={800}
              rte
            />
          </div>

          <div className="mv-flex mv-flex-col mv-gap-4 md:mv-p-4 md:mv-border md:mv-rounded-lg md:mv-border-gray-200">
            <h2 className="mv-text-primary mv-text-lg mv-font-semibold mv-mb-0">
              Video-Link zu Deinem Projekt
            </h2>

            <Input
              {...conform.input(fields.video)}
              placeholder="youtube.com/watch?v=<videoCode>"
            >
              <Input.Label htmlFor={fields.video.id}>
                Einbettungslink
              </Input.Label>
              {typeof fields.video.error !== "undefined" && (
                <Input.Error>{fields.video.error}</Input.Error>
              )}
              <Input.HelperText>
                Kopiere die Youtube-URL deines Videos aus der Adresszeile des
                Browsers, nutze die Teilenfunktion oder den Embed-Link von
                YouTube.
              </Input.HelperText>
            </Input>

            <Input {...conform.input(fields.videoSubline)}>
              <Input.Label htmlFor={fields.videoSubline.id}>
                Bitte gibt hier eine Bildunterschrift für Dein Video ein.
              </Input.Label>
              {typeof fields.videoSubline.error !== "undefined" && (
                <Input.Error>{fields.videoSubline.error}</Input.Error>
              )}
            </Input>
          </div>

          <div className="mv-flex mv-w-full mv-justify-end">
            <div className="mv-flex mv-shrink mv-w-full md:mv-max-w-fit lg:mv-w-auto mv-items-center mv-justify-center lg:mv-justify-end">
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
                  Änderungen verwerfen
                </Button>
                {/* TODO: Use Button type reset when RTE is resetable. Currently the rte does not reset via button type reset */}
                {/* <Button type="reset" variant="outline" fullSize>
                  Änderungen verwerfen
                </Button> */}
                {/* TODO: Add diabled attribute. Note: I'd like to use a hook from kent that needs remix v2 here. see /app/lib/utils/hooks.ts  */}

                <Button
                  type="submit"
                  fullSize
                  onClick={() => {
                    setIsDirty(false);
                  }}
                >
                  Speichern
                </Button>
              </Controls>
            </div>
          </div>
          {/* Workarround error messages because conform mapping and error displaying is not working yet with Select and RTE components */}
          {fields.additionalDisciplines.error !== undefined && (
            <Alert level="negative">
              Zusätzliche Disziplinen: {fields.additionalDisciplines.error}
            </Alert>
          )}
          {fields.idea.error !== undefined && (
            <Alert level="negative">
              Ausführliche Beschreibung - Idee: {fields.idea.error}
            </Alert>
          )}
          {fields.goals.error !== undefined && (
            <Alert level="negative">
              Ausführliche Beschreibung - Ziele: {fields.goals.error}
            </Alert>
          )}
          {fields.implementation.error !== undefined && (
            <Alert level="negative">
              Ausführliche Beschreibung - Durchführung:{" "}
              {fields.implementation.error}
            </Alert>
          )}
          {fields.furtherDescription.error !== undefined && (
            <Alert level="negative">
              Ausführliche Beschreibung - Sonstiges:{" "}
              {fields.furtherDescription.error}
            </Alert>
          )}
          {fields.targeting.error !== undefined && (
            <Alert level="negative">
              Ausführliche Beschreibung - Zielgruppenansprache:{" "}
              {fields.targeting.error}
            </Alert>
          )}
          {fields.hints.error !== undefined && (
            <Alert level="negative">
              Ausführliche Beschreibung - Tipps: {fields.hints.error}
            </Alert>
          )}
        </div>
      </Form>
    </Section>
  );
}

export default Details;
