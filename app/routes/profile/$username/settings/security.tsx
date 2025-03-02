import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import {
  useActionData,
  useLoaderData,
  useNavigation,
  redirect,
} from "react-router";
import { InputError, makeDomainFunction } from "domain-functions";
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
import { invariantResponse } from "~/lib/utils/response";
import { getParamValueOrThrow } from "~/lib/utils/routes";
import { detectLanguage } from "~/i18n.server";
import { deriveProfileMode } from "../utils.server";
import {
  getProfileByUsername,
  type ProfileSecurityLocales,
} from "./security.server";
import { languageModuleMap } from "~/locales/.server";
import { insertComponentsIntoLocale } from "~/lib/utils/i18n";

const createEmailSchema = (locales: ProfileSecurityLocales) => {
  return z.object({
    email: z
      .string()
      .min(1, locales.validation.email.min)
      .email(locales.validation.email.email)
      .transform((value) => value.trim()),
    confirmEmail: z
      .string()
      .min(1, locales.validation.confirmEmail.min)
      .email(locales.validation.confirmEmail.email)
      .transform((value) => value.trim()),
    submittedForm: z.string(),
  });
};

const createPasswordSchema = (locales: ProfileSecurityLocales) => {
  return z.object({
    password: z.string().min(8, locales.validation.password.min),
    confirmPassword: z.string().min(8, locales.validation.confirmPassword.min),
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
    invariantResponse(false, "Profile not found", { status: 404 });
  }
  const { sessionUser, redirectPath } =
    await getSessionUserOrRedirectPathToLogin(authClient, request);

  if (sessionUser === null && redirectPath !== null) {
    return redirect(redirectPath);
  }
  const mode = await deriveProfileMode(sessionUser, username);
  invariantResponse(mode === "owner", "Not privileged", { status: 403 });

  const language = await detectLanguage(request);
  const locales =
    languageModuleMap[language]["profile/$username/settings/security"];

  const provider = sessionUser.app_metadata.provider || "email";

  return { provider, locales };
};

const createPasswordMutation = (locales: ProfileSecurityLocales) => {
  return makeDomainFunction(
    createPasswordSchema(locales),
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
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
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

const createEmailMutation = (locales: ProfileSecurityLocales) => {
  return makeDomainFunction(
    createEmailSchema(locales),
    emailEnvironmentSchema
  )(async (values, environment) => {
    if (values.confirmEmail !== values.email) {
      throw new InputError(locales.error.emailsDontMatch, "confirmEmail"); // -- Field error
    }

    const { error } = await sendResetEmailLink(
      // TODO: fix type issue
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
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
  const language = await detectLanguage(request);
  const locales =
    languageModuleMap[language]["profile/$username/settings/security"];
  const { authClient } = createAuthClient(request);
  const username = getParamValueOrThrow(params, "username");
  const sessionUser = await getSessionUserOrThrow(authClient);
  const mode = await deriveProfileMode(sessionUser, username);
  invariantResponse(mode === "owner", locales.error.notPrivileged, {
    status: 403,
  });

  if (sessionUser.app_metadata.provider === "keycloak") {
    invariantResponse(false, locales.error.notAllowed, { status: 403 });
  }

  const requestClone = request.clone(); // we need to clone request, because unpack formData can be used only once
  const formData = await requestClone.formData();

  const submittedForm = formData.get("submittedForm");

  let result = null;
  if (submittedForm === "changeEmail") {
    result = await performMutation({
      request,
      schema: createEmailSchema(locales),
      mutation: createEmailMutation(locales),
      environment: { authClient: authClient },
    });
  } else {
    result = await performMutation({
      request,
      schema: createPasswordSchema(locales),
      mutation: createPasswordMutation(locales),
      environment: { authClient: authClient },
    });
  }
  return result;
};

export default function Security() {
  const navigation = useNavigation();
  const loaderData = useLoaderData<typeof loader>();
  const { locales } = loaderData;
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

  const passwordSchema = createPasswordSchema(locales);
  const emailSchema = createEmailSchema(locales);

  return (
    <>
      <h1 className="mb-8">{locales.content.headline}</h1>
      {loaderData.provider === "keycloak" ? (
        <>
          <h4 className="mb-4 font-semibold">
            {locales.section.changePassword1.headline}
          </h4>
          <p className="mb-8">
            {insertComponentsIntoLocale(locales.section.changePassword1.intro, [
              <a
                key="change-mint-id-password"
                href="https://mint-id.org"
                target="_blank"
                rel="noreferrer"
                className="text-primary hover:underline"
              >
                {" "}
              </a>,
            ])}
          </p>
        </>
      ) : (
        <fieldset disabled={navigation.state === "submitting"}>
          <h4 className="mb-4 font-semibold">
            {locales.section.changePassword2.headline}
          </h4>

          <p className="mb-8">{locales.section.changePassword2.intro}</p>

          <RemixFormsForm method="post" schema={passwordSchema}>
            {({ Field, Errors, register }) => (
              <>
                <Field name="password" label="Neues Passwort" className="mb-4">
                  {({ Errors }) => (
                    <>
                      <InputPassword
                        id="password"
                        label={
                          locales.section.changePassword2.form.password.label
                        }
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
                        label={
                          locales.section.changePassword2.form.confirmPassword
                            .label
                        }
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
                  {locales.section.changePassword2.form.submit.label}
                </button>
                {showPasswordFeedback ? (
                  <span
                    className={
                      "mt-2 ml-2 text-green-500 text-bold animate-fade-out"
                    }
                  >
                    {locales.section.changePassword2.feedback}
                  </span>
                ) : null}
                <Errors />
              </>
            )}
          </RemixFormsForm>
          <hr className="border-neutral-400 my-10 @lg:mv-my-16" />

          <h4 className="mb-4 font-semibold">
            {locales.section.changeEmail.headline}
          </h4>

          <p className="mb-8">{locales.section.changeEmail.intro}</p>
          <RemixFormsForm method="post" schema={emailSchema}>
            {({ Field, Errors, register }) => (
              <>
                <Field name="email" label="Neue E-Mail" className="mb-4">
                  {({ Errors }) => (
                    <>
                      <Input
                        id="email"
                        label={locales.section.changeEmail.form.email.label}
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
                        label={
                          locales.section.changeEmail.form.confirmEmail.label
                        }
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
                  {locales.section.changeEmail.form.submit.label}
                </button>
                {showEmailFeedback ? (
                  <span
                    className={
                      "mt-2 ml-2 text-green-500 text-bold animate-fade-out"
                    }
                  >
                    {locales.section.changeEmail.feedback}
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
