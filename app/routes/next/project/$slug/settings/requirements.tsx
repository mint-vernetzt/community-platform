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
  Toast,
} from "@mint-vernetzt/components";
import {
  json,
  redirect,
  type DataFunctionArgs,
  type LinksFunction,
} from "@remix-run/node";
import {
  Form,
  useActionData,
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
import { prismaClient } from "~/prisma.server";
import { BackButton } from "./__components";
import {
  getRedirectPathOnProtectedProjectRoute,
  getSubmissionHash,
} from "./utils.server";

const requirementsSchema = z.object({
  timeframe: z
    .string()
    .optional()
    .transform((value) => (value === undefined || value === "" ? null : value))
    .refine(
      (value) => {
        return (
          // Entities are being replaced by "x" just to get the right count for them.
          replaceHtmlEntities(removeHtmlTags(value || ""), "x").length <= 200
        );
      },
      {
        message:
          "Deine Eingabe übersteigt die maximal zulässige Zeichenzahl von 200.",
      }
    ),
  jobFillings: z
    .string()
    .optional()
    .transform((value) => (value === undefined || value === "" ? null : value))
    .refine(
      (value) => {
        return (
          // Entities are being replaced by "x" just to get the right count for them.
          replaceHtmlEntities(removeHtmlTags(value || ""), "x").length <= 500
        );
      },
      {
        message:
          "Deine Eingabe übersteigt die maximal zulässige Zeichenzahl von 500.",
      }
    ),
  furtherJobFillings: z
    .string()
    .optional()
    .transform((value) => (value === undefined || value === "" ? null : value))
    .refine(
      (value) => {
        return (
          // Entities are being replaced by "x" just to get the right count for them.
          replaceHtmlEntities(removeHtmlTags(value || ""), "x").length <= 200
        );
      },
      {
        message:
          "Deine Eingabe übersteigt die maximal zulässige Zeichenzahl von 200.",
      }
    ),
  yearlyBudget: z
    .string()
    .max(
      80,
      "Deine Eingabe übersteigt die maximal zulässige Zeichenzahl von 80."
    )
    .optional()
    .transform((value) => (value === undefined || value === "" ? null : value)),
  financings: z.array(z.string().uuid()),
  furtherFinancings: z
    .string()
    .optional()
    .transform((value) => (value === undefined || value === "" ? null : value))
    .refine(
      (value) => {
        return (
          // Entities are being replaced by "x" just to get the right count for them.
          replaceHtmlEntities(removeHtmlTags(value || ""), "x").length <= 500
        );
      },
      {
        message:
          "Deine Eingabe übersteigt die maximal zulässige Zeichenzahl von 500.",
      }
    ),
  technicalRequirements: z
    .string()
    .optional()
    .transform((value) => (value === undefined || value === "" ? null : value))
    .refine(
      (value) => {
        return (
          // Entities are being replaced by "x" just to get the right count for them.
          replaceHtmlEntities(removeHtmlTags(value || ""), "x").length <= 500
        );
      },
      {
        message:
          "Deine Eingabe übersteigt die maximal zulässige Zeichenzahl von 500.",
      }
    ),
  furtherTechnicalRequirements: z
    .string()
    .optional()
    .transform((value) => (value === undefined || value === "" ? null : value))
    .refine(
      (value) => {
        return (
          // Entities are being replaced by "x" just to get the right count for them.
          replaceHtmlEntities(removeHtmlTags(value || ""), "x").length <= 500
        );
      },
      {
        message:
          "Deine Eingabe übersteigt die maximal zulässige Zeichenzahl von 500.",
      }
    ),
  roomSituation: z
    .string()
    .optional()
    .transform((value) => (value === undefined || value === "" ? null : value))
    .refine(
      (value) => {
        return (
          // Entities are being replaced by "x" just to get the right count for them.
          replaceHtmlEntities(removeHtmlTags(value || ""), "x").length <= 200
        );
      },
      {
        message:
          "Deine Eingabe übersteigt die maximal zulässige Zeichenzahl von 200.",
      }
    ),
  furtherRoomSituation: z
    .string()
    .optional()
    .transform((value) => (value === undefined || value === "" ? null : value))
    .refine(
      (value) => {
        return (
          // Entities are being replaced by "x" just to get the right count for them.
          replaceHtmlEntities(removeHtmlTags(value || ""), "x").length <= 200
        );
      },
      {
        message:
          "Deine Eingabe übersteigt die maximal zulässige Zeichenzahl von 200.",
      }
    ),
});

export const links: LinksFunction = () => [
  { rel: "stylesheet", href: quillStyles },
];

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

  invariantResponse(sessionUser !== null, "Not logged in", {
    status: 403,
  });

  const project = await prismaClient.project.findUnique({
    select: {
      timeframe: true,
      jobFillings: true,
      furtherJobFillings: true,
      yearlyBudget: true,
      furtherFinancings: true,
      technicalRequirements: true,
      furtherTechnicalRequirements: true,
      roomSituation: true,
      furtherRoomSituation: true,
      financings: {
        select: {
          financing: {
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

  const allFinancings = await prismaClient.financing.findMany({
    select: {
      id: true,
      title: true,
    },
  });

  return json({ project, allFinancings }, { headers: response.headers });
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
      requirementsSchema.transform(async (data, ctx) => {
        if (intent !== "submit") return { ...data };

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

        try {
          await prismaClient.project.update({
            where: {
              slug: params.slug,
            },
            data: {
              ...rest,
              timeframe: sanitizeUserHtml(timeframe),
              jobFillings: sanitizeUserHtml(jobFillings),
              furtherJobFillings: sanitizeUserHtml(furtherJobFillings),
              furtherFinancings: sanitizeUserHtml(furtherFinancings),
              technicalRequirements: sanitizeUserHtml(technicalRequirements),
              furtherTechnicalRequirements: sanitizeUserHtml(
                furtherTechnicalRequirements
              ),
              roomSituation: sanitizeUserHtml(roomSituation),
              furtherRoomSituation: sanitizeUserHtml(furtherRoomSituation),
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
    return json({ status: "idle", submission, hash } as const, {
      headers: response.headers,
    });
  }
  if (!submission.value) {
    return json({ status: "error", submission, hash } as const, {
      status: 400,
      headers: response.headers,
    });
  }

  return json({ status: "success", submission, hash } as const, {
    headers: response.headers,
  });
}

function Requirements() {
  const location = useLocation();
  const loaderData = useLoaderData<typeof loader>();
  const { project, allFinancings } = loaderData;
  const { financings, ...rest } = project;
  const actionData = useActionData<typeof action>();
  const [form, fields] = useForm({
    id: "requirements-form",
    constraint: getFieldsetConstraint(requirementsSchema),
    defaultValue: {
      // TODO: Investigate: Why can i spread here (defaultValue also accepts null values) and not on web-social?
      ...rest,
      financings: project.financings.map((relation) => relation.financing.id),
    },
    lastSubmission: actionData?.submission,
    shouldValidate: "onSubmit",
    shouldRevalidate: "onInput",
    onValidate({ formData }) {
      return parse(formData, { schema: requirementsSchema });
    },
  });
  const financingList = useFieldList(form.ref, fields.financings);

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
      <Section>
        <BackButton to={location.pathname}>Rahmenbedingungen</BackButton>
        <p className="mv-my-6 md:mv-mt-0">
          Die genannten Informationen zu Finanziellem und personellem Rahmen
          beziehen sich auf das angegebene Projekt, nicht allgemein auf die
          Organisation. Die Infos sollen eine Anregung sein für Interessierte,
          die das Projekt als Inspiration nehmen wollen.
        </p>
        <Form method="post" {...form.props}>
          <Input id="deep" defaultValue="true" type="hidden" />
          <div className="mv-flex mv-flex-col mv-gap-6 md:mv-gap-4">
            <div className="mv-flex mv-flex-col mv-gap-4 md:mv-p-4 md:mv-border md:mv-rounded-lg md:mv-border-gray-200">
              <h2 className="mv-text-primary mv-text-lg mv-font-semibold mv-mb-0">
                Zeitlicher Rahmen
              </h2>

              <TextAreaWithCounter
                {...conform.textarea(fields.timeframe)}
                id={fields.timeframe.id || ""}
                label="Projektstart bzw. Projektlaufzeit"
                errorMessage={fields.timeframe.error}
                maxCharacters={200}
                rte
              />
            </div>

            <div className="mv-flex mv-flex-col mv-gap-4 md:mv-p-4 md:mv-border md:mv-rounded-lg md:mv-border-gray-200">
              <h2 className="mv-text-primary mv-text-lg mv-font-semibold mv-mb-0">
                Personelle Situation
              </h2>

              <TextAreaWithCounter
                {...conform.textarea(fields.jobFillings)}
                id={fields.jobFillings.id || ""}
                label="Stellen und / oder Stundenkontingent"
                helperText="Wie viele Menschen sind an der Verwirklichung des Projektes
              oder Bildungsangebotes beteiligt?"
                errorMessage={fields.jobFillings.error}
                maxCharacters={500}
                rte
              />

              <TextAreaWithCounter
                {...conform.textarea(fields.furtherJobFillings)}
                id={fields.furtherJobFillings.id || ""}
                label="Weitere Infos"
                helperText="Gibt es noch weitere Punkte, die Du anderen Akteur:innen dazu mitteilen möchtest?"
                errorMessage={fields.furtherJobFillings.error}
                maxCharacters={200}
                rte
              />
            </div>

            <div className="mv-flex mv-flex-col mv-gap-4 md:mv-p-4 md:mv-border md:mv-rounded-lg md:mv-border-gray-200">
              <h2 className="mv-text-primary mv-text-lg mv-font-semibold mv-mb-0">
                Finanzieller Rahmen
              </h2>

              <Input {...conform.input(fields.yearlyBudget)}>
                <Input.Label htmlFor={fields.yearlyBudget.id}>
                  Jährliches Budget
                </Input.Label>
                {typeof fields.yearlyBudget.error !== "undefined" && (
                  <Input.Error>{fields.yearlyBudget.error}</Input.Error>
                )}
                <Input.HelperText>
                  Nutze dieses Freitextfeld um andere Akteur:innen über Eure
                  finanziellen Ressourcen zu informieren.
                </Input.HelperText>
              </Input>

              <Select onChange={handleSelectChange}>
                <Select.Label htmlFor={fields.financings.id}>
                  Art der Finanzierung
                </Select.Label>
                <Select.HelperText>
                  Wöhle die Art der Finanzierung aus.
                </Select.HelperText>
                <option selected hidden>
                  Bitte auswählen
                </option>
                {allFinancings
                  .filter((financing) => {
                    return !financingList.some((listFinancing) => {
                      return listFinancing.defaultValue === financing.id;
                    });
                  })
                  .map((filteredFinancing) => {
                    return (
                      <React.Fragment key={`${filteredFinancing.id}-fragment`}>
                        <button
                          hidden
                          {...list.insert(fields.financings.name, {
                            defaultValue: filteredFinancing.id,
                          })}
                        >
                          {filteredFinancing.title}
                        </button>
                        <option
                          key={filteredFinancing.id}
                          value={filteredFinancing.id}
                          className="my-2"
                        >
                          {filteredFinancing.title}
                        </option>
                      </React.Fragment>
                    );
                  })}
              </Select>
              {financingList.length > 0 && (
                <Chip.Container>
                  {financingList.map((listFinancing, index) => {
                    return (
                      <Chip key={listFinancing.key}>
                        {allFinancings.find((financing) => {
                          return financing.id === listFinancing.defaultValue;
                        })?.title || "Not Found"}
                        <Input
                          type="hidden"
                          {...conform.input(listFinancing)}
                        />
                        <Chip.Delete>
                          <button
                            {...list.remove(fields.financings.name, { index })}
                          />
                        </Chip.Delete>
                      </Chip>
                    );
                  })}
                </Chip.Container>
              )}

              <TextAreaWithCounter
                {...conform.textarea(fields.furtherFinancings)}
                id={fields.furtherFinancings.id || ""}
                label="Weitere Infos"
                helperText="Nutze dieses Feld, wenn du keine passende Finanzierungsart
              vorgefunden hast."
                errorMessage={fields.furtherFinancings.error}
                maxCharacters={500}
                rte
              />
            </div>

            <div className="mv-flex mv-flex-col mv-gap-4 md:mv-p-4 md:mv-border md:mv-rounded-lg md:mv-border-gray-200">
              <h2 className="mv-text-primary mv-text-lg mv-font-semibold mv-mb-0">
                Technischer Rahmen
              </h2>

              <TextAreaWithCounter
                {...conform.textarea(fields.technicalRequirements)}
                id={fields.technicalRequirements.id || ""}
                label="Welche Software/Hardware/Bausätze oder Maschinen kommen zum
                Einsatz?"
                errorMessage={fields.technicalRequirements.error}
                maxCharacters={500}
                rte
              />

              <TextAreaWithCounter
                {...conform.textarea(fields.furtherTechnicalRequirements)}
                id={fields.furtherTechnicalRequirements.id || ""}
                label="Sonstige Erläuterungen"
                errorMessage={fields.furtherTechnicalRequirements.error}
                maxCharacters={500}
                rte
              />
            </div>

            <div className="mv-flex mv-flex-col mv-gap-4 md:mv-p-4 md:mv-border md:mv-rounded-lg md:mv-border-gray-200">
              <h2 className="mv-text-primary mv-text-lg mv-font-semibold mv-mb-0">
                Räumliche Situation
              </h2>

              <TextAreaWithCounter
                {...conform.textarea(fields.roomSituation)}
                id={fields.roomSituation.id || ""}
                label="Arbeitsorte"
                helperText="Welche räumliche Situation ist nötig?"
                errorMessage={fields.roomSituation.error}
                maxCharacters={200}
                rte
              />

              <TextAreaWithCounter
                {...conform.textarea(fields.furtherRoomSituation)}
                id={fields.furtherRoomSituation.id || ""}
                label="Weitere Informationen"
                errorMessage={fields.furtherRoomSituation.error}
                maxCharacters={200}
                rte
              />
            </div>

            <div className="mv-flex mv-w-full mv-justify-end">
              <div className="mv-flex mv-shrink mv-w-full md:mv-max-w-fit lg:mv-w-auto mv-items-center mv-justify-center lg:mv-justify-end">
                <Controls>
                  <Button type="reset" variant="outline" fullSize>
                    Änderungen verwerfen
                  </Button>
                  {/* TODO: Add diabled attribute. Note: I'd like to use a hook from kent that needs remix v2 here. see /app/lib/utils/hooks.ts  */}

                  <Button type="submit" fullSize>
                    Speichern
                  </Button>
                </Controls>
              </div>
            </div>
            {typeof actionData !== "undefined" &&
              actionData !== null &&
              actionData.status === "success" && (
                <Toast key={actionData.hash}>Daten gespeichert.</Toast>
              )}
            {/* Workarround error messages because conform mapping and error displaying is not working yet with RTE components */}
            {fields.timeframe.error !== undefined && (
              <Alert level="negative">
                Zeitlicher Rahmen - Projektstart bzw. Projektlaufzeit:{" "}
                {fields.timeframe.error}
              </Alert>
            )}
            {fields.jobFillings.error !== undefined && (
              <Alert level="negative">
                Personelle Situation - Stellen und / oder Stundenkontingent:{" "}
                {fields.jobFillings.error}
              </Alert>
            )}
            {fields.furtherJobFillings.error !== undefined && (
              <Alert level="negative">
                Personelle Situation - Weitere Infos:{" "}
                {fields.furtherJobFillings.error}
              </Alert>
            )}
            {fields.furtherFinancings.error !== undefined && (
              <Alert level="negative">
                Finanzieller Rahmen - Weitere Infos:{" "}
                {fields.furtherFinancings.error}
              </Alert>
            )}
            {fields.technicalRequirements.error !== undefined && (
              <Alert level="negative">
                Technischer Rahmen - Eingesetzte Technik:{" "}
                {fields.technicalRequirements.error}
              </Alert>
            )}
            {fields.furtherTechnicalRequirements.error !== undefined && (
              <Alert level="negative">
                Technischer Rahmen - Sonstige Erläuterungen:{" "}
                {fields.furtherTechnicalRequirements.error}
              </Alert>
            )}
            {fields.roomSituation.error !== undefined && (
              <Alert level="negative">
                Räumliche Situation - Arbeitsorte: {fields.roomSituation.error}
              </Alert>
            )}
            {fields.furtherRoomSituation.error !== undefined && (
              <Alert level="negative">
                Räumliche Situation - Weitere Informationen:{" "}
                {fields.furtherRoomSituation.error}
              </Alert>
            )}
          </div>
        </Form>
      </Section>
    </>
  );
}

export default Requirements;
