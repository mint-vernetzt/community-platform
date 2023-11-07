import type { DataFunctionArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { Link, useSearchParams, useSubmit } from "@remix-run/react";
import type { KeyboardEvent } from "react";
import { makeDomainFunction } from "remix-domains";
import type { FormProps } from "remix-forms";
import { Form as RemixForm, performMutation } from "remix-forms";
import type { SomeZodObject } from "zod";
import { z } from "zod";
import Input from "~/components/FormElements/Input/Input";
import { createAuthClient, getSessionUser, signIn } from "../../auth.server";
import InputPassword from "../../components/FormElements/InputPassword/InputPassword";
import HeaderLogo from "../../components/HeaderLogo/HeaderLogo";
import PageBackground from "../../components/PageBackground/PageBackground";
import { getProfileByEmailCaseInsensitive } from "../organization/$slug/settings/utils.server";
import { useTranslation } from "react-i18next";
import { TFunction } from "i18next";
import i18next from "~/i18next.server";

const createSchema = (t: TFunction) => {
  return z.object({
    email: z
      .string()
      .email(t("validation.email.email"))
      .min(1, t("validation.email.min")),
    password: z.string().min(8, t("validation.password.min")),
    loginRedirect: z.string().optional(),
  });
};

const environmentSchema = z.object({
  authClient: z.unknown(),
  // authClient: z.instanceof(SupabaseClient),
});

function LoginForm<Schema extends SomeZodObject>(props: FormProps<Schema>) {
  return <RemixForm<Schema> {...props} />;
}

export const loader = async (args: DataFunctionArgs) => {
  const { request } = args;

  const response = new Response();
  const authClient = createAuthClient(request, response);
  const sessionUser = await getSessionUser(authClient);
  if (sessionUser !== null) {
    return redirect("/dashboard", { headers: response.headers });
  }

  return response;
};

const createMutation = (t: TFunction) => {
  return makeDomainFunction(
    createSchema(t),
    environmentSchema
  )(async (values, environment) => {
    const { error } = await signIn(
      // TODO: fix type issue
      environment.authClient,
      values.email,
      values.password
    );

    let profile;
    if (error !== null) {
      if (error.message === "Invalid login credentials") {
        throw t("error.invalidCredentials");
      } else {
        throw error.message;
      }
    } else {
      profile = await getProfileByEmailCaseInsensitive(values.email);
    }

    return { values: { ...values, username: profile?.username } };
  });
};

export const action = async ({ request }: DataFunctionArgs) => {
  const response = new Response();
  const authClient = createAuthClient(request, response);
  const t = await i18next.getFixedT(request, ["routes/login"]);

  const result = await performMutation({
    request,
    schema: createSchema(t),
    mutation: createMutation(t),
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

  const { t, i18n } = useTranslation(["routes/login"]);
  const schema = createSchema(t);

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
                  {t("content.question")}{" "}
                  <Link
                    to={`/register${
                      loginRedirect ? `?login_redirect=${loginRedirect}` : ""
                    }`}
                    className="text-primary font-bold"
                  >
                    {t("content.action")}
                  </Link>
                </div>
              </div>
            </div>
            <div className="flex flex-col md:flex-row -mx-4">
              <div className="basis-full md:basis-6/12"> </div>
              <div className="basis-full md:basis-6/12 xl:basis-5/12 px-4">
                <h1 className="mb-8">{t("content.headline")}</h1>

                <Errors className="alert-error p-3 mb-3 text-white" />

                <div className="mb-4">
                  <Field name="email" label="E-Mail">
                    {({ Errors }) => (
                      <>
                        <Input
                          id="email"
                          label={t("label.email")}
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
                          label={t("label.password")}
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
                      {t("label.submit")}
                    </button>
                  </div>
                  <div className="basis-6/12 px-4 text-right">
                    <Link
                      to={`/reset${
                        loginRedirect ? `?login_redirect=${loginRedirect}` : ""
                      }`}
                      className="text-primary font-bold"
                    >
                      {t("label.reset")}
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
