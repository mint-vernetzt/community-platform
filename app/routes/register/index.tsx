import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import {
  Link,
  useActionData,
  useLoaderData,
  useSearchParams,
  useSubmit,
  redirect,
} from "react-router";
import { makeDomainFunction } from "domain-functions";
import { forwardRef, type KeyboardEvent } from "react";
import { performMutation } from "remix-forms";
import { z } from "zod";
import { createAuthClient, getSessionUser, signUp } from "~/auth.server";
import Input from "~/components/FormElements/Input/Input";
import { RemixFormsForm } from "~/components/RemixFormsForm/RemixFormsForm";
import { detectLanguage } from "~/i18n.server";
import InputPassword from "../../components/FormElements/InputPassword/InputPassword";
import SelectField from "../../components/FormElements/SelectField/SelectField";
import { generateUsername } from "../../utils.server";
import { type RegisterLocales } from "./index.server";
import { languageModuleMap } from "~/locales/.server";
import { invariantResponse } from "~/lib/utils/response";
import { insertParametersIntoLocale } from "~/lib/utils/i18n";
import { RichText } from "~/components/Richtext/RichText";

const createSchema = (locales: RegisterLocales) => {
  return z.object({
    // todo: i18n of enums?
    academicTitle: z
      .string()
      .optional()
      .transform((value) => {
        if (value === "") {
          return null;
        }
        return value;
      }),
    firstName: z.string().min(1, locales.validation.firstName.min),
    lastName: z.string().min(1, locales.validation.lastName.min),
    email: z
      .string()
      .email(locales.validation.email.email)
      .min(1, locales.validation.email.min),
    password: z.string().min(8, locales.validation.password.min),
    termsAccepted: z.boolean(),
    loginRedirect: z.string().optional(),
  });
};

const environmentSchema = z.object({
  authClient: z.unknown(),
  // authClient: z.instanceof(SupabaseClient),
  siteUrl: z.string(),
});

export const loader = async (args: LoaderFunctionArgs) => {
  const { request } = args;
  const { authClient } = createAuthClient(request);
  const sessionUser = await getSessionUser(authClient);
  if (sessionUser !== null) {
    return redirect("/dashboard");
  }

  const language = await detectLanguage(request);
  const locales = languageModuleMap[language]["register/index"];

  return { locales };
};

const createMutation = (locales: RegisterLocales) => {
  return makeDomainFunction(
    createSchema(locales),
    environmentSchema
  )(async (values, environment) => {
    // TODO: move to database trigger
    const { firstName, lastName, academicTitle, termsAccepted } = values;

    if (!termsAccepted) {
      throw locales.validation.termsAccepted;
    }

    const username = `${generateUsername(firstName, lastName)}`;

    const loginRedirect = values.loginRedirect
      ? `${environment.siteUrl}${values.loginRedirect}`
      : undefined;

    const { error } = await signUp(
      // TODO: fix type issue
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      environment.authClient,
      values.email,
      values.password,
      {
        firstName,
        lastName,
        username,
        academicTitle: academicTitle || null,
        termsAccepted,
      },
      loginRedirect
    );

    if (
      error !== null &&
      error.code !== "user_already_exists" &&
      error.message !== "User already registered"
    ) {
      invariantResponse(false, "Server Error", { status: 500 });
    }
    return values;
  });
};

export const action = async (args: ActionFunctionArgs) => {
  const { request } = args;
  const { authClient } = createAuthClient(request);

  const language = await detectLanguage(request);
  const locales = languageModuleMap[language]["register/index"];

  const siteUrl = `${process.env.COMMUNITY_BASE_URL}`;

  const result = await performMutation({
    request,
    schema: createSchema(locales),
    mutation: createMutation(locales),
    environment: { authClient: authClient, siteUrl: siteUrl },
  });

  return result;
};

export default function Register() {
  const { locales } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const [urlSearchParams] = useSearchParams();
  const loginRedirect = urlSearchParams.get("login_redirect");
  const submit = useSubmit();
  const handleKeyPress = (event: KeyboardEvent<HTMLFormElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      // TODO: fix type issue
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      if (event.target.getAttribute("name") !== "termsAccepted") {
        submit(event.currentTarget);
      }
    }
  };
  const schema = createSchema(locales);

  return (
    <>
      <div className="mv-w-full mv-mx-auto mv-px-4 @sm:mv-max-w-screen-container-sm @md:mv-max-w-screen-container-md @lg:mv-max-w-screen-container-lg @xl:mv-max-w-screen-container-xl @xl:mv-px-6 @2xl:mv-max-w-screen-container-2xl relative z-10">
        <div className="flex flex-col mv-w-full mv-items-center">
          <div className="mv-w-full @sm:mv-w-2/3 @md:mv-w-1/2 @2xl:mv-w-1/3">
            <div className="mv-mb-6 mv-mt-12">
              {locales.content.question}{" "}
              <Link
                to={`/login${
                  loginRedirect ? `?login_redirect=${loginRedirect}` : ""
                }`}
                className="text-primary font-bold"
              >
                {locales.content.login}
              </Link>
            </div>
            <h1 className="mb-4">{locales.content.create}</h1>
            {actionData !== undefined && actionData.success ? (
              <>
                <div className="mb-4">
                  <RichText
                    html={insertParametersIntoLocale(locales.content.success, {
                      email: actionData.data.email,
                    })}
                  />{" "}
                  <Link
                    to={`/reset${
                      loginRedirect ? `?login_redirect=${loginRedirect}` : ""
                    }`}
                    className="text-primary font-bold hover:underline"
                  >
                    {locales.content.reset}
                  </Link>
                  .
                </div>
              </>
            ) : (
              <RemixFormsForm
                method="post"
                schema={schema}
                onKeyDown={handleKeyPress}
              >
                {({ Field, Errors, register }) => (
                  <>
                    <p className="mb-4">{locales.form.intro}</p>
                    <div className="flex flex-row -mx-4 mb-4">
                      <div className="basis-full @lg:mv-basis-6/12 px-4 mb-4">
                        <input
                          name="loginRedirect"
                          defaultValue={loginRedirect || undefined}
                          hidden
                        />
                        <Field name="academicTitle" label="Titel">
                          {({ Errors }) => (
                            <>
                              <SelectField
                                label={locales.form.title.label}
                                options={[
                                  {
                                    label: locales.form.title.options.dr,
                                    value: "Dr.",
                                  },
                                  {
                                    label: locales.form.title.options.prof,
                                    value: "Prof.",
                                  },
                                  {
                                    label: locales.form.title.options.profdr,
                                    value: "Prof. Dr.",
                                  },
                                ]}
                                {...register("academicTitle")}
                              />
                              <Errors />
                            </>
                          )}
                        </Field>
                      </div>
                    </div>

                    <div className="flex flex-col @lg:mv-flex-row -mx-4 mb-4">
                      <div className="basis-full @lg:mv-basis-6/12 px-4 mb-4">
                        <Field name="firstName" label="Vorname">
                          {({ Errors }) => (
                            <>
                              <Input
                                id="firstName"
                                label={locales.form.firstName}
                                required
                                {...register("firstName")}
                              />

                              <Errors />
                            </>
                          )}
                        </Field>
                      </div>
                      <div className="basis-full @lg:mv-basis-6/12 px-4 mb-4">
                        <Field name="lastName" label="Nachname">
                          {({ Errors }) => (
                            <>
                              <Input
                                id="lastName"
                                label={locales.form.lastName}
                                required
                                {...register("lastName")}
                              />
                              <Errors />
                            </>
                          )}
                        </Field>
                      </div>
                    </div>

                    <div className="mb-4">
                      <Field name="email" label="E-Mail">
                        {({ Errors }) => (
                          <>
                            <Input
                              id="email"
                              label={locales.form.email}
                              required
                              {...register("email")}
                            />
                            <Errors />
                          </>
                        )}
                      </Field>
                    </div>

                    <div className="mb-4">
                      <Field name="password" label="Passwort">
                        {({ Errors }) => (
                          <>
                            <InputPassword
                              id="password"
                              label={locales.form.password}
                              required
                              {...register("password")}
                            />
                            <Errors />
                          </>
                        )}
                      </Field>
                    </div>

                    {/* <div className="mb-4">
              <InputPassword id="" label="Passwort wiederholen" isRequired />
            </div> */}

                    <div className="mb-8">
                      <div className="form-control checkbox-privacy items-start">
                        <label className="label cursor-pointer items-start">
                          <Field name="termsAccepted">
                            {({ Errors }) => {
                              const ForwardRefComponent = forwardRef<
                                HTMLInputElement,
                                React.DetailedHTMLProps<
                                  React.InputHTMLAttributes<HTMLInputElement>,
                                  HTMLInputElement
                                >
                              >((props, ref) => {
                                return (
                                  <>
                                    <input
                                      ref={
                                        // TODO: can this type assertion be removed and proofen by code?
                                        ref as React.RefObject<HTMLInputElement>
                                      }
                                      {...props}
                                    />
                                  </>
                                );
                              });
                              ForwardRefComponent.displayName =
                                "ForwardRefComponent";
                              return (
                                <>
                                  <ForwardRefComponent
                                    type="checkbox"
                                    className="checkbox checkbox-primary mr-4"
                                    {...register("termsAccepted")}
                                  />
                                  <Errors />
                                </>
                              );
                            }}
                          </Field>
                          <span className="label-text">
                            {locales.form.acknowledgements.intro}{" "}
                            <a
                              href="https://mint-vernetzt.de/terms-of-use-community-platform"
                              target="_blank"
                              rel="noreferrer noopener"
                              className="text-primary font-bold hover:underline"
                            >
                              {locales.form.acknowledgements.termsOfUse}
                            </a>
                            {locales.form.acknowledgements.bridge}{" "}
                            <a
                              href="https://mint-vernetzt.de/privacy-policy-community-platform"
                              target="_blank"
                              rel="noreferrer noopener"
                              className="text-primary font-bold hover:underline"
                            >
                              {locales.form.acknowledgements.dataProtection}
                            </a>{" "}
                            {locales.form.acknowledgements.outro}
                          </span>
                        </label>
                      </div>
                    </div>
                    <div className="mb-8">
                      <button type="submit" className="btn btn-primary">
                        {locales.form.submit}
                      </button>
                    </div>
                    <Errors />
                  </>
                )}
              </RemixFormsForm>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
