import { useForm } from "@conform-to/react";
import { parse } from "@conform-to/zod";
import { Button } from "@mint-vernetzt/components/src/molecules/Button";
import { Input } from "@mint-vernetzt/components/src/molecules/Input";
import {
  redirect,
  type ActionFunctionArgs,
  type LoaderFunctionArgs,
} from "react-router";
import { Form, useActionData, useBlocker, useLoaderData } from "react-router";
import React from "react";
import { z } from "zod";
import { createAuthClient, getSessionUser } from "~/auth.server";
import { invariantResponse } from "~/lib/utils/response";
import { prismaClient } from "~/prisma.server";
import { detectLanguage } from "~/i18n.server";
import { redirectWithToast } from "~/toast.server";
import {
  getRedirectPathOnProtectedProjectRoute,
  getHash,
} from "../utils.server";
import { Deep } from "~/lib/utils/searchParams";
import { type ChangeProjectUrlLocales } from "./change-url.server";
import { languageModuleMap } from "~/locales/.server";
import {
  insertComponentsIntoLocale,
  insertParametersIntoLocale,
} from "~/lib/utils/i18n";

function createSchema(
  locales: ChangeProjectUrlLocales,
  constraint?: {
    isSlugUnique?: (slug: string) => Promise<boolean>;
  }
) {
  return z.object({
    slug: z
      .string()
      .min(3, locales.validation.slug.min)
      .max(50, locales.validation.slug.max)
      .regex(/^[-a-z0-9-]+$/i, locales.validation.slug.regex)
      .refine(async (slug) => {
        if (
          typeof constraint !== "undefined" &&
          typeof constraint.isSlugUnique === "function"
        ) {
          return await constraint.isSlugUnique(slug);
        }
        return true;
      }, locales.validation.slug.unique),
  });
}

export const loader = async (args: LoaderFunctionArgs) => {
  const { request, params } = args;

  const language = await detectLanguage(request);
  const locales =
    languageModuleMap[language][
      "project/$slug/settings/danger-zone/change-url"
    ];

  const { authClient } = createAuthClient(request);
  const sessionUser = await getSessionUser(authClient);

  invariantResponse(
    typeof params.slug !== "undefined",
    locales.error.missingParameterSlug,
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

  return {
    slug: params.slug,
    baseURL: process.env.COMMUNITY_BASE_URL,
    locales,
  };
};

export const action = async (args: ActionFunctionArgs) => {
  const { request, params } = args;

  const language = await detectLanguage(request);
  const locales =
    languageModuleMap[language][
      "project/$slug/settings/danger-zone/change-url"
    ];

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

  const formData = await request.formData();
  const submission = await parse(formData, {
    schema: createSchema(locales, {
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

    const hash = getHash(submission);

    return redirectWithToast(
      `${pathname}?${Deep}=true`,
      {
        id: "settings-toast",
        key: hash,
        message: locales.content.feedback,
      },
      { scrollToToast: true }
    );
  }

  return submission;
};

function ChangeURL() {
  const loaderData = useLoaderData<typeof loader>();
  const { locales } = loaderData;
  const actionData = useActionData<typeof action>();

  const [form, fields] = useForm({
    shouldValidate: "onSubmit",
    onValidate: (values) => {
      return parse(values.formData, { schema: createSchema(locales) });
    },
    shouldRevalidate: "onSubmit",
    // TODO: Remove assertion by using conform v1
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    lastSubmission: actionData,
  });

  const [isDirty, setIsDirty] = React.useState(false);
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      isDirty && currentLocation.pathname !== nextLocation.pathname
  );
  if (blocker.state === "blocked") {
    const confirmed = confirm(locales.content.prompt);
    if (confirmed === true) {
      // TODO: fix blocker -> use org settings as blueprint
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
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
        {insertComponentsIntoLocale(
          insertParametersIntoLocale(locales.content.reach, {
            url: `${loaderData.baseURL}/project/`,
            slug: loaderData.slug,
          }),
          [
            <span key="current-project-url" className="mv-break-all" />,
            <strong key="current-project-slug" />,
          ]
        )}
      </p>
      <p>{locales.content.note}</p>
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
          <Input name={Deep} defaultValue="true" type="hidden" />
          <Input id="slug" defaultValue={loaderData.slug}>
            <Input.Label htmlFor={fields.slug.id}>
              {locales.content.label}
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
                {locales.content.action}
              </Button>
            </div>
          </div>
        </div>
      </Form>
    </>
  );
}

export default ChangeURL;
