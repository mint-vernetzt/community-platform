import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import {
  Link,
  useActionData,
  useSearchParams,
  useSubmit,
} from "@remix-run/react";
import { makeDomainFunction } from "domain-functions";
import { type TFunction } from "i18next";
import type { KeyboardEvent } from "react";
import { useTranslation } from "react-i18next";
import type { FormProps } from "remix-forms";
import { performMutation } from "remix-forms";
import type { SomeZodObject } from "zod";
import { z } from "zod";
import Input from "~/components/FormElements/Input/Input";
import { RemixFormsForm } from "~/components/RemixFormsForm/RemixFormsForm";
import i18next from "~/i18next.server";
import { detectLanguage } from "~/root.server";
import { createAuthClient, getSessionUser, signIn } from "../../auth.server";
import InputPassword from "../../components/FormElements/InputPassword/InputPassword";

const i18nNS = ["routes/login"];
export const handle = {
  i18n: i18nNS,
};

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

function LoginForm<Schema extends SomeZodObject>(props: FormProps<Schema>) {
  return <RemixFormsForm<Schema> {...props} />;
}

export const loader = async (args: LoaderFunctionArgs) => {
  const { request } = args;

  const { authClient } = createAuthClient(request);
  const sessionUser = await getSessionUser(authClient);
  if (sessionUser !== null) {
    return redirect("/dashboard");
  }

  return null;
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const locale = detectLanguage(request);
  const t = await i18next.getFixedT(locale, i18nNS);

  const schema = createSchema(t);
  const mutation = makeDomainFunction(schema)(async (values) => {
    return { ...values };
  });

  const submission = await performMutation({
    request,
    schema,
    mutation,
  });

  if (submission.success) {
    const { error, headers } = await signIn(
      request,
      submission.data.email,
      submission.data.password
    );

    if (error !== null) {
      if (error.message === "Invalid login credentials") {
        return json({
          message: t("error.invalidCredentials"),
        });
      } else {
        throw json({ message: "Server Error" }, { status: 500 });
      }
    }
    if (submission.data.loginRedirect) {
      return redirect(submission.data.loginRedirect, {
        headers: headers,
      });
    } else {
      return redirect("/dashboard", {
        headers: headers,
      });
    }
  }

  return json(submission);
};

export default function Index() {
  const actionData = useActionData<typeof action>();
  const loginError =
    actionData !== undefined && "message" in actionData
      ? actionData.message
      : null;
  const [urlSearchParams] = useSearchParams();
  const loginRedirect = urlSearchParams.get("login_redirect");
  const submit = useSubmit();
  const handleKeyPress = (event: KeyboardEvent<HTMLFormElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      submit(event.currentTarget);
    }
  };

  const { t } = useTranslation(i18nNS);
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
          <div className="mv-w-full mv-mx-auto mv-px-4 @sm:mv-max-w-screen-container-sm @md:mv-max-w-screen-container-md @lg:mv-max-w-screen-container-lg @xl:mv-max-w-screen-container-xl @xl:mv-px-6 @2xl:mv-max-w-screen-container-2xl relative z-10">
            <div className="flex flex-col mv-w-full mv-items-center">
              <div className="mv-w-full @sm:mv-w-2/3 @md:mv-w-1/2 @2xl:mv-w-1/3">
                <div className="mv-mb-14 mv-mt-6">
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
                <h1 className="mb-8">{t("content.headline")}</h1>

                <Errors className="mv-p-3 mv-mb-3 mv-bg-error mv-text-white">
                  {loginError}
                </Errors>

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
