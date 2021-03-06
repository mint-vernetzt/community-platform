import { ActionFunction, json, LoaderFunction, useLoaderData } from "remix";
import { makeDomainFunction } from "remix-domains";
import { Form as RemixForm, FormProps, performMutation } from "remix-forms";
import { SomeZodObject, z } from "zod";
import Input from "~/components/FormElements/Input/Input";
import { updateProfileByUserId } from "~/profile.server";
import {
  authenticator,
  getUserByAccessToken,
  sessionStorage,
  supabaseStrategy,
} from "../../auth.server";
import InputPassword from "../../components/FormElements/InputPassword/InputPassword";
import HeaderLogo from "../../components/HeaderLogo/HeaderLogo";
import PageBackground from "../../components/PageBackground/PageBackground";

const schema = z.object({
  email: z.string().email().min(1),
  password: z.string().min(8),
});

function LoginForm<Schema extends SomeZodObject>(props: FormProps<Schema>) {
  return <RemixForm<Schema> {...props} />;
}

export const Routes = {
  SuccessRedirect: "/",
  FailureRedirect: "/login",
};

type LoaderData = {
  error: Error | null;
};

export const loader: LoaderFunction = async (args) => {
  const { request } = args;

  const url = new URL(request.url);
  const type = url.searchParams.get("type");
  const accessToken = url.searchParams.get("access_token");
  if (accessToken !== null && type === "email_change") {
    const { user, error } = await getUserByAccessToken(accessToken);
    if (error !== null) {
      throw error;
    }
    if (user !== null && user.email !== undefined) {
      const profile = await updateProfileByUserId(user.id, {
        email: user.email,
      });
      await supabaseStrategy.checkSession(request, {
        successRedirect: `/profile/${profile.username}`,
      });
    }
  }

  await supabaseStrategy.checkSession(request, {
    successRedirect: "/explore",
  });

  const session = await sessionStorage.getSession(
    request.headers.get("Cookie")
  );

  const error = session.get(authenticator.sessionErrorKey);

  return json<LoaderData>({ error });
};

const mutation = makeDomainFunction(schema)(async (values) => values);

export const action: ActionFunction = async (args) => {
  const request = args.request.clone();

  const result = await performMutation({
    request,
    schema,
    mutation,
  });

  if (result.success) {
    await authenticator.authenticate("sb", request, {
      successRedirect: Routes.SuccessRedirect,
      failureRedirect: Routes.FailureRedirect,
    });
  }

  return null;
};

export default function Index() {
  const loaderData = useLoaderData<LoaderData>();
  return (
    <LoginForm method="post" schema={schema}>
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
                  <a href="/register" className="text-primary font-bold">
                    Registrieren
                  </a>
                </div>
              </div>
            </div>
            <div className="flex flex-col md:flex-row -mx-4">
              <div className="basis-full md:basis-6/12"> </div>
              <div className="basis-full md:basis-6/12 xl:basis-5/12 px-4">
                <h1 className="mb-8">Anmelden</h1>
                {loaderData.error && (
                  <div className="alert-error p-3 mb-3 text-white">
                    {loaderData.error.message}
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
                <div className="flex flex-row -mx-4 mb-8 items-center">
                  <div className="basis-6/12 px-4">
                    <button type="submit" className="btn btn-primary">
                      Login
                    </button>
                  </div>
                  <div className="basis-6/12 px-4 text-right">
                    <a href="/reset" className="text-primary font-bold">
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
