import { getFormProps, getInputProps, useForm } from "@conform-to/react-v1";
import { getZodConstraint, parseWithZod } from "@conform-to/zod-v1";
import { Button } from "@mint-vernetzt/components/src/molecules/Button";
import { Input } from "@mint-vernetzt/components/src/molecules/Input";
import * as Sentry from "@sentry/node";
import {
  Form,
  redirect,
  useActionData,
  useLoaderData,
  useNavigation,
  type ActionFunctionArgs,
  type LoaderFunctionArgs,
} from "react-router";
import { useHydrated } from "remix-utils/use-hydrated";
import { z } from "zod";
import { redirectWithAlert } from "~/alert.server";
import { createAuthClient, getSessionUser } from "~/auth.server";
import { detectLanguage } from "~/i18n.server";
import {
  insertComponentsIntoLocale,
  insertParametersIntoLocale,
} from "~/lib/utils/i18n";
import { invariant, invariantResponse } from "~/lib/utils/response";
import { getParamValueOrThrow } from "~/lib/utils/routes";
import { languageModuleMap } from "~/locales/.server";
import { prismaClient } from "~/prisma.server";
import { getRedirectPathOnProtectedOrganizationRoute } from "~/routes/organization/$slug/utils.server";
import {
  deleteOrganizationBySlug,
  type DeleteOrganizationLocales,
} from "./delete.server";

function createSchema(locales: DeleteOrganizationLocales, name: string) {
  return z.object({
    name: z
      .string({
        required_error: locales.validation.name.required,
      })
      .refine((value) => {
        return value === name;
      }, locales.validation.name.noMatch),
  });
}

export const loader = async (args: LoaderFunctionArgs) => {
  const { request, params } = args;
  const slug = getParamValueOrThrow(params, "slug");

  const language = await detectLanguage(request);
  const locales =
    languageModuleMap[language][
      "organization/$slug/settings/danger-zone/delete"
    ];

  const organization = await prismaClient.organization.findFirst({
    where: { slug },
    select: {
      name: true,
    },
  });

  invariantResponse(organization !== null, locales.error.organizationNotFound, {
    status: 404,
  });

  return {
    organization,
    locales,
    currentTimestamp: Date.now(),
  };
};

export const action = async (args: ActionFunctionArgs) => {
  const { request, params } = args;

  const language = await detectLanguage(request);
  const locales =
    languageModuleMap[language][
      "organization/$slug/settings/danger-zone/delete"
    ];

  const { authClient } = createAuthClient(request);
  const sessionUser = await getSessionUser(authClient);

  // check slug exists (throw bad request if not)
  invariantResponse(params.slug !== undefined, locales.error.invalidRoute, {
    status: 400,
  });

  const redirectPath = await getRedirectPathOnProtectedOrganizationRoute({
    request,
    slug: params.slug,
    sessionUser,
    authClient,
  });

  if (redirectPath !== null) {
    return redirect(redirectPath);
  }

  const organization = await prismaClient.organization.findFirst({
    where: { slug: params.slug },
    select: {
      id: true,
      name: true,
    },
  });

  invariantResponse(organization !== null, locales.error.organizationNotFound, {
    status: 404,
  });

  const formData = await request.formData();
  const submission = await parseWithZod(formData, {
    schema: createSchema(locales, organization.name).transform(
      async (data, ctx) => {
        try {
          invariant(params.slug !== undefined, locales.error.invalidRoute);
          await deleteOrganizationBySlug(params.slug);
        } catch (error) {
          Sentry.captureException(error);
          ctx.addIssue({
            code: "custom",
            message: locales.error.deletionFailed,
          });
          return z.NEVER;
        }
        return { ...data };
      }
    ),
    async: true,
  });

  if (submission.status !== "success") {
    return {
      currentTimestamp: Date.now(),
      submission: submission.reply(),
    };
  }

  return redirectWithAlert(`/dashboard`, {
    message: insertParametersIntoLocale(locales.content.success, {
      name: organization.name,
    }),
  });
};

function Delete() {
  const loaderData = useLoaderData<typeof loader>();
  const { locales } = loaderData;
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isHydrated = useHydrated();

  const [form, fields] = useForm({
    id: `delete-organization-form-${
      actionData?.currentTimestamp || loaderData.currentTimestamp
    }`,
    constraint: getZodConstraint(
      createSchema(locales, loaderData.organization.name)
    ),
    shouldValidate: "onInput",
    onValidate: (values) => {
      return parseWithZod(values.formData, {
        schema: createSchema(locales, loaderData.organization.name),
      });
    },
    shouldRevalidate: "onInput",
    lastResult: navigation.state === "idle" ? actionData?.submission : null,
  });

  return (
    <>
      <p>
        {insertComponentsIntoLocale(
          insertParametersIntoLocale(locales.content.confirmation, {
            name: loaderData.organization.name,
          }),
          [<strong key="delete-organization-confirmation" />]
        )}
      </p>
      <p>{locales.content.explanation}</p>
      <Form
        {...getFormProps(form)}
        method="post"
        preventScrollReset
        autoComplete="off"
      >
        <div className="mv-flex mv-flex-col mv-gap-4 @md:mv-p-4 @md:mv-border @md:mv-rounded-lg @md:mv-border-gray-200">
          <Input
            {...getInputProps(fields.name, { type: "text" })}
            placeholder={locales.content.placeholder}
            key={"confirm-deletion-with-name"}
          >
            <Input.Label htmlFor={fields.name.id}>
              {locales.content.label}
            </Input.Label>
            {typeof fields.name.errors !== "undefined" &&
            fields.name.errors.length > 0
              ? fields.name.errors.map((error) => (
                  <Input.Error id={fields.name.errorId} key={error}>
                    {error}
                  </Input.Error>
                ))
              : null}
          </Input>
          <div className="mv-flex mv-w-full mv-justify-end">
            <div className="mv-flex mv-shrink mv-w-full @md:mv-max-w-fit @lg:mv-w-auto mv-items-center mv-justify-center @lg:mv-justify-end">
              <Button
                type="submit"
                level="negative"
                disabled={
                  isHydrated
                    ? form.dirty === false || form.valid === false
                    : false
                }
                fullSize
              >
                {locales.content.action}
              </Button>
            </div>
          </div>
        </div>
        {typeof form.errors !== "undefined" && form.errors.length > 0 ? (
          <div>
            {form.errors.map((error, index) => {
              return (
                <div
                  id={form.errorId}
                  key={index}
                  className="mv-text-sm mv-font-semibold mv-text-negative-600"
                >
                  {error}
                </div>
              );
            })}
          </div>
        ) : null}
      </Form>
    </>
  );
}

export default Delete;
