import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { redirect } from "@remix-run/node";
import { useLoaderData, useSearchParams } from "@remix-run/react";
import { InputError, makeDomainFunction } from "domain-functions";
import { performMutation } from "remix-forms";
import { z } from "zod";
import { RemixFormsForm } from "~/components/RemixFormsForm/RemixFormsForm";
import { invariantResponse } from "~/lib/utils/response";
import { detectLanguage } from "~/root.server";
import {
  createAuthClient,
  getSessionUser,
  getSessionUserOrRedirectPathToLogin,
} from "../../auth.server";
import InputPassword from "../../components/FormElements/InputPassword/InputPassword";
import { type SetPasswordLocales } from "./set-password.server";
import { languageModuleMap } from "~/locales/.server";

const createSchema = (locales: SetPasswordLocales) => {
  return z.object({
    password: z.string().min(8, locales.validation.password.min),
    confirmPassword: z.string().min(8, locales.validation.confirmPassword.min),
    loginRedirect: z.string().optional(),
  });
};

const environmentSchema = z.object({
  authClient: z.unknown(),
  // authClient: z.instanceof(SupabaseClient),
  userId: z.string(),
});

export const loader = async (args: LoaderFunctionArgs) => {
  const { request } = args;
  const { authClient } = createAuthClient(request);
  const { sessionUser, redirectPath } =
    await getSessionUserOrRedirectPathToLogin(authClient, request);

  if (sessionUser === null && redirectPath !== null) {
    return redirect(redirectPath);
  }

  const language = await detectLanguage(request);
  const locales = languageModuleMap[language]["reset/set-password"];

  return { locales };
};

const createMutation = (locales: SetPasswordLocales) => {
  return makeDomainFunction(
    createSchema(locales),
    environmentSchema
  )(async (values, environment) => {
    if (values.password !== values.confirmPassword) {
      throw new InputError(locales.error.confirmation, "confirmPassword"); // -- Field error
    }

    // TODO: fix type issue
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const { error } = await environment.authClient.auth.updateUser({
      password: values.password,
    });
    if (error !== null) {
      throw error.message;
    }

    return values;
  });
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { authClient } = createAuthClient(request);
  const sessionUser = await getSessionUser(authClient);

  const language = await detectLanguage(request);
  const locales = languageModuleMap[language]["reset/set-password"];

  const schema = createSchema(locales);
  const mutation = createMutation(locales);

  invariantResponse(sessionUser !== null, "Forbidden", { status: 403 });
  const result = await performMutation({
    request,
    schema,
    mutation,
    environment: { authClient: authClient, userId: sessionUser.id },
  });

  if (result.success) {
    return redirect(result.data.loginRedirect || "/dashboard");
  }

  return result;
};

export default function SetPassword() {
  const [urlSearchParams] = useSearchParams();
  const loginRedirect = urlSearchParams.get("login_redirect");
  const { locales } = useLoaderData<typeof loader>();
  const schema = createSchema(locales);

  return (
    <>
      <div className="mv-w-full mv-mx-auto mv-px-4 @sm:mv-max-w-screen-container-sm @md:mv-max-w-screen-container-md @lg:mv-max-w-screen-container-lg @xl:mv-max-w-screen-container-xl @xl:mv-px-6 @2xl:mv-max-w-screen-container-2xl relative z-10">
        <RemixFormsForm
          method="post"
          schema={schema}
          hiddenFields={["loginRedirect"]}
          values={{
            loginRedirect: loginRedirect,
          }}
        >
          {({ Field, Errors, register }) => (
            <div className="flex flex-col mv-w-full mv-items-center">
              <div className="mv-w-full @sm:mv-w-2/3 @md:mv-w-1/2 @2xl:mv-w-1/3">
                <div className="mv-mb-6 mv-mt-12"> </div>
                <h1 className="mb-8">Neues Passwort vergeben</h1>
                <Field name="loginRedirect" />
                <div className="mb-4">
                  <Field name="password" label="Neues Passwort">
                    {({ Errors }) => (
                      <>
                        <InputPassword
                          id="password"
                          label={locales.form.label.password}
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
                          label={locales.form.label.confirmPassword}
                          {...register("confirmPassword")}
                        />
                        <Errors />
                      </>
                    )}
                  </Field>
                </div>

                <div className="mb-8">
                  <button type="submit" className="btn btn-primary">
                    {locales.form.label.submit}
                  </button>
                </div>
                <Errors />
              </div>
            </div>
          )}
        </RemixFormsForm>
      </div>
    </>
  );
}
