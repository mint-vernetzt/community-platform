import {
  ActionFunction,
  json,
  LoaderFunction,
  redirect,
  useActionData,
  useLoaderData,
} from "remix";
import { InputError, makeDomainFunction } from "remix-domains";
import { Form as RemixForm, performMutation } from "remix-forms";
import { z } from "zod";
import { getURLSearchParameterFromURLHash } from "~/lib/utils/url";
import { updatePasswordByAccessToken } from "../../auth.server";
import InputPassword from "../../components/FormElements/InputPassword/InputPassword";
import HeaderLogo from "../../components/HeaderLogo/HeaderLogo";
import PageBackground from "../../components/PageBackground/PageBackground";

const schema = z.object({
  password: z
    .string()
    .min(8, "Dein Passwort muss mindestens 8 Zeichen lang sein."),
  confirmPassword: z
    .string()
    .min(8, "Dein Passwort muss mindestens 8 Zeichen lang sein."),
  accessToken: z
    .string()
    .min(
      1,
      "Bitte nutze den Link aus Deiner E-Mail, um Dein Passwort zu ändern."
    ),
  redirectToAfterSetPassword: z.string().optional(),
});

type LoaderData = {
  accessToken: string | null;
  redirectToAfterSetPassword: string | null;
};

export const loader: LoaderFunction = async (args) => {
  const { request } = args;

  const url = new URL(request.url);
  const accessToken = url.searchParams.get("access_token");
  const redirectToAfterSetPassword = url.searchParams.get("redirect_to");

  return json<LoaderData>({ accessToken, redirectToAfterSetPassword });
};

const mutation = makeDomainFunction(schema)(async (values) => {
  if (values.password !== values.confirmPassword) {
    throw new InputError(
      "Deine Passwörter stimmen nicht überein.",
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
  const result = await performMutation({
    request,
    schema,
    mutation,
  });

  if (result.success) {
    return redirect(result.data.redirectToAfterSetPassword || "/login");
  }

  return result;
};

export function getAccessToken(
  urlSearchParameter: URLSearchParams | null,
  actionData?: ActionData
) {
  if (urlSearchParameter !== null) {
    const accessToken = urlSearchParameter.get("access_token");
    if (accessToken !== null) {
      return accessToken;
    }
  }
  if (actionData !== undefined && actionData.values !== undefined) {
    return actionData.values.accessToken;
  }
  return "";
}

export default function SetPassword() {
  const loaderData = useLoaderData<LoaderData>();
  const actionData = useActionData<ActionData>();

  const urlSearchParameter = getURLSearchParameterFromURLHash();
  const accessToken = getAccessToken(urlSearchParameter, actionData);

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
        <RemixForm
          method="post"
          schema={schema}
          hiddenFields={["redirectToAfterSetPassword"]}
          values={{
            redirectToAfterSetPassword: loaderData.redirectToAfterSetPassword,
          }}
        >
          {({ Field, Button, Errors, register }) => (
            <div className="flex flex-col md:flex-row -mx-4">
              <div className="basis-full md:basis-6/12"> </div>
              <div className="basis-full md:basis-6/12 xl:basis-5/12 px-4">
                <h1 className="mb-8">Neues Passwort vergeben</h1>
                <Field name="redirectToAfterSetPassword" />
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
      </div>
    </>
  );
}
