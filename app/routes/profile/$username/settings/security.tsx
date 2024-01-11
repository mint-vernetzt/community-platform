import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useActionData, useLoaderData, useNavigation } from "@remix-run/react";
import { InputError, makeDomainFunction } from "domain-functions";
import { performMutation } from "remix-forms";
import { z } from "zod";
import {
  createAuthClient,
  getSessionUserOrThrow,
  sendResetEmailLink,
  updatePassword,
} from "~/auth.server";
import Input from "~/components/FormElements/Input/Input";
import InputPassword from "~/components/FormElements/InputPassword/InputPassword";
import { invariantResponse } from "~/lib/utils/response";
import { getParamValueOrThrow } from "~/lib/utils/routes";
import { deriveProfileMode } from "../utils.server";
import { getProfileByUsername } from "./security.server";
import { RemixFormsForm } from "~/components/RemixFormsForm/RemixFormsForm";

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

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  const response = new Response();

  const authClient = createAuthClient(request, response);
  const username = getParamValueOrThrow(params, "username");
  const profile = await getProfileByUsername(username);
  if (profile === null) {
    throw json({ message: "profile not found." }, { status: 404 });
  }
  const sessionUser = await getSessionUserOrThrow(authClient);
  const mode = await deriveProfileMode(sessionUser, username);
  invariantResponse(mode === "owner", "Not privileged", { status: 403 });

  const provider = sessionUser.app_metadata.provider || "email";

  return json({ provider });
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
    // TODO: fix type issue
    // @ts-ignore
    environment.authClient,
    values.email,
    environment.siteUrl
  );
  if (error !== null) {
    throw error.message;
  }

  return values;
});

export const action = async ({ request, params }: ActionFunctionArgs) => {
  const response = new Response();

  const authClient = createAuthClient(request, response);
  const username = getParamValueOrThrow(params, "username");
  const sessionUser = await getSessionUserOrThrow(authClient);
  const mode = await deriveProfileMode(sessionUser, username);
  invariantResponse(mode === "owner", "Not privileged", { status: 403 });

  if (sessionUser.app_metadata.provider === "keycloak") {
    throw json({ message: "not allowed." }, { status: 403 });
  }

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
  return json(result, { headers: response.headers });
};

export default function Security() {
  const navigation = useNavigation();
  const loaderData = useLoaderData<typeof loader>();

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

  return (
    <>
      <h1 className="mb-8">Login und Sicherheit</h1>
      {loaderData.provider === "keycloak" ? (
        <>
          <h4 className="mb-4 font-semibold">
            Passwort oder E-Mail-Adresse ändern
          </h4>
          <p className="mb-8">
            Du nutzt die MINT-ID und kannst deshalb deine E-Mail-Adresse und
            dein Passwort nur auf{" "}
            <a
              href="https://mint-id.org"
              target="_blank"
              rel="noreferrer"
              className="text-primary hover:underline"
            >
              mint-id.org
            </a>{" "}
            ändern.
          </p>
        </>
      ) : (
        <fieldset disabled={navigation.state === "submitting"}>
          <h4 className="mb-4 font-semibold">Passwort ändern</h4>

          <p className="mb-8">
            Hier kannst Du Dein Passwort ändern. Es muss mindestens 8 Zeichen
            lang sein. Benutze auch Zahlen und Zeichen, damit es sicherer ist.
          </p>
          <input type="hidden" name="action" value="changePassword" />

          <RemixFormsForm method="post" schema={passwordSchema}>
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
          </RemixFormsForm>
          <hr className="border-neutral-400 my-10 lg:my-16" />

          <h4 className="mb-4 font-semibold">E-Mail ändern</h4>

          <p className="mb-8">
            Hier kannst du Deine E-Mail-Adresse für die Anmeldung auf der
            Community-Plattform ändern.
          </p>
          <RemixFormsForm method="post" schema={emailSchema}>
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
          </RemixFormsForm>
        </fieldset>
      )}
    </>
  );
}
