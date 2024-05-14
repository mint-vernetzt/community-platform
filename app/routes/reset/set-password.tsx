import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { useLoaderData, useSearchParams } from "@remix-run/react";
import { InputError, makeDomainFunction } from "domain-functions";
import { performMutation } from "remix-forms";
import { z } from "zod";
import { RemixFormsForm } from "~/components/RemixFormsForm/RemixFormsForm";
import { invariantResponse } from "~/lib/utils/response";
import { createAuthClient, getSessionUser } from "../../auth.server";
import InputPassword from "../../components/FormElements/InputPassword/InputPassword";
import HeaderLogo from "../../components/HeaderLogo/HeaderLogo";
import PageBackground from "../../components/PageBackground/PageBackground";
import { type TFunction } from "i18next";
import i18next from "~/i18next.server";
import { useTranslation } from "react-i18next";
import { detectLanguage } from "~/root.server";
import { getFeatureAbilities } from "~/lib/utils/application";

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
  const sessionUser = await getSessionUser(authClient);
  invariantResponse(sessionUser !== null, "Forbidden", { status: 403 });
  const abilities = await getFeatureAbilities(authClient, "next_navbar");
  return { abilities };
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
  const loaderData = useLoaderData<typeof loader>();
  const [urlSearchParams] = useSearchParams();
  const loginRedirect = urlSearchParams.get("login_redirect");

  const { t } = useTranslation(i18nNS);
  const schema = createSchema(t);

  return (
    <>
      <PageBackground imagePath="/images/login_background_image.jpg" />
      <div className="md:container md:mx-auto px-4 relative z-10">
        {loaderData.abilities.next_navbar.hasAccess === false ? (
          <div className="flex flex-row -mx-4 justify-end">
            <div className="basis-full md:basis-6/12 px-4 pt-3 pb-24 flex flex-row items-center">
              <div>
                <HeaderLogo />
              </div>
              <div className="ml-auto"></div>
            </div>
          </div>
        ) : null}

        <RemixFormsForm
          method="post"
          schema={schema}
          hiddenFields={["loginRedirect"]}
          values={{
            loginRedirect: loginRedirect,
          }}
        >
          {({ Field, Button, Errors, register }) => (
            <div className="flex flex-col md:flex-row -mx-4">
              <div className="basis-full md:basis-6/12"> </div>
              <div className="basis-full md:basis-6/12 xl:basis-5/12 px-4 justify-end">
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
