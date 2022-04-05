import { ActionFunction, Form, json, LoaderFunction } from "remix";
import InputPassword from "../../components/FormElements/InputPassword/InputPassword";
import InputText from "../../components/FormElements/InputText/InputText";
import SelectField from "../../components/FormElements/SelectField/SelectField";
import HeaderLogo from "../../components/HeaderLogo/HeaderLogo";
import PageBackground from "../../components/PageBackground/PageBackground";
import { signUp } from "../../auth.server";
import { prismaClient } from "../../prisma";
import { badRequest, generateUsername, validateFormData } from "../../utils";

export const loader: LoaderFunction = async (args) => {
  return null;
};

// TODO: Error handling and passing
export const action: ActionFunction = async (args) => {
  const { request } = args;

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch (error) {
    return badRequest();
  }

  const isFormDataValid = validateFormData(
    ["email", "password", "firstName", "lastName", "termsAccepted"],
    formData
  );

  if (!isFormDataValid) {
    console.error("form data not valid");
    return badRequest(); // TODO: return empty fields to highlight
  }

  const termsAccepted = formData.get("termsAccepted");
  if (termsAccepted !== "on") {
    console.error("terms not accepted");
    return badRequest(); // TODO: return message e.g. "accepting terms are required"
  }

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const firstName = formData.get("firstName") as string;
  const lastName = formData.get("lastName") as string;
  const academicTitle = formData.get("academicTitle") as string;

  // TODO: move to database trigger
  const numberOfProfilesWithSameName = await prismaClient.profile.count({
    where: { firstName, lastName },
  });
  const username = `${generateUsername(firstName, lastName)}${
    numberOfProfilesWithSameName > 0
      ? numberOfProfilesWithSameName.toString()
      : ""
  }`;

  const { user, session, error } = await signUp(email, password, {
    firstName,
    lastName,
    username,
    academicTitle,
    termsAccepted,
  });

  if (error) {
    console.error(error);
    return badRequest(); // TODO: handle and pass error
  }

  return json({ user, session });
};

export default function Register() {
  return (
    <Form method="post">
      <PageBackground imagePath="/images/default_kitchen.jpg" />
      <div className="md:container md:mx-auto relative z-10">
        <div className="flex flex-row -mx-4 justify-end">
          <div className="basis-6/12 px-4 pt-4 pb-24 flex flex-row items-center">
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
        <div className="flex flex-row -mx-4">
          <div className="basis-6/12 px-4"> </div>
          <div className="basis-5/12 px-4">
            <h1 className="mb-8">Neues Profil anlegen</h1>

            <div className="flex flex-row -mx-4 mb-4">
              <div className="basis-6/12 px-4">
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
                />
              </div>
            </div>

            <div className="flex flex-row -mx-4 mb-4">
              <div className="basis-6/12 px-4">
                <InputText id="firstName" label="Vorname" isRequired />
              </div>
              <div className="basis-6/12 px-4">
                <InputText id="lastName" label="Nachname" isRequired />
              </div>
            </div>

            <div className="mb-4">
              <InputText id="email" label="E-Mail" isRequired />
            </div>

            <div className="mb-4">
              <InputPassword id="password" label="Passwort" isRequired />
            </div>

            {/* <div className="mb-4">
              <InputPassword id="" label="Passwort wiederholen" isRequired />
            </div> */}

            <div className="mb-8">
              <div className="form-control checkbox-privacy">
                <label className="label cursor-pointer items-start">
                  <input
                    id="termsAccepted"
                    name="termsAccepted"
                    type="checkbox"
                    className="checkbox checkbox-primary mr-4"
                  />
                  <span className="label-text">
                    Wenn Sie ein Konto erstellen, erklären Sie sich mit unseren
                    Nutzungs-bedingungen, Datenschutzrichtlinien und unseren
                    Standardeinstellungen für Benachrichtigungen einverstanden.
                  </span>
                </label>
              </div>
            </div>
            <div className="mb-8">
              <button type="submit" className="btn btn-primary">
                Account registrieren
              </button>
            </div>
          </div>
        </div>
      </div>
    </Form>
  );
}
