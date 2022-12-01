import {
  ActionFunction,
  json,
  LoaderFunction,
  redirect,
} from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import {
  createServerClient,
  SupabaseClient,
} from "@supabase/auth-helpers-remix";
import { InputError, makeDomainFunction } from "remix-domains";
import {
  Form as RemixForm,
  PerformMutation,
  performMutation,
} from "remix-forms";
import { Schema, z } from "zod";
import { updatePassword } from "../../auth.server";
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

  // TODO: Check if we still need the access token
  accessToken: z
    .string()
    .min(
      1,
      "Bitte nutze den Link aus Deiner E-Mail, um Dein Passwort zu ändern."
    ),
  redirectToAfterSetPassword: z.string().optional(),
});

const environmentSchema = z.object({
  supabaseClient: z.instanceof(SupabaseClient),
});

type LoaderData = {
  accessToken: string | null;
  redirectToAfterSetPassword: string | null;
};

export const loader: LoaderFunction = async (args) => {
  const { request } = args;
  const response = new Response();

  createServerClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY, {
    request,
    response,
  });

  // TODO: Rework reset password -> Check redirects
  // reset -> set-password -> login -> either default or event page
  // Check if we still need the access token
  const url = new URL(request.url);
  const accessToken = url.searchParams.get("access_token");
  const redirectToAfterSetPassword = url.searchParams.get("redirect_to");

  return json<LoaderData>(
    { accessToken, redirectToAfterSetPassword },
    { headers: response.headers }
  );
};

const mutation = makeDomainFunction(
  schema,
  environmentSchema
)(async (values, environment) => {
  if (values.password !== values.confirmPassword) {
    throw new InputError(
      "Deine Passwörter stimmen nicht überein.",
      "confirmPassword"
    ); // -- Field error
  }
  const { error } = await updatePassword(
    environment.supabaseClient,
    values.password
  );
  if (error !== null) {
    throw error.message;
  }
  return values;
});

type ActionData = PerformMutation<z.infer<Schema>, z.infer<typeof schema>>;

export const action: ActionFunction = async ({ request }) => {
  const response = new Response();

  const supabaseClient = createServerClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY,
    {
      request,
      response,
    }
  );
  const result = await performMutation({
    request,
    schema,
    mutation,
    environment: { supabaseClient: supabaseClient },
  });

  if (result.success) {
    // TODO: Rework reset password -> Check redirects
    // reset -> set-password -> login -> either default or event page
    return redirect(result.data.redirectToAfterSetPassword || "/login", {
      headers: response.headers,
    });
  }

  return json<ActionData>(result, { headers: response.headers });
};

// Check if we still need the access token
// export function getAccessToken(
//   urlSearchParameter: URLSearchParams | null,
//   actionData?: ActionData
// ) {
//   if (urlSearchParameter !== null) {
//     const accessToken = urlSearchParameter.get("access_token");
//     if (accessToken !== null) {
//       return accessToken;
//     }
//   }
//   if (actionData !== undefined && actionData.values !== undefined) {
//     return actionData.values.accessToken;
//   }
//   return "";
// }

export default function SetPassword() {
  const loaderData = useLoaderData<LoaderData>();

  // Check if we still need the access token
  // const actionData = useActionData<ActionData>();
  // const urlSearchParameter = getURLSearchParameterFromURLHash();
  // const accessToken = getAccessToken(urlSearchParameter, actionData);

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

                {/* Check if we still need the access token */}
                {/* <Field name="accessToken">
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
                </Field> */}

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
