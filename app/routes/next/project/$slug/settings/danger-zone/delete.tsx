import { useForm } from "@conform-to/react";
import { parse } from "@conform-to/zod";
import { Button, Input } from "@mint-vernetzt/components";
import { json, redirect, type DataFunctionArgs } from "@remix-run/node";
import { Form, useActionData, useLoaderData } from "@remix-run/react";
import { z } from "zod";
import { createAuthClient, getSessionUser } from "~/auth.server";
import { invariantResponse } from "~/lib/utils/response";
import { prismaClient } from "~/prisma.server";
import { getRedirectPathOnProtectedProjectRoute } from "../utils.server";
import { redirectWithAlert } from "~/alert.server";

function createSchema(name: string) {
  return z.object({
    name: z.string().refine((value) => {
      return value === name;
    }, "Der eingegebene Projektname stimmt nicht überein."),
  });
}

export const loader = async (args: DataFunctionArgs) => {
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

  const project = await prismaClient.project.findFirst({
    where: { slug: params.slug },
    select: {
      name: true,
    },
  });

  invariantResponse(project !== null, "Project not found", { status: 404 });

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

  const project = await prismaClient.project.findFirst({
    where: { slug: params.slug },
    select: {
      id: true,
      name: true,
    },
  });

  invariantResponse(project !== null, "Project not found", { status: 404 });

  const formData = await request.formData();
  const submission = parse(formData, {
    schema: createSchema(project.name),
  });

  if (typeof submission.value !== "undefined" && submission.value !== null) {
    await prismaClient.project.delete({
      where: {
        id: project.id,
      },
    });
    return redirectWithAlert(
      "/dashboard",
      { message: `Projekt "${project.name}" gelöscht.` },
      { scrollIntoView: false },
      { headers: response.headers }
    );
  }

  return json(submission, { headers: response.headers });
};

function Delete() {
  const loaderData = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();

  const [form, fields] = useForm({
    shouldValidate: "onSubmit",
    onValidate: (values) => {
      return parse(values.formData, {
        schema: createSchema(loaderData.project.name),
      });
    },
    shouldRevalidate: "onSubmit",
    lastSubmission: actionData,
  });

  return (
    <>
      <p>
        Bitte gib den Namen des Projekts{" "}
        <strong>{loaderData.project.name}</strong> ein, um das Löschen zu
        bestätigen.
      </p>
      <p>
        Wenn Du danach auf "Projekt löschen” klickst, wird Euer Projekt ohne
        erneute Abfrage gelöscht.
      </p>
      <Form method="post" {...form.props}>
        <div className="mv-flex mv-flex-col mv-gap-4 md:mv-p-4 md:mv-border md:mv-rounded-lg md:mv-border-gray-200">
          <Input id="deep" defaultValue="true" type="hidden" />
          <Input id="name">
            <Input.Label htmlFor={fields.name.id}>
              Löschen bestätigen
            </Input.Label>
            {typeof fields.name.error !== "undefined" && (
              <Input.Error>{fields.name.error}</Input.Error>
            )}
          </Input>
          <div className="mv-flex mv-w-full mv-justify-end">
            <div className="mv-flex mv-shrink mv-w-full md:mv-max-w-fit lg:mv-w-auto mv-items-center mv-justify-center lg:mv-justify-end">
              <Button type="submit" level="negative" fullSize>
                Project löschen
              </Button>
            </div>
          </div>
        </div>
      </Form>
    </>
  );
}

export default Delete;
