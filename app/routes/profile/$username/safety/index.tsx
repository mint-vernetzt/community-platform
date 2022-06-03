import { InputError } from "remix-domains";

import {
  ActionFunction,
  Form,
  json,
  Link,
  LoaderFunction,
  useActionData,
  useLoaderData,
  useParams,
  useTransition,
} from "remix";
import { badRequest, forbidden } from "remix-utils";

import { getProfileByUserId, updateProfileByUserId } from "~/profile.server";
import {
  authenticator,
  getUser,
  sessionStorage,
  updatePassword,
} from "~/auth.server";
import Input from "~/components/FormElements/Input/Input";
import HeaderLogo from "~/components/HeaderLogo/HeaderLogo";
import { Profile } from "@prisma/client";
import { getInitials } from "~/lib/profile/getInitials";
import { z } from "zod";
import { makeDomainFunction } from "remix-domains";
import { Form as RemixForm, performMutation } from "remix-forms";
import InputPassword from "~/components/FormElements/InputPassword/InputPassword";
import { supabaseClient } from "~/supabase";

const emailSchema = z.object({
  email: z
    .string()
    .min(1, "Bitte eine E-Mail eingeben.")
    .email("Ungültige E-Mail"),
  confirmEmail: z
    .string()
    .min(1, "E-Mail wiederholen um Rechtschreibfehler zu vermeiden.")
    .email("Ungültige E-Mail"),
  submittedForm: z.string(),
});

const passwordSchema = z.object({
  password: z.string().min(1, "Bitte ein Passwort eingeben."),
  confirmPassword: z
    .string()
    .min(1, "Passwort wiederholen um Rechtschreibfehler zu vermeiden."),
  submittedForm: z.string(),
});

export async function handleAuthorization(request: Request, username: string) {
  if (typeof username !== "string" || username === "") {
    throw badRequest({ message: "username must be provided" });
  }
  const sessionUser = await getUser(request);

  if (sessionUser === null || sessionUser.user_metadata.username !== username) {
    throw forbidden({ message: "not allowed" });
  }

  return sessionUser;
}

type LoaderData = {
  profile: Pick<Profile, "email" | "firstName" | "lastName">;
  isUserInEmailChangeProcess: boolean;
};

export const loader: LoaderFunction = async ({ request, params }) => {
  const username = params.username ?? "";
  const sessionUser = await handleAuthorization(request, username);

  const profile = await getProfileByUserId(sessionUser.id, [
    "email",
    "firstName",
    "lastName",
  ]);
  if (profile === null) {
    throw new Error(
      `PrismaClient can't find a profile for the user "${username}"`
    );
  }
  // TODO: This only works because the meta data is changed before email confirmation is finished (unwanted behaviour?)
  // What is the difference between the three fields profile.email, sessionUser.email, sessionUser.user_metadata.email (Single source of truth)
  // In addition a new session has to be started (log out/in) to see the change (refresh session? Log out user after second confirmation?)
  const isUserInEmailChangeProcess =
    sessionUser.email !== sessionUser.user_metadata.email;

  return json({ profile, isUserInEmailChangeProcess });
};

const passwordMutation = makeDomainFunction(passwordSchema)(async (values) => {
  if (values.confirmPassword !== values.password) {
    throw new InputError(
      "Die eingegebenen Passwörter stimmen nicht überein",
      "confirmPassword"
    ); // -- Field error
  }
  // TODO: What are the password restrictions? length, used chars, etc... ?

  return values;
});

const emailMutation = makeDomainFunction(emailSchema)(async (values) => {
  if (values.confirmEmail !== values.email) {
    throw new InputError(
      "Die eingegebenen E-Mails stimmen nicht überein",
      "confirmEmail"
    ); // -- Field error
  }
  return values;
});

export const action: ActionFunction = async ({ request, params }) => {
  const username = params.username ?? "";
  const sessionUser = await handleAuthorization(request, username);

  const requestClone = request.clone(); // we need to clone request, because unpack formData can be used only once
  const formData = await requestClone.formData();
  const submittedForm = formData.get("submittedForm");
  const schema = submittedForm === "changeEmail" ? emailSchema : passwordSchema;
  const mutation =
    submittedForm === "changeEmail" ? emailMutation : passwordMutation;

  const mutationResult = await performMutation({
    request,
    schema,
    mutation, // TODO: Fix later
  });
  if (!mutationResult.success) {
    return mutationResult;
  }

  // TODO:
  // - supabaseclient can not be used in the mutation function (Isn't the mutation function supposed for such operations?

  const session = await sessionStorage.getSession(
    request.headers.get("Cookie")
  );
  let { access_token: accessToken } = session.get(authenticator.sessionKey);
  if (!accessToken) {
    throw forbidden({ message: "not allowed" }); // TODO: maybe other message
  }
  supabaseClient.auth.setAuth(accessToken);

  const email = formData.get("email");
  if (email !== null) {
    // TODO: Outsource below code to auth.server.tsx
    const { user, error } = await supabaseClient.auth.update({
      email: email as string,
      data: { email: email as string },
    });
    if (error !== null) {
      throw error;
    }
    // TODO: What if the user does not confirm the email change? The profile table is still updated with the new email
    // -> Update the profile email at the end point of the second confirmation link
    await updateProfileByUserId(sessionUser.id, { email: email as string });
  }

  const password = formData.get("password");
  if (password !== null) {
    const { error } = await updatePassword(accessToken, password as string);
    if (error !== null) {
      throw error;
    }
  }

  return mutationResult;
};

export default function Index() {
  const { username } = useParams();
  const transition = useTransition();
  const { profile, isUserInEmailChangeProcess } = useLoaderData<LoaderData>();

  const initials = getInitials(profile);

  // TODO: Declare type
  const actionData = useActionData();

  let showPasswordFeedback = false,
    showEmailFeedback = false;
  if (actionData !== undefined) {
    showPasswordFeedback =
      actionData.success && actionData.data.password !== undefined;
    showEmailFeedback =
      actionData.success && actionData.data.email !== undefined;
  }

  return (
    <>
      <header className="shadow-md mb-8">
        <div className="container mx-auto px-4 relative z-11">
          <div className="basis-full md:basis-6/12 px-4 pt-3 pb-3 flex flex-row items-center">
            <div>
              <Link to="/explore">
                <HeaderLogo />
              </Link>
            </div>

            <div className="ml-auto">
              <div className="dropdown dropdown-end">
                <label tabIndex={0} className="btn btn-primary w-10 h-10">
                  {initials}
                </label>
                <ul
                  tabIndex={0}
                  className="dropdown-content menu p-2 shadow bg-base-100 rounded-box w-52"
                >
                  <li>
                    <Link to={`/profile/${username}`}>Profil anzeigen</Link>
                  </li>
                  <li>
                    <Link to={`/profile/${username}/edit`}>
                      Profil bearbeiten
                    </Link>
                  </li>
                  <li>
                    <Form action="/logout?index" method="post">
                      <button type="submit" className="w-full text-left">
                        Logout
                      </button>
                    </Form>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </header>
      <fieldset disabled={transition.state === "submitting"}>
        <div className="container mx-auto px-4 relative z-10 pb-44">
          <div className="flex flex-col lg:flex-row -mx-4">
            {/* refactor menu */}
            <div className="md:flex md:flex-row px-4 pt-10 lg:pt-0">
              <div className="basis-4/12 px-4">
                <div className="px-4 py-8 lg:p-8 pb-15 rounded-lg bg-neutral-200 shadow-lg relative mb-8">
                  <h3 className="font-bold mb-7">Profil bearbeiten</h3>
                  {/*TODO: add missing pages*/}
                  <ul>
                    <li>
                      <a
                        href={`/profile/${username}/edit`}
                        className="block text-3xl  text-neutral-500 hover:text-primary py-3"
                      >
                        Persönliche Daten
                      </a>
                    </li>
                    <li>
                      <a
                        href={`/profile/${username}/safety`}
                        className="block text-3xl text-primary py-3"
                      >
                        Login und Sicherheit
                      </a>
                    </li>
                  </ul>

                  <hr className="border-neutral-400 my-4 lg:my-8" />

                  <div className="">
                    {/* <a
                          href="/#"
                          className="block text-3xl text-neutral-500 hover:text-primary py-3"
                        > */}
                    <span className="block text-3xl text-neutral-500  py-3">
                      Profil löschen
                    </span>
                    {/* </a> */}
                  </div>
                </div>
              </div>

              <div className="basis-6/12 px-4">
                <h1 className="mb-8">Login und Sicherheit</h1>

                <h4 className="mb-4 font-semibold">Passwort ändern</h4>

                <p className="mb-8">
                  Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed
                  diam nonumy eirmod tempor invidunt ut labore et dolore magna
                  aliquyam erat, sed diam voluptua.
                </p>
                <input type="hidden" name="action" value="changePassword" />

                <RemixForm method="post" schema={passwordSchema}>
                  {({ Field, Button, Errors, register }) => (
                    <>
                      <Field
                        name="password"
                        label="Neues Passwort"
                        className="mb-4"
                      >
                        {({ Errors }) => (
                          <>
                            <InputPassword
                              id="password"
                              label="Neues Passwort *"
                              {...register("password")}
                            />
                            <Errors />
                          </>
                        )}
                      </Field>

                      <Field name="confirmPassword" label="Wiederholen">
                        {({ Errors }) => (
                          <>
                            <InputPassword
                              id="confirmPassword"
                              label="Passwort wiederholen *"
                              {...register("confirmPassword")}
                            />
                            <Errors />
                          </>
                        )}
                      </Field>
                      <Field name="submittedForm" label="Wiederholen">
                        {({ Errors }) => (
                          <>
                            <input
                              type="hidden"
                              value="changePassword"
                              {...register("submittedForm")}
                            ></input>
                            <Errors />
                          </>
                        )}
                      </Field>

                      <button type="submit" className="btn btn-primary mt-8">
                        Passwort ändern
                      </button>
                      {showPasswordFeedback ? (
                        <div>Passwort wurde erfolgreich geändert!</div>
                      ) : null}
                    </>
                  )}
                </RemixForm>
                {/*<Field name="submitButton" label="Passwort ändern">
                      {({ Errors }) => (
                        <>
                          <Errors />
                        </>
                      )}
                      </Field>*/}
                <hr className="border-neutral-400 my-10 lg:my-16" />

                <h4 className="mb-4 font-semibold">E-Mail ändern</h4>

                <p className="mb-8">
                  Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed
                  diam nonumy eirmod tempor invidunt ut labore et dolore magna
                  aliquyam erat, sed diam voluptua.
                </p>
                <RemixForm method="post" schema={emailSchema}>
                  {({ Field, Button, Errors, register }) => (
                    <>
                      <Field name="email" label="Neue E-Mail" className="mb-4">
                        {({ Errors }) => (
                          <>
                            <Input
                              id="email"
                              label="Neue E-Mail *"
                              {...register("email")}
                            />
                            <Errors />
                          </>
                        )}
                      </Field>

                      <Field name="confirmEmail" label="Wiederholen">
                        {({ Errors }) => (
                          <>
                            <Input
                              id="confirmEmail"
                              label="E-Mail wiederholen *"
                              {...register("confirmEmail")}
                            />
                            <Errors />
                          </>
                        )}
                      </Field>

                      <Field name="submittedForm" label="Wiederholen">
                        {({ Errors }) => (
                          <>
                            <input
                              type="hidden"
                              value="changeEmail"
                              {...register("submittedForm")}
                            ></input>
                            <Errors />
                          </>
                        )}
                      </Field>
                      <button type="submit" className="btn btn-primary mt-8">
                        E-Mail ändern
                      </button>
                      {showEmailFeedback ? (
                        <div>
                          Ein Bestätigungslink wird an Ihre alte und neue E-Mail
                          gesendet. Bestätigen Sie beide um den Änderungsprozess
                          abzuschließen.
                        </div>
                      ) : null}
                      {
                        // TODO: Insert oldEmail and newEmail
                        isUserInEmailChangeProcess ? (
                          <div>
                            Ihre Änderung von (oldEmail) zu (newEmail) wurde
                            noch nicht bestätigt. Bitte folgen Sie den
                            Bestätigungslinks, die an Ihre alte und neue E-Mail
                            gesendet wurden.
                          </div>
                        ) : null
                      }
                    </>
                  )}
                </RemixForm>
              </div>
            </div>
          </div>

          <footer className="fixed z-10 bg-white border-t-2 border-primary w-full inset-x-0 bottom-0">
            <div className="md:container md:mx-auto ">
              <div className="px-4 py-8 flex flex-row items-center justify-end"></div>
            </div>
          </footer>
        </div>
      </fieldset>
    </>
  );
}

// TODO: Handle confirmation links
// -> Currently the user is redirected to the home directory
// with a message inside the url (A notice about the second confirmation link)
