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
import { checkFeatureAbilitiesOrThrow } from "~/lib/utils/application";
import { invariantResponse } from "~/lib/utils/response";
import { getParamValueOrThrow } from "~/lib/utils/routes";
import { prismaClient } from "~/prisma.server";
import { detectLanguage } from "~/root.server";
import { getRedirectPathOnProtectedOrganizationRoute } from "~/routes/organization/$slug/utils.server";
import { DeepSearchParam } from "~/form-helpers";

const i18nNS = ["routes/next/organization/settings/danger-zone/delete"];
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
  const slug = getParamValueOrThrow(params, "slug");

  const locale = detectLanguage(request);
  const t = await i18next.getFixedT(locale, i18nNS);

  const organization = await prismaClient.organization.findFirst({
    where: { slug },
    select: {
      name: true,
    },
  });

  invariantResponse(organization !== null, t("error.organizationNotFound"), {
    status: 404,
  });

  return json({
    organization,
  });
};

export const action = async (args: ActionFunctionArgs) => {
  const { request, params } = args;

  const locale = detectLanguage(request);
  const t = await i18next.getFixedT(locale, i18nNS);

  const { authClient } = createAuthClient(request);
  const sessionUser = await getSessionUser(authClient);
  await checkFeatureAbilitiesOrThrow(authClient, ["next-organization-create"]);

  // check slug exists (throw bad request if not)
  invariantResponse(params.slug !== undefined, t("error.invalidRoute"), {
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

  invariantResponse(organization !== null, t("error.organizationNotFound"), {
    status: 404,
  });

  const formData = await request.formData();
  const submission = parse(formData, {
    schema: createSchema(t, organization.name),
  });

  if (typeof submission.value !== "undefined" && submission.value !== null) {
    await prismaClient.organization.delete({
      where: {
        id: organization.id,
      },
    });
    return redirectWithAlert(`/dashboard`, {
      message: t("content.success", { name: organization.name }),
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
        schema: createSchema(t, loaderData.organization.name),
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
            name: loaderData.organization.name,
          }}
          components={[<strong key="delete-organization-confirmation" />]}
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
