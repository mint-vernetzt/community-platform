import { useForm } from "@conform-to/react";
import { parse } from "@conform-to/zod";
import { Button, Input } from "@mint-vernetzt/components";
import {
  json,
  redirect,
  type ActionFunctionArgs,
  type LoaderFunctionArgs,
} from "@remix-run/node";
import { Form, useActionData, useLoaderData } from "@remix-run/react";
import { type TFunction } from "i18next";
import { Trans, useTranslation } from "react-i18next";
import { z } from "zod";
import { redirectWithAlert } from "~/alert.server";
import { createAuthClient, getSessionUser } from "~/auth.server";
import i18next from "~/i18next.server";
import { invariantResponse } from "~/lib/utils/response";
import { prismaClient } from "~/prisma.server";
import { detectLanguage } from "~/root.server";
import { getRedirectPathOnProtectedProjectRoute } from "../utils.server";
import { DeepSearchParam } from "~/form-helpers";

const i18nNS = ["routes/project/settings/danger-zone/delete"] as const;
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

export const loader = async (args: LoaderFunctionArgs) => {
  const { request, params } = args;

  const locale = detectLanguage(request);
  const t = await i18next.getFixedT(locale, i18nNS);

  const { authClient } = createAuthClient(request);

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
    return redirect(redirectPath);
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

  return json({
    project,
  });
};

export const action = async (args: ActionFunctionArgs) => {
  const { request, params } = args;

  const locale = detectLanguage(request);
  const t = await i18next.getFixedT(locale, i18nNS);

  const { authClient } = createAuthClient(request);

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
    return redirect(redirectPath);
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
    return redirectWithAlert(`/dashboard`, {
      message: t("content.success", { name: project.name }),
    });
  }

  return json(submission);
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
          components={[<strong key="delete-project-confirmation" />]}
        />
      </p>
      <p>{t("content.explanation")}</p>
      <Form method="post" {...form.props}>
        <div className="mv-flex mv-flex-col mv-gap-4 @md:mv-p-4 @md:mv-border @md:mv-rounded-lg @md:mv-border-gray-200">
          <Input name={DeepSearchParam} defaultValue="true" type="hidden" />
          <Input id="name">
            <Input.Label htmlFor={fields.name.id}>
              {t("content.label")}
            </Input.Label>
            {typeof fields.name.error !== "undefined" && (
              <Input.Error>{fields.name.error}</Input.Error>
            )}
          </Input>
          <div className="mv-flex mv-w-full mv-justify-end">
            <div className="mv-flex mv-shrink mv-w-full @md:mv-max-w-fit @lg:mv-w-auto mv-items-center mv-justify-center @lg:mv-justify-end">
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
