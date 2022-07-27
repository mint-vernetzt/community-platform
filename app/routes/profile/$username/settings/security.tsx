import { ActionFunction, useActionData, useTransition } from "remix";
import { InputError, makeDomainFunction } from "remix-domains";
import { Form as RemixForm, performMutation } from "remix-forms";
import { badRequest, forbidden } from "remix-utils";
import { z } from "zod";
import {
  getUserByRequest,
  updateEmailOfLoggedInUser,
  updatePasswordOfLoggedInUser,
} from "~/auth.server";
import Input from "~/components/FormElements/Input/Input";
import InputPassword from "~/components/FormElements/InputPassword/InputPassword";
import useCSRF from "~/lib/hooks/useCSRF";
import { validateCSRFToken } from "~/utils.server";

const emailSchema = z.object({
  csrf: z.string(),
  email: z
    .string()
    .min(1, "Bitte eine E-Mail eingeben.")
    .email("Ungültige E-Mail"),
  confirmEmail: z
    .string()
    .min(1, "E-Mail wiederholen um Rechtschreibfehler zu vermeiden.")
    .email("Ungültige E-Mail"),
  submittedForm: z.enum(["changeEmail"]), // TODO: Can be exactly one of changeEmail || changePassword
});

const passwordSchema = z.object({
  csrf: z.string(),
  password: z.string().min(8, "Bitte ein Passwort eingeben."),
  confirmPassword: z
    .string()
    .min(8, "Passwort wiederholen um Rechtschreibfehler zu vermeiden."),
  submittedForm: z.enum(["changePassword"]),
});

// TODO: Higher order function
export async function handleAuthorization(request: Request, username: string) {
  if (typeof username !== "string" || username === "") {
    throw badRequest({ message: "username must be provided" });
  }
  const sessionUser = await getUserByRequest(request);

  if (sessionUser === null || sessionUser.user_metadata.username !== username) {
    throw forbidden({ message: "not allowed" });
  }

  return sessionUser;
}

const passwordMutation = makeDomainFunction(passwordSchema)(async (values) => {
  if (values.confirmPassword !== values.password) {
    throw new InputError(
      "Die eingegebenen Passwörter stimmen nicht überein",
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
      "Die eingegebenen E-Mails stimmen nicht überein",
      "confirmEmail"
    ); // -- Field error
  }

  const { error } = await updateEmailOfLoggedInUser(values.email);
  if (error !== null) {
    throw error.message;
  }

  return values;
});

export const action: ActionFunction = async ({ request, params }) => {
  const requestClone = request.clone(); // we need to clone request, because unpack formData can be used only once
  const formData = await requestClone.formData();

  await validateCSRFToken(request);

  const submittedForm = formData.get("submittedForm");
  const schema = submittedForm === "changeEmail" ? emailSchema : passwordSchema;
  const mutation =
    submittedForm === "changeEmail" ? emailMutation : passwordMutation;
  return performMutation({
    request,
    schema,
    mutation, // TODO: Fix later
  });
};

export default function Security() {
  const transition = useTransition();

  const { hiddenCSRFInput } = useCSRF();

  // TODO: Declare type
  const actionData = useActionData();

  let showPasswordFeedback = false,
    showEmailFeedback = false;
  if (actionData !== undefined) {
    showPasswordFeedback =
      actionData.success && actionData.data.password !== undefined;
    showEmailFeedback =
      actionData.success && actionData.data.email !== undefined;
  }

  return (
    <>
      <fieldset disabled={transition.state === "submitting"}>
        <h1 className="mb-8">Login und Sicherheit</h1>

        <h4 className="mb-4 font-semibold">Passwort ändern</h4>

        <p className="mb-8">
          Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam
          nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat,
          sed diam voluptua.
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
                      required
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
                      required
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
              <Field name="csrf">
                {({ Errors }) => (
                  <>
                    {hiddenCSRFInput}
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
                  Passwort wurde geändert.
                </span>
              ) : null}
              <Errors />
            </>
          )}
        </RemixForm>
        <hr className="border-neutral-400 my-10 lg:my-16" />

        <h4 className="mb-4 font-semibold">E-Mail ändern</h4>

        <p className="mb-8">
          Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam
          nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat,
          sed diam voluptua.
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
                      required
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
                      required
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
              <Field name="csrf">
                {({ Errors }) => (
                  <>
                    {hiddenCSRFInput}
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
                  Bestätigungslink gesendet.
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
