import { useForm } from "@conform-to/react";
import { parse } from "@conform-to/zod";
import { Button, Input } from "@mint-vernetzt/components";
import { json, redirect, type DataFunctionArgs } from "@remix-run/node";
import { Form, useActionData, useLoaderData } from "@remix-run/react";
import { z } from "zod";
import { redirectWithAlert } from "~/alert.server";
import { createAuthClient, getSessionUser } from "~/auth.server";
import { invariantResponse } from "~/lib/utils/response";
import { prismaClient } from "~/prisma.server";
import { getRedirectPathOnProtectedProjectRoute } from "../utils.server";

function createSchema(constraint?: {
  isSlugUnique?: (slug: string) => Promise<boolean>;
}) {
  return z.object({
    slug: z
      .string()
      .min(3, "Mindestens 3 Zeichen")
      .max(50, "Maximal 50 Zeichen")
      .regex(/^[-a-z0-9-]+$/i, "Nur Buchstaben, Zahlen und Bindestriche")
      .refine(async (slug) => {
        if (
          typeof constraint !== "undefined" &&
          typeof constraint.isSlugUnique === "function"
        ) {
          return await constraint.isSlugUnique(slug);
        }
        return true;
      }, "Diese URL ist bereits vergeben"),
  });
}

export const loader = async (args: DataFunctionArgs) => {
  const { request, params } = args;
  const response = new Response();

  const authClient = createAuthClient(request, response);
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

export const action = async (args: DataFunctionArgs) => {
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

    return redirectWithAlert(`${pathname}?deep`, {
      level: "positive",
      message: "URL wurde geändert.",
    });
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

  return (
    <>
      <p className="mv-mb-4">
        Aktuell ist Dein Projekt über folgende URL "{loaderData.baseURL}
        /project/
        <strong>{loaderData.slug}</strong>" zu erreichen.
      </p>
      <p className="mv-mb-4">
        Wenn Du die URL Deines Projekts änderst, dann ist Dein Projekt über den
        bisherigen Link, solltest Du ihn bereits geteilt haben, nicht mehr
        erreichbar.
      </p>
      <Form method="post" {...form.props}>
        <Input id="deep" value="true" type="hidden" />
        <Input id="slug" defaultValue={loaderData.slug}>
          Projekt-URL
        </Input>
        <p id={fields.slug.errorId}>{fields.slug.error}</p>
        <Button type="submit" level="negative">
          URL ändern
        </Button>
      </Form>
    </>
  );
}

export default ChangeURL;
