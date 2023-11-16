import { conform, list, useFieldList, useForm } from "@conform-to/react";
import { getFieldsetConstraint, parse } from "@conform-to/zod";
import {
  Button,
  Chip,
  Controls,
  Input,
  Section,
  Select,
} from "@mint-vernetzt/components";
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
import { phoneSchema } from "~/lib/utils/schemas";
import { prismaClient } from "~/prisma.server";
import { redirectWithToast } from "~/toast.server";
import { BackButton } from "./__components";
import { createAreaOptions } from "./general.server";
import {
  getRedirectPathOnProtectedProjectRoute,
  getSubmissionHash,
} from "./utils.server";

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
    .optional()
    .transform((value) => (value === undefined || value === "" ? null : value)),
  phone: phoneSchema
    .optional()
    .transform((value) => (value === undefined || value === "" ? null : value)),
  contactName: z
    .string()
    .optional()
    .transform((value) => (value === undefined || value === "" ? null : value)),
  subline: z
    .string()
    .optional()
    .transform((value) => (value === undefined || value === "" ? null : value)),
  street: z
    .string()
    .optional()
    .transform((value) => (value === undefined || value === "" ? null : value)),
  streetNumber: z
    .string()
    .optional()
    .transform((value) => (value === undefined || value === "" ? null : value)),
  streetNumberAddition: z
    .string()
    .optional()
    .transform((value) => (value === undefined || value === "" ? null : value)),
  zipCode: z
    .string()
    .optional()
    .transform((value) => (value === undefined || value === "" ? null : value)),
  city: z
    .string()
    .optional()
    .transform((value) => (value === undefined || value === "" ? null : value)),
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
      subline: true,
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

  return json(
    { project, allFormats, areaOptions },
    {
      headers: response.headers,
    }
  );
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

  const hash = getSubmissionHash(submission);

  if (submission.intent !== "submit") {
    return json({ status: "idle", submission, hash } as const, {
      headers: response.headers,
    });
  }
  if (!submission.value) {
    return json({ status: "error", submission, hash } as const, {
      headers: response.headers,
      status: 400,
    });
  }

  return redirectWithToast(
    `/next/project/${params.slug}/settings/general?deep`,
    { id: "settings-toast", key: hash, message: "Daten gespeichert!" },
    { scrollIntoView: true },
    { headers: response.headers }
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
              Projekttitel
            </h2>
            <Input {...conform.input(fields.name)}>
              <Input.Label htmlFor={fields.name.id}>
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

          <div className="md:mv-p-4 md:mv-border md:mv-rounded-lg md:mv-border-gray-200">
            <h2 className="mv-text-primary mv-text-lg mv-font-semibold mv-mb-4">
              Projektuntertitel
            </h2>
            <Input {...conform.input(fields.subline)}>
              <Input.Label>
                Subline Deines Projekts oder Bildungsangebotes
              </Input.Label>
              {typeof fields.subline.error !== "undefined" && (
                <Input.Error>{fields.subline.error}</Input.Error>
              )}
              <Input.HelperText>
                Mit max. 90 Zeichen wird Dein Projekt in der Übersicht gut
                dargestellt.
              </Input.HelperText>
            </Input>
          </div>

          <div className="mv-flex mv-flex-col mv-gap-4 md:mv-p-4 md:mv-border md:mv-rounded-lg md:mv-border-gray-200">
            <h2 className="mv-text-primary mv-text-lg mv-font-semibold mv-mb-0">
              Projektformat
            </h2>
            <Select onChange={handleSelectChange}>
              <Select.Label htmlFor={fields.formats.id}>
                In welchem Format findet das Projekt statt?
              </Select.Label>
              <Select.HelperText>
                Mehrfachnennungen sind möglich.
              </Select.HelperText>
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
                    <React.Fragment key={`${filteredFormat.id}-fragment`}>
                      <button
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
                    </React.Fragment>
                  );
                })}
            </Select>
            {formatList.length > 0 && (
              <Chip.Container>
                {formatList.map((listFormat, index) => {
                  return (
                    <Chip key={listFormat.key}>
                      <Input type="hidden" {...conform.input(listFormat)} />
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
            {typeof fields.furtherFormats !== "undefined" &&
              typeof fields.furtherFormats.id !== "undefined" && (
                <div className="mv-flex mv-flex-row mv-gap-4 mv-items-center">
                  <Input
                    id={fields.furtherFormats.id}
                    value={furtherFormat}
                    onChange={handleFurtherFormatInputChange}
                  >
                    <Input.Label htmlFor={fields.furtherFormats.id}>
                      Sonstige Formate
                    </Input.Label>
                    <Input.HelperText>
                      Bitte gib kurze Begriffe an.
                    </Input.HelperText>
                  </Input>
                  <div className="mv--mt-1">
                    <Button
                      {...list.insert(fields.furtherFormats.name, {
                        defaultValue: furtherFormat,
                      })}
                      variant="ghost"
                      disabled={furtherFormat === ""}
                    >
                      Hinzufügen
                    </Button>
                  </div>
                </div>
              )}
            {furtherFormatsList.length > 0 && (
              <Chip.Container>
                {furtherFormatsList.map((listFormat, index) => {
                  return (
                    <Chip key={listFormat.key}>
                      <Input type="hidden" {...conform.input(listFormat)} />
                      {listFormat.defaultValue || "Not Found"}
                      <Chip.Delete>
                        <button
                          {...list.remove(fields.furtherFormats.name, {
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
              Aktivitätsgebiet
            </h2>
            <Select onChange={handleSelectChange}>
              <Select.Label htmlFor={fields.areas.id}>
                Wo wird das Projekt / Bildungsangebot durchgeführt?
              </Select.Label>
              <Select.HelperText>
                Mehrfachnennungen sind möglich.
              </Select.HelperText>

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
                .map((filteredOption, index) => {
                  // All options that have a value are created as options with a hidden add button thats clicked by the select onChange handler
                  if (filteredOption.value !== undefined) {
                    return (
                      <React.Fragment key={`${filteredOption.value}-fragment`}>
                        <button
                          key={`${filteredOption.value}-button`}
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
                      </React.Fragment>
                    );
                  }
                  // Divider, that have no value are shown as a disabled option. Is this styleable? Is there a better way of doing this?
                  else {
                    return (
                      <option
                        key={`${filteredOption.label}-${index}-divider`}
                        disabled
                      >
                        {filteredOption.label}
                      </option>
                    );
                  }
                })}
            </Select>
            {areaList.length > 0 && (
              <Chip.Container>
                {areaList.map((listArea, index) => {
                  return (
                    <Chip key={listArea.key}>
                      <Input type="hidden" {...conform.input(listArea)} />
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
          <div className="mv-flex mv-flex-col mv-gap-4 md:mv-p-4 md:mv-border md:mv-rounded-lg md:mv-border-gray-200">
            <h2 className="mv-text-primary mv-text-lg mv-font-semibold mv-mb-0">
              Kontaktdaten
            </h2>
            <Input {...conform.input(fields.email)}>
              <Input.Label htmlFor={fields.email.id}>
                E-Mail-Adresse
              </Input.Label>
              {typeof fields.email.error !== "undefined" && (
                <Input.Error>{fields.email.error}</Input.Error>
              )}
            </Input>
            <Input {...conform.input(fields.phone)}>
              <Input.Label htmlFor={fields.phone.id}>Telefonnummer</Input.Label>
              {typeof fields.phone.error !== "undefined" && (
                <Input.Error>{fields.phone.error}</Input.Error>
              )}
            </Input>
          </div>
          <div className="mv-flex mv-flex-col mv-gap-4 md:mv-p-4 md:mv-border md:mv-rounded-lg md:mv-border-gray-200">
            <h2 className="mv-text-primary mv-text-lg mv-font-semibold mv-mb-0">
              Anschrift
            </h2>
            <Input {...conform.input(fields.contactName)}>
              <Input.Label htmlFor={fields.contactName.id}>Name</Input.Label>
              {typeof fields.contactName.error !== "undefined" && (
                <Input.Error>{fields.contactName.error}</Input.Error>
              )}
            </Input>
            <div className="lg:mv-flex lg:mv-gap-4">
              <div className="mv-w-full lg:mv-w-1/3">
                <Input {...conform.input(fields.street)}>
                  <Input.Label htmlFor={fields.street.id}>Straße</Input.Label>
                  {typeof fields.street.error !== "undefined" && (
                    <Input.Error>{fields.street.error}</Input.Error>
                  )}
                </Input>
              </div>
              <div className="mv-flex mv-flex mv-w-full lg:mv-w-2/3 mv-gap-4 mv-mt-4 lg:mv-mt-0">
                <div className="mv-flex-1">
                  <Input {...conform.input(fields.streetNumber)}>
                    <Input.Label htmlFor={fields.streetNumber.id}>
                      Hausnummer
                    </Input.Label>
                    {typeof fields.streetNumber.error !== "undefined" && (
                      <Input.Error>{fields.streetNumber.error}</Input.Error>
                    )}
                  </Input>
                </div>
                <div className="mv-flex-1">
                  <Input {...conform.input(fields.streetNumberAddition)}>
                    <Input.Label htmlFor={fields.streetNumberAddition.id}>
                      Zusatz
                    </Input.Label>
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
                  <Input.Label htmlFor={fields.zipCode.id}>PLZ</Input.Label>
                  {typeof fields.zipCode.error !== "undefined" && (
                    <Input.Error>{fields.zipCode.error}</Input.Error>
                  )}
                </Input>
              </div>
              <div className="mv-flex-1 mv-mt-4 lg:mv-mt-0">
                <Input {...conform.input(fields.city)}>
                  <Input.Label htmlFor={fields.city.id}>Stadt</Input.Label>
                  {typeof fields.city.error !== "undefined" && (
                    <Input.Error>{fields.city.error}</Input.Error>
                  )}
                </Input>
              </div>
            </div>
          </div>

          <p className="mv-text-sm mv-mt-4">*Erforderliche Angaben</p>
          <div className="mv-flex mv-w-full mv-justify-end">
            <div className="mv-flex mv-shrink mv-w-full md:mv-max-w-fit lg:mv-w-auto mv-items-center mv-justify-center lg:mv-justify-end">
              <Controls>
                <Button type="reset" variant="outline" fullSize>
                  Änderungen verwerfen
                </Button>
                <Button type="submit" fullSize>
                  Speichern
                </Button>
              </Controls>
            </div>
          </div>
        </div>
      </Form>
    </Section>
  );
}

export default General;
