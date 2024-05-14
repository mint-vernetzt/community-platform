import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import {
  Link,
  useActionData,
  useLoaderData,
  useSearchParams,
  useSubmit,
} from "@remix-run/react";
import { makeDomainFunction } from "domain-functions";
import type { KeyboardEvent } from "react";
import type { FormProps } from "remix-forms";
import { performMutation } from "remix-forms";
import type { SomeZodObject } from "zod";
import { z } from "zod";
import Input from "~/components/FormElements/Input/Input";
import { RemixFormsForm } from "~/components/RemixFormsForm/RemixFormsForm";
import { createAuthClient, getSessionUser, signIn } from "../../auth.server";
import InputPassword from "../../components/FormElements/InputPassword/InputPassword";
import HeaderLogo from "../../components/HeaderLogo/HeaderLogo";
import PageBackground from "../../components/PageBackground/PageBackground";
import { useTranslation } from "react-i18next";
import { type TFunction } from "i18next";
import i18next from "~/i18next.server";
import { detectLanguage } from "~/root.server";
import { getFeatureAbilities } from "~/lib/utils/application";

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
  const abilities = await getFeatureAbilities(authClient, "next_navbar");

  return { abilities };
};

// const mutation = makeDomainFunction(schema)(async (values) => {
//   return { ...values };
// });

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
  const loaderData = useLoaderData<typeof loader>();
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
          <PageBackground imagePath="/images/login_background_image.jpg" />
          <div className="md:container md:mx-auto px-4 relative z-10">
            {loaderData.abilities.next_navbar.hasAccess === false ? (
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
            ) : null}
            <div className="flex flex-col md:flex-row -mx-4">
              <div className="basis-full md:basis-6/12 px-4"> </div>
              <div className="basis-full md:basis-6/12 xl:basis-5/12 px-4">
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
