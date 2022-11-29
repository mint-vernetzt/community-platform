import {
  ActionFunction,
  Link,
  LoaderFunction,
  useActionData,
  useLoaderData,
  useTransition,
} from "remix";
import { InputError, makeDomainFunction } from "remix-domains";
import { Form as RemixForm, performMutation } from "remix-forms";
import { z } from "zod";
import {
  updateEmailOfLoggedInUser,
  updatePasswordOfLoggedInUser,
} from "~/auth.server";
import Input from "~/components/FormElements/Input/Input";
import InputPassword from "~/components/FormElements/InputPassword/InputPassword";
import { handleAuthorization } from "../utils.server";

/* Disabled until issue #609 is resolved

const emailSchema = z.object({
  email: z
    .string()
    .min(1, "Bitte gib eine gültige E-Mail-Adresse ein.")
    .email("Bitte gib eine gültige E-Mail-Adresse ein."),
  confirmEmail: z
    .string()
    .min(1, "Bitte gib eine gültige E-Mail-Adresse ein.")
    .email("Bitte gib eine gültige E-Mail-Adresse ein. "),
  submittedForm: z.enum(["changeEmail"]), // TODO: Can be exactly one of changeEmail || changePassword
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

const passwordMutation = makeDomainFunction(passwordSchema)(async (values) => {
  if (values.confirmPassword !== values.password) {
    throw new InputError(
      "Deine Passwörter stimmen nicht überein.",
      "confirmPassword"
    ); // -- Field error
  }

  const { error } = await updatePasswordOfLoggedInUser(values.password);
  if (error !== null) {
    throw error.message;
  }

  return values;
});

const emailMutation = makeDomainFunction(emailSchema)(async (values) => {
  if (values.confirmEmail !== values.email) {
    throw new InputError(
      "Deine E-Mails stimmen nicht überein.",
      "confirmEmail"
    ); // -- Field error
  }

  const { error } = await updateEmailOfLoggedInUser(values.email);
  if (error !== null) {
    throw error.message;
  }

  return values;
});

export const loader: LoaderFunction = async (args) => {
  const { request, params } = args;

  const { username = "" } = params;

  await handleAuthorization(request, username);

  return null;
};



export const action: ActionFunction = async ({ request, params }) => {
  const requestClone = request.clone(); // we need to clone request, because unpack formData can be used only once
  const formData = await requestClone.formData();

  const submittedForm = formData.get("submittedForm");

  let result = null;
  if (submittedForm === "changeEmail") {
    result = await performMutation({
      request,
      schema: emailSchema,
      mutation: emailMutation,
    });
  } else if (submittedForm === "changePassword") {
    result = await performMutation({
      request,
      schema: passwordSchema,
      mutation: passwordMutation,
    });
  }
  return result;
};
*/

// Remove protocol and host from loader when issue #609 is resolved

type LoaderData = {
  protocol: string;
  host: string;
};

export const loader: LoaderFunction = async ({ request, params }) => {
  const url = new URL(request.url);

  const username = params.username ?? "";
  await handleAuthorization(request, username);

  return {
    protocol: url.protocol,
    host: url.host,
  };
};

export default function Security() {
  // Remove useLoaderData when issue #609 is resolved
  const loaderData = useLoaderData<LoaderData>();

  // Disabled until issue #609 is resolved

  // const transition = useTransition();

  // // TODO: Declare type
  // const actionData = useActionData();

  // let showPasswordFeedback = false,
  //   showEmailFeedback = false;
  // if (actionData !== undefined) {
  //   showPasswordFeedback =
  //     actionData.success && actionData.data.password !== undefined;
  //   showEmailFeedback =
  //     actionData.success && actionData.data.email !== undefined;
  // }

  return (
    <>
      {/* Disabled until issue #609 is resolved */}

      {/* <fieldset disabled={transition.state === "submitting"}> */}
      <h1 className="mb-8">Login und Sicherheit</h1>
      <p className="mb-4">
        Bald stehen folgende Funktionen über ein automatisiertes Formular zur
        Verfügung.
      </p>
      <h4 className="mb-4 font-semibold">E-Mail-Adresse ändern</h4>
      <p className="mb-8">
        Falls du die E-Mail-Adresse deines Accounts ändern möchtest, melde dich
        bitte bei{" "}
        <a
          href="mailto:support@mint-vernetzt.de"
          className="hover:underline font-bold text-primary"
        >
          support@mint-vernetzt.de
        </a>
        .
      </p>
      <h4 className="mb-4 font-semibold">Passwort ändern</h4>
      <p>
        Um dein Passwort zu ändern, folge bitte diesem Link:{" "}
        <Link
          to={`/reset?redirect_to=${loaderData.protocol}//${loaderData.host}/reset/set-password?redirect_to=${loaderData.protocol}//${loaderData.host}/login`}
          className="hover:underline font-bold text-primary"
        >
          Passwort zurücksetzen
        </Link>
        .
      </p>

      {/* Disabled until issue #609 is resolved */}

      {/* <h4 className="mb-4 font-semibold">Passwort ändern</h4>

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
      */}
    </>
  );
}
