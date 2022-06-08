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

import { getProfileByUserId } from "~/profile.server";
import {
  getUserByRequest,
  updateEmailOfLoggedInUser,
  updatePasswordOfLoggedInUser,
} from "~/auth.server";
import Input from "~/components/FormElements/Input/Input";
import HeaderLogo from "~/components/HeaderLogo/HeaderLogo";
import { Profile } from "@prisma/client";
import { getInitials } from "~/lib/profile/getInitials";
import { z } from "zod";
import { makeDomainFunction } from "remix-domains";
import { Form as RemixForm, performMutation } from "remix-forms";
import InputPassword from "~/components/FormElements/InputPassword/InputPassword";

const emailSchema = z.object({
  email: z
    .string()
    .min(1, "Bitte eine E-Mail eingeben.")
    .email("Ungültige E-Mail"),
  confirmEmail: z
    .string()
    .min(1, "E-Mail wiederholen um Rechtschreibfehler zu vermeiden.")
    .email("Ungültige E-Mail"),
  submittedForm: z.enum(["changeEmail"]), // TODO: Can be exactly one of changeEmail || changePassword
});

const passwordSchema = z.object({
  password: z.string().min(1, "Bitte ein Passwort eingeben."),
  confirmPassword: z
    .string()
    .min(1, "Passwort wiederholen um Rechtschreibfehler zu vermeiden."),
  submittedForm: z.enum(["changePassword"]),
});

// TODO: Higher order function
export async function handleAuthorization(request: Request, username: string) {
  if (typeof username !== "string" || username === "") {
    throw badRequest({ message: "username must be provided" });
  }
  const sessionUser = await getUserByRequest(request);

  if (sessionUser === null || sessionUser.user_metadata.username !== username) {
    throw forbidden({ message: "not allowed" });
  }

  return sessionUser;
}

type LoaderData = {
  profile: Pick<Profile, "email" | "firstName" | "lastName">;
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

  return json({ profile });
};

const passwordMutation = makeDomainFunction(passwordSchema)(async (values) => {
  if (values.confirmPassword !== values.password) {
    throw new InputError(
      "Die eingegebenen Passwörter stimmen nicht überein",
      "confirmPassword"
    ); // -- Field error
  }

  const { error } = await updatePasswordOfLoggedInUser(values.password);
  if (error !== null) {
    throw error.message;
  }

  return values;
});

const emailMutation = makeDomainFunction(emailSchema)(async (values) => {
  if (values.confirmEmail !== values.email) {
    throw new InputError(
      "Die eingegebenen E-Mails stimmen nicht überein",
      "confirmEmail"
    ); // -- Field error
  }

  const { error } = await updateEmailOfLoggedInUser(values.email);
  if (error !== null) {
    throw error.message;
  }

  return values;
});

export const action: ActionFunction = async ({ request, params }) => {
  const requestClone = request.clone(); // we need to clone request, because unpack formData can be used only once
  const formData = await requestClone.formData();

  const submittedForm = formData.get("submittedForm");
  const schema = submittedForm === "changeEmail" ? emailSchema : passwordSchema;
  const mutation =
    submittedForm === "changeEmail" ? emailMutation : passwordMutation;
  return performMutation({
    request,
    schema,
    mutation, // TODO: Fix later
  });
};

export default function Index() {
  const { username } = useParams();
  const transition = useTransition();
  const { profile } = useLoaderData<LoaderData>();

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
                        href={`/profile/${username}/security`}
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
                              label="Neues Passwort"
                              required
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
                              label="Passwort wiederholen"
                              required
                              {...register("confirmPassword")}
                            />
                            <Errors />
                          </>
                        )}
                      </Field>
                      <Field name="submittedForm">
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
                        <span
                          className={
                            "mt-2 ml-2 text-green-500 text-bold animate-fade-out"
                          }
                        >
                          Passwort wurde geändert.
                        </span>
                      ) : null}
                    </>
                  )}
                </RemixForm>
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
                              label="Neue E-Mail"
                              required
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
                              label="E-Mail wiederholen"
                              required
                              {...register("confirmEmail")}
                            />
                            <Errors />
                          </>
                        )}
                      </Field>

                      <Field name="submittedForm">
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
                        <span
                          className={
                            "mt-2 ml-2 text-green-500 text-bold animate-fade-out"
                          }
                        >
                          Bestätigungslink gesendet.
                        </span>
                      ) : null}
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
