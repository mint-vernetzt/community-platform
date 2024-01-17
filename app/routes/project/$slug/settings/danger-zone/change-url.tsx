import { useForm } from "@conform-to/react";
import { parse } from "@conform-to/zod";
import { Button, Input } from "@mint-vernetzt/components";
import {
  type ActionFunctionArgs,
  type LoaderFunctionArgs,
  json,
  redirect,
} from "@remix-run/node";
import { Form, useActionData, useLoaderData } from "@remix-run/react";
import React from "react";
import { z } from "zod";
import { createAuthClient, getSessionUser } from "~/auth.server";
import { usePrompt } from "~/lib/hooks/usePrompt";
import { invariantResponse } from "~/lib/utils/response";
import { prismaClient } from "~/prisma.server";
import { redirectWithToast } from "~/toast.server";
import {
  getRedirectPathOnProtectedProjectRoute,
  getSubmissionHash,
} from "../utils.server";

function createSchema(constraint?: {
  isSlugUnique?: (slug: string) => Promise<boolean>;
}) {
  return z.object({
    slug: z
      .string()
      .min(3, "Es werden mind. 3 Zeichen benötigt.")
      .max(50, "Es sind max. 50 Zeichen erlaubt.")
      .regex(
        /^[-a-z0-9-]+$/i,
        "Nur Buchstaben, Zahlen und Bindestriche erlaubt."
      )
      .refine(async (slug) => {
        if (
          typeof constraint !== "undefined" &&
          typeof constraint.isSlugUnique === "function"
        ) {
          return await constraint.isSlugUnique(slug);
        }
        return true;
      }, "Diese URL ist bereits vergeben."),
  });
}

export const loader = async (args: LoaderFunctionArgs) => {
  const { request, params } = args;
  const { authClient, response } = createAuthClient(request);
  const sessionUser = await getSessionUser(authClient);

  invariantResponse(
    typeof params.slug !== "undefined",
    'Route parameter "slug" not found',
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
    return redirect(redirectPath, { headers: response.headers });
  }

  return json(
    { slug: params.slug, baseURL: process.env.COMMUNITY_BASE_URL },
    { headers: response.headers }
  );
};

export const action = async (args: ActionFunctionArgs) => {
  const { request, params } = args;
  const { authClient, response } = createAuthClient(request);
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

  const formData = await request.formData();
  const submission = await parse(formData, {
    schema: createSchema({
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
        message: "URL wurde geändert.",
      },
      { init: { headers: response.headers }, scrollToToast: true }
    );
  }

  return json(submission, { headers: response.headers });
};

function ChangeURL() {
  const loaderData = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();

  const [form, fields] = useForm({
    shouldValidate: "onSubmit",
    onValidate: (values) => {
      return parse(values.formData, { schema: createSchema() });
    },
    shouldRevalidate: "onSubmit",
    lastSubmission: actionData,
  });

  const [isDirty, setIsDirty] = React.useState(false);
  // TODO: When updating to remix v2 use "useBlocker()" hook instead to provide custom ui (Modal, etc...)
  // see https://remix.run/docs/en/main/hooks/use-blocker
  usePrompt(
    "Du hast ungespeicherte Änderungen. Diese gehen verloren, wenn Du jetzt einen Schritt weiter gehst.",
    isDirty
  );

  return (
    <>
      <p>
        Aktuell ist Dein Projekt über folgende URL "
        <span className="mv-break-all">
          {loaderData.baseURL}
          /project/
          <strong>{loaderData.slug}</strong>
        </span>
        " zu erreichen.
      </p>
      <p>
        Wenn du die URL deines Projekts änderst und den bisherigen Link bereits
        geteilt hast, wird das Projekt über den alten Link nicht mehr erreichbar
        sein.
      </p>
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
        <div className="mv-flex mv-flex-col mv-gap-4 md:mv-p-4 md:mv-border md:mv-rounded-lg md:mv-border-gray-200">
          <Input id="deep" defaultValue="true" type="hidden" />
          <Input id="slug" defaultValue={loaderData.slug}>
            <Input.Label htmlFor={fields.slug.id}>Projekt-URL</Input.Label>
            {typeof actionData !== "undefined" &&
              typeof fields.slug.error !== "undefined" && (
                <Input.Error>{fields.slug.error}</Input.Error>
              )}
          </Input>
          <div className="mv-flex mv-w-full mv-justify-end">
            <div className="mv-flex mv-shrink mv-w-full md:mv-max-w-fit lg:mv-w-auto mv-items-center mv-justify-center lg:mv-justify-end">
              <Button
                type="submit"
                level="negative"
                fullSize
                onClick={() => {
                  setIsDirty(false);
                }}
              >
                URL ändern
              </Button>
            </div>
          </div>
        </div>
      </Form>
    </>
  );
}

export default ChangeURL;
