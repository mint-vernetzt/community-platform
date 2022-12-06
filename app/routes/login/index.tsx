import { json, redirect } from "@remix-run/node";
import type { ActionFunction, LoaderFunction } from "@remix-run/node";
import { Link, useSearchParams } from "@remix-run/react";
import { createServerClient } from "@supabase/auth-helpers-remix";
import { makeDomainFunction } from "remix-domains";
import { Form as RemixForm, performMutation } from "remix-forms";
import type { FormProps, PerformMutation } from "remix-forms";
import { z } from "zod";
import type { Schema, SomeZodObject } from "zod";
import Input from "~/components/FormElements/Input/Input";
import { getSessionUser, setSession, signIn } from "../../auth.server";
import InputPassword from "../../components/FormElements/InputPassword/InputPassword";
import HeaderLogo from "../../components/HeaderLogo/HeaderLogo";
import PageBackground from "../../components/PageBackground/PageBackground";
import { getProfileByUserId } from "~/profile.server";

const schema = z.object({
  email: z
    .string()
    .email("Bitte gib eine gültige E-Mail-Adresse ein.")
    .min(1, "Bitte gib eine gültige E-Mail-Adresse ein."),
  password: z
    .string()
    .min(8, "Dein Passwort muss mindestens 8 Zeichen lang sein."),
  loginRedirect: z.string().optional(),
});

const environmentSchema = z.object({
  supabaseClient: z.unknown(),
  // supabaseClient: z.instanceof(SupabaseClient),
});

function LoginForm<Schema extends SomeZodObject>(props: FormProps<Schema>) {
  return <RemixForm<Schema> {...props} />;
}

export const loader: LoaderFunction = async (args) => {
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

  const url = new URL(request.url);
  const urlSearchParams = new URLSearchParams(url.searchParams);
  const loginRedirect = urlSearchParams.get("login_redirect");
  const accessToken = urlSearchParams.get("access_token");
  const refreshToken = urlSearchParams.get("refresh_token");
  const type = urlSearchParams.get("type");

  if (accessToken !== null && refreshToken !== null) {
    // This automatically logs in the user
    // Throws error on invalid refreshToken, accessToken combination
    const { user: sessionUser } = await setSession(
      supabaseClient,
      accessToken,
      refreshToken
    );
    if (type === "sign_up" && loginRedirect === null && sessionUser !== null) {
      // Default redirect to profile of sessionUser after sign up confirmation
      const profile = await getProfileByUserId(sessionUser.id, ["username"]);
      return redirect(`/profile/${profile.username}`, {
        headers: response.headers,
      });
    }
  }

  const sessionUser = await getSessionUser(supabaseClient);

  if (sessionUser !== null) {
    if (loginRedirect !== null) {
      return redirect(loginRedirect, { headers: response.headers });
    } else {
      return redirect("/explore", { headers: response.headers });
    }
  }

  return response;
};

const mutation = makeDomainFunction(
  schema,
  environmentSchema
)(async (values, environment) => {
  const { error } = await signIn(
    environment.supabaseClient,
    values.email,
    values.password
  );

  if (error !== null) {
    if (error.message === "Invalid login credentials") {
      throw "Deine Anmeldedaten (E-Mail oder Passwort) sind nicht korrekt. Bitte überprüfe Deine Eingaben.";
    } else {
      throw error.message;
    }
  }

  return { values };
});

export type ActionData = PerformMutation<
  z.infer<Schema>,
  z.infer<typeof schema>
>;

export const action: ActionFunction = async ({ request }) => {
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

  if (result.success) {
    if (result.data.values.loginRedirect) {
      return redirect(result.data.values.loginRedirect, {
        headers: response.headers,
      });
    } else {
      // Default redirect after login
      return redirect("/explore", { headers: response.headers });
    }
  }

  return json<ActionData>(result, { headers: response.headers });
};

export default function Index() {
  const [urlSearchParams] = useSearchParams();
  const loginRedirect = urlSearchParams.get("login_redirect");

  return (
    <LoginForm
      method="post"
      schema={schema}
      hiddenFields={["loginRedirect"]}
      values={{
        loginRedirect: loginRedirect || undefined,
      }}
    >
      {({ Field, Button, Errors, register }) => (
        <>
          <PageBackground imagePath="/images/login_background_image.jpg" />
          <div className="md:container md:mx-auto px-4 relative z-10">
            <div className="flex flex-row -mx-4 justify-end">
              <div className="basis-full md:basis-6/12 px-4 pt-4 pb-24 flex flex-row items-center">
                <div className="">
                  <HeaderLogo />
                </div>
                <div className="ml-auto">
                  Noch kein Mitglied?{" "}
                  <Link
                    to={`/register${
                      loginRedirect ? `?login_redirect=${loginRedirect}` : ""
                    }`}
                    className="text-primary font-bold"
                  >
                    Registrieren
                  </Link>
                </div>
              </div>
            </div>
            <div className="flex flex-col md:flex-row -mx-4">
              <div className="basis-full md:basis-6/12"> </div>
              <div className="basis-full md:basis-6/12 xl:basis-5/12 px-4">
                <h1 className="mb-8">Anmelden</h1>

                <Errors className="alert-error p-3 mb-3 text-white" />

                <div className="mb-4">
                  <Field name="email" label="E-Mail">
                    {({ Errors }) => (
                      <>
                        <Input
                          id="email"
                          label="E-Mail"
                          {...register("email")}
                        />
                        <Errors />
                      </>
                    )}
                  </Field>
                </div>
                <div className="mb-10">
                  <Field name="password" label="Passwort">
                    {({ Errors }) => (
                      <>
                        <InputPassword
                          id="password"
                          label="Passwort"
                          {...register("password")}
                        />
                        <Errors />
                      </>
                    )}
                  </Field>
                </div>

                <Field name="loginRedirect" />
                <div className="flex flex-row -mx-4 mb-8 items-center">
                  <div className="basis-6/12 px-4">
                    <button type="submit" className="btn btn-primary">
                      Login
                    </button>
                  </div>
                  <div className="basis-6/12 px-4 text-right">
                    <Link
                      to={`/reset${
                        loginRedirect ? `?login_redirect=${loginRedirect}` : ""
                      }`}
                      className="text-primary font-bold"
                    >
                      Passwort vergessen?
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </LoginForm>
  );
}
