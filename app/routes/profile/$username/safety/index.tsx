import { InputError } from "remix-domains";

import {
  ActionFunction,
  Form,
  json,
  Link,
  LoaderFunction,
  Session,
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
  updateEmail,
  updatePassword,
} from "~/auth.server";
import Input from "~/components/FormElements/Input/Input";
import HeaderLogo from "~/components/HeaderLogo/HeaderLogo";
import { Profile } from "@prisma/client";
import { getInitials } from "~/lib/profile/getInitials";
import { z } from "zod";
import { makeDomainFunction } from "remix-domains";
import { formAction, Form as RemixForm } from "remix-forms";
import InputPassword from "~/components/FormElements/InputPassword/InputPassword";
import { supabaseClient } from "~/supabase";
import { User } from "@supabase/supabase-js";

const emailSchema = z.object({
  email: z.string().min(1).email(),
  confirmEmail: z.string().min(1).email(),
  submittedForm: z.string(),
});

const passwordSchema = z.object({
  password: z.string().min(1),
  confirmPassword: z.string().min(1),
  submittedForm: z.string(),
});

export async function handleAuthorization(request: Request, username: string) {
  if (typeof username !== "string" || username === "") {
    throw badRequest({ message: "username must be provided" });
  }
  const currentUser = await getUser(request);

  if (currentUser?.user_metadata.username !== username) {
    throw forbidden({ message: "not allowed" });
  }

  return currentUser;
}

type LoaderData = {
  profile: Pick<Profile, "email" | "firstName" | "lastName">;
};

export const loader: LoaderFunction = async ({ request, params }) => {
  const username = params.username ?? "";
  const currentUser = await handleAuthorization(request, username);

  let profile = await getProfileByUserId(currentUser.id, [
    "email",
    "firstName",
    "lastName",
  ]);
  if (profile === null) {
    throw new Error(
      `PrismaClient can't find a profile for the user "${username}"`
    );
  }
  return json({ profile });
};

const passwordMutation = makeDomainFunction(passwordSchema)(async (values) => {
  if (values.confirmPassword !== values.password) {
    throw new InputError(
      "Die eingegebenen Passwörter stimmen nicht überein",
      "confirmPassword"
    ); // -- Field error
  }

  return values;
});

const emailMutation = makeDomainFunction(emailSchema)(
  async (values) => {
    if (values.confirmEmail !== values.email) {
      throw new InputError(
        "Die eingegebenen E-Mails stimmen nicht überein",
        "confirmEmail"
      ); // -- Field error
    }
    return values;
  }

  //const { user, error } = await supabase.auth.update({email: 'new@email.com'});
);

export const action: ActionFunction = async ({ request }) => {
  const requestClone = request.clone(); // we need to clone request, because unpack formData can be used only once

  const formData = await requestClone.formData();
  const submittedForm = formData.get("submittedForm");
  const schema = submittedForm === "changeEmail" ? emailSchema : passwordSchema;
  const mutation =
    submittedForm === "changeEmail" ? emailMutation : passwordMutation;

  const result = formAction({
    request,
    schema,
    mutation, // TODO: Fix later
  });

  // TODO:
  // - The code below is executed when the mutation throws an error (thats unwanted behaviour)
  // - supabaseclient can not be used in the mutation function (Isn't the mutation function supposed for such operations?)

  const sessionUser = await getUser(request);
  if (sessionUser === null) {
    throw forbidden({ message: "not allowed" });
  }
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
    await updateProfileByUserId(sessionUser.id, { email: email as string });
  }

  const password = formData.get("password");
  if (password !== null) {
    updatePassword(accessToken, password as string);
  }

  // TODO: Implement Feedback -> Password changed
  // TODO: Implement Feedback -> Waiting for E-Mail confirmation
  // TODO: Implement Feedback -> Waiting for second E-Mail confirmation

  return result;
};

export default function Index() {
  const { username } = useParams();
  const transition = useTransition();
  const { profile } = useLoaderData<LoaderData>();

  const initials = getInitials(profile);

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
