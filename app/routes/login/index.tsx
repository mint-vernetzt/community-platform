import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { Link, useSearchParams, useSubmit } from "@remix-run/react";
import type { KeyboardEvent } from "react";
import { makeDomainFunction } from "remix-domains";
import type { FormProps } from "remix-forms";
import { performMutation } from "remix-forms";
import type { SomeZodObject } from "zod";
import { z } from "zod";
import Input from "~/components/FormElements/Input/Input";
import {
  createAdminAuthClient,
  createAuthClient,
  getSessionUser,
  signIn,
} from "../../auth.server";
import InputPassword from "../../components/FormElements/InputPassword/InputPassword";
import HeaderLogo from "../../components/HeaderLogo/HeaderLogo";
import PageBackground from "../../components/PageBackground/PageBackground";
import { getProfileByEmailCaseInsensitive } from "../organization/$slug/settings/utils.server";
import { RemixFormsForm } from "~/components/RemixFormsForm/RemixFormsForm";

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
  authClient: z.unknown(),
  // authClient: z.instanceof(SupabaseClient),
});

function LoginForm<Schema extends SomeZodObject>(props: FormProps<Schema>) {
  return <RemixFormsForm<Schema> {...props} />;
}

export const loader = async (args: LoaderFunctionArgs) => {
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
  const { error } = await signIn(
    // TODO: fix type issue
    // @ts-ignore
    environment.authClient,
    values.email,
    values.password
  );

  let profile;
  if (error !== null) {
    if (error.message === "Invalid login credentials") {
      throw "Deine Anmeldedaten (E-Mail oder Passwort) sind nicht korrekt. Bitte überprüfe Deine Eingaben.";
    } else {
      throw error.message;
    }
  } else {
    profile = await getProfileByEmailCaseInsensitive(values.email);
    if (profile !== null) {
      // changes provider of user to email
      const adminAuthClient = createAdminAuthClient();
      await adminAuthClient.auth.admin.updateUserById(profile.id, {
        app_metadata: {
          provider: "email",
        },
      });
      // TODO: fix type issue
      // @ts-ignore
      await environment.authClient.auth.refreshSession();
    }
  }

  return { values: { ...values, username: profile?.username } };
});

export const action = async ({ request }: ActionFunctionArgs) => {
  const response = new Response();

  const authClient = createAuthClient(request, response);

  const result = await performMutation({
    request,
    schema,
    mutation,
    environment: { authClient: authClient },
  });

  if (result.success) {
    if (result.data.values.loginRedirect) {
      return redirect(result.data.values.loginRedirect, {
        headers: response.headers,
      });
    } else {
      // Default redirect after login
      return redirect("/dashboard", {
        headers: response.headers,
      });
    }
  }

  return json(result, { headers: response.headers });
};

export default function Index() {
  const [urlSearchParams] = useSearchParams();
  const loginRedirect = urlSearchParams.get("login_redirect");
  const submit = useSubmit();
  const handleKeyPress = (event: KeyboardEvent<HTMLFormElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      submit(event.currentTarget);
    }
  };

  return (
    <LoginForm
      method="post"
      schema={schema}
      hiddenFields={["loginRedirect"]}
      values={{
        loginRedirect: loginRedirect || undefined,
      }}
      onKeyDown={handleKeyPress}
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
