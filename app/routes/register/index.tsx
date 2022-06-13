import React from "react";
import { ActionFunction, LoaderFunction, useActionData } from "remix";
import InputPassword from "../../components/FormElements/InputPassword/InputPassword";
import InputText from "../../components/FormElements/InputText/InputText";
import SelectField from "../../components/FormElements/SelectField/SelectField";
import HeaderLogo from "../../components/HeaderLogo/HeaderLogo";
import PageBackground from "../../components/PageBackground/PageBackground";
import { signUp } from "../../auth.server";
import { generateUsername } from "../../utils";
import { Form as RemixForm, performMutation } from "remix-forms";
import { z } from "zod";
import { makeDomainFunction } from "remix-domains";
import { getNumberOfProfilesWithTheSameName } from "~/profile.server";

const schema = z.object({
  academicTitle: z.enum(["Dr.", "Prof.", "Prof. Dr."]).optional(),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email().min(1),
  password: z.string().min(1),
  termsAccepted: z.boolean(),
});

export const loader: LoaderFunction = async (args) => {
  return null;
};

const mutation = makeDomainFunction(schema)(async (values) => {
  // TODO: move to database trigger
  const { firstName, lastName, academicTitle, termsAccepted } = values;
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

export const action: ActionFunction = async (args) => {
  const { request } = args;

  return await performMutation({
    request,
    schema,
    mutation,
  });
};

export default function Register() {
  const actionData = useActionData();

  return (
    <>
      <PageBackground imagePath="/images/default_kitchen.jpg" />
      <div className="md:container md:mx-auto px-4 relative z-10">
        <div className="flex flex-row -mx-4 justify-end">
          <div className="basis-full md:basis-6/12 px-4 pt-4 pb-24 flex flex-row items-center">
            <div className="">
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
            <h1 className="mb-8">Neues Profil anlegen</h1>
            {actionData !== undefined && actionData.success ? (
              <>
                <p className="mb-4">
                  Das Profil für <b>{actionData.data.email}</b> wurde erstellt.
                  Um die Registrierung abzuschließen, schau bitte in deine
                  E-Mails und klicke auf den Registrierungslink.
                  {/*TODO: better text*/}
                </p>
              </>
            ) : (
              <RemixForm method="post" schema={schema}>
                {({ Field, Button, Errors, register }) => (
                  <>
                    <div className="flex flex-row -mx-4 mb-4">
                      <div className="basis-full lg:basis-6/12 px-4 mb-4">
                        <Field name="academicTitle" label="Titel">
                          {({ Errors }) => (
                            <>
                              <SelectField
                                id="academicTitle"
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
                              <InputText
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
                              <InputText
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
                            <InputText
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
                            Wenn Sie ein Konto erstellen, erklären Sie sich mit
                            unseren Nutzungsbedingungen, Datenschutzrichtlinien
                            und unseren Standardeinstellungen für
                            Benachrichtigungen einverstanden.
                          </span>
                        </label>
                      </div>
                    </div>
                    <div className="mb-8">
                      <button type="submit" className="btn btn-primary">
                        Account registrieren
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
