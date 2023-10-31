import { useForm } from "@conform-to/react";
import { getFieldsetConstraint, parse } from "@conform-to/zod";
import { json, redirect, type DataFunctionArgs } from "@remix-run/node";
import {
  Form,
  useActionData,
  useLoaderData,
  useLocation,
} from "@remix-run/react";
import { z } from "zod";
import { redirectWithAlert } from "~/alert.server";
import { createAuthClient, getSessionUser } from "~/auth.server";
import { invariantResponse } from "~/lib/utils/response";
import { prismaClient } from "~/prisma.server";
import { BackButton } from "./__components";
import { getRedirectPathOnProtectedProjectRoute } from "./utils.server";
import { phoneSchema } from "~/lib/utils/schemas";

const generalSchema = z.object({
  name: z
    .string({
      required_error: "Der Projektname ist eine erforderliche Angabe.",
    })
    .max(55, "Es sind nur maximal 55 Zeichen für deinen Projektnamen erlaubt."),
  formats: z.array(z.string().uuid()),
  furtherFormats: z.array(z.string()),
  areas: z.array(z.string().uuid()),
  email: z.string().email("Bitte gib eine gültige E-Mail Adresse ein."),
  phone: phoneSchema
    .optional()
    .transform((value) => (value === undefined ? null : value)),
  // TODO: Bea fragen:
  // - "Ansprechpartner:in / Name des Projekts*"
  //    -> Was von beiden ist gemeint? Name des Projekts existiert schon im Formular.
  //    -> Sind das Profile oder ist das einfach eine freie Eingabe
  // - E-Mail, Straße, Hausnummer, PLZ, Stadt required?
  street: z
    .string()
    .optional()
    .transform((value) => (value === undefined ? null : value)),
  streetNumber: z
    .string()
    .optional()
    .transform((value) => (value === undefined ? null : value)),
  streetNumberAddition: z
    .string()
    .optional()
    .transform((value) => (value === undefined ? null : value)),
  zipCode: z
    .string()
    .optional()
    .transform((value) => (value === undefined ? null : value)),
  city: z
    .string()
    .optional()
    .transform((value) => (value === undefined ? null : value)),
});

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

  // TODO: Change schema and get data
  const project = await prismaClient.project.findUnique({
    select: {
      id: true,
    },
    where: {
      slug: params.slug,
    },
  });
  invariantResponse(project !== null, "Project not found", {
    status: 404,
  });

  return json({ project });
};

export async function action({ request, params }: DataFunctionArgs) {
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
  // Validation
  const formData = await request.formData();
  const submission = await parse(formData, {
    schema: (intent) =>
      generalSchema.transform(async (data, ctx) => {
        if (intent !== "submit") return { ...data };
        try {
          // TODO: Investigate why typescript does not show an type error...
          // const someData = { test: "", ...data };
          await prismaClient.project.update({
            where: {
              slug: params.slug,
            },
            data: {
              // ...someData,
              ...data,
            },
          });
        } catch (e) {
          console.warn(e);
          ctx.addIssue({
            code: "custom",
            message:
              "Die Daten konnten nicht gespeichert werden. Bitte versuche es erneut oder wende dich an den Support",
          });
          return z.NEVER;
        }

        return { ...data };
      }),
    async: true,
  });

  if (submission.intent !== "submit") {
    return json({ status: "idle", submission } as const);
  }
  if (!submission.value) {
    return json({ status: "error", submission } as const, { status: 400 });
  }

  return redirectWithAlert(
    `/next/project/${params.slug}/settings/web-social?deep`,
    {
      message: "Deine Änderungen wurden gespeichert.",
    }
  );
}

function General() {
  const location = useLocation();
  const loaderData = useLoaderData<typeof loader>();
  const { project } = loaderData;
  const actionData = useActionData<typeof action>();
  const formId = "general-form";
  const [form, fields] = useForm({
    id: formId,
    constraint: getFieldsetConstraint(generalSchema),
    defaultValue: {},
    lastSubmission: actionData?.submission,
    onValidate({ formData }) {
      return parse(formData, { schema: generalSchema });
    },
  });

  return (
    <>
      <BackButton to={location.pathname}>Eckdaten anlegen</BackButton>
      <p>
        Wo kann die Community mehr über Dein Projekt oder Bildungsangebot
        erfahren?
      </p>
      <Form method="post" {...form.props}>
        {/* TODO: Input fields */}

        <ul id={form.errorId}>
          {form.errors.map((e) => (
            <li key={e}>{e}</li>
          ))}
        </ul>

        <p>*Erforderliche Angaben</p>

        <div>
          <button type="reset">Änderungen verwerfen</button>
        </div>
        <div>
          <button type="submit">Speichern und weiter</button>
        </div>
      </Form>
    </>
  );
}

export default General;
