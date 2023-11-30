import type { DataFunctionArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { useSearchParams } from "@remix-run/react";
import { InputError, makeDomainFunction } from "remix-domains";
import { Form as RemixForm, performMutation } from "remix-forms";
import { badRequest } from "remix-utils";
import { z } from "zod";
import {
  createAuthClient,
  getSessionUser,
  setSession,
  updatePassword,
} from "../../auth.server";
import InputPassword from "../../components/FormElements/InputPassword/InputPassword";
import HeaderLogo from "../../components/HeaderLogo/HeaderLogo";
import PageBackground from "../../components/PageBackground/PageBackground";
import { TFunction } from "i18next";
import i18next from "~/i18next.server";
import { useTranslation } from "react-i18next";

const i18nNS = ["routes/reset/set-password"];
export const handle = {
  i18n: i18nNS,
};

const createSchema = (t: TFunction) => {
  return z.object({
    password: z.string().min(8, t("validation.password.min")),
    confirmPassword: z.string().min(8, t("validation.confirmPassword.min")),
    accessToken: z.string().min(1, t("validation.accessToken.min")),
    refreshToken: z.string().min(1, t("validation.refreshToken.min")),
    loginRedirect: z.string().optional(),
  });
};

const environmentSchema = z.object({
  authClient: z.unknown(),
  // authClient: z.instanceof(SupabaseClient),
});

export const loader = async (args: DataFunctionArgs) => {
  const { request } = args;
  const response = new Response();
  const authClient = createAuthClient(request, response);
  const sessionUser = await getSessionUser(authClient);
  if (sessionUser !== null) {
    return redirect("/dashboard", { headers: response.headers });
  }

  const t = await i18next.getFixedT(request, i18nNS);

  const url = new URL(request.url);
  const accessToken = url.searchParams.get("access_token");
  const refreshToken = url.searchParams.get("refresh_token");

  if (accessToken === null || refreshToken === null) {
    throw badRequest(t("error.badRequest"));
  }

  return response;
};

const createMutation = (t: TFunction) => {
  return makeDomainFunction(
    createSchema(t),
    environmentSchema
  )(async (values, environment) => {
    if (values.password !== values.confirmPassword) {
      throw new InputError(t("error.confirmation"), "confirmPassword"); // -- Field error
    }

    // This automatically logs in the user
    // Throws error on invalid refreshToken, accessToken combination
    await setSession(
      // @ts-ignore TODO: fix type issue
      environment.authClient,
      values.accessToken,
      values.refreshToken
    );

    const { error } = await updatePassword(
      // @ts-ignore TODO: fix type issue
      environment.authClient,
      values.password
    );
    if (error !== null) {
      throw error.message;
    }
    return values;
  });
};

export const action = async ({ request }: DataFunctionArgs) => {
  const response = new Response();

  const t = await i18next.getFixedT(request, i18nNS);
  const authClient = createAuthClient(request, response);
  const result = await performMutation({
    request,
    schema: createSchema(t),
    mutation: createMutation(t),
    environment: { authClient: authClient },
  });

  if (result.success) {
    return redirect(result.data.loginRedirect || "/explore?reason=5", {
      headers: response.headers,
    });
  }

  return json(result, { headers: response.headers });
};

export default function SetPassword() {
  const [urlSearchParams] = useSearchParams();
  const loginRedirect = urlSearchParams.get("login_redirect");
  const accessToken = urlSearchParams.get("access_token");
  const refreshToken = urlSearchParams.get("refresh_token");

  const { t } = useTranslation(i18nNS);
  const schema = createSchema(t);

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
              <div className="basis-full md:basis-6/12"></div>
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
        </RemixForm>
      </div>
    </>
  );
}
