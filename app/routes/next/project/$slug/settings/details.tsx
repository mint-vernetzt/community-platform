import { conform, list, useFieldList, useForm } from "@conform-to/react";
import { getFieldsetConstraint, parse } from "@conform-to/zod";
import { json, redirect, type DataFunctionArgs } from "@remix-run/node";
import {
  Form,
  useActionData,
  useLoaderData,
  useLocation,
} from "@remix-run/react";
import React from "react";
import { z } from "zod";
import { createAuthClient, getSessionUser } from "~/auth.server";
import { invariantResponse } from "~/lib/utils/response";
import { prismaClient } from "~/prisma.server";
import { BackButton } from "./__components";
import { getRedirectPathOnProtectedProjectRoute } from "./utils.server";
import { youtubeSchema } from "~/lib/utils/schemas";

// TODO:

// Migrate scripts:
// - description -> furtherDescription
// - map old disciplines to new ones
// - map old target groups to new ones

const detailsSchema = z.object({
  disciplines: z.array(z.string().uuid()),
  additionalDisciplines: z.array(z.string().uuid()),
  furtherDisciplines: z.array(z.string()),
  participantLimit: z
    .string()
    .regex(/[0-9]*/g, {
      message: "Die Anzahl der Teilnehmer:innen muss eine Zahl sein.",
    })
    .optional()
    .transform((value) => (value === undefined ? null : value)),
  targetGroups: z.array(z.string().uuid()),
  specialTargetGroups: z.array(z.string().uuid()),
  targetGroupAdditions: z
    .string()
    .optional()
    .transform((value) => (value === undefined ? null : value)),
  excerpt: z
    .string()
    .optional()
    .transform((value) => (value === undefined ? null : value)),
  idea: z
    .string()
    .optional()
    .transform((value) => (value === undefined ? null : value)),
  goals: z
    .string()
    .optional()
    .transform((value) => (value === undefined ? null : value)),
  implementation: z
    .string()
    .optional()
    .transform((value) => (value === undefined ? null : value)),
  furtherDescription: z
    .string()
    .optional()
    .transform((value) => (value === undefined ? null : value)),
  targeting: z
    .string()
    .optional()
    .transform((value) => (value === undefined ? null : value)),
  hints: z
    .string()
    .optional()
    .transform((value) => (value === undefined ? null : value)),
  video: youtubeSchema,
  videoSubline: z
    .string()
    .optional()
    .transform((value) => (value === undefined ? null : value)),
});

export const loader = async (args: DataFunctionArgs) => {
  const { request, params } = args;
  const response = new Response();

  const authClient = createAuthClient(request, response);

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
    return redirect(redirectPath, { headers: response.headers });
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
      targetGroups: {
        select: {
          targetGroup: {
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

  const allTargetGroups = await prismaClient.targetGroup.findMany({
    select: {
      id: true,
      title: true,
    },
  });

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
    allTargetGroups,
    allSpecialTargetGroups,
  });
};

export async function action({ request, params }: DataFunctionArgs) {
  const response = new Response();
  const authClient = createAuthClient(request, response);
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
    return redirect(redirectPath, { headers: response.headers });
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
            path: ["additionalDisciplines"],
            message:
              "Zusätzliche Disziplinen können nur gewählt werden, wenn mindestens eine Hauptdisziplin ausgewählt wurde.",
          });
          return z.NEVER;
        }

        const {
          disciplines,
          additionalDisciplines,
          targetGroups,
          specialTargetGroups,
          ...rest
        } = data;
        try {
          await prismaClient.project.update({
            where: {
              slug: params.slug,
            },
            data: {
              ...rest,
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
              targetGroups: {
                deleteMany: {},
                connectOrCreate: targetGroups.map((targetGroupId: string) => {
                  return {
                    where: {
                      targetGroupId_projectId: {
                        targetGroupId: targetGroupId,
                        projectId: project.id,
                      },
                    },
                    create: {
                      targetGroupId,
                    },
                  };
                }),
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

  if (submission.intent !== "submit") {
    return json({ status: "idle", submission } as const);
  }
  if (!submission.value) {
    return json({ status: "error", submission } as const, { status: 400 });
  }

  return json({ status: "success", submission } as const, { status: 200 });
}

function Details() {
  const location = useLocation();
  const loaderData = useLoaderData<typeof loader>();
  const {
    project,
    allDisciplines,
    allAdditionalDisciplines,
    allTargetGroups,
    allSpecialTargetGroups,
  } = loaderData;
  const {
    disciplines,
    additionalDisciplines,
    targetGroups,
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
      targetGroups: project.targetGroups.map(
        (relation) => relation.targetGroup.id
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
  const targetGroupList = useFieldList(form.ref, fields.targetGroups);
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
    for (let child of event.currentTarget.children) {
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

  return (
    <>
      <BackButton to={location.pathname}>Projekt-Details</BackButton>
      <p>
        Teile der Community mehr über Dein Projekt oder Bildungsangebot mit.
      </p>
      <Form method="post" {...form.props}>
        {/* This button ensures submission via enter key. Always use a hidden button at top of the form when other submit buttons are inside it (f.e. the add/remove list buttons) */}
        <button type="submit" hidden></button>

        <h2>MINT-Disziplinen</h2>

        <div>
          <label htmlFor={fields.disciplines.id}>
            Welche MINT-Disziplinen spielen in Deinem Projekt eine Rolle?
          </label>

          <div className="flex flex-col">
            <select onChange={handleSelectChange}>
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
                    <>
                      <button
                        key={`${filteredDiscipline.id}-add-button`}
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
                    </>
                  );
                })}
            </select>
          </div>
          <ul>
            {disciplineList.map((listDiscipline, index) => {
              return (
                <li className="flex flex-row my-2" key={listDiscipline.key}>
                  <p>
                    {allDisciplines.find((discipline) => {
                      return discipline.id === listDiscipline.defaultValue;
                    })?.title || "Not Found"}
                  </p>
                  <input hidden {...conform.input(listDiscipline)} />
                  <button
                    className="ml-2"
                    {...list.remove(fields.disciplines.name, { index })}
                  >
                    - Delete
                  </button>
                </li>
              );
            })}
          </ul>
          {fields.disciplines.errors !== undefined &&
            fields.disciplines.errors.length > 0 && (
              <ul id={fields.disciplines.errorId}>
                {fields.disciplines.errors.map((e) => (
                  <li key={e}>{e}</li>
                ))}
              </ul>
            )}
        </div>
        <p>Mehrfachnennungen sind möglich.</p>

        <div>
          <label htmlFor={fields.additionalDisciplines.id}>
            Welche zusätzlichen Disziplinen spielen in Deinem Projekt eine
            Rolle?
          </label>

          <div className="flex flex-col">
            <select onChange={handleSelectChange}>
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
                    <>
                      <button
                        key={`${filteredAdditionalDiscipline.id}-add-button`}
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
                    </>
                  );
                })}
            </select>
          </div>
          <ul>
            {additionalDisciplineList.map((listAdditionalDiscipline, index) => {
              return (
                <li
                  className="flex flex-row my-2"
                  key={listAdditionalDiscipline.key}
                >
                  <p>
                    {allAdditionalDisciplines.find((additionalDiscipline) => {
                      return (
                        additionalDiscipline.id ===
                        listAdditionalDiscipline.defaultValue
                      );
                    })?.title || "Not Found"}
                  </p>
                  <input hidden {...conform.input(listAdditionalDiscipline)} />
                  <button
                    className="ml-2"
                    {...list.remove(fields.additionalDisciplines.name, {
                      index,
                    })}
                  >
                    - Delete
                  </button>
                </li>
              );
            })}
          </ul>
          {fields.additionalDisciplines.errors !== undefined &&
            fields.additionalDisciplines.errors.length > 0 && (
              <ul id={fields.additionalDisciplines.errorId}>
                {fields.additionalDisciplines.errors.map((e) => (
                  <li key={e}>{e}</li>
                ))}
              </ul>
            )}
        </div>
        <p>Mehrfachnennungen sind möglich.</p>

        <div>
          <label htmlFor={fields.furtherDisciplines.id}>
            Welche weiteren Teildisziplinen (oder Techniken, Verfahren) spielen
            eine Rolle?
          </label>
          <div className="flex flex-col">
            <ul>
              <li>
                <input
                  className="my-2"
                  onChange={handleFurtherDisciplineInputChange}
                  value={furtherDiscipline}
                />
                <button
                  className="ml-2"
                  {...list.insert(fields.furtherDisciplines.name, {
                    defaultValue: furtherDiscipline,
                  })}
                >
                  + Add
                </button>
              </li>
              {furtherDisciplinesList.map((furtherDiscipline, index) => {
                return (
                  <li
                    className="flex flex-row my-2"
                    key={furtherDiscipline.key}
                  >
                    <p>{furtherDiscipline.defaultValue || "Not Found"}</p>
                    <input hidden {...conform.input(furtherDiscipline)} />
                    <button
                      className="ml-2"
                      {...list.remove(fields.furtherDisciplines.name, {
                        index,
                      })}
                    >
                      - Delete
                    </button>
                  </li>
                );
              })}
            </ul>
            {fields.furtherDisciplines.errors !== undefined &&
              fields.furtherDisciplines.errors.length > 0 && (
                <ul id={fields.furtherDisciplines.errorId}>
                  {fields.furtherDisciplines.errors.map((e) => (
                    <li key={e}>{e}</li>
                  ))}
                </ul>
              )}
          </div>
        </div>
        <p>Bitte gib kurze Begriffe an.</p>

        <h2>Teilnehmer:innen</h2>

        <div>
          <label htmlFor={fields.participantLimit.id}>
            Für wie viele Teilnehmer:innen ist Dein Projekt/Bildungangebot
            gedacht?
          </label>
          <input className="ml-2" {...conform.input(fields.participantLimit)} />
          {fields.participantLimit.errors !== undefined &&
            fields.participantLimit.errors.length > 0 && (
              <ul id={fields.participantLimit.errorId}>
                {fields.participantLimit.errors.map((e) => (
                  <li key={e}>{e}</li>
                ))}
              </ul>
            )}
        </div>

        <div>
          <label htmlFor={fields.targetGroups.id}>
            Welche Zielgruppe spricht das Projekt an?
          </label>

          <div className="flex flex-col">
            <select onChange={handleSelectChange}>
              <option selected hidden>
                Bitte auswählen
              </option>
              {allTargetGroups
                .filter((targetGroup) => {
                  return !targetGroupList.some((listTargetGroup) => {
                    return listTargetGroup.defaultValue === targetGroup.id;
                  });
                })
                .map((filteredTargetGroup) => {
                  return (
                    <>
                      <button
                        key={`${filteredTargetGroup.id}-add-button`}
                        hidden
                        {...list.insert(fields.targetGroups.name, {
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
                    </>
                  );
                })}
            </select>
          </div>
          <ul>
            {targetGroupList.map((listTargetGroup, index) => {
              return (
                <li className="flex flex-row my-2" key={listTargetGroup.key}>
                  <p>
                    {allTargetGroups.find((targetGroup) => {
                      return targetGroup.id === listTargetGroup.defaultValue;
                    })?.title || "Not Found"}
                  </p>
                  <input hidden {...conform.input(listTargetGroup)} />
                  <button
                    className="ml-2"
                    {...list.remove(fields.targetGroups.name, { index })}
                  >
                    - Delete
                  </button>
                </li>
              );
            })}
          </ul>
          {fields.targetGroups.errors !== undefined &&
            fields.targetGroups.errors.length > 0 && (
              <ul id={fields.targetGroups.errorId}>
                {fields.targetGroups.errors.map((e) => (
                  <li key={e}>{e}</li>
                ))}
              </ul>
            )}
        </div>
        <p>Mehrfachnennungen sind möglich.</p>

        <div>
          <label htmlFor={fields.specialTargetGroups.id}>
            Wird eine bestimmte (geschlechtsspezifische, soziale, kulturelle
            oder demografische etc.) Gruppe innerhalb der Zielgruppe
            angesprochen?
          </label>

          <div className="flex flex-col">
            <select onChange={handleSelectChange}>
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
                    <>
                      <button
                        key={`${filteredSpecialTargetGroup.id}-add-button`}
                        hidden
                        {...list.insert(fields.specialTargetGroups.name, {
                          defaultValue: filteredSpecialTargetGroup.id,
                        })}
                      >
                        {filteredSpecialTargetGroup.title}
                      </button>
                      {/* TODO: Add special target group description */}
                      <option
                        key={filteredSpecialTargetGroup.id}
                        value={filteredSpecialTargetGroup.id}
                        className="my-2"
                      >
                        {filteredSpecialTargetGroup.title}
                      </option>
                    </>
                  );
                })}
            </select>
          </div>
          <ul>
            {specialTargetGroupList.map((listSpecialTargetGroup, index) => {
              return (
                <li
                  className="flex flex-row my-2"
                  key={listSpecialTargetGroup.key}
                >
                  <p>
                    {allSpecialTargetGroups.find((specialTargetGroup) => {
                      return (
                        specialTargetGroup.id ===
                        listSpecialTargetGroup.defaultValue
                      );
                    })?.title || "Not Found"}
                  </p>
                  <input hidden {...conform.input(listSpecialTargetGroup)} />
                  <button
                    className="ml-2"
                    {...list.remove(fields.specialTargetGroups.name, { index })}
                  >
                    - Delete
                  </button>
                </li>
              );
            })}
          </ul>
          {fields.specialTargetGroups.errors !== undefined &&
            fields.specialTargetGroups.errors.length > 0 && (
              <ul id={fields.specialTargetGroups.errorId}>
                {fields.specialTargetGroups.errors.map((e) => (
                  <li key={e}>{e}</li>
                ))}
              </ul>
            )}
        </div>
        <p>Mehrfachnennungen sind möglich.</p>

        <div>
          <label htmlFor={fields.targetGroupAdditions.id}>Ergänzungen</label>
          <input
            className="ml-2"
            {...conform.input(fields.targetGroupAdditions)}
          />
          {/* TODO: Add character count 200 */}
          <p>0/200</p>
          {fields.targetGroupAdditions.errors !== undefined &&
            fields.targetGroupAdditions.errors.length > 0 && (
              <ul id={fields.targetGroupAdditions.errorId}>
                {fields.targetGroupAdditions.errors.map((e) => (
                  <li key={e}>{e}</li>
                ))}
              </ul>
            )}
        </div>

        <h2>Kurztext zu Deinem Projekt</h2>

        <p>
          Fasse Dein Projekt in einem Satz zusammen. Dieser Text wird als Teaser
          angezeigt.
        </p>

        <div>
          <label htmlFor={fields.excerpt.id}>Kurzbeschreibung</label>
          {/* TODO: Add RTE */}
          <textarea className="ml-2" {...conform.textarea(fields.excerpt)} />
          {/* TODO: Add character count 100 */}
          <p>0/100</p>
          {fields.excerpt.errors !== undefined &&
            fields.excerpt.errors.length > 0 && (
              <ul id={fields.excerpt.errorId}>
                {fields.excerpt.errors.map((e) => (
                  <li key={e}>{e}</li>
                ))}
              </ul>
            )}
        </div>

        <h2>Ausführliche Beschreibung</h2>

        <p>
          Nutze für Deine Beschreibungen die vorgegebenen Felder oder
          strukturiere Deine Projektbeschreibung mit Hilfe von selbstgewählten
          Überschriften in Feld “Sonstiges”.
        </p>

        <div>
          <label htmlFor={fields.idea.id}>Idee</label>
          {/* TODO: Add RTE */}
          <textarea className="ml-2" {...conform.textarea(fields.idea)} />
          {/* TODO: Add character count 2000 */}
          <p>0/2000</p>
          {fields.idea.errors !== undefined && fields.idea.errors.length > 0 && (
            <ul id={fields.idea.errorId}>
              {fields.idea.errors.map((e) => (
                <li key={e}>{e}</li>
              ))}
            </ul>
          )}
        </div>

        <div>
          <label htmlFor={fields.goals.id}>Ziele</label>
          {/* TODO: Add RTE */}
          <textarea className="ml-2" {...conform.textarea(fields.goals)} />
          {/* TODO: Add character count 2000 */}
          <p>0/2000</p>
          {fields.goals.errors !== undefined && fields.goals.errors.length > 0 && (
            <ul id={fields.goals.errorId}>
              {fields.goals.errors.map((e) => (
                <li key={e}>{e}</li>
              ))}
            </ul>
          )}
        </div>
        <p>Beschreibe Lernziele oder mögliche Ergebnisse.</p>

        <div>
          <label htmlFor={fields.implementation.id}>Durchführung</label>
          {/* TODO: Add RTE */}
          <textarea
            className="ml-2"
            {...conform.textarea(fields.implementation)}
          />
          {/* TODO: Add character count 2000 */}
          <p>0/2000</p>
          {fields.implementation.errors !== undefined &&
            fields.implementation.errors.length > 0 && (
              <ul id={fields.implementation.errorId}>
                {fields.implementation.errors.map((e) => (
                  <li key={e}>{e}</li>
                ))}
              </ul>
            )}
        </div>
        <p>Welche Schritte werden durchgeführt?</p>

        <div>
          <label htmlFor={fields.furtherDescription.id}>Sonstiges</label>
          {/* TODO: Add RTE */}
          <textarea
            className="ml-2"
            {...conform.textarea(fields.furtherDescription)}
          />
          {/* TODO: Add character count 8000 */}
          <p>0/8000</p>
          {fields.furtherDescription.errors !== undefined &&
            fields.furtherDescription.errors.length > 0 && (
              <ul id={fields.furtherDescription.errorId}>
                {fields.furtherDescription.errors.map((e) => (
                  <li key={e}>{e}</li>
                ))}
              </ul>
            )}
        </div>
        <p>
          Was möchtest Du außerdem der Community mitgeben? Nutze dieses Feld um
          Deine Projekt-Beschreibung mit Überschriften selbst zu strukturieren.
        </p>

        <div>
          <label htmlFor={fields.targeting.id}>
            Wie wird die Zielgruppe erreicht?
          </label>
          {/* TODO: Add RTE */}
          <textarea className="ml-2" {...conform.textarea(fields.targeting)} />
          {/* TODO: Add character count 800 */}
          <p>0/800</p>
          {fields.targeting.errors !== undefined &&
            fields.targeting.errors.length > 0 && (
              <ul id={fields.targeting.errorId}>
                {fields.targeting.errors.map((e) => (
                  <li key={e}>{e}</li>
                ))}
              </ul>
            )}
        </div>
        <p>
          Welche Maßnahmen werden durchgeführt um die Zielgruppe anzusprechen?
          Womit wird geworben? Gibt es neben dem Erlernten weitere Benefits?
        </p>

        <div>
          <label htmlFor={fields.hints.id}>Tipps zum Nachahmen</label>
          {/* TODO: Add RTE */}
          <textarea className="ml-2" {...conform.textarea(fields.hints)} />
          {/* TODO: Add character count 800 */}
          <p>0/800</p>
          {fields.hints.errors !== undefined && fields.hints.errors.length > 0 && (
            <ul id={fields.hints.errorId}>
              {fields.hints.errors.map((e) => (
                <li key={e}>{e}</li>
              ))}
            </ul>
          )}
        </div>
        <p>
          Was kannst Du Akteur:innen mitgeben, die ein ähnliches Projekt auf die
          Beine stellen wollen. Was gibt es zu beachten?
        </p>

        <h2>Video-Link zu Deinem Projekt</h2>

        <div>
          <label htmlFor={fields.video.id}>Einbettungslink</label>
          <input
            placeholder="youtube.com/<name>"
            className="ml-2"
            {...conform.input(fields.video)}
          />
          {fields.video.errors !== undefined && fields.video.errors.length > 0 && (
            <ul id={fields.video.errorId}>
              {fields.video.errors.map((e) => (
                <li key={e}>{e}</li>
              ))}
            </ul>
          )}
        </div>

        <div>
          <label htmlFor={fields.videoSubline.id}>
            Bitte gibt hier eine Bildunterschrift für Dein Video ein.
          </label>
          <input className="ml-2" {...conform.input(fields.videoSubline)} />
          {/* TODO: Add character count 80 */}
          <p>0/80</p>
          {fields.videoSubline.errors !== undefined &&
            fields.videoSubline.errors.length > 0 && (
              <ul id={fields.videoSubline.errorId}>
                {fields.videoSubline.errors.map((e) => (
                  <li key={e}>{e}</li>
                ))}
              </ul>
            )}
        </div>

        {/* TODO: Add Toast as success message */}

        <ul id={form.errorId}>
          {form.errors.map((e) => (
            <li key={e}>{e}</li>
          ))}
        </ul>

        <div>
          <button type="reset">Änderungen verwerfen</button>
        </div>
        <div>
          {/* TODO: Add diabled attribute. Note: I'd like to use a hook from kent that needs remix v2 here. see /app/lib/utils/hooks.ts on branch "1094-feature-project-settings-web-and-social" */}
          <button type="submit">Speichern</button>
        </div>
      </Form>
    </>
  );
}

export default Details;
