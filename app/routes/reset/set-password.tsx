import type { ActionFunction, LoaderFunction } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { useSearchParams } from "@remix-run/react";
import { InputError, makeDomainFunction } from "remix-domains";
import type { PerformMutation } from "remix-forms";
import { Form as RemixForm, performMutation } from "remix-forms";
import type { Schema } from "zod";
import { z } from "zod";
import {
  createAuthClient,
  setSession,
  updatePassword,
} from "../../auth.server";
import InputPassword from "../../components/FormElements/InputPassword/InputPassword";
import HeaderLogo from "../../components/HeaderLogo/HeaderLogo";
import PageBackground from "../../components/PageBackground/PageBackground";

const schema = z.object({
  password: z
    .string()
    .min(8, "Dein Passwort muss mindestens 8 Zeichen lang sein."),
  confirmPassword: z
    .string()
    .min(8, "Dein Passwort muss mindestens 8 Zeichen lang sein."),
  accessToken: z
    .string()
    .min(
      1,
      "Bitte nutze den Link aus Deiner E-Mail, um Dein Passwort zu ändern."
    ),
  refreshToken: z
    .string()
    .min(
      1,
      "Bitte nutze den Link aus Deiner E-Mail, um Dein Passwort zu ändern."
    ),
  loginRedirect: z.string().optional(),
});

const environmentSchema = z.object({
  authClient: z.unknown(),
  // authClient: z.instanceof(SupabaseClient),
});

export const loader: LoaderFunction = async (args) => {
  const { request } = args;
  const response = new Response();

  createAuthClient(request, response);

  return response;
};

const mutation = makeDomainFunction(
  schema,
  environmentSchema
)(async (values, environment) => {
  if (values.password !== values.confirmPassword) {
    throw new InputError(
      "Deine Passwörter stimmen nicht überein.",
      "confirmPassword"
    ); // -- Field error
  }

  // This automatically logs in the user
  // Throws error on invalid refreshToken, accessToken combination
  await setSession(
    environment.supabaseClient,
    values.accessToken,
    values.refreshToken
  );

  const { error } = await updatePassword(
    environment.supabaseClient,
    values.password
  );
  if (error !== null) {
    throw error.message;
  }
  return values;
});

type ActionData = PerformMutation<z.infer<Schema>, z.infer<typeof schema>>;

export const action: ActionFunction = async ({ request }) => {
  const response = new Response();

  const authClient = createAuthClient(request, response);
  const result = await performMutation({
    request,
    schema,
    mutation,
    environment: { authClient: authClient },
  });

  if (result.success) {
    return redirect(result.data.loginRedirect || "/explore", {
      headers: response.headers,
    });
  }

  return json<ActionData>(result, { headers: response.headers });
};

export default function SetPassword() {
  const [urlSearchParams] = useSearchParams();
  const loginRedirect = urlSearchParams.get("login_redirect");
  const accessToken = urlSearchParams.get("access_token");
  const refreshToken = urlSearchParams.get("refresh_token");

  return (
    <>
      <PageBackground imagePath="/images/login_background_image.jpg" />
      <div className="md:container md:mx-auto px-4 relative z-10">
        <div className="flex flex-row -mx-4 justify-end">
          <div className="basis-full md:basis-6/12 px-4 pt-3 pb-24 flex flex-row items-center">
            <div>
              <HeaderLogo />
            </div>
            <div className="ml-auto"></div>
          </div>
        </div>
        <RemixForm
          method="post"
          schema={schema}
          hiddenFields={["loginRedirect", "accessToken", "refreshToken"]}
          values={{
            loginRedirect: loginRedirect,
            accessToken: accessToken,
            refreshToken: refreshToken,
          }}
        >
          {({ Field, Button, Errors, register }) => (
            <div className="flex flex-col md:flex-row -mx-4">
              <div className="basis-full md:basis-6/12"> </div>
              <div className="basis-full md:basis-6/12 xl:basis-5/12 px-4">
                <h1 className="mb-8">Neues Passwort vergeben</h1>
                <Field name="loginRedirect" />
                <Field name="accessToken" />
                <Field name="refreshToken" />
                <div className="mb-4">
                  <Field name="password" label="Neues Passwort">
                    {({ Errors }) => (
                      <>
                        <InputPassword
                          id="password"
                          label="Neues Passwort"
                          {...register("password")}
                        />
                        <Errors />
                      </>
                    )}
                  </Field>
                </div>

                <div className="mb-8">
                  <Field name="confirmPassword" label="Wiederholen">
                    {({ Errors }) => (
                      <>
                        <InputPassword
                          id="confirmPassword"
                          label="Passwort wiederholen"
                          {...register("confirmPassword")}
                        />
                        <Errors />
                      </>
                    )}
                  </Field>
                </div>

                <div className="mb-8">
                  <button type="submit" className="btn btn-primary">
                    Passwort speichern
                  </button>
                </div>
                <Errors />
              </div>
            </div>
          )}
        </RemixForm>
      </div>
    </>
  );
}
