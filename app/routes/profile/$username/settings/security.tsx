import type { ActionFunction, LoaderFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useActionData, useTransition } from "@remix-run/react";
import { InputError, makeDomainFunction } from "remix-domains";
import type { PerformMutation } from "remix-forms";
import { Form as RemixForm, performMutation } from "remix-forms";
import { forbidden, notFound } from "remix-utils";
import type { Schema } from "zod";
import { z } from "zod";
import {
  createAuthClient,
  getSessionOrThrow,
  getSessionUserOrThrow,
  sendResetEmailLink,
  updatePassword,
} from "~/auth.server";
import Input from "~/components/FormElements/Input/Input";
import InputPassword from "~/components/FormElements/InputPassword/InputPassword";
import { getParamValueOrThrow } from "~/lib/utils/routes";
import { getProfileByUsername } from "~/profile.server";
import { handleAuthorization } from "../utils.server";

const emailSchema = z.object({
  email: z
    .string()
    .min(1, "Bitte gib eine gültige E-Mail-Adresse ein.")
    .email("Bitte gib eine gültige E-Mail-Adresse ein."),
  confirmEmail: z
    .string()
    .min(1, "Bitte gib eine gültige E-Mail-Adresse ein.")
    .email("Bitte gib eine gültige E-Mail-Adresse ein. "),
  submittedForm: z.enum(["changeEmail"]),
});

const passwordSchema = z.object({
  password: z
    .string()
    .min(8, "Dein Passwort muss mindestens 8 Zeichen lang sein."),
  confirmPassword: z
    .string()
    .min(8, "Dein Passwort muss mindestens 8 Zeichen lang sein."),
  submittedForm: z.enum(["changePassword"]),
});

const passwordEnvironmentSchema = z.object({
  authClient: z.unknown(),
  // authClient: z.instanceof(SupabaseClient),
});

const emailEnvironmentSchema = z.object({
  authClient: z.unknown(),
  siteUrl: z.string(),
  // authClient: z.instanceof(SupabaseClient),
});

export const loader: LoaderFunction = async ({ request, params }) => {
  const response = new Response();

  const authClient = createAuthClient(request, response);
  const username = getParamValueOrThrow(params, "username");
  const profile = await getProfileByUsername(username);
  if (profile === null) {
    throw notFound({ message: "profile not found." });
  }
  const session = await getSessionOrThrow(authClient);
  const sessionUser = session.user;

  if (sessionUser.app_metadata.provider === "keycloak") {
    throw forbidden({ message: "not allowed." });
  }

  await handleAuthorization(sessionUser.id, profile.id);

  return response;
};

const passwordMutation = makeDomainFunction(
  passwordSchema,
  passwordEnvironmentSchema
)(async (values, environment) => {
  if (values.confirmPassword !== values.password) {
    throw new InputError(
      "Deine Passwörter stimmen nicht überein.",
      "confirmPassword"
    ); // -- Field error
  }

  const { error } = await updatePassword(
    environment.authClient,
    values.password
  );
  if (error !== null) {
    throw error.message;
  }

  return values;
});

const emailMutation = makeDomainFunction(
  emailSchema,
  emailEnvironmentSchema
)(async (values, environment) => {
  if (values.confirmEmail !== values.email) {
    throw new InputError(
      "Deine E-Mails stimmen nicht überein.",
      "confirmEmail"
    ); // -- Field error
  }

  const { error } = await sendResetEmailLink(
    environment.authClient,
    values.email,
    environment.siteUrl
  );
  if (error !== null) {
    throw error.message;
  }

  return values;
});

type ActionData =
  | PerformMutation<z.infer<Schema>, z.infer<typeof emailSchema>>
  | PerformMutation<z.infer<Schema>, z.infer<typeof passwordSchema>>;

export const action: ActionFunction = async ({ request, params }) => {
  const response = new Response();

  const authClient = createAuthClient(request, response);
  const username = getParamValueOrThrow(params, "username");
  const profile = await getProfileByUsername(username);
  if (profile === null) {
    throw notFound({ message: "profile not found." });
  }
  const sessionUser = await getSessionUserOrThrow(authClient);
  await handleAuthorization(sessionUser.id, profile.id);

  const requestClone = request.clone(); // we need to clone request, because unpack formData can be used only once
  const formData = await requestClone.formData();

  const submittedForm = formData.get("submittedForm");

  let result = null;
  if (submittedForm === "changeEmail") {
    const siteUrl = `${process.env.COMMUNITY_BASE_URL}/verification`;
    result = await performMutation({
      request,
      schema: emailSchema,
      mutation: emailMutation,
      environment: { authClient: authClient, siteUrl: siteUrl },
    });
  } else {
    result = await performMutation({
      request,
      schema: passwordSchema,
      mutation: passwordMutation,
      environment: { authClient: authClient },
    });
  }
  return json<ActionData>(result, { headers: response.headers });
};

export default function Security() {
  const transition = useTransition();

  const actionData = useActionData<ActionData>();

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

  return (
    <>
      <fieldset disabled={transition.state === "submitting"}>
        <h4 className="mb-4 font-semibold">Passwort ändern</h4>

        <p className="mb-8">
          Hier kannst Du Dein Passwort ändern. Es muss mindestens 8 Zeichen lang
          sein. Benutze auch Zahlen und Zeichen, damit es sicherer ist.
        </p>
        <input type="hidden" name="action" value="changePassword" />

        <RemixForm method="post" schema={passwordSchema}>
          {({ Field, Button, Errors, register }) => (
            <>
              <Field name="password" label="Neues Passwort" className="mb-4">
                {({ Errors }) => (
                  <>
                    <InputPassword
                      id="password"
                      label="Neues Passwort"
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
                      label="Passwort wiederholen"
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
                      value="changePassword"
                      {...register("submittedForm")}
                    ></input>
                    <Errors />
                  </>
                )}
              </Field>

              <button type="submit" className="btn btn-primary mt-8">
                Passwort ändern
              </button>
              {showPasswordFeedback ? (
                <span
                  className={
                    "mt-2 ml-2 text-green-500 text-bold animate-fade-out"
                  }
                >
                  Dein Passwort wurde geändert.
                </span>
              ) : null}
              <Errors />
            </>
          )}
        </RemixForm>
        <hr className="border-neutral-400 my-10 lg:my-16" />

        <h4 className="mb-4 font-semibold">E-Mail ändern</h4>

        <p className="mb-8">
          Hier kannst du Deine E-Mail-Adresse für die Anmeldung auf der
          Community-Plattform ändern.
        </p>
        <RemixForm method="post" schema={emailSchema}>
          {({ Field, Button, Errors, register }) => (
            <>
              <Field name="email" label="Neue E-Mail" className="mb-4">
                {({ Errors }) => (
                  <>
                    <Input
                      id="email"
                      label="Neue E-Mail"
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
                      label="E-Mail wiederholen"
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
                      value="changeEmail"
                      {...register("submittedForm")}
                    ></input>
                    <Errors />
                  </>
                )}
              </Field>
              <button type="submit" className="btn btn-primary mt-8">
                E-Mail ändern
              </button>
              {showEmailFeedback ? (
                <span
                  className={
                    "mt-2 ml-2 text-green-500 text-bold animate-fade-out"
                  }
                >
                  Ein Bestätigungslink wurde Dir zugesendet.
                </span>
              ) : null}
              <Errors />
            </>
          )}
        </RemixForm>
      </fieldset>
    </>
  );
}
