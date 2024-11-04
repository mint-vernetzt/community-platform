import { useForm } from "@conform-to/react";
import { parse } from "@conform-to/zod";
import { Button, Input } from "@mint-vernetzt/components";
import {
  json,
  redirect,
  type ActionFunctionArgs,
  type LoaderFunctionArgs,
} from "@remix-run/node";
import {
  Form,
  useActionData,
  useBlocker,
  useLoaderData,
} from "@remix-run/react";
import { type TFunction } from "i18next";
import React from "react";
import { Trans, useTranslation } from "react-i18next";
import { z } from "zod";
import { createAuthClient, getSessionUser } from "~/auth.server";
import i18next from "~/i18next.server";
import { invariantResponse } from "~/lib/utils/response";
import { prismaClient } from "~/prisma.server";
import { detectLanguage } from "~/root.server";
import { redirectWithToast } from "~/toast.server";
import {
  getRedirectPathOnProtectedProjectRoute,
  getSubmissionHash,
} from "../utils.server";

const i18nNS = ["routes/project/settings/danger-zone/change-url"];
export const handle = {
  i18n: i18nNS,
};

function createSchema(
  t: TFunction,
  constraint?: {
    isSlugUnique?: (slug: string) => Promise<boolean>;
  }
) {
  return z.object({
    slug: z
      .string()
      .min(3, t("validation.slug.min"))
      .max(50, t("validation.slug.max"))
      .regex(/^[-a-z0-9-]+$/i, t("validation.slug.regex"))
      .refine(async (slug) => {
        if (
          typeof constraint !== "undefined" &&
          typeof constraint.isSlugUnique === "function"
        ) {
          return await constraint.isSlugUnique(slug);
        }
        return true;
      }, t("validations.slug.unique")),
  });
}

export const loader = async (args: LoaderFunctionArgs) => {
  const { request, params } = args;

  const locale = detectLanguage(request);
  const t = await i18next.getFixedT(locale, i18nNS);

  const { authClient } = createAuthClient(request);
  const sessionUser = await getSessionUser(authClient);

  invariantResponse(
    typeof params.slug !== "undefined",
    t("error.missingParameterSlug"),
    {
      status: 404,
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

  return json({ slug: params.slug, baseURL: process.env.COMMUNITY_BASE_URL });
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

  const formData = await request.formData();
  const submission = await parse(formData, {
    schema: createSchema(t, {
      isSlugUnique: async (slug) => {
        const project = await prismaClient.project.findFirst({
          where: { slug: slug },
          select: {
            slug: true,
          },
        });
        return project === null;
      },
    }),
    async: true,
  });

  if (typeof submission.value !== "undefined" && submission.value !== null) {
    await prismaClient.project.update({
      where: { slug: params.slug },
      data: { slug: submission.value.slug },
    });

    const url = new URL(request.url);
    const pathname = url.pathname.replace(params.slug, submission.value.slug);

    const hash = getSubmissionHash(submission);

    return redirectWithToast(
      `${pathname}?deep`,
      {
        id: "settings-toast",
        key: hash,
        message: t("content.feedback"),
      },
      { scrollToToast: true }
    );
  }

  return json(submission);
};

function ChangeURL() {
  const loaderData = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();

  const { t } = useTranslation(i18nNS);

  const [form, fields] = useForm({
    shouldValidate: "onSubmit",
    onValidate: (values) => {
      return parse(values.formData, { schema: createSchema(t) });
    },
    shouldRevalidate: "onSubmit",
    lastSubmission: actionData,
  });

  const [isDirty, setIsDirty] = React.useState(false);
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      isDirty && currentLocation.pathname !== nextLocation.pathname
  );
  if (blocker.state === "blocked") {
    const confirmed = confirm(t("content.prompt"));
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
      <p>
        <Trans
          i18nKey="content.reach"
          ns={i18nNS}
          components={[
            <span key="current-project-url" className="mv-break-all">
              {loaderData.baseURL}/project/<strong>{loaderData.slug}</strong>
            </span>,
          ]}
        />
      </p>
      <p>{t("content.note")}</p>
      <Form
        method="post"
        {...form.props}
        onChange={() => {
          setIsDirty(true);
        }}
        onReset={() => {
          setIsDirty(false);
        }}
      >
        <div className="mv-flex mv-flex-col mv-gap-4 @md:mv-p-4 @md:mv-border @md:mv-rounded-lg @md:mv-border-gray-200">
          <Input id="deep" defaultValue="true" type="hidden" />
          <Input id="slug" defaultValue={loaderData.slug}>
            <Input.Label htmlFor={fields.slug.id}>
              {t("content.label")}
            </Input.Label>
            {typeof actionData !== "undefined" &&
              typeof fields.slug.error !== "undefined" && (
                <Input.Error>{fields.slug.error}</Input.Error>
              )}
          </Input>
          <div className="mv-flex mv-w-full mv-justify-end">
            <div className="mv-flex mv-shrink mv-w-full @md:mv-max-w-fit @lg:mv-w-auto mv-items-center mv-justify-center @lg:mv-justify-end">
              <Button
                type="submit"
                level="negative"
                fullSize
                onClick={() => {
                  setIsDirty(false);
                }}
              >
                {t("content.action")}
              </Button>
            </div>
          </div>
        </div>
      </Form>
    </>
  );
}

export default ChangeURL;
