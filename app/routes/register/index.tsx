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
import React from "react";
import { Trans, useTranslation } from "react-i18next";
import { performMutation } from "remix-forms";
import { z } from "zod";
import { createAuthClient, getSessionUser, signUp } from "~/auth.server";
import Input from "~/components/FormElements/Input/Input";
import { RemixFormsForm } from "~/components/RemixFormsForm/RemixFormsForm";
import i18next from "~/i18next.server";
import { detectLanguage } from "~/root.server";
import InputPassword from "../../components/FormElements/InputPassword/InputPassword";
import SelectField from "../../components/FormElements/SelectField/SelectField";
import { generateUsername } from "../../utils.server";

const i18nNS = ["routes-register-index"] as const;
export const handle = {
  i18n: i18nNS,
};

const createSchema = (t: TFunction) => {
  return z.object({
    // todo: i18n of enums?
    academicTitle: z.string().optional(), // TODO: empty string to "null"
    firstName: z.string().min(1, t("validation.firstName.min")),
    lastName: z.string().min(1, t("validation.lastName.min")),
    email: z
      .string()
      .email(t("validation.email.email"))
      .min(1, t("validation.email.min")),
    password: z.string().min(8, t("validation.password.min")),
    termsAccepted: z.boolean(),
    loginRedirect: z.string().optional(),
  });
};

const environmentSchema = z.object({
  authClient: z.unknown(),
  // authClient: z.instanceof(SupabaseClient),
  siteUrl: z.string(),
});

export const loader = async (args: LoaderFunctionArgs) => {
  const { request } = args;
  const { authClient } = createAuthClient(request);
  const sessionUser = await getSessionUser(authClient);
  if (sessionUser !== null) {
    return redirect("/dashboard");
  }

  return null;
};

const createMutation = (t: TFunction) => {
  return makeDomainFunction(
    createSchema(t),
    environmentSchema
  )(async (values, environment) => {
    // TODO: move to database trigger
    const { firstName, lastName, academicTitle, termsAccepted } = values;

    if (!termsAccepted) {
      throw t("validation.termsAccepted");
    }

    const username = `${generateUsername(firstName, lastName)}`;

    const loginRedirect = values.loginRedirect
      ? `${environment.siteUrl}${values.loginRedirect}`
      : undefined;

    const { error } = await signUp(
      // TODO: fix type issue
      // @ts-ignore
      environment.authClient,
      values.email,
      values.password,
      {
        firstName,
        lastName,
        username,
        academicTitle: academicTitle || null,
        termsAccepted,
      },
      loginRedirect
    );

    if (
      error !== null &&
      error.code !== "user_already_exists" &&
      error.message !== "User already registered"
    ) {
      throw json(
        { message: `${error.code}: ${error.message}` },
        { status: 500 }
      );
    }

    return values;
  });
};

export const action = async (args: ActionFunctionArgs) => {
  const { request } = args;
  const { authClient } = createAuthClient(request);

  const locale = detectLanguage(request);
  const t = await i18next.getFixedT(locale, i18nNS);

  const siteUrl = `${process.env.COMMUNITY_BASE_URL}`;

  const result = await performMutation({
    request,
    schema: createSchema(t),
    mutation: createMutation(t),
    environment: { authClient: authClient, siteUrl: siteUrl },
  });

  return json(result);
};

export default function Register() {
  const actionData = useActionData<typeof action>();
  const [urlSearchParams] = useSearchParams();
  const loginRedirect = urlSearchParams.get("login_redirect");
  const submit = useSubmit();
  const handleKeyPress = (event: KeyboardEvent<HTMLFormElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      // TODO: Type issue
      // @ts-ignore
      if (event.target.getAttribute("name") !== "termsAccepted") {
        submit(event.currentTarget);
      }
    }
  };

  const { t } = useTranslation(i18nNS);
  const schema = createSchema(t);

  return (
    <>
      <div className="mv-w-full mv-mx-auto mv-px-4 @sm:mv-max-w-screen-container-sm @md:mv-max-w-screen-container-md @lg:mv-max-w-screen-container-lg @xl:mv-max-w-screen-container-xl @xl:mv-px-6 @2xl:mv-max-w-screen-container-2xl relative z-10">
        <div className="flex flex-col mv-w-full mv-items-center">
          <div className="mv-w-full @sm:mv-w-2/3 @md:mv-w-1/2 @2xl:mv-w-1/3">
            <div className="mv-mb-6 mv-mt-12">
              {t("content.question")}{" "}
              <Link
                to={`/login${
                  loginRedirect ? `?login_redirect=${loginRedirect}` : ""
                }`}
                className="text-primary font-bold"
              >
                {t("content.login")}
              </Link>
            </div>
            <h1 className="mb-4">{t("content.create")}</h1>
            {actionData !== undefined && actionData.success ? (
              <>
                <p className="mb-4">
                  <Trans
                    i18nKey="content.success"
                    ns="routes/register/index"
                    values={{ email: actionData.data.email }}
                  ></Trans>{" "}
                  <Link
                    to={`/reset${
                      loginRedirect ? `?login_redirect=${loginRedirect}` : ""
                    }`}
                    className="text-primary font-bold hover:underline"
                  >
                    {t("content.reset")}
                  </Link>
                  .
                </p>
              </>
            ) : (
              <RemixFormsForm
                method="post"
                schema={schema}
                hiddenFields={["loginRedirect"]}
                values={{
                  loginRedirect: loginRedirect,
                }}
                onKeyDown={handleKeyPress}
              >
                {({ Field, Button, Errors, register }) => (
                  <>
                    <p className="mb-4">{t("form.intro")}</p>
                    <div className="flex flex-row -mx-4 mb-4">
                      <div className="basis-full @lg:mv-basis-6/12 px-4 mb-4">
                        <Field name="loginRedirect" />
                        <Field name="academicTitle" label="Titel">
                          {({ Errors }) => (
                            <>
                              <SelectField
                                label={t("form.title.label")}
                                options={[
                                  {
                                    label: t("form.title.options.dr"),
                                    value: "Dr.",
                                  },
                                  {
                                    label: t("form.title.options.prof"),
                                    value: "Prof.",
                                  },
                                  {
                                    label: t("form.title.options.profdr"),
                                    value: "Prof. Dr.",
                                  },
                                ]}
                                {...register("academicTitle")}
                              />
                              <Errors />
                            </>
                          )}
                        </Field>
                      </div>
                    </div>

                    <div className="flex flex-col @lg:mv-flex-row -mx-4 mb-4">
                      <div className="basis-full @lg:mv-basis-6/12 px-4 mb-4">
                        <Field name="firstName" label="Vorname">
                          {({ Errors }) => (
                            <>
                              <Input
                                id="firstName"
                                label={t("form.firstName")}
                                required
                                {...register("firstName")}
                              />

                              <Errors />
                            </>
                          )}
                        </Field>
                      </div>
                      <div className="basis-full @lg:mv-basis-6/12 px-4 mb-4">
                        <Field name="lastName" label="Nachname">
                          {({ Errors }) => (
                            <>
                              <Input
                                id="lastName"
                                label={t("form.lastName")}
                                required
                                {...register("lastName")}
                              />
                              <Errors />
                            </>
                          )}
                        </Field>
                      </div>
                    </div>

                    <div className="mb-4">
                      <Field name="email" label="E-Mail">
                        {({ Errors }) => (
                          <>
                            <Input
                              id="email"
                              label={t("form.email")}
                              required
                              {...register("email")}
                            />
                            <Errors />
                          </>
                        )}
                      </Field>
                    </div>

                    <div className="mb-4">
                      <Field name="password" label="Passwort">
                        {({ Errors }) => (
                          <>
                            <InputPassword
                              id="password"
                              label={t("form.password")}
                              required
                              {...register("password")}
                            />
                            <Errors />
                          </>
                        )}
                      </Field>
                    </div>

                    {/* <div className="mb-4">
              <InputPassword id="" label="Passwort wiederholen" isRequired />
            </div> */}

                    <div className="mb-8">
                      <div className="form-control checkbox-privacy items-start">
                        <label className="label cursor-pointer items-start">
                          <Field name="termsAccepted">
                            {({ Errors }) => {
                              const ForwardRefComponent = React.forwardRef<
                                HTMLInputElement,
                                React.DetailedHTMLProps<
                                  React.InputHTMLAttributes<HTMLInputElement>,
                                  HTMLInputElement
                                >
                              >((props, ref) => {
                                return (
                                  <>
                                    <input
                                      ref={
                                        // TODO: can this type assertion be removed and proofen by code?
                                        ref as React.RefObject<HTMLInputElement>
                                      }
                                      {...props}
                                    />
                                  </>
                                );
                              });
                              return (
                                <>
                                  <ForwardRefComponent
                                    type="checkbox"
                                    className="checkbox checkbox-primary mr-4"
                                    {...register("termsAccepted")}
                                  />
                                  <Errors />
                                </>
                              );
                            }}
                          </Field>
                          <span className="label-text">
                            {t("form.acknowledgements.intro")}{" "}
                            <a
                              href="https://mint-vernetzt.de/terms-of-use-community-platform"
                              target="_blank"
                              rel="noreferrer"
                              className="text-primary font-bold hover:underline"
                            >
                              {t("form.acknowledgements.termsOfUse")}
                            </a>
                            {t("form.acknowledgements.bridge")}{" "}
                            <a
                              href="https://mint-vernetzt.de/privacy-policy-community-platform"
                              target="_blank"
                              rel="noreferrer"
                              className="text-primary font-bold hover:underline"
                            >
                              {t("form.acknowledgements.dataProtection")}
                            </a>{" "}
                            {t("form.acknowledgements.outro")}
                          </span>
                        </label>
                      </div>
                    </div>
                    <div className="mb-8">
                      <button type="submit" className="btn btn-primary">
                        {t("form.submit")}
                      </button>
                    </div>
                    <Errors />
                  </>
                )}
              </RemixFormsForm>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
