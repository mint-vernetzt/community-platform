import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { useSearchParams } from "@remix-run/react";
import { InputError, makeDomainFunction } from "domain-functions";
import { type TFunction } from "i18next";
import { useTranslation } from "react-i18next";
import { performMutation } from "remix-forms";
import { z } from "zod";
import { RemixFormsForm } from "~/components/RemixFormsForm/RemixFormsForm";
import i18next from "~/i18next.server";
import { invariantResponse } from "~/lib/utils/response";
import { detectLanguage } from "~/root.server";
import {
  createAuthClient,
  getSessionUser,
  getSessionUserOrRedirectPathToLogin,
} from "../../auth.server";
import InputPassword from "../../components/FormElements/InputPassword/InputPassword";

const i18nNS = ["routes/reset/set-password"];
export const handle = {
  i18n: i18nNS,
};

const createSchema = (t: TFunction) => {
  return z.object({
    password: z.string().min(8, t("validation.password.min")),
    confirmPassword: z.string().min(8, t("validation.confirmPassword.min")),
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
  return null;
};

const createMutation = (t: TFunction) => {
  return makeDomainFunction(
    createSchema(t),
    environmentSchema
  )(async (values, environment) => {
    if (values.password !== values.confirmPassword) {
      throw new InputError(t("error.confirmation"), "confirmPassword"); // -- Field error
    }

    // TODO: fix type issue
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
  const { authClient, headers } = createAuthClient(request);
  const sessionUser = await getSessionUser(authClient);

  const locale = detectLanguage(request);
  const t = await i18next.getFixedT(locale, i18nNS);

  const schema = createSchema(t);
  const mutation = createMutation(t);

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

  return json(result, { headers });
};

export default function SetPassword() {
  const [urlSearchParams] = useSearchParams();
  const loginRedirect = urlSearchParams.get("login_redirect");

  const { t } = useTranslation(i18nNS);
  const schema = createSchema(t);

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
          {({ Field, Button, Errors, register }) => (
            <div className="flex flex-col mv-w-full mv-items-center">
              <div className="mv-w-full @sm:mv-w-2/3 @md:mv-w-1/2 @2xl:mv-w-1/3">
                <div className="mv-mb-14 mv-mt-6"> </div>
                <h1 className="mb-8">Neues Passwort vergeben</h1>
                <Field name="loginRedirect" />
                <div className="mb-4">
                  <Field name="password" label="Neues Passwort">
                    {({ Errors }) => (
                      <>
                        <InputPassword
                          id="password"
                          label={t("form.label.password")}
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
                          label={t("form.label.confirmPassword")}
                          {...register("confirmPassword")}
                        />
                        <Errors />
                      </>
                    )}
                  </Field>
                </div>

                <div className="mb-8">
                  <button type="submit" className="btn btn-primary">
                    {t("form.label.submit")}
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
