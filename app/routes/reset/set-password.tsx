import {
  ActionFunction,
  json,
  LoaderFunction,
  useActionData,
  useLoaderData,
} from "remix";
import { InputError, makeDomainFunction } from "remix-domains";
import { Form as RemixForm, formAction } from "remix-forms";
import { z } from "zod";
import { updatePasswordByAccessToken } from "../../auth.server";
import InputPassword from "../../components/FormElements/InputPassword/InputPassword";
import HeaderLogo from "../../components/HeaderLogo/HeaderLogo";
import PageBackground from "../../components/PageBackground/PageBackground";

const schema = z.object({
  password: z.string().min(1, "Bitte ein Passwort eingeben."),
  confirmPassword: z
    .string()
    .min(8, "Passwort wiederholen um Rechtschreibfehler zu vermeiden."),
  accessToken: z
    .string()
    .min(
      1,
      "Bitte über den Bestätigungslink in der E-Mail das Passwort ändern."
    ),
});

type LoaderData = {
  accessToken: string | null;
};

export const loader: LoaderFunction = async (args) => {
  const { request } = args;

  const url = new URL(request.url);

  const accessToken = url.searchParams.get("access_token");

  return json<LoaderData>({ accessToken });
};

const mutation = makeDomainFunction(schema)(async (values) => {
  if (values.password !== values.confirmPassword) {
    throw new InputError(
      "Die eingegebenen Passwörter stimmen nicht überein.",
      "confirmPassword"
    ); // -- Field error
  }
  const { error } = await updatePasswordByAccessToken(
    values.password,
    values.accessToken
  );
  if (error !== null) {
    throw error.message;
  }
  return values;
});

// TODO: Make generic actionData type to reuse in other routes
type ActionData = {
  errors: Record<keyof z.infer<typeof schema>, string[]>;
  values: z.infer<typeof schema>;
};

export const action: ActionFunction = async ({ request }) => {
  return formAction({
    request,
    schema,
    mutation,
    successPath: "/login",
  });
};

export function getAccessToken(
  loaderData: LoaderData,
  actionData?: ActionData
) {
  if (loaderData.accessToken !== null) {
    return loaderData.accessToken;
  }
  if (actionData !== undefined && actionData.values !== undefined) {
    return actionData.values.accessToken;
  }
  return "";
}

export default function SetPassword() {
  const loaderData = useLoaderData<LoaderData>();
  const actionData = useActionData<ActionData>();
  const accessToken = getAccessToken(loaderData, actionData);

  return (
    <>
      <PageBackground imagePath="/images/login_background_image.jpg" />
      <div className="md:container md:mx-auto px-4 relative z-10">
        <div className="flex flex-row -mx-4 justify-end">
          <div className="basis-full md:basis-6/12 px-4 pt-3 pb-24 flex flex-row items-center">
            <div>
              <HeaderLogo />
            </div>
            <div className="ml-auto"></div>
          </div>
        </div>
        <RemixForm method="post" schema={schema}>
          {({ Field, Button, Errors, register }) => (
            <div className="flex flex-col md:flex-row -mx-4">
              <div className="basis-full md:basis-6/12"> </div>
              <div className="basis-full md:basis-6/12 xl:basis-5/12 px-4">
                <h1 className="mb-8">Neues Passwort vergeben</h1>
                <div className="mb-4">
                  <Field name="password" label="Neues Passwort">
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
                </div>

                <div className="mb-8">
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
                </div>

                <Field name="accessToken">
                  {({ Errors }) => (
                    <>
                      <input
                        type="hidden"
                        value={accessToken}
                        {...register("accessToken")}
                      ></input>
                      <Errors />
                    </>
                  )}
                </Field>

                <div className="mb-8">
                  <button type="submit" className="btn btn-primary">
                    Passwort speichern
                  </button>
                </div>
                <Errors />
              </div>
            </div>
          )}
        </RemixForm>
        {/* <div className="flex flex-row -mx-4">
          <div className="basis-6/12 px-4"> </div>
          <div className="basis-5/12 px-4">
          </div>
        </div> */}
      </div>
    </>
  );
}
