import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { useActionData, useLoaderData, useNavigation } from "@remix-run/react";
import { InputError, makeDomainFunction } from "domain-functions";
import { type TFunction } from "i18next";
import { Trans, useTranslation } from "react-i18next";
import { performMutation } from "remix-forms";
import { z } from "zod";
import {
  createAuthClient,
  getSessionUserOrRedirectPathToLogin,
  getSessionUserOrThrow,
  sendResetEmailLink,
  updatePassword,
} from "~/auth.server";
import Input from "~/components/FormElements/Input/Input";
import InputPassword from "~/components/FormElements/InputPassword/InputPassword";
import { RemixFormsForm } from "~/components/RemixFormsForm/RemixFormsForm";
import i18next from "~/i18next.server";
import { invariantResponse } from "~/lib/utils/response";
import { getParamValueOrThrow } from "~/lib/utils/routes";
import { detectLanguage } from "~/root.server";
import { deriveProfileMode } from "../utils.server";
import { getProfileByUsername } from "./security.server";

const i18nNS = ["routes/profile/settings/security"];
export const handle = {
  i18n: i18nNS,
};

const createEmailSchema = (t: TFunction) => {
  return z.object({
    email: z
      .string()
      .min(1, t("validation.email.min"))
      .email(t("validation.email.email")),
    confirmEmail: z
      .string()
      .min(1, t("validation.confirmEmail.min"))
      .email(t("validation.confirmEmail.email")),
    submittedForm: z.string(),
  });
};

const createPasswordSchema = (t: TFunction) => {
  return z.object({
    password: z.string().min(8, t("validation.password.min")),
    confirmPassword: z.string().min(8, t("validation.confirmPassword.min")),
    submittedForm: z.string(),
  });
};

const passwordEnvironmentSchema = z.object({
  authClient: z.unknown(),
  // authClient: z.instanceof(SupabaseClient),
});

const emailEnvironmentSchema = z.object({
  authClient: z.unknown(),
  // authClient: z.instanceof(SupabaseClient),
});

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  const { authClient } = createAuthClient(request);

  const username = getParamValueOrThrow(params, "username");
  const profile = await getProfileByUsername(username);
  if (profile === null) {
    throw json({ message: "profile not found." }, { status: 404 });
  }
  const { sessionUser, redirectPath } =
    await getSessionUserOrRedirectPathToLogin(authClient, request);

  if (sessionUser === null && redirectPath !== null) {
    return redirect(redirectPath);
  }
  const mode = await deriveProfileMode(sessionUser, username);
  invariantResponse(mode === "owner", "Not privileged", { status: 403 });

  const provider = sessionUser.app_metadata.provider || "email";

  return json({ provider });
};

const createPasswordMutation = (t: TFunction) => {
  return makeDomainFunction(
    createPasswordSchema(t),
    passwordEnvironmentSchema
  )(async (values, environment) => {
    if (values.confirmPassword !== values.password) {
      throw new InputError(
        "Deine Passwörter stimmen nicht überein.",
        "confirmPassword"
      ); // -- Field error
    }

    const { error } = await updatePassword(
      // TODO: fix type issue
      // @ts-ignore
      environment.authClient,
      values.password
    );
    if (error !== null) {
      throw error.message;
    }

    return values;
  });
};

const createEmailMutation = (t: TFunction) => {
  return makeDomainFunction(
    createEmailSchema(t),
    emailEnvironmentSchema
  )(async (values, environment) => {
    if (values.confirmEmail !== values.email) {
      throw new InputError(t("error.emailsDontMatch"), "confirmEmail"); // -- Field error
    }

    const { error } = await sendResetEmailLink(
      // TODO: fix type issue
      // @ts-ignore
      environment.authClient,
      values.email
    );
    if (error !== null) {
      throw error.message;
    }

    return values;
  });
};

export const action = async ({ request, params }: ActionFunctionArgs) => {
  const locale = detectLanguage(request);
  const t = await i18next.getFixedT(locale, [
    "routes/profile/settings/security",
  ]);
  const { authClient } = createAuthClient(request);
  const username = getParamValueOrThrow(params, "username");
  const sessionUser = await getSessionUserOrThrow(authClient);
  const mode = await deriveProfileMode(sessionUser, username);
  invariantResponse(mode === "owner", t("error.notPrivileged"), {
    status: 403,
  });

  if (sessionUser.app_metadata.provider === "keycloak") {
    throw json({ message: t("error.notAllowed") }, { status: 403 });
  }

  const requestClone = request.clone(); // we need to clone request, because unpack formData can be used only once
  const formData = await requestClone.formData();

  const submittedForm = formData.get("submittedForm");

  let result = null;
  if (submittedForm === "changeEmail") {
    result = await performMutation({
      request,
      schema: createEmailSchema(t),
      mutation: createEmailMutation(t),
      environment: { authClient: authClient },
    });
  } else {
    result = await performMutation({
      request,
      schema: createPasswordSchema(t),
      mutation: createPasswordMutation(t),
      environment: { authClient: authClient },
    });
  }
  return json(result);
};

export default function Security() {
  const navigation = useNavigation();
  const loaderData = useLoaderData<typeof loader>();

  const { t } = useTranslation(i18nNS);
  const actionData = useActionData<typeof action>();

  let showPasswordFeedback = false,
    showEmailFeedback = false;
  if (actionData !== undefined) {
    showPasswordFeedback =
      actionData.success &&
      "password" in actionData.data &&
      actionData.data.password !== undefined;
    showEmailFeedback =
      actionData.success &&
      "email" in actionData.data &&
      actionData.data.email !== undefined;
  }

  const passwordSchema = createPasswordSchema(t);
  const emailSchema = createEmailSchema(t);

  return (
    <>
      <h1 className="mb-8">{t("content.headline")}</h1>
      {loaderData.provider === "keycloak" ? (
        <>
          <h4 className="mb-4 font-semibold">
            {t("section.changePassword1.headline")}
          </h4>
          <p className="mb-8">
            <Trans
              i18nKey="section.changePassword1.intro"
              ns={i18nNS}
              components={[
                <a
                  href="https://mint-id.org"
                  target="_blank"
                  rel="noreferrer"
                  className="text-primary hover:underline"
                />,
              ]}
            />
          </p>
        </>
      ) : (
        <fieldset disabled={navigation.state === "submitting"}>
          <h4 className="mb-4 font-semibold">
            {t("section.changePassword2.headline")}
          </h4>

          <p className="mb-8">{t("section.changePassword2.intro")}</p>

          <RemixFormsForm method="post" schema={passwordSchema}>
            {({ Field, Button, Errors, register }) => (
              <>
                <Field name="password" label="Neues Passwort" className="mb-4">
                  {({ Errors }) => (
                    <>
                      <InputPassword
                        id="password"
                        label={t("section.changePassword2.form.password.label")}
                        {...register("password")}
                      />
                      <Errors />
                    </>
                  )}
                </Field>

                <Field name="confirmPassword" label="Wiederholen">
                  {({ Errors }) => (
                    <>
                      <InputPassword
                        id="confirmPassword"
                        label={t(
                          "section.changePassword2.form.confirmPassword.label"
                        )}
                        {...register("confirmPassword")}
                      />
                      <Errors />
                    </>
                  )}
                </Field>
                <Field name="submittedForm">
                  {({ Errors }) => (
                    <>
                      <input
                        type="hidden"
                        defaultValue="changePassword"
                        {...register("submittedForm")}
                      ></input>
                      <Errors />
                    </>
                  )}
                </Field>

                <button type="submit" className="btn btn-primary mt-8">
                  {t("section.changePassword2.form.submit.label")}
                </button>
                {showPasswordFeedback ? (
                  <span
                    className={
                      "mt-2 ml-2 text-green-500 text-bold animate-fade-out"
                    }
                  >
                    {t("section.changePassword2.feedback")}
                  </span>
                ) : null}
                <Errors />
              </>
            )}
          </RemixFormsForm>
          <hr className="border-neutral-400 my-10 @lg:mv-my-16" />

          <h4 className="mb-4 font-semibold">
            {t("section.changeEmail.headline")}
          </h4>

          <p className="mb-8">{t("section.changeEmail.intro")}</p>
          <RemixFormsForm method="post" schema={emailSchema}>
            {({ Field, Button, Errors, register }) => (
              <>
                <Field name="email" label="Neue E-Mail" className="mb-4">
                  {({ Errors }) => (
                    <>
                      <Input
                        id="email"
                        label={t("section.changeEmail.form.email.label")}
                        {...register("email")}
                      />
                      <Errors />
                    </>
                  )}
                </Field>

                <Field name="confirmEmail" label="Wiederholen">
                  {({ Errors }) => (
                    <>
                      <Input
                        id="confirmEmail"
                        label={t("section.changeEmail.form.confirmEmail.label")}
                        {...register("confirmEmail")}
                      />
                      <Errors />
                    </>
                  )}
                </Field>

                <Field name="submittedForm">
                  {({ Errors }) => (
                    <>
                      <input
                        type="hidden"
                        defaultValue="changeEmail"
                        {...register("submittedForm")}
                      ></input>
                      <Errors />
                    </>
                  )}
                </Field>
                <button type="submit" className="btn btn-primary mt-8">
                  {t("section.changeEmail.form.submit.label")}
                </button>
                {showEmailFeedback ? (
                  <span
                    className={
                      "mt-2 ml-2 text-green-500 text-bold animate-fade-out"
                    }
                  >
                    {t("section.changeEmail.feedback")}
                  </span>
                ) : null}
                <Errors />
              </>
            )}
          </RemixFormsForm>
        </fieldset>
      )}
    </>
  );
}
