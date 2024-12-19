import { conform, list, useFieldList, useForm } from "@conform-to/react";
import { getFieldsetConstraint, parse } from "@conform-to/zod";
import {
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
import { prismaClient } from "~/prisma.server";
import { detectLanguage } from "~/i18n.server";
import { redirectWithToast } from "~/toast.server";
import { BackButton } from "~/components-next/BackButton";
import { ConformSelect } from "~/components-next/ConformSelect";
import {
  getRedirectPathOnProtectedProjectRoute,
  getHash,
  updateFilterVectorOfProject,
} from "./utils.server";
import { Deep } from "~/lib/utils/searchParams";
import { Input } from "@mint-vernetzt/components/src/molecules/Input";
import { Chip } from "@mint-vernetzt/components/src/molecules/Chip";
import { Controls } from "@mint-vernetzt/components/src/organisms/containers/Controls";
import { Button } from "@mint-vernetzt/components/src/molecules/Button";
import { Alert } from "@mint-vernetzt/components/src/molecules/Alert";
import { Section } from "@mint-vernetzt/components/src/organisms/containers/Section";
import { type ProjectRequirementsSettingsLocales } from "./requirements.server";
import { languageModuleMap } from "~/locales/.server";

const createRequirementsSchema = (
  locales: ProjectRequirementsSettingsLocales
) =>
  z.object({
    timeframe: z
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
            replaceHtmlEntities(removeHtmlTags(value || ""), "x").length <= 200
          );
        },
        {
          message: locales.route.validation.timeframe.length,
        }
      ),
    jobFillings: z
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
          message: locales.route.validation.jobFillings.length,
        }
      ),
    furtherJobFillings: z
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
            replaceHtmlEntities(removeHtmlTags(value || ""), "x").length <= 200
          );
        },
        {
          message: locales.route.validation.furtherJobFillings.length,
        }
      ),
    yearlyBudget: z
      .string()
      .max(80, locales.route.validation.yearlyBudget.max)
      .optional()
      .transform((value) => {
        if (value === undefined) {
          return null;
        }
        const trimmedValue = value.trim();
        return trimmedValue === "" || trimmedValue === "<p></p>" ? null : value;
      }),
    financings: z.array(z.string().uuid()),
    furtherFinancings: z
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
          message: locales.route.validation.furtherFinancings.length,
        }
      ),
    technicalRequirements: z
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
            replaceHtmlEntities(removeHtmlTags(value || ""), "x").length <= 500
          );
        },
        {
          message: locales.route.validation.technicalRequirements.length,
        }
      ),
    furtherTechnicalRequirements: z
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
            replaceHtmlEntities(removeHtmlTags(value || ""), "x").length <= 500
          );
        },
        {
          message: locales.route.validation.furtherTechnicalRequirements.length,
        }
      ),
    roomSituation: z
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
            replaceHtmlEntities(removeHtmlTags(value || ""), "x").length <= 200
          );
        },
        {
          message: locales.route.validation.roomSituation.length,
        }
      ),
    furtherRoomSituation: z
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
            replaceHtmlEntities(removeHtmlTags(value || ""), "x").length <= 200
          );
        },
        {
          message: locales.route.validation.furtherRoomSituation.length,
        }
      ),
  });

export const links: LinksFunction = () => [
  { rel: "stylesheet", href: quillStyles },
];

export const loader = async (args: LoaderFunctionArgs) => {
  const { request, params } = args;

  const language = await detectLanguage(request);
  const locales =
    languageModuleMap[language]["project/$slug/settings/requirements"];

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

  invariantResponse(sessionUser !== null, locales.route.error.notLoggedIn, {
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

  const allFinancings = await prismaClient.financing.findMany({
    select: {
      id: true,
      slug: true,
    },
  });

  return { project, allFinancings, locales };
};

export async function action({ request, params }: ActionFunctionArgs) {
  const { authClient } = createAuthClient(request);

  const language = await detectLanguage(request);
  const locales =
    languageModuleMap[language]["project/$slug/settings/requirements"];

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
  const requirementsSchema = createRequirementsSchema(locales);
  const formData = await request.formData();
  const submission = await parse(formData, {
    schema: (intent) =>
      requirementsSchema.transform(async (data, ctx) => {
        if (intent !== "submit") return { ...data };

        invariantResponse(
          sanitizeUserHtml !== undefined,
          "Typescript doesnt know that the module is server only and that we are on the server here.",
          { status: 500 }
        );

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
          updateFilterVectorOfProject(project.id);
        } catch (e) {
          console.warn(e);
          ctx.addIssue({
            code: "custom",
            message: locales.route.error.custom,
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
    id: "change-project-requirements-toast",
    key: hash,
    message: locales.route.content.success,
  });
}

function Requirements() {
  const location = useLocation();
  const loaderData = useLoaderData<typeof loader>();
  const { project, allFinancings, locales } = loaderData;
  const { financings, ...rest } = project;
  const actionData = useActionData<typeof action>();
  const requirementsSchema = createRequirementsSchema(locales);
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

  const [isDirty, setIsDirty] = React.useState(false);
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      isDirty && currentLocation.pathname !== nextLocation.pathname
  );
  if (blocker.state === "blocked") {
    const confirmed = confirm(locales.route.content.prompt);
    if (confirmed === true) {
      // @ts-ignore - The blocker type may not be correct. Sentry logged an error that claims invalid blocker state transition from proceeding to proceeding
      if (blocker.state !== "proceeding") {
        blocker.proceed();
      }
    } else {
      blocker.reset();
    }
  }

  return (
    <>
      <Section>
        <BackButton to={location.pathname}>
          {locales.route.content.back}
        </BackButton>
        <p className="mv-my-6 @md:mv-mt-0">{locales.route.content.intro}</p>
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
          <Input name={Deep} defaultValue="true" type="hidden" />
          <div className="mv-flex mv-flex-col mv-gap-6 @md:mv-gap-4">
            <div className="mv-flex mv-flex-col mv-gap-4 @md:mv-p-4 @md:mv-border @md:mv-rounded-lg @md:mv-border-gray-200">
              <h2 className="mv-text-primary mv-text-lg mv-font-semibold mv-mb-0">
                {locales.route.form.timeframe.headline}
              </h2>

              <TextAreaWithCounter
                {...conform.textarea(fields.timeframe)}
                id={fields.timeframe.id || ""}
                label={locales.route.form.timeframe.label}
                errorMessage={fields.timeframe.error}
                maxCharacters={200}
                rte
              />
            </div>

            <div className="mv-flex mv-flex-col mv-gap-4 @md:mv-p-4 @md:mv-border @md:mv-rounded-lg @md:mv-border-gray-200">
              <h2 className="mv-text-primary mv-text-lg mv-font-semibold mv-mb-0">
                {locales.route.form.personellSituation.headline}
              </h2>

              <TextAreaWithCounter
                {...conform.textarea(fields.jobFillings)}
                id={fields.jobFillings.id || ""}
                label={locales.route.form.personellSituation.jobFillings.label}
                helperText={
                  locales.route.form.personellSituation.jobFillings.helper
                }
                errorMessage={fields.jobFillings.error}
                maxCharacters={800}
                rte
              />

              <TextAreaWithCounter
                {...conform.textarea(fields.furtherJobFillings)}
                id={fields.furtherJobFillings.id || ""}
                label={
                  locales.route.form.personellSituation.furtherJobFillings.label
                }
                helperText={
                  locales.route.form.personellSituation.furtherJobFillings
                    .helper
                }
                errorMessage={fields.furtherJobFillings.error}
                maxCharacters={200}
                rte
              />
            </div>

            <div className="mv-flex mv-flex-col mv-gap-4 @md:mv-p-4 @md:mv-border @md:mv-rounded-lg @md:mv-border-gray-200">
              <h2 className="mv-text-primary mv-text-lg mv-font-semibold mv-mb-0">
                {locales.route.form.budget.headline}
              </h2>

              <Input {...conform.input(fields.yearlyBudget)}>
                <Input.Label htmlFor={fields.yearlyBudget.id}>
                  {locales.route.form.budget.yearlyBudget.label}
                </Input.Label>
                {typeof fields.yearlyBudget.error !== "undefined" && (
                  <Input.Error>{fields.yearlyBudget.error}</Input.Error>
                )}
                <Input.HelperText>
                  {locales.route.form.budget.yearlyBudget.helper}
                </Input.HelperText>
              </Input>

              <ConformSelect
                id={fields.financings.id}
                cta={locales.route.form.budget.financings.option}
              >
                <ConformSelect.Label htmlFor={fields.financings.id}>
                  {locales.route.form.budget.financings.label}
                </ConformSelect.Label>
                <ConformSelect.HelperText>
                  {locales.route.form.budget.financings.helper}
                </ConformSelect.HelperText>
                {allFinancings
                  .filter((financing) => {
                    return !financingList.some((listFinancing) => {
                      return listFinancing.defaultValue === financing.id;
                    });
                  })
                  .map((filteredFinancing) => {
                    let title;
                    if (filteredFinancing.slug in locales.financings) {
                      type LocaleKey = keyof typeof locales.financings;
                      title =
                        locales.financings[filteredFinancing.slug as LocaleKey]
                          .title;
                    } else {
                      console.error(
                        `Financing ${filteredFinancing.slug} not found in locales`
                      );
                      title = filteredFinancing.slug;
                    }
                    return (
                      <button
                        key={filteredFinancing.id}
                        {...list.insert(fields.financings.name, {
                          defaultValue: filteredFinancing.id,
                        })}
                        className="mv-text-start mv-w-full mv-py-1 mv-px-2"
                      >
                        {title}
                      </button>
                    );
                  })}
              </ConformSelect>
              {financingList.length > 0 && (
                <Chip.Container>
                  {financingList.map((listFinancing, index) => {
                    let financingSlug = allFinancings.find((financing) => {
                      return financing.id === listFinancing.defaultValue;
                    })?.slug;
                    let title;
                    if (financingSlug === undefined) {
                      console.error(
                        `Financing with id ${listFinancing.id} not found in allAdditionalDisciplines`
                      );
                      title = null;
                    } else {
                      if (financingSlug in locales.financings) {
                        type LocaleKey = keyof typeof locales.financings;
                        title =
                          locales.financings[financingSlug as LocaleKey].title;
                      } else {
                        console.error(
                          `Financing ${financingSlug} not found in locales`
                        );
                        title = financingSlug;
                      }
                    }
                    return (
                      <Chip key={listFinancing.key}>
                        {title || locales.route.content.notFound}
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
                label={locales.route.form.budget.furtherFinancings.label}
                helperText={locales.route.form.budget.furtherFinancings.helper}
                errorMessage={fields.furtherFinancings.error}
                maxCharacters={800}
                rte
              />
            </div>

            <div className="mv-flex mv-flex-col mv-gap-4 @md:mv-p-4 @md:mv-border @md:mv-rounded-lg @md:mv-border-gray-200">
              <h2 className="mv-text-primary mv-text-lg mv-font-semibold mv-mb-0">
                {locales.route.form.technicalFrame.headline}
              </h2>

              <TextAreaWithCounter
                {...conform.textarea(fields.technicalRequirements)}
                id={fields.technicalRequirements.id || ""}
                label={
                  locales.route.form.technicalFrame.technicalRequirements.label
                }
                errorMessage={fields.technicalRequirements.error}
                maxCharacters={500}
                rte
              />

              <TextAreaWithCounter
                {...conform.textarea(fields.furtherTechnicalRequirements)}
                id={fields.furtherTechnicalRequirements.id || ""}
                label={
                  locales.route.form.technicalFrame.furtherTechnicalRequirements
                    .label
                }
                errorMessage={fields.furtherTechnicalRequirements.error}
                maxCharacters={500}
                rte
              />
            </div>

            <div className="mv-flex mv-flex-col mv-gap-4 @md:mv-p-4 @md:mv-border @md:mv-rounded-lg @md:mv-border-gray-200">
              <h2 className="mv-text-primary mv-text-lg mv-font-semibold mv-mb-0">
                {locales.route.form.spatialSituation.headline}
              </h2>

              <TextAreaWithCounter
                {...conform.textarea(fields.roomSituation)}
                id={fields.roomSituation.id || ""}
                label={locales.route.form.spatialSituation.roomSituation.label}
                helperText={
                  locales.route.form.spatialSituation.roomSituation.helper
                }
                errorMessage={fields.roomSituation.error}
                maxCharacters={200}
                rte
              />

              <TextAreaWithCounter
                {...conform.textarea(fields.furtherRoomSituation)}
                id={fields.furtherRoomSituation.id || ""}
                label={
                  locales.route.form.spatialSituation.furtherRoomSituation.label
                }
                errorMessage={fields.furtherRoomSituation.error}
                maxCharacters={200}
                rte
              />
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
                    {locales.route.form.reset}
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
                    {locales.route.form.submit}
                  </Button>
                </Controls>
              </div>
            </div>
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
