import { useForm } from "@conform-to/react";
import { parse } from "@conform-to/zod";
import { Button, Input } from "@mint-vernetzt/components";
import { type DataFunctionArgs, json, redirect } from "@remix-run/node";
import { Form, useActionData, useLoaderData } from "@remix-run/react";
import { z } from "zod";
import { createAuthClient, getSessionUser } from "~/auth.server";
import { invariantResponse } from "~/lib/utils/response";
import { prismaClient } from "~/prisma.server";
import { getRedirectPathOnProtectedProjectRoute } from "../utils.server";
import { redirectWithAlert } from "~/alert.server";
import { TFunction } from "i18next";
import i18next from "~/i18next.server";
import { Trans, useTranslation } from "react-i18next";

const i18nNS = ["routes/project/settings/danger-zone/delete"];
export const handle = {
  i18n: i18nNS,
};

function createSchema(t: TFunction, name: string) {
  return z.object({
    name: z.string().refine((value) => {
      return value === name;
    }, t("validation.name.noMatch")),
  });
}

export const loader = async (args: DataFunctionArgs) => {
  const { request, params } = args;
  const response = new Response();
  const t = await i18next.getFixedT(request, i18nNS);

  const authClient = createAuthClient(request, response);

  const sessionUser = await getSessionUser(authClient);

  // check slug exists (throw bad request if not)
  invariantResponse(params.slug !== undefined, t("error.invalidRoute"), {
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

  const project = await prismaClient.project.findFirst({
    where: { slug: params.slug },
    select: {
      name: true,
    },
  });

  invariantResponse(project !== null, t("error.projectNotFound"), {
    status: 404,
  });

  return json(
    {
      project,
    },
    { headers: response.headers }
  );
};

export const action = async (args: DataFunctionArgs) => {
  const { request, params } = args;
  const response = new Response();
  const t = await i18next.getFixedT(request, i18nNS);
  const authClient = createAuthClient(request, response);

  const sessionUser = await getSessionUser(authClient);

  // check slug exists (throw bad request if not)
  invariantResponse(params.slug !== undefined, t("error.invalidRoute"), {
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

  const project = await prismaClient.project.findFirst({
    where: { slug: params.slug },
    select: {
      id: true,
      name: true,
    },
  });

  invariantResponse(project !== null, t("error.projectNotFound"), {
    status: 404,
  });

  const formData = await request.formData();
  const submission = parse(formData, {
    schema: createSchema(t, project.name),
  });

  if (typeof submission.value !== "undefined" && submission.value !== null) {
    await prismaClient.project.delete({
      where: {
        id: project.id,
      },
    });
    return redirectWithAlert(
      `/dashboard`,
      {
        message: t("content.error", { name: project.name }),
      },
      { headers: response.headers }
    );
  }

  return json(submission, { headers: response.headers });
};

function Delete() {
  const loaderData = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const { t } = useTranslation(i18nNS);

  const [form, fields] = useForm({
    shouldValidate: "onSubmit",
    onValidate: (values) => {
      return parse(values.formData, {
        schema: createSchema(t, loaderData.project.name),
      });
    },
    shouldRevalidate: "onSubmit",
    lastSubmission: actionData,
  });

  return (
    <>
      <p>
        <Trans
          i18nKey="content.confirmation"
          ns={i18nNS}
          values={{
            name: loaderData.project.name,
          }}
          components={[<strong />]}
        />
      </p>
      <p>{t("content.explanation")}</p>
      <Form method="post" {...form.props}>
        <div className="mv-flex mv-flex-col mv-gap-4 md:mv-p-4 md:mv-border md:mv-rounded-lg md:mv-border-gray-200">
          <Input id="deep" defaultValue="true" type="hidden" />
          <Input id="name">
            <Input.Label htmlFor={fields.name.id}>
              {t("content.label")}
            </Input.Label>
            {typeof fields.name.error !== "undefined" && (
              <Input.Error>{fields.name.error}</Input.Error>
            )}
          </Input>
          <div className="mv-flex mv-w-full mv-justify-end">
            <div className="mv-flex mv-shrink mv-w-full md:mv-max-w-fit lg:mv-w-auto mv-items-center mv-justify-center lg:mv-justify-end">
              <Button type="submit" level="negative" fullSize>
                {t("content.action")}
              </Button>
            </div>
          </div>
        </div>
      </Form>
    </>
  );
}

export default Delete;
