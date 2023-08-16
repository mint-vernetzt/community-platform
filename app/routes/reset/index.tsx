import type { ActionFunction, LoaderFunction } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { Link, useActionData, useSearchParams } from "@remix-run/react";
import { makeDomainFunction } from "remix-domains";
import type { PerformMutation } from "remix-forms";
import { Form as RemixForm, performMutation } from "remix-forms";
import type { Schema } from "zod";
import { z } from "zod";
import Input from "~/components/FormElements/Input/Input";
import {
  createAdminAuthClient,
  createAuthClient,
  getSessionUser,
  sendResetPasswordLink,
} from "../../auth.server";
import HeaderLogo from "../../components/HeaderLogo/HeaderLogo";
import PageBackground from "../../components/PageBackground/PageBackground";
import { prismaClient } from "~/prisma";

const schema = z.object({
  email: z
    .string()
    .email("Bitte gib eine gültige E-Mail-Adresse ein.")
    .min(1, "Bitte gib eine gültige E-Mail-Adresse ein."),
  loginRedirect: z.string().optional(),
});

const environmentSchema = z.object({
  authClient: z.unknown(),
  // authClient: z.instanceof(SupabaseClient),
  siteUrl: z.string(),
});

export const loader: LoaderFunction = async (args) => {
  const { request } = args;
  const response = new Response();
  const authClient = createAuthClient(request, response);
  const sessionUser = await getSessionUser(authClient);

  if (sessionUser !== null) {
    return redirect("/dashboard", { headers: response.headers });
  }

  return response;
};

const mutation = makeDomainFunction(
  schema,
  environmentSchema
)(async (values, environment) => {
  // Passing through a possible redirect after login (e.g. to an event)
  const emailRedirectTo = values.loginRedirect
    ? `${environment.siteUrl}?login_redirect=${values.loginRedirect}`
    : environment.siteUrl;

  // get profile by email to be able to find user
  const profile = await prismaClient.profile.findFirst({
    where: { email: values.email },
    select: { id: true },
  });

  if (profile !== null) {
    const adminAuthClient = createAdminAuthClient();
    const { data, error } = await adminAuthClient.auth.admin.getUserById(
      profile.id
    );
    if (error !== null) {
      console.error(error);
    } else if (data.user !== null) {
      // if user uses email provider send password reset link
      if (data.user.app_metadata.provider === "email") {
        const { error } = await sendResetPasswordLink(
          environment.authClient,
          values.email,
          emailRedirectTo
        );
        if (error !== null && error.message !== "User not found") {
          throw error.message;
        }
      } else {
        console.log("User uses other provider than email.");
      }
    }
  }

  return values;
});

type ActionData = PerformMutation<z.infer<Schema>, z.infer<typeof schema>>;

export const action: ActionFunction = async (args) => {
  const { request } = args;
  const response = new Response();

  const authClient = createAuthClient(request, response);

  const siteUrl = `${process.env.COMMUNITY_BASE_URL}/verification`;

  const result = await performMutation({
    request,
    schema,
    mutation,
    environment: { authClient: authClient, siteUrl: siteUrl },
  });

  return json<ActionData>(result, { headers: response.headers });
};

export default function Index() {
  const actionData = useActionData<ActionData>();
  const [urlSearchParams] = useSearchParams();
  const loginRedirect = urlSearchParams.get("login_redirect");

  return (
    <>
      <PageBackground imagePath="/images/login_background_image.jpg" />
      <div className="md:container md:mx-auto px-4 relative z-10">
        <div className="flex flex-row -mx-4 justify-end">
          <div className="basis-full md:basis-6/12 px-4 pt-3 pb-24 flex flex-row items-center">
            <div>
              <HeaderLogo />
            </div>
            <div className="ml-auto">
              <Link
                to={`/login${
                  loginRedirect ? `?login_redirect=${loginRedirect}` : ""
                }`}
                className="text-primary font-bold"
              >
                Anmelden
              </Link>
            </div>
          </div>
        </div>
        <div className="flex flex-col md:flex-row -mx-4">
          <div className="basis-full md:basis-6/12"> </div>
          <div className="basis-full md:basis-6/12 xl:basis-5/12 px-4">
            <h1 className="mb-8">Passwort zurücksetzen</h1>
            {actionData !== undefined && actionData.success ? (
              <>
                <p className="mb-4">
                  Eine E-Mail zum Zurücksetzen des Passworts wurde an{" "}
                  <b>{actionData.data.email}</b> geschickt.
                </p>
                <p className="mb-4">
                  Solltest Du Dich noch nicht unter dieser E-Mail-Adresse
                  registriert haben, erhältst Du keine E-Mail zum Zurücksetzen
                  des Passworts.
                </p>
              </>
            ) : (
              <RemixForm
                method="post"
                schema={schema}
                hiddenFields={["loginRedirect"]}
                values={{
                  loginRedirect: loginRedirect || undefined,
                }}
              >
                {({ Field, Button, Errors, register }) => (
                  <>
                    <p className="mb-4">
                      Du hast Dein Passwort vergessen? Dann gib hier Deine
                      E-Mail-Adresse ein, die Du bei der Anmeldung verwendet
                      hast. Wir senden Dir eine Mail, über die Du ein neues
                      Passwort einstellen kannst.
                    </p>

                    <Field name="loginRedirect" />
                    <div className="mb-8">
                      <Field name="email" label="E-Mail">
                        {({ Errors }) => (
                          <>
                            <Input
                              id="email"
                              label="E-Mail"
                              required
                              {...register("email")}
                            />
                            <Errors />
                          </>
                        )}
                      </Field>
                    </div>

                    <div className="mb-8">
                      <button type="submit" className="btn btn-primary">
                        Passwort zurücksetzen
                      </button>
                    </div>
                    <Errors />
                  </>
                )}
              </RemixForm>
            )}
          </div>
        </div>
        {/* <div className="flex flex-row -mx-4 mb-8 items-center">
          <div className="basis-6/12 px-4"> </div>
          <div className="basis-5/12 px-4"></div>
        </div> */}
      </div>
    </>
  );
}
