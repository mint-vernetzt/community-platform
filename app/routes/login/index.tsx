import {
  ActionFunction,
  json,
  LoaderFunction,
  redirect,
} from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { createServerClient } from "@supabase/auth-helpers-remix";
import { makeDomainFunction } from "remix-domains";
import {
  Form as RemixForm,
  FormProps,
  PerformMutation,
  performMutation,
} from "remix-forms";
import { Schema, SomeZodObject, z } from "zod";
import Input from "~/components/FormElements/Input/Input";
import { getSessionUser } from "../../auth.server";
import InputPassword from "../../components/FormElements/InputPassword/InputPassword";
import HeaderLogo from "../../components/HeaderLogo/HeaderLogo";
import PageBackground from "../../components/PageBackground/PageBackground";

const schema = z.object({
  email: z
    .string()
    .email("Bitte gib eine gültige E-Mail-Adresse ein.")
    .min(1, "Bitte gib eine gültige E-Mail-Adresse ein."),
  password: z
    .string()
    .min(8, "Dein Passwort muss mindestens 8 Zeichen lang sein."),
  loginSuccessRedirect: z.string().optional(),
  loginFailureRedirect: z.string().optional(),
});

function LoginForm<Schema extends SomeZodObject>(props: FormProps<Schema>) {
  return <RemixForm<Schema> {...props} />;
}

type LoaderData = {
  loginSuccessRedirect?: string;
  loginFailureRedirect?: string;
  registerRedirect: string;
  resetPasswordRedirect: string;
};

export const loader: LoaderFunction = async (args) => {
  const { request } = args;

  const response = new Response();

  const supabaseClient = createServerClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY,
    {
      request,
      response,
    }
  );

  const sessionUser = await getSessionUser(supabaseClient);

  if (sessionUser !== null) {
    return redirect("/explore", { headers: response.headers });
  }

  const url = new URL(request.url);

  // TODO: Rework email change
  // const type = url.searchParams.get("type");
  // const accessToken = url.searchParams.get("access_token");
  // if (accessToken !== null && type === "email_change") {
  //   const { user, error } = await getUserByAccessToken(accessToken);
  //   if (error !== null) {
  //     throw error;
  //   }
  //   if (user !== null && user.email !== undefined) {
  //     const profile = await updateProfileByUserId(user.id, {
  //       email: user.email,
  //     });
  //     await supabaseStrategy.checkSession(request, {
  //       successRedirect: `/profile/${profile.username}`,
  //     });
  //   }
  // }

  let loginSuccessRedirect;
  let loginFailureRedirect;
  const loginRedirect = url.searchParams.get("login_redirect");
  if (loginRedirect !== null) {
    loginSuccessRedirect = loginRedirect;
    // TODO: Check if we need the failure redirect
    loginFailureRedirect = `/login?login_redirect=${loginRedirect}`;
  }
  // Those redirects should be obsolete as all confirmation links should lead to the landing page
  // There they get distibuted depending on its type
  const registerRedirect = `/register?redirect_to=${request.url}`;
  const absoluteSetPasswordURL =
    url.protocol +
    "//" +
    url.host +
    `/reset/set-password?redirect_to=${request.url}`;
  const resetPasswordRedirect = `/reset?redirect_to=${absoluteSetPasswordURL}`;

  return json<LoaderData>(
    {
      loginSuccessRedirect,
      loginFailureRedirect,
      registerRedirect,
      resetPasswordRedirect,
    },
    { headers: response.headers }
  );
};

// TODO: Rework login
// const defaultRedirect = {
//   loginSuccessRedirect: "/",
//   loginFailureRedirect: "/login",
// };

const mutation = makeDomainFunction(schema)(async (values) => values);

export type ActionData = PerformMutation<
  z.infer<Schema>,
  z.infer<typeof schema>
>;

export const action: ActionFunction = async ({ request }) => {
  const response = new Response();

  createServerClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY, {
    request,
    response,
  });
  const clonedRequest = request.clone();

  const result = await performMutation({
    request: clonedRequest,
    schema,
    mutation,
  });

  // TODO: Rework login -> Maybe move to mutation
  // Return error when login failed
  // if (result.success) {
  //   await authenticator.authenticate("sb", request, {
  //     successRedirect:
  //       result.data.loginSuccessRedirect ||
  //       defaultRedirect.loginSuccessRedirect,
  //     failureRedirect:
  //       result.data.loginFailureRedirect ||
  //       defaultRedirect.loginFailureRedirect,
  //   });
  // }

  return json<ActionData>(result, { headers: response.headers });
};

export default function Index() {
  const loaderData = useLoaderData<LoaderData>();

  return (
    <LoginForm
      method="post"
      schema={schema}
      hiddenFields={["loginSuccessRedirect", "loginFailureRedirect"]}
      values={{
        loginSuccessRedirect: loaderData.loginSuccessRedirect,
        loginFailureRedirect: loaderData.loginFailureRedirect,
      }}
    >
      {({ Field, Button, Errors, register }) => (
        <>
          <PageBackground imagePath="/images/login_background_image.jpg" />
          <div className="md:container md:mx-auto px-4 relative z-10">
            <div className="flex flex-row -mx-4 justify-end">
              <div className="basis-full md:basis-6/12 px-4 pt-4 pb-24 flex flex-row items-center">
                <div className="">
                  <HeaderLogo />
                </div>
                <div className="ml-auto">
                  Noch kein Mitglied?{" "}
                  <a
                    href={loaderData.registerRedirect}
                    className="text-primary font-bold"
                  >
                    Registrieren
                  </a>
                </div>
              </div>
            </div>
            <div className="flex flex-col md:flex-row -mx-4">
              <div className="basis-full md:basis-6/12"> </div>
              <div className="basis-full md:basis-6/12 xl:basis-5/12 px-4">
                <h1 className="mb-8">Anmelden</h1>
                {/* TODO: Rework login: Use error from actionData result */}
                {loaderData.error && (
                  <div className="alert-error p-3 mb-3 text-white">
                    Deine Anmeldedaten (E-Mail oder Passwort) sind nicht
                    korrekt. Bitte überprüfe Deine Eingaben.
                  </div>
                )}
                <div className="mb-4">
                  <Field name="email" label="E-Mail">
                    {({ Errors }) => (
                      <>
                        <Input
                          id="email"
                          label="E-Mail"
                          {...register("email")}
                        />
                        <Errors />
                      </>
                    )}
                  </Field>
                </div>
                <div className="mb-10">
                  <Field name="password" label="Passwort">
                    {({ Errors }) => (
                      <>
                        <InputPassword
                          id="password"
                          label="Passwort"
                          {...register("password")}
                        />
                        <Errors />
                      </>
                    )}
                  </Field>
                </div>
                <Field name="loginSuccessRedirect" />
                <Field name="loginFailureRedirect" />
                <div className="flex flex-row -mx-4 mb-8 items-center">
                  <div className="basis-6/12 px-4">
                    <button type="submit" className="btn btn-primary">
                      Login
                    </button>
                  </div>
                  <div className="basis-6/12 px-4 text-right">
                    <a
                      href={loaderData.resetPasswordRedirect}
                      className="text-primary font-bold"
                    >
                      Passwort vergessen?
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </LoginForm>
  );
}
