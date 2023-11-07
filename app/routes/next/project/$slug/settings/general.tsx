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
import { phoneSchema } from "~/lib/utils/schemas";
import { prismaClient } from "~/prisma.server";
import { BackButton } from "./__components";
import { getRedirectPathOnProtectedProjectRoute } from "./utils.server";
import React from "react";
import { createAreaOptions } from "./general.server";

const generalSchema = z.object({
  name: z.string({
    required_error: "Der Projektname ist eine erforderliche Angabe.",
  }),
  formats: z.array(z.string().uuid()),
  furtherFormats: z.array(z.string()),
  areas: z.array(z.string().uuid()),
  email: z
    .string()
    .email("Bitte gib eine gültige E-Mail Adresse ein.")
    .optional(),
  phone: phoneSchema
    .optional()
    .transform((value) => (value === undefined ? null : value)),
  contactName: z
    .string()
    .optional()
    .transform((value) => (value === undefined ? null : value)),
  street: z
    .string()
    .optional()
    .transform((value) => (value === undefined ? null : value)),
  streetNumber: z
    .string()
    .optional()
    .transform((value) => (value === undefined ? null : value)),
  streetNumberAddition: z
    .string()
    .optional()
    .transform((value) => (value === undefined ? null : value)),
  zipCode: z
    .string()
    .optional()
    .transform((value) => (value === undefined ? null : value)),
  city: z
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
      name: true,
      email: true,
      phone: true,
      contactName: true,
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

  const allFormats = await prismaClient.format.findMany({
    select: {
      id: true,
      title: true,
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

  return json({ project, allFormats, areaOptions });
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
        const { formats, areas, ...rest } = data;
        try {
          await prismaClient.project.update({
            where: {
              slug: params.slug,
            },
            data: {
              ...rest,
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
  const { project, allFormats, areaOptions } = loaderData;
  const { formats, areas, ...rest } = project;
  const actionData = useActionData<typeof action>();
  const formId = "general-form";
  const [form, fields] = useForm({
    id: formId,
    constraint: getFieldsetConstraint(generalSchema),
    defaultValue: {
      // TODO: Investigate: Why can i spread here (defaultValue also accepts null values) and not on web-social?
      ...rest,
      formats: project.formats.map((relation) => relation.format.id),
      areas: project.areas.map((relation) => relation.area.id),
    },
    lastSubmission: actionData?.submission,
    shouldValidate: "onSubmit",
    shouldRevalidate: "onInput",
    onValidate({ formData }) {
      return parse(formData, { schema: generalSchema });
    },
  });
  const formatList = useFieldList(form.ref, fields.formats);
  const furtherFormatsList = useFieldList(form.ref, fields.furtherFormats);
  const areaList = useFieldList(form.ref, fields.areas);

  const [furtherFormat, setFurtherFormat] = React.useState<string>("");
  const handleFurtherFormatInputChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFurtherFormat(event.currentTarget.value);
  };

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
          <input className="ml-2" {...conform.input(fields.name)} />
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

          <div className="flex flex-col">
            <select
              onChange={(event) => {
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
              }}
            >
              <option selected hidden>
                Bitte auswählen
              </option>
              {allFormats
                .filter((format) => {
                  return !formatList.some((listFormat) => {
                    return listFormat.defaultValue === format.id;
                  });
                })
                .map((filteredFormat) => {
                  return (
                    <>
                      <button
                        key={`${filteredFormat.id}-add-button`}
                        hidden
                        {...list.insert(fields.formats.name, {
                          defaultValue: filteredFormat.id,
                        })}
                      >
                        {filteredFormat.title}
                      </button>
                      <option
                        key={filteredFormat.id}
                        value={filteredFormat.id}
                        className="my-2"
                      >
                        {filteredFormat.title}
                      </option>
                    </>
                  );
                })}
            </select>
          </div>
          <ul>
            {formatList.map((listFormat, index) => {
              return (
                <li className="flex flex-row my-2" key={listFormat.key}>
                  <p>
                    {allFormats.find((format) => {
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
              <input
                className="my-2"
                onChange={handleFurtherFormatInputChange}
                value={furtherFormat}
              />
              <button
                className="ml-2"
                {...list.insert(fields.furtherFormats.name, {
                  defaultValue: furtherFormat,
                })}
              >
                + Add
              </button>
            </li>
            {furtherFormatsList.map((furtherFormat, index) => {
              return (
                <li className="flex flex-row my-2" key={furtherFormat.key}>
                  <p>{furtherFormat.defaultValue || "Not Found"}</p>
                  <input hidden {...conform.input(furtherFormat)} />
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

        <h2>Aktivitätsgebiet</h2>

        <div>
          <label htmlFor={fields.areas.id}>
            Wo wird das Projekt / Bildungsangebot durchgeführt?
          </label>
          <div className="flex flex-col">
            <select
              onChange={(event) => {
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
              }}
            >
              {/* This is the default option used as placeholder. */}
              <option selected disabled>
                Bitte auswählen
              </option>
              {areaOptions
                .filter((option) => {
                  // All options that have a value should only be shown if they are not inside the current selected area list
                  if (option.value !== undefined) {
                    return !areaList.some((listArea) => {
                      return listArea.defaultValue === option.value;
                    });
                  }
                  // Divider, that have no value should be always shown
                  else {
                    return true;
                  }
                })
                .map((filteredOption) => {
                  // All options that have a value are created as options with a hidden add button thats clicked by the select onChange handler
                  if (filteredOption.value !== undefined) {
                    return (
                      <>
                        <button
                          key={`${filteredOption.value}-add-button`}
                          hidden
                          {...list.insert(fields.areas.name, {
                            defaultValue: filteredOption.value,
                          })}
                        >
                          {filteredOption.label}
                        </button>
                        <option
                          key={filteredOption.value}
                          value={filteredOption.value}
                        >
                          {filteredOption.label}
                        </option>
                      </>
                    );
                  }
                  // Divider, that have no value are shown as a disabled option. Is this styleable? Is there a better way of doing this?
                  else {
                    return (
                      <>
                        <option disabled>{filteredOption.label}</option>
                      </>
                    );
                  }
                })}
            </select>
          </div>
          <ul>
            {areaList.map((listArea, index) => {
              return (
                <li className="flex flex-row my-2" key={listArea.key}>
                  <p>
                    {areaOptions.find((area) => {
                      return area.value === listArea.defaultValue;
                    })?.label || "Not Found"}
                  </p>
                  <input hidden {...conform.input(listArea)} />
                  <button
                    className="ml-2"
                    {...list.remove(fields.areas.name, { index })}
                  >
                    - Delete
                  </button>
                </li>
              );
            })}
          </ul>
          {fields.areas.errors !== undefined && fields.areas.errors.length > 0 && (
            <ul id={fields.areas.errorId}>
              {fields.areas.errors.map((e) => (
                <li key={e}>{e}</li>
              ))}
            </ul>
          )}
        </div>

        <h2>Kontaktdaten</h2>

        <div>
          <label htmlFor={fields.email.id}>E-Mail-Adresse</label>
          <input className="ml-2" {...conform.input(fields.email)} />
          {fields.email.errors !== undefined && fields.email.errors.length > 0 && (
            <ul id={fields.email.errorId}>
              {fields.email.errors.map((e) => (
                <li key={e}>{e}</li>
              ))}
            </ul>
          )}
        </div>

        <div>
          <label htmlFor={fields.phone.id}>Telefonnummer</label>
          <input className="ml-2" {...conform.input(fields.phone)} />
          {fields.phone.errors !== undefined && fields.phone.errors.length > 0 && (
            <ul id={fields.phone.errorId}>
              {fields.phone.errors.map((e) => (
                <li key={e}>{e}</li>
              ))}
            </ul>
          )}
        </div>

        <h2>Anschrift</h2>

        <div>
          <label htmlFor={fields.contactName.id}>Name</label>
          <input className="ml-2" {...conform.input(fields.contactName)} />
          {fields.contactName.errors !== undefined &&
            fields.contactName.errors.length > 0 && (
              <ul id={fields.contactName.errorId}>
                {fields.contactName.errors.map((e) => (
                  <li key={e}>{e}</li>
                ))}
              </ul>
            )}
        </div>

        <div>
          <label htmlFor={fields.street.id}>Straße</label>
          <input className="ml-2" {...conform.input(fields.street)} />
          {fields.street.errors !== undefined &&
            fields.street.errors.length > 0 && (
              <ul id={fields.street.errorId}>
                {fields.street.errors.map((e) => (
                  <li key={e}>{e}</li>
                ))}
              </ul>
            )}
        </div>

        <div>
          <label htmlFor={fields.streetNumber.id}>Hausnummer</label>
          <input className="ml-2" {...conform.input(fields.streetNumber)} />
          {fields.streetNumber.errors !== undefined &&
            fields.streetNumber.errors.length > 0 && (
              <ul id={fields.streetNumber.errorId}>
                {fields.streetNumber.errors.map((e) => (
                  <li key={e}>{e}</li>
                ))}
              </ul>
            )}
        </div>

        <div>
          <label htmlFor={fields.streetNumberAddition.id}>Zusatz</label>
          <input
            className="ml-2"
            {...conform.input(fields.streetNumberAddition)}
          />
          {fields.streetNumberAddition.errors !== undefined &&
            fields.streetNumberAddition.errors.length > 0 && (
              <ul id={fields.streetNumberAddition.errorId}>
                {fields.streetNumberAddition.errors.map((e) => (
                  <li key={e}>{e}</li>
                ))}
              </ul>
            )}
        </div>

        <div>
          <label htmlFor={fields.zipCode.id}>PLZ</label>
          <input className="ml-2" {...conform.input(fields.zipCode)} />
          {fields.zipCode.errors !== undefined &&
            fields.zipCode.errors.length > 0 && (
              <ul id={fields.zipCode.errorId}>
                {fields.zipCode.errors.map((e) => (
                  <li key={e}>{e}</li>
                ))}
              </ul>
            )}
        </div>

        <div>
          <label htmlFor={fields.city.id}>Stadt</label>
          <input className="ml-2" {...conform.input(fields.city)} />
          {fields.city.errors !== undefined && fields.city.errors.length > 0 && (
            <ul id={fields.city.errorId}>
              {fields.city.errors.map((e) => (
                <li key={e}>{e}</li>
              ))}
            </ul>
          )}
        </div>

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
          {/* TODO: Add diabled attribute. Note: I'd like to use a hook from kent that needs remix v2 here. see /app/lib/utils/hooks.ts on branch "1094-feature-project-settings-web-and-social" */}
          <button type="submit">Speichern und weiter</button>
        </div>
      </Form>
    </>
  );
}

export default General;
