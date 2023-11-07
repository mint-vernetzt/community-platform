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
import {
  Button,
  Chip,
  Input,
  Section,
  Select,
} from "@mint-vernetzt/components";

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
    <Section>
      <BackButton to={location.pathname}>Eckdaten anlegen</BackButton>
      <p className="mv-my-6 md:mv-mt-0">
        Teile der Community Grundlegendes über Dein Projekt oder Bildungsangebot
        mit.
      </p>
      <Form method="post" {...form.props}>
        {/* This button ensures submission via enter key. Always use a hidden button at top of the form when other submit buttons are inside it (f.e. the add/remove list buttons) */}
        <Button type="submit" hidden />
        <div className="mv-flex mv-flex-col mv-gap-6 md:mv-gap-4">
          <div className="md:mv-p-4 md:mv-border md:mv-rounded-lg md:mv-border-gray-200">
            <h2 className="mv-text-primary mv-text-lg mv-font-semibold mv-mb-4">
              Projektname
            </h2>
            <Input {...conform.input(fields.name)}>
              <Input.Label>
                Titel des Projekts oder Bildungsangebotes*
              </Input.Label>
              {typeof fields.name.error !== "undefined" && (
                <Input.Error>{fields.name.error}</Input.Error>
              )}
              <Input.HelperText>
                Mit max. 55 Zeichen wird Dein Projekt gut dargestellt.
              </Input.HelperText>
            </Input>
          </div>

          <div className="mv-flex mv-flex-col mv-gap-4 md:mv-p-4 md:mv-border md:mv-rounded-lg md:mv-border-gray-200">
            <h2 className="mv-text-primary mv-text-lg mv-font-semibold mv-mb-0">
              Projektformat
            </h2>
            <Select
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
              <Select.Label>
                In welchem Format findet das Projekt statt?
              </Select.Label>
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
            </Select>
            {formatList.length > 0 && (
              <Chip.Container>
                {formatList.map((listFormat, index) => {
                  return (
                    <Chip key={listFormat.key}>
                      {allFormats.find((format) => {
                        return format.id === listFormat.defaultValue;
                      })?.title || "Not Found"}
                      <Chip.Delete>
                        <button
                          {...list.remove(fields.formats.name, { index })}
                        />
                      </Chip.Delete>
                    </Chip>
                  );
                })}
              </Chip.Container>
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

          <div className="mv-flex mv-flex-col mv-gap-4 md:mv-p-4 md:mv-border md:mv-rounded-lg md:mv-border-gray-200">
            <h2 className="mv-text-primary mv-text-lg mv-font-semibold mv-mb-0">
              Aktivitätsgebiet
            </h2>
            <Select
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
              <Select.Label>
                Wo wird das Projekt / Bildungsangebot durchgeführt?
              </Select.Label>

              {/* This is the default option used as placeholder. */}
              <option selected hidden>
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
            </Select>
            {areaList.length > 0 && (
              <Chip.Container>
                {areaList.map((listArea, index) => {
                  return (
                    <Chip key={listArea.key}>
                      {areaOptions.find((area) => {
                        return area.value === listArea.defaultValue;
                      })?.label || "Not Found"}
                      <Chip.Delete>
                        <button
                          {...list.remove(fields.areas.name, { index })}
                        />
                      </Chip.Delete>
                    </Chip>
                  );
                })}
              </Chip.Container>
            )}
          </div>
          {/* <div className="mv-flex mv-flex-col mv-gap-4"> */}
          <div className="md:mv-p-4 md:mv-border md:mv-rounded-lg md:mv-border-gray-200">
            <h2 className="mv-text-primary mv-text-lg mv-font-semibold mv-mb-4">
              Kontaktdaten
            </h2>
            <Input {...conform.input(fields.email)}>
              <Input.Label>E-Mail-Adresse</Input.Label>
              {typeof fields.email.error !== "undefined" && (
                <Input.Error>{fields.email.error}</Input.Error>
              )}
            </Input>
            <Input {...conform.input(fields.phone)}>
              <Input.Label>Telefonnummer</Input.Label>
              {typeof fields.phone.error !== "undefined" && (
                <Input.Error>{fields.phone.error}</Input.Error>
              )}
            </Input>
          </div>
          <div className="md:mv-p-4 md:mv-border md:mv-rounded-lg md:mv-border-gray-200">
            <h2 className="mv-text-primary mv-text-lg mv-font-semibold mv-mb-4">
              Anschrift
            </h2>
            <Input {...conform.input(fields.contactName)}>
              <Input.Label>Name</Input.Label>
              {typeof fields.contactName.error !== "undefined" && (
                <Input.Error>{fields.contactName.error}</Input.Error>
              )}
            </Input>
            <div className="lg:mv-flex lg:mv-gap-4">
              <div className="mv-flex-1">
                <Input {...conform.input(fields.street)}>
                  <Input.Label>Straße</Input.Label>
                  {typeof fields.street.error !== "undefined" && (
                    <Input.Error>{fields.street.error}</Input.Error>
                  )}
                </Input>
              </div>
              <div className="mv-flex-1 mv-flex mv-gap-4">
                <div className="mv-flex-1">
                  <Input {...conform.input(fields.streetNumber)}>
                    <Input.Label>Hausnummer</Input.Label>
                    {typeof fields.streetNumber.error !== "undefined" && (
                      <Input.Error>{fields.streetNumber.error}</Input.Error>
                    )}
                  </Input>
                </div>
                <div className="mv-flex-1">
                  <Input {...conform.input(fields.streetNumberAddition)}>
                    <Input.Label>Zusatz</Input.Label>
                    {typeof fields.streetNumberAddition.error !==
                      "undefined" && (
                      <Input.Error>
                        {fields.streetNumberAddition.error}
                      </Input.Error>
                    )}
                  </Input>
                </div>
              </div>
            </div>

            <div className="lg:mv-flex lg:mv-gap-4">
              <div className="mv-flex-1">
                <Input {...conform.input(fields.zipCode)}>
                  <Input.Label>PLZ</Input.Label>
                  {typeof fields.zipCode.error !== "undefined" && (
                    <Input.Error>{fields.zipCode.error}</Input.Error>
                  )}
                </Input>
              </div>
              <div className="mv-flex-1">
                <Input {...conform.input(fields.city)}>
                  <Input.Label>Stadt</Input.Label>
                  {typeof fields.city.error !== "undefined" && (
                    <Input.Error>{fields.city.error}</Input.Error>
                  )}
                </Input>
              </div>
            </div>
          </div>
          {/* </div> */}

          <p className="mv-text-sm mv-mt-4">*Erforderliche Angaben</p>

          <div className="mv-mt-8 mv-w-full md:mv-max-w-fit">
            <div className="mv-flex mv-gap-4">
              <div className="mv-grow">
                <Button type="reset" variant="outline" fullSize>
                  Änderungen verwerfen
                </Button>
              </div>
              <div className="mv-grow">
                {/* TODO: Add diabled attribute. Note: I'd like to use a hook from kent that needs remix v2 here. see /app/lib/utils/hooks.ts  */}

                <Button type="submit" fullSize>
                  Speichern und weiter
                </Button>
              </div>
            </div>
          </div>
        </div>
      </Form>
    </Section>
  );
}

export default General;
