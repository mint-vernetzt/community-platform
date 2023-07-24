import type { ActionFunction, LoaderFunction } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import {
  Link,
  useActionData,
  useSearchParams,
  useSubmit,
} from "@remix-run/react";
import type { KeyboardEvent } from "react";
import React from "react";
import { makeDomainFunction } from "remix-domains";
import type { PerformMutation } from "remix-forms";
import { Form as RemixForm, performMutation } from "remix-forms";
import type { Schema } from "zod";
import { z } from "zod";
import { createAuthClient, getSessionUser, signUp } from "~/auth.server";
import Input from "~/components/FormElements/Input/Input";
import InputPassword from "../../components/FormElements/InputPassword/InputPassword";
import SelectField from "../../components/FormElements/SelectField/SelectField";
import HeaderLogo from "../../components/HeaderLogo/HeaderLogo";
import PageBackground from "../../components/PageBackground/PageBackground";
import { generateUsername } from "../../utils";

const schema = z.object({
  academicTitle: z.enum(["Dr.", "Prof.", "Prof. Dr."]).optional(),
  firstName: z.string().min(1, "Bitte gib Deinen Vornamen ein."),
  lastName: z.string().min(1, "Bitte gib Deinen Nachnamen ein."),
  email: z
    .string()
    .email("Bitte gib eine gültige E-Mail-Adresse ein.")
    .min(1, "Bitte gib eine gültige E-Mail-Adresse ein."),
  password: z
    .string()
    .min(
      8,
      "Dein Passwort muss mindestens 8 Zeichen lang sein. Benutze auch Zahlen und Zeichen, damit es sicherer ist."
    ),
  termsAccepted: z.boolean(),
  loginRedirect: z.string().optional(),
});

const environmentSchema = z.object({
  authClient: z.unknown(),
  // authClient: z.instanceof(SupabaseClient),
  siteUrl: z.string(),
});

export const loader: LoaderFunction = async (args) => {
  const { request } = args;
  const response = new Response();
  const authClient = createAuthClient(request, response);
  const sessionUser = await getSessionUser(authClient);
  if (sessionUser !== null) {
    return redirect("/dashboard", { headers: response.headers });
  }

  return response;
};

const mutation = makeDomainFunction(
  schema,
  environmentSchema
)(async (values, environment) => {
  // TODO: move to database trigger
  const { firstName, lastName, academicTitle, termsAccepted } = values;

  if (!termsAccepted) {
    throw "Bitte akzeptiere unsere Nutzungsbedingungen und bestätige, dass Du die Datenschutzerklärung gelesen hast.";
  }

  const username = `${generateUsername(firstName, lastName)}`;

  // Passing through a possible redirect after login (e.g. to an event)
  const emailRedirectTo = values.loginRedirect
    ? `${environment.siteUrl}?login_redirect=${values.loginRedirect}`
    : environment.siteUrl;

  const { error } = await signUp(
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
    emailRedirectTo
  );
  if (error !== null && error.message !== "User already registered") {
    throw error.message;
  }

  return values;
});

type ActionData = PerformMutation<z.infer<Schema>, z.infer<typeof schema>>;

export const action: ActionFunction = async (args) => {
  const { request } = args;
  const response = new Response();

  const authClient = createAuthClient(request, response);

  const siteUrl = `${process.env.COMMUNITY_BASE_URL}/verification`;

  const result = await performMutation({
    request,
    schema,
    mutation,
    environment: { authClient: authClient, siteUrl: siteUrl },
  });

  return json<ActionData>(result, { headers: response.headers });
};

export default function Register() {
  const actionData = useActionData<ActionData>();
  const [urlSearchParams] = useSearchParams();
  const loginRedirect = urlSearchParams.get("login_redirect");
  const submit = useSubmit();
  const handleKeyPress = (event: KeyboardEvent<HTMLFormElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      // TODO: Type issue
      if (event.target.getAttribute("name") !== "termsAccepted") {
        submit(event.currentTarget);
      }
    }
  };

  return (
    <>
      <PageBackground imagePath="/images/login_background_image.jpg" />
      <div className="md:container md:mx-auto px-4 relative z-10">
        <div className="flex flex-row -mx-4 justify-end">
          <div className="basis-full md:basis-6/12 px-4 pt-3 pb-24 flex flex-row items-center">
            <div>
              <HeaderLogo />
            </div>
            <div className="ml-auto">
              Bereits Mitglied?{" "}
              <Link
                to={`/login${
                  loginRedirect ? `?login_redirect=${loginRedirect}` : ""
                }`}
                className="text-primary font-bold"
              >
                Anmelden
              </Link>
            </div>
          </div>
        </div>
        <div className="flex flex-col md:flex-row -mx-4">
          <div className="basis-full md:basis-6/12 px-4"> </div>
          <div className="basis-full md:basis-6/12 xl:basis-5/12 px-4">
            <h1 className="mb-4">Neues Profil anlegen</h1>
            {actionData !== undefined && actionData.success ? (
              <>
                <p className="mb-4">
                  Das Profil für <b>{actionData.data.email}</b> wurde erstellt.
                  Um die Registrierung abzuschließen, bestätige bitte innerhalb
                  von 24 Stunden den Registrierungslink in Deinen E-Mails, den
                  wir Dir über <b>noreply@mint-vernetzt.de</b> zusenden. Bitte
                  sieh auch in Deinem Spam-Ordner nach. Hast Du Dich bereits
                  vorher mit dieser E-Mail-Adresse registriert und Dein Passwort
                  vergessen, dann setze hier Dein Passwort zurück:{" "}
                  <Link
                    to={`/reset${
                      loginRedirect ? `?login_redirect=${loginRedirect}` : ""
                    }`}
                    className="text-primary font-bold hover:underline"
                  >
                    Passwort zurücksetzen
                  </Link>
                  .
                </p>
              </>
            ) : (
              <RemixForm
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
                    <p className="mb-4">
                      Hier kannst Du Dein persönliches Profil anlegen. Die
                      Organisationen, Netzwerke oder Unternehmen, in denen Du
                      tätig bist, können im nächsten Schritt angelegt werden.
                    </p>
                    <div className="flex flex-row -mx-4 mb-4">
                      <div className="basis-full lg:basis-6/12 px-4 mb-4">
                        <Field name="loginRedirect" />
                        <Field name="academicTitle" label="Titel">
                          {({ Errors }) => (
                            <>
                              <SelectField
                                label="Titel"
                                options={[
                                  {
                                    label: "Dr.",
                                    value: "Dr.",
                                  },
                                  {
                                    label: "Prof.",
                                    value: "Prof.",
                                  },
                                  {
                                    label: "Prof. Dr.",
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

                    <div className="flex flex-col lg:flex-row -mx-4 mb-4">
                      <div className="basis-full lg:basis-6/12 px-4 mb-4">
                        <Field name="firstName" label="Vorname">
                          {({ Errors }) => (
                            <>
                              <Input
                                id="firstName"
                                label="Vorname"
                                required
                                {...register("firstName")}
                              />

                              <Errors />
                            </>
                          )}
                        </Field>
                      </div>
                      <div className="basis-full lg:basis-6/12 px-4 mb-4">
                        <Field name="lastName" label="Nachname">
                          {({ Errors }) => (
                            <>
                              <Input
                                id="lastName"
                                label="Nachname"
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
                              label="E-Mail"
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
                              label="Passwort"
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
                      <div className="form-control checkbox-privacy">
                        <label className="label cursor-pointer items-start">
                          <Field name="termsAccepted">
                            {({ Errors }) => {
                              const ForwardRefComponent = React.forwardRef<
                                HTMLInputElement,
                                JSX.IntrinsicElements["input"]
                              >((props, ref) => {
                                return (
                                  <>
                                    <input
                                      ref={
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
                            Ich erkläre mich mit der Geltung der{" "}
                            <a
                              href="https://mint-vernetzt.de/terms-of-use-community-platform"
                              target="_blank"
                              rel="noreferrer"
                              className="text-primary font-bold hover:underline"
                            >
                              Nutzungsbedingungen
                            </a>{" "}
                            einverstanden. Die{" "}
                            <a
                              href="https://mint-vernetzt.de/privacy-policy-community-platform"
                              target="_blank"
                              rel="noreferrer"
                              className="text-primary font-bold hover:underline"
                            >
                              Datenschutzerklärung
                            </a>{" "}
                            habe ich zur Kenntnis genommen.
                          </span>
                        </label>
                      </div>
                    </div>
                    <div className="mb-8">
                      <button type="submit" className="btn btn-primary">
                        Profil anlegen
                      </button>
                    </div>
                    <Errors />
                  </>
                )}
              </RemixForm>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
