import { ActionFunction, useActionData } from "remix";
import { resetPassword } from "../../auth.server";
import InputText from "../../components/FormElements/InputText/InputText";
import HeaderLogo from "../../components/HeaderLogo/HeaderLogo";
import PageBackground from "../../components/PageBackground/PageBackground";
import { Form as RemixForm, performMutation } from "remix-forms";
import { z } from "zod";
import { makeDomainFunction } from "remix-domains";

const schema = z.object({
  email: z
    .string()
    .email("Ungültige E-Mail.")
    .min(1, "Bitte eine E-Mail eingeben."),
});

const mutation = makeDomainFunction(schema)(async (values) => {
  const { error } = await resetPassword(values.email);

  // ignore user with email not exist -> Why?
  if (error !== null && error.message !== "User not found") {
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

export default function Index() {
  // TODO: Declare type
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
            <div className="ml-auto"></div>
          </div>
        </div>
        <div className="flex flex-col md:flex-row -mx-4">
          <div className="basis-full md:basis-6/12"> </div>
          <div className="basis-full md:basis-6/12 xl:basis-5/12 px-4">
            <h1 className="mb-8">Passwort zurücksetzen</h1>
            {actionData !== undefined && actionData.success ? (
              <>
                <p className="mb-4">
                  Um das Passwort zurückzusetzen, bitte auf den Bestätigungslink
                  drücken, der an <b>{actionData.data.email}</b> versendet
                  wurde. {/*TODO: better text*/}
                </p>
              </>
            ) : (
              <RemixForm method="post" schema={schema}>
                {({ Field, Button, Errors, register }) => (
                  <>
                    <p className="mb-4">
                      Geben Sie die E-Mail-Adresse ein, die Sie bei Ihrer
                      Anmeldung verwendet haben, und wir senden Ihnen
                      Anweisungen zum Zurücksetzen Ihres Passworts.
                    </p>

                    <div className="mb-8">
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

                    <div className="mb-8">
                      <button type="submit" className="btn btn-primary">
                        Passwort zurücksetzen
                      </button>
                    </div>
                  </>
                )}
              </RemixForm>
            )}
          </div>
        </div>
        {/* <div className="flex flex-row -mx-4 mb-8 items-center">
          <div className="basis-6/12 px-4"> </div>
          <div className="basis-5/12 px-4"></div>
        </div> */}
      </div>
    </>
  );
}
