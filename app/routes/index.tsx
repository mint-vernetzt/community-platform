import type { ActionArgs, LoaderArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import {
  Link,
  useLoaderData,
  useSearchParams,
  useSubmit,
} from "@remix-run/react";
import type { KeyboardEvent } from "react";
import React from "react";
import { makeDomainFunction } from "remix-domains";
import type { FormProps } from "remix-forms";
import { Form, performMutation } from "remix-forms";
import type { SomeZodObject } from "zod";
import { z } from "zod";
import {
  createAuthClient,
  getSessionUser,
  setSession,
  signIn,
} from "~/auth.server";
import Input from "~/components/FormElements/Input/Input";
import InputPassword from "~/components/FormElements/InputPassword/InputPassword";
import { getProfileByUserId } from "~/profile.server";
import { getProfileByEmailCaseInsensitive } from "./organization/$slug/settings/utils.server";
import {
  getEventCount,
  getOrganizationCount,
  getProfileCount,
} from "./utils.server";

const schema = z.object({
  email: z
    .string()
    .email("Bitte gib eine gültige E-Mail-Adresse ein.")
    .min(1, "Bitte gib eine gültige E-Mail-Adresse ein."),
  password: z
    .string()
    .min(8, "Dein Passwort muss mindestens 8 Zeichen lang sein."),
  loginRedirect: z.string().optional(),
});

const environmentSchema = z.object({
  authClient: z.unknown(),
  // authClient: z.instanceof(SupabaseClient),
});

function LoginForm<Schema extends SomeZodObject>(props: FormProps<Schema>) {
  return <Form<Schema> {...props} />;
}

export const loader = async (args: LoaderArgs) => {
  const { request } = args;

  const response = new Response();

  const authClient = createAuthClient(request, response);

  const url = new URL(request.url);
  const urlSearchParams = new URLSearchParams(url.searchParams);
  const loginRedirect = urlSearchParams.get("login_redirect");
  const accessToken = urlSearchParams.get("access_token");
  const refreshToken = urlSearchParams.get("refresh_token");
  const type = urlSearchParams.get("type");

  if (accessToken !== null && refreshToken !== null) {
    // This automatically logs in the user
    // Throws error on invalid refreshToken, accessToken combination
    const { user: sessionUser } = await setSession(
      authClient,
      accessToken,
      refreshToken
    );
    if (type === "sign_up" && loginRedirect === null && sessionUser !== null) {
      // Default redirect to profile of sessionUser after sign up confirmation
      const profile = await getProfileByUserId(sessionUser.id, ["username"]);
      return redirect(`/profile/${profile.username}`, {
        headers: response.headers,
      });
    }
  }

  const sessionUser = await getSessionUser(authClient);

  if (sessionUser !== null) {
    if (loginRedirect !== null) {
      return redirect(loginRedirect, { headers: response.headers });
    } else {
      // Default redirect to profile of sessionUser after sign up confirmation
      const profile = await getProfileByUserId(sessionUser.id, ["username"]);
      return redirect(`/profile/${profile.username}`, {
        headers: response.headers,
      });
    }
  }

  const profileCount = await getProfileCount();
  const organizationCount = await getOrganizationCount();
  const eventCount = await getEventCount();

  return json(
    {
      profileCount,
      organizationCount,
      eventCount,
    },
    { headers: response.headers }
  );
};

const mutation = makeDomainFunction(
  schema,
  environmentSchema
)(async (values, environment) => {
  const { error } = await signIn(
    environment.authClient,
    values.email,
    values.password
  );

  if (error !== null) {
    if (error.message === "Invalid login credentials") {
      throw "Deine Anmeldedaten (E-Mail oder Passwort) sind nicht korrekt. Bitte überprüfe Deine Eingaben.";
    } else {
      throw error.message;
    }
  }

  return { ...values };
});

export const action = async ({ request }: ActionArgs) => {
  const response = new Response();

  const authClient = createAuthClient(request, response);

  const result = await performMutation({
    request,
    schema,
    mutation,
    environment: { authClient: authClient },
  });

  if (result.success) {
    if (result.data.loginRedirect) {
      return redirect(result.data.loginRedirect, {
        headers: response.headers,
      });
    } else {
      // Default redirect after login
      const profile = await getProfileByEmailCaseInsensitive(result.data.email);
      if (profile !== null) {
        return redirect(`/profile/${profile.username}`, {
          headers: response.headers,
        });
      } else {
        return redirect(`/explore`, { headers: response.headers });
      }
    }
  }

  return json(result, { headers: response.headers });
};

export default function Index() {
  const submit = useSubmit();
  const loaderData = useLoaderData<typeof loader>();
  const [urlSearchParams] = useSearchParams();
  const loginRedirect = urlSearchParams.get("login_redirect");
  const handleKeyPress = (event: KeyboardEvent<HTMLFormElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      submit(event.currentTarget);
    }
  };

  // Access point for confirmation links
  // Must be called on the client because hash parameters can only be accessed from the client
  React.useEffect(() => {
    const urlHashParams = new URLSearchParams(window.location.hash.slice(1));
    const type = urlHashParams.get("type");
    const accessToken = urlHashParams.get("access_token");
    const refreshToken = urlHashParams.get("refresh_token");
    const loginRedirect = urlSearchParams.get("login_redirect");
    const error = urlHashParams.get("error");
    const errorCode = urlHashParams.get("error_code");
    const errorDescription = urlHashParams.get("error_description");

    if (accessToken !== null && refreshToken !== null) {
      if (type === "signup") {
        submit(
          loginRedirect
            ? {
                login_redirect: loginRedirect,
                access_token: accessToken,
                refresh_token: refreshToken,
                type: type,
              }
            : {
                access_token: accessToken,
                refresh_token: refreshToken,
                type: type,
              },
          {
            action: "/",
          }
        );
        return;
      }
      if (type === "recovery") {
        submit(
          loginRedirect
            ? {
                login_redirect: loginRedirect,
                access_token: accessToken,
                refresh_token: refreshToken,
              }
            : { access_token: accessToken, refresh_token: refreshToken },
          {
            action: "/reset/set-password",
          }
        );
        return;
      }
      if (type === "email_change") {
        submit(
          {
            access_token: accessToken,
            refresh_token: refreshToken,
            type: type,
          },
          {
            action: "/reset/set-email",
          }
        );
        return;
      }
    }
    if (error !== null || errorCode !== null || errorDescription !== null) {
      alert(
        `Es ist ein Fehler mit dem Bestätigungslink aufgetreten. Das tut uns Leid. Bitte wende dich mit den folgenden Daten an den Support:\n${error}\n${errorDescription}\n${errorCode}`
      );
      return;
    }

    // // Redirect when user is logged in
    // // Remove the else case when the landing page is implemented in this route
    // if (loaderData.hasSession) {
    //   submit(null, { action: "/explore?reason=1" });
    //   return;
    // }
  }, [submit /*loaderData.hasSession*/, , urlSearchParams]);

  return (
    <>
      <div>Willkommen in Deiner MINT-Community</div>
      <div>
        Entdecke auf der MINTvernetzt Community Plattform andere
        MINT-Akteur:innen, Organisationen und MINT-Veranstaltungen und lass Dich
        für Deine Arbeit inspirieren.
      </div>
      <LoginForm
        method="post"
        schema={schema}
        hiddenFields={["loginRedirect"]}
        values={{
          loginRedirect: loginRedirect || undefined,
        }}
        onKeyDown={handleKeyPress}
      >
        {({ Field, Button, Errors, register }) => (
          <>
            <Errors className="alert-error p-3 mb-3 text-white" />

            <Field name="email" label="E-Mail">
              {({ Errors }) => (
                <>
                  <Input id="email" label="E-Mail" {...register("email")} />
                  <Errors />
                </>
              )}
            </Field>
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

            <Field name="loginRedirect" />

            <button type="submit">Login</button>
          </>
        )}
      </LoginForm>
      <Link
        to={`/reset${loginRedirect ? `?login_redirect=${loginRedirect}` : ""}`}
      >
        Passwort vergessen?
      </Link>
      <div>Noch kein Mitglied?</div>
      <Link
        to={`/register${
          loginRedirect ? `?login_redirect=${loginRedirect}` : ""
        }`}
      >
        Registrieren
      </Link>
      <div>
        Erstelle Profilseiten für Dich, für Deine Organisation und lege Projekte
        oder Veranstaltungen an.
      </div>
      <div>Miteinander Bildung gestalten</div>
      <div>
        Die Community-Plattform unterstützt Dich darin, Dich mit anderen
        MINT-Akteur:innen und -Organisationen zu vernetzen, Inspiration oder
        Expert:innen zu konkreten Themen in Deiner Umgebung zu finden oder
        spannende Veranstaltungen zu entdecken. Hier wird Zukunft gestaltet.
        Schön, dass Du dabei bist.
      </div>
      <Link
        to={`/register${
          loginRedirect ? `?login_redirect=${loginRedirect}` : ""
        }`}
      >
        Jetzt registrieren
      </Link>
      <div>WIE UNSERE COMMUNITY WÄCHST</div>
      <div>{loaderData.profileCount} Profile</div>
      <div>{loaderData.organizationCount} Organisationen</div>
      <div>{loaderData.eventCount} Veranstaltungen</div>
      <div>Werde auch Du Teil unserer ständig wachsenden MINT-Community.</div>
      <div>MEHR ZUR INITIATIVE ERFAHREN</div>
      <div>
        Die MINTvernetzt Community-Plattform ist eines unserer Projekte, um die
        MINT-Community zu stärken. Erfahre mehr über die Arbeit von
        MINTvernetzt, der Service- und Anlaufstelle für MINT-Akteur:innen in
        Deutschland auf unserer Website.
      </div>
      <a href="https://mint-vernetzt.de/" target="_blank" rel="noreferrer">
        MINTvernetzt Website besuchen
      </a>
    </>
  );
}
