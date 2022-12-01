import { sendResetPasswordLink } from "../../auth.server";
import { ActionFunction, json, LoaderFunction } from "@remix-run/node";
import { useActionData, useLoaderData } from "@remix-run/react";
import Input from "~/components/FormElements/Input/Input";
import HeaderLogo from "../../components/HeaderLogo/HeaderLogo";
import PageBackground from "../../components/PageBackground/PageBackground";
import {
  Form as RemixForm,
  PerformMutation,
  performMutation,
} from "remix-forms";
import { Schema, z } from "zod";
import { makeDomainFunction } from "remix-domains";
import {
  createServerClient,
  SupabaseClient,
} from "@supabase/auth-helpers-remix";

const schema = z.object({
  email: z
    .string()
    .email("Bitte gib eine gültige E-Mail-Adresse ein.")
    .min(1, "Bitte gib eine gültige E-Mail-Adresse ein."),
  redirectToAfterResetPassword: z.string().optional(),
});

const environmentSchema = z.object({
  supabaseClient: z.instanceof(SupabaseClient),
});

type LoaderData = {
  redirectToAfterResetPassword: string | null;
  loginRedirect?: string;
};

export const loader: LoaderFunction = async (args) => {
  const { request } = args;
  const response = new Response();

  createServerClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY, {
    request,
    response,
  });

  // TODO: Rework reset password -> Check redirects
  // reset -> set-password -> login -> either default or event page
  const url = new URL(request.url);
  const redirectToAfterResetPassword = url.searchParams.get("redirect_to");
  let loginRedirect;
  if (redirectToAfterResetPassword !== null) {
    const redirectURL = new URL(redirectToAfterResetPassword);
    const redirectAfterRedirect = redirectURL.searchParams.get("redirect_to");
    if (redirectAfterRedirect !== null) {
      const redirectAfterRedirectURL = new URL(redirectAfterRedirect);
      const eventSlug = redirectAfterRedirectURL.searchParams.get("event_slug");
      if (eventSlug !== null) {
        loginRedirect = `/login?event_slug=${eventSlug}`;
      }
    }
  }

  return json<LoaderData>(
    { redirectToAfterResetPassword, loginRedirect },
    { headers: response.headers }
  );
};

const mutation = makeDomainFunction(
  schema,
  environmentSchema
)(async (values, environment) => {
  const { error } = await sendResetPasswordLink(
    environment.supabaseClient,
    values.email,
    values.redirectToAfterResetPassword
  );

  if (error !== null && error.message !== "User not found") {
    throw error.message;
  }
  return values;
});

type ActionData = PerformMutation<z.infer<Schema>, z.infer<typeof schema>>;

export const action: ActionFunction = async (args) => {
  const { request } = args;
  const response = new Response();

  const supabaseClient = createServerClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY,
    {
      request,
      response,
    }
  );

  const result = await performMutation({
    request,
    schema,
    mutation,
    environment: { supabaseClient: supabaseClient },
  });

  return json<ActionData>(result, { headers: response.headers });
};

export default function Index() {
  const actionData = useActionData<ActionData>();
  const loaderData = useLoaderData<LoaderData>();

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
              <a
                href={loaderData.loginRedirect || "/login"}
                className="text-primary font-bold"
              >
                Anmelden
              </a>
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
                hiddenFields={["redirectToAfterResetPassword"]}
                values={{
                  redirectToAfterResetPassword:
                    loaderData.redirectToAfterResetPassword,
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

                    <Field name="redirectToAfterResetPassword" />
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
