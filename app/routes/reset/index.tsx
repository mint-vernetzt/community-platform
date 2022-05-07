import { ActionFunction, Form, json, useActionData } from "remix";
import { badRequest, serverError } from "remix-utils";
import { resetPassword } from "../../auth.server";
import InputText from "../../components/FormElements/InputText/InputText";
import HeaderLogo from "../../components/HeaderLogo/HeaderLogo";
import PageBackground from "../../components/PageBackground/PageBackground";
import { validateFormData } from "../../utils";

type ActionData = {
  email: string;
  message: string;
};

export const action: ActionFunction = async (args) => {
  const { request } = args;

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch (error) {
    throw badRequest({ message: "Invalid Form Data." });
  }

  const isFormDataValid = validateFormData(["email"], formData);

  if (!isFormDataValid) {
    console.error("Invalid Form Data.");
    throw badRequest({ message: "Invalid Form Data." }); // TODO: return empty fields to highlight
  }

  const email = formData.get("email") as string;
  const { error } = await resetPassword(email);

  // ignore user with email not exist
  if (error && error.message !== "User not found") {
    console.error(error.message);
    throw serverError({ message: error.message });
  }

  return json<ActionData>({ email, message: "Reset password request sent." });
};

export default function Index() {
  const actionData = useActionData<ActionData>();

  return (
    <Form method="post" action="/reset?index">
      <PageBackground imagePath="/images/default_kitchen.jpg" />
      <div className="md:container md:mx-auto px-4 relative z-10">
        <div className="flex flex-row -mx-4 justify-end">
          <div className="basis-full md:basis-6/12 px-4 pt-4 pb-24 flex flex-row items-center">
            <div className="">
              <HeaderLogo />
            </div>
            <div className="ml-auto"></div>
          </div>
        </div>
        <div className="flex flex-col md:flex-row -mx-4">
          <div className="basis-full md:basis-6/12"> </div>
          <div className="basis-full md:basis-6/12 xl:basis-5/12 px-4">
            <h1 className="mb-8">Passwort zurücksetzen</h1>
            {actionData !== undefined ? (
              <>
                <p className="mb-4">
                  Das Passwort für <b>{actionData.email}</b> wurde
                  zurückgesetzt. {/*TODO: better text*/}
                </p>
              </>
            ) : (
              <>
                <p className="mb-4">
                  Geben Sie die E-Mail-Adresse ein, die Sie bei Ihrer Anmeldung
                  verwendet haben, und wir senden Ihnen Anweisungen zum
                  Zurücksetzen Ihres Passworts.
                </p>

                <div className="mb-8">
                  <InputText id="email" label="E-Mail" />
                </div>

                <div className="mb-8">
                  <button type="submit" className="btn btn-primary">
                    Passwort zurücksetzen
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
        {/* <div className="flex flex-row -mx-4 mb-8 items-center">
          <div className="basis-6/12 px-4"> </div>
          <div className="basis-5/12 px-4"></div>
        </div> */}
      </div>
    </Form>
  );
}
