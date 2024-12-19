import { useForm } from "@conform-to/react";
import { parse } from "@conform-to/zod";
import { Button } from "@mint-vernetzt/components/src/molecules/Button";
import { Input } from "@mint-vernetzt/components/src/molecules/Input";
import {
  redirect,
  type ActionFunctionArgs,
  type LoaderFunctionArgs,
} from "@remix-run/node";
import { Form, useActionData, useLoaderData } from "@remix-run/react";
import { z } from "zod";
import { redirectWithAlert } from "~/alert.server";
import { createAuthClient, getSessionUser } from "~/auth.server";
import { invariantResponse } from "~/lib/utils/response";
import { prismaClient } from "~/prisma.server";
import { detectLanguage } from "~/i18n.server";
import { getRedirectPathOnProtectedProjectRoute } from "../utils.server";
import { Deep } from "~/lib/utils/searchParams";
import { type DeleteProjectLocales } from "./delete.server";
import { languageModuleMap } from "~/locales/.server";
import {
  insertComponentsIntoLocale,
  insertParametersIntoLocale,
} from "~/lib/utils/i18n";

function createSchema(locales: DeleteProjectLocales, name: string) {
  return z.object({
    name: z.string().refine((value) => {
      return value === name;
    }, locales.validation.name.noMatch),
  });
}

export const loader = async (args: LoaderFunctionArgs) => {
  const { request, params } = args;

  const language = await detectLanguage(request);
  const locales =
    languageModuleMap[language]["project/$slug/settings/danger-zone/delete"];

  const { authClient } = createAuthClient(request);

  const sessionUser = await getSessionUser(authClient);

  // check slug exists (throw bad request if not)
  invariantResponse(params.slug !== undefined, locales.error.invalidRoute, {
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

  const project = await prismaClient.project.findFirst({
    where: { slug: params.slug },
    select: {
      name: true,
    },
  });

  invariantResponse(project !== null, locales.error.projectNotFound, {
    status: 404,
  });

  return {
    project,
    locales,
  };
};

export const action = async (args: ActionFunctionArgs) => {
  const { request, params } = args;

  const language = await detectLanguage(request);
  const locales =
    languageModuleMap[language]["project/$slug/settings/danger-zone/delete"];

  const { authClient } = createAuthClient(request);

  const sessionUser = await getSessionUser(authClient);

  // check slug exists (throw bad request if not)
  invariantResponse(params.slug !== undefined, locales.error.invalidRoute, {
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

  const project = await prismaClient.project.findFirst({
    where: { slug: params.slug },
    select: {
      id: true,
      name: true,
    },
  });

  invariantResponse(project !== null, locales.error.projectNotFound, {
    status: 404,
  });

  const formData = await request.formData();
  const submission = parse(formData, {
    schema: createSchema(locales, project.name),
  });

  if (typeof submission.value !== "undefined" && submission.value !== null) {
    await prismaClient.project.delete({
      where: {
        id: project.id,
      },
    });
    return redirectWithAlert(`/dashboard`, {
      message: insertParametersIntoLocale(locales.content.success, {
        name: project.name,
      }),
    });
  }

  return submission;
};

function Delete() {
  const loaderData = useLoaderData<typeof loader>();
  const { locales } = loaderData;
  const actionData = useActionData<typeof action>();

  const [form, fields] = useForm({
    shouldValidate: "onSubmit",
    onValidate: (values) => {
      return parse(values.formData, {
        schema: createSchema(locales, loaderData.project.name),
      });
    },
    shouldRevalidate: "onSubmit",
    lastSubmission: actionData,
  });

  return (
    <>
      <p>
        {insertComponentsIntoLocale(
          insertParametersIntoLocale(locales.content.confirmation, {
            name: loaderData.project.name,
          }),
          [<strong key="delete-project-confirmation" />]
        )}
      </p>
      <p>{locales.content.explanation}</p>
      <Form method="post" {...form.props}>
        <div className="mv-flex mv-flex-col mv-gap-4 @md:mv-p-4 @md:mv-border @md:mv-rounded-lg @md:mv-border-gray-200">
          <Input name={Deep} defaultValue="true" type="hidden" />
          <Input id="name">
            <Input.Label htmlFor={fields.name.id}>
              {locales.content.label}
            </Input.Label>
            {typeof fields.name.error !== "undefined" && (
              <Input.Error>{fields.name.error}</Input.Error>
            )}
          </Input>
          <div className="mv-flex mv-w-full mv-justify-end">
            <div className="mv-flex mv-shrink mv-w-full @md:mv-max-w-fit @lg:mv-w-auto mv-items-center mv-justify-center @lg:mv-justify-end">
              <Button type="submit" level="negative" fullSize>
                {locales.content.action}
              </Button>
            </div>
          </div>
        </div>
      </Form>
    </>
  );
}

export default Delete;
