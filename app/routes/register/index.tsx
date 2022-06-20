import React from "react";
import { ActionFunction, LoaderFunction, useActionData } from "remix";
import InputPassword from "../../components/FormElements/InputPassword/InputPassword";
import Input from "~/components/FormElements/Input/Input";
import SelectField from "../../components/FormElements/SelectField/SelectField";
import HeaderLogo from "../../components/HeaderLogo/HeaderLogo";
import PageBackground from "../../components/PageBackground/PageBackground";
import { signUp } from "../../auth.server";
import { generateUsername } from "../../utils";
import {
  Form as RemixForm,
  PerformMutation,
  performMutation,
} from "remix-forms";
import { Schema, z } from "zod";
import { makeDomainFunction } from "remix-domains";
import { getNumberOfProfilesWithTheSameName } from "~/profile.server";

const schema = z.object({
  academicTitle: z.enum(["Dr.", "Prof.", "Prof. Dr."]).optional(),
  firstName: z.string().min(1, "Bitte einen Vornamen eingeben."),
  lastName: z.string().min(1, "Bitte einen Nachnamen eingeben."),
  email: z
    .string()
    .email("Ungültige E-Mail.")
    .min(1, "Bitte eine E-Mail eingeben."),
  password: z.string().min(1, "Bitte ein Passwort eingeben."),
  termsAccepted: z.boolean(),
});

export const loader: LoaderFunction = async (args) => {
  return null;
};

const mutation = makeDomainFunction(schema)(async (values) => {
  // TODO: move to database trigger
  const { firstName, lastName, academicTitle, termsAccepted } = values;
  // TODO: Check if username exists because profiles can be deleted.
  // That leads to username count gets out of sync with the below count of users with same name.
  const numberOfProfilesWithSameName = await getNumberOfProfilesWithTheSameName(
    firstName,
    lastName
  );
  const username = `${generateUsername(firstName, lastName)}${
    numberOfProfilesWithSameName > 0
      ? numberOfProfilesWithSameName.toString()
      : ""
  }`;

  const { error } = await signUp(values.email, values.password, {
    firstName,
    lastName,
    username,
    academicTitle,
    termsAccepted,
  });
  if (error !== null) {
    throw error.message;
  }

  return values;
});

type ActionData = PerformMutation<z.infer<Schema>, z.infer<typeof schema>>;

export const action: ActionFunction = async (args) => {
  const { request } = args;

  return await performMutation({
    request,
    schema,
    mutation,
  });
};

export default function Register() {
  const actionData = useActionData<ActionData>();

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
              <a href="/login" className="text-primary font-bold">
                Anmelden
              </a>
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
                  wir Dir über <b>noreply@mail.app.supabase.io</b> zusenden.
                  Bitte prüfe auch den Spam-Ordner.
                </p>
              </>
            ) : (
              <RemixForm method="post" schema={schema}>
                {({ Field, Button, Errors, register }) => (
                  <>
                    <p className="mb-4">
                      Hier kannst Du Dein persönliches Profil anlegen. Das
                      Unternehmen, in dem Du tätig bist, sowie Projekte und
                      Netzwerke können im nächsten Schritt angelegt werden.
                    </p>
                    <div className="flex flex-row -mx-4 mb-4">
                      <div className="basis-full lg:basis-6/12 px-4 mb-4">
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
                          {/** TODO: Insert links */}
                          <span className="label-text">
                            Ich erkläre mich mit der Geltung der
                            Nutzungsbedingungen [LINK] einverstanden. Die
                            Datenschutzerklärung [LINK] habe ich zur Kenntnis
                            genommen.
                          </span>
                        </label>
                      </div>
                    </div>
                    <div className="mb-8">
                      <button type="submit" className="btn btn-primary">
                        Profil anlegen
                      </button>
                    </div>
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
