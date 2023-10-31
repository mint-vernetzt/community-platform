import { conform, list, useFieldList, useForm } from "@conform-to/react";
import { getFieldsetConstraint, parse } from "@conform-to/zod";
import { json, redirect, type DataFunctionArgs } from "@remix-run/node";
import {
  Form,
  useActionData,
  useLoaderData,
  useLocation,
} from "@remix-run/react";
import { z } from "zod";
import { redirectWithAlert } from "~/alert.server";
import { createAuthClient, getSessionUser } from "~/auth.server";
import { invariantResponse } from "~/lib/utils/response";
import { prismaClient } from "~/prisma.server";
import { BackButton } from "./__components";
import { getRedirectPathOnProtectedProjectRoute } from "./utils.server";
import { phoneSchema } from "~/lib/utils/schemas";

const generalSchema = z.object({
  // TODO: Bea fragen:
  // - Strikt nur 55 Zeichen zulassen oder soll das nur ein Hinweis sein?
  name: z
    .string({
      required_error: "Der Projektname ist eine erforderliche Angabe.",
    })
    .max(55, "Es sind nur maximal 55 Zeichen für deinen Projektnamen erlaubt."),
  formats: z.array(z.string().uuid()),
  furtherFormats: z.array(z.string()),
  // areas: z.array(z.string().uuid()),
  // email: z.string().email("Bitte gib eine gültige E-Mail Adresse ein."),
  // phone: phoneSchema
  //   .optional()
  //   .transform((value) => (value === undefined ? null : value)),
  // // TODO: Bea fragen:
  // // - "Ansprechpartner:in / Name des Projekts*"
  // //    -> Was von beiden ist gemeint? Name des Projekts existiert schon im Formular.
  // //    -> Sind das Profile oder ist das einfach eine freie Eingabe
  // // - E-Mail, Straße, Hausnummer, PLZ, Stadt required?
  // street: z
  //   .string()
  //   .optional()
  //   .transform((value) => (value === undefined ? null : value)),
  // streetNumber: z
  //   .string()
  //   .optional()
  //   .transform((value) => (value === undefined ? null : value)),
  // streetNumberAddition: z
  //   .string()
  //   .optional()
  //   .transform((value) => (value === undefined ? null : value)),
  // zipCode: z
  //   .string()
  //   .optional()
  //   .transform((value) => (value === undefined ? null : value)),
  // city: z
  //   .string()
  //   .optional()
  //   .transform((value) => (value === undefined ? null : value)),
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
      name: true,
      email: true,
      phone: true,
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
              title: true,
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
  invariantResponse(project !== null, "Project not found", {
    status: 404,
  });

  const formats = await prismaClient.format.findMany({
    select: {
      id: true,
      title: true,
    },
  });

  return json({ project, formats });
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
      generalSchema.transform(async (data, ctx) => {
        if (intent !== "submit") return { ...data };
        try {
          await prismaClient.project.update({
            where: {
              slug: params.slug,
            },
            data: {
              name: data.name,
              furtherFormats: data.furtherFormats,
              formats: {
                deleteMany: {},
                connectOrCreate: data.formats.map((formatId: string) => {
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

  return redirectWithAlert(
    `/next/project/${params.slug}/settings/web-social?deep`,
    {
      message: "Deine Änderungen wurden gespeichert.",
    }
  );
}

function General() {
  const location = useLocation();
  const loaderData = useLoaderData<typeof loader>();
  const { project, formats } = loaderData;
  const actionData = useActionData<typeof action>();
  const formId = "general-form";
  const [form, fields] = useForm({
    id: formId,
    constraint: getFieldsetConstraint(generalSchema),
    defaultValue: {
      name: project.name,
      formats: project.formats.map((relation) => relation.format.id),
      furtherFormats: project.furtherFormats,
    },
    lastSubmission: actionData?.submission,
    onValidate({ formData }) {
      return parse(formData, { schema: generalSchema });
    },
  });
  const formatList = useFieldList(form.ref, fields.formats);
  const furtherFormatsList = useFieldList(form.ref, fields.furtherFormats);

  return (
    <>
      <BackButton to={location.pathname}>Eckdaten anlegen</BackButton>
      <p>
        Wo kann die Community mehr über Dein Projekt oder Bildungsangebot
        erfahren?
      </p>
      <Form method="post" {...form.props}>
        {/* This button ensures submission via enter key. Always use a hidden button at top of the form when other submit buttons are inside it (f.e. the add/remove list buttons) */}
        <button type="submit" hidden></button>

        <h2>Projektname</h2>
        <div>
          <label htmlFor={fields.name.id}>
            Titel des Projekts oder Bildungsangebotes*
          </label>
          {/* TODO: Bea fragen: Soll hier ein input mit Counter hin (max 55 Zeichen)? Aktuell nur ein Hinweis designed */}
          <input autoFocus className="ml-2" {...conform.input(fields.name)} />
          {fields.name.errors !== undefined && fields.name.errors.length > 0 && (
            <ul id={fields.name.errorId}>
              {fields.name.errors.map((e) => (
                <li key={e}>{e}</li>
              ))}
            </ul>
          )}
        </div>
        <p>Mit max. 55 Zeichen wird Dein Projekt gut dargestellt.</p>

        <h2>Projektformat</h2>
        <div>
          <label htmlFor={fields.formats.id}>
            In welchem Format findet das Projekt statt?
          </label>
          <div className="grid grid-cols-2">
            <div className="flex flex-col">
              {formats
                .filter((format) => {
                  return !formatList.some((listFormat) => {
                    return listFormat.defaultValue === format.id;
                  });
                })
                .map((filteredFormat) => {
                  return (
                    <>
                      <button
                        key={filteredFormat.id}
                        className="my-2"
                        {...list.insert(fields.formats.name, {
                          defaultValue: filteredFormat.id,
                        })}
                      >
                        {filteredFormat.title}
                      </button>
                    </>
                  );
                })}
            </div>
            <ul>
              {formatList.map((listFormat, index) => {
                return (
                  <li className="flex flex-row my-2" key={listFormat.key}>
                    <p>
                      {formats.find((format) => {
                        return format.id === listFormat.defaultValue;
                      })?.title || "Not Found"}
                    </p>
                    <input hidden {...conform.input(listFormat)} />
                    <button
                      className="ml-2"
                      {...list.remove(fields.formats.name, { index })}
                    >
                      - Delete
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
          {fields.formats.errors !== undefined &&
            fields.formats.errors.length > 0 && (
              <ul id={fields.formats.errorId}>
                {fields.formats.errors.map((e) => (
                  <li key={e}>{e}</li>
                ))}
              </ul>
            )}
        </div>
        <p>Mehrfachnennungen sind möglich.</p>

        <div>
          <label htmlFor={fields.furtherFormats.id}>Sonstige Formate</label>

          <div className="flex flex-col"></div>
          <ul>
            <li>
              <button {...list.insert(fields.furtherFormats.name)}>
                + Add
              </button>
              {/* <input
                className="my-2"
                {...list.insert(fields.furtherFormats.name)}
              /> */}
            </li>
            {furtherFormatsList.map((furtherFormat, index) => {
              console.log(furtherFormat);
              return (
                <li className="flex flex-row my-2" key={furtherFormat.key}>
                  <p></p>
                  <input {...conform.input(furtherFormat)} />
                  <button
                    className="ml-2"
                    {...list.remove(fields.furtherFormats.name, { index })}
                  >
                    - Delete
                  </button>
                </li>
              );
            })}
          </ul>
          {fields.furtherFormats.errors !== undefined &&
            fields.furtherFormats.errors.length > 0 && (
              <ul id={fields.furtherFormats.errorId}>
                {fields.furtherFormats.errors.map((e) => (
                  <li key={e}>{e}</li>
                ))}
              </ul>
            )}
        </div>
        <p>Bitte gib kurze Begriffe an.</p>

        <ul id={form.errorId}>
          {form.errors.map((e) => (
            <li key={e}>{e}</li>
          ))}
        </ul>

        <p>*Erforderliche Angaben</p>

        <div>
          <button type="reset">Änderungen verwerfen</button>
        </div>
        <div>
          <button type="submit">Speichern und weiter</button>
        </div>
      </Form>
    </>
  );
}

export default General;
