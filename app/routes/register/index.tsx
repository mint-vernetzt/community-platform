import { getFormProps, getInputProps, useForm } from "@conform-to/react-v1";
import { getZodConstraint, parseWithZod } from "@conform-to/zod-v1";
import { Button } from "@mint-vernetzt/components/src/molecules/Button";
import { Input } from "@mint-vernetzt/components/src/molecules/Input";
import { useState } from "react";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import {
  Form,
  Link,
  redirect,
  useActionData,
  useLoaderData,
  useNavigation,
  useSearchParams,
} from "react-router";
import { useHydrated } from "remix-utils/use-hydrated";
import { z } from "zod";
import { createAuthClient, getSessionUser } from "~/auth.server";
import { Checkbox } from "~/components-next/Checkbox";
import { Dropdown } from "~/components-next/Dropdown";
import { FormControl } from "~/components-next/FormControl";
import { ShowPasswordButton } from "~/components-next/ShowPasswordButton";
import { PrivateVisibility } from "~/components-next/icons/PrivateVisibility";
import { PublicVisibility } from "~/components-next/icons/PublicVisibility";
import { detectLanguage } from "~/i18n.server";
import { useIsSubmitting } from "~/lib/hooks/useIsSubmitting";
import {
  insertComponentsIntoLocale,
  insertParametersIntoLocale,
} from "~/lib/utils/i18n";
import { checkboxSchema } from "~/lib/utils/schemas";
import { languageModuleMap } from "~/locales/.server";
import { register, type RegisterLocales } from "./index.server";

export const createRegisterSchema = (locales: RegisterLocales) => {
  return z.object({
    academicTitle: z
      .enum([
        locales.form.title.options.none,
        locales.form.title.options.dr,
        locales.form.title.options.prof,
        locales.form.title.options.profdr,
      ])
      .optional()
      .transform((value) => {
        if (
          typeof value === "undefined" ||
          value === locales.form.title.options.none
        ) {
          return null;
        }
        return value;
      }),
    firstName: z
      .string({
        message: locales.validation.firstName,
      })
      .trim(),
    lastName: z
      .string({
        message: locales.validation.lastName,
      })
      .trim(),
    email: z
      .string({
        message: locales.validation.email,
      })
      .trim()
      .email(locales.validation.email),
    password: z
      .string({
        message: locales.validation.password.required,
      })
      .min(8, locales.validation.password.min),
    termsAccepted: checkboxSchema,
    loginRedirect: z.string().optional(),
  });
};

export const loader = async (args: LoaderFunctionArgs) => {
  const { request } = args;
  const { authClient } = createAuthClient(request);
  const sessionUser = await getSessionUser(authClient);
  if (sessionUser !== null) {
    return redirect("/dashboard");
  }

  const language = await detectLanguage(request);
  const locales = languageModuleMap[language]["register/index"];

  return { locales, currentTimestamp: Date.now() };
};

export const action = async (args: ActionFunctionArgs) => {
  const { request } = args;
  const { authClient } = createAuthClient(request);

  const language = await detectLanguage(request);
  const locales = languageModuleMap[language]["register/index"];

  // Conform
  const formData = await request.formData();
  const { submission } = await register({
    formData,
    authClient,
    locales,
  });

  return {
    submission: submission.reply(),
    email: submission.status === "success" ? submission.value.email : null,
    systemMail: process.env.SYSTEM_MAIL_SENDER,
    supportMail: process.env.SUPPORT_MAIL,
    currentTimestamp: Date.now(),
  };
};

export default function Register() {
  const actionData = useActionData<typeof action>();
  const loaderData = useLoaderData<typeof loader>();
  const { locales, currentTimestamp } = loaderData;
  const navigation = useNavigation();
  const isHydrated = useHydrated();
  const isSubmitting = useIsSubmitting();
  const [urlSearchParams] = useSearchParams();
  const loginRedirect = urlSearchParams.get("login_redirect");
  const [showPassword, setShowPassword] = useState(false);

  const [registerForm, registerFields] = useForm({
    id: `register-${actionData?.currentTimestamp || currentTimestamp}`,
    constraint: getZodConstraint(createRegisterSchema(locales)),
    defaultValue: {
      loginRedirect: loginRedirect,
    },
    shouldValidate: "onBlur",
    shouldRevalidate: "onInput",
    lastResult: navigation.state === "idle" ? actionData?.submission : null,
    onValidate({ formData }) {
      const submission = parseWithZod(formData, {
        schema: createRegisterSchema(locales).transform((data, ctx) => {
          if (data.termsAccepted === false) {
            ctx.addIssue({
              code: "custom",
              message: locales.validation.termsAccepted,
              path: ["termsAccepted"],
            });
            return z.NEVER;
          }
          return { ...data };
        }),
      });
      return submission;
    },
  });

  return (
    <div className="w-full mx-auto px-4 @sm:max-w-screen-container-sm @md:max-w-screen-container-md @lg:max-w-screen-container-lg @xl:max-w-screen-container-xl @xl:px-6 @2xl:max-w-screen-container-2xl relative">
      <div className="flex flex-col w-full items-center">
        <div className="w-full @sm:w-2/3 @md:w-1/2 @2xl:w-1/3">
          <div className="mb-6 mt-12">
            {locales.content.question}{" "}
            <Link
              to={`/login${
                loginRedirect !== null ? `?login_redirect=${loginRedirect}` : ""
              }`}
              className="text-primary font-bold"
              prefetch="intent"
            >
              {locales.content.login}
            </Link>
          </div>
          <h1 className="mb-8">{locales.content.create}</h1>
          {typeof actionData !== "undefined" &&
          typeof actionData.submission.status !== "undefined" &&
          actionData.submission.status === "success" ? (
            <>
              <p className="mb-4">
                {insertComponentsIntoLocale(
                  insertParametersIntoLocale(locales.content.success, {
                    email: actionData.email,
                    systemMail: actionData.systemMail,
                  }),
                  [
                    <span key="email-highlight" className="font-semibold" />,
                    <Link
                      key="reset-password-link"
                      to={`/reset${
                        loginRedirect !== null
                          ? `?login_redirect=${loginRedirect}`
                          : ""
                      }`}
                      className="text-primary font-semibold hover:underline"
                      prefetch="intent"
                    >
                      {" "}
                    </Link>,
                    <Link
                      key="support-mail-link"
                      to={`mailto:${actionData.supportMail}`}
                      className="text-primary font-semibold hover:underline"
                    >
                      {" "}
                    </Link>,
                  ]
                )}
              </p>
            </>
          ) : (
            <Form
              {...getFormProps(registerForm)}
              method="post"
              preventScrollReset
              autoComplete="off"
            >
              <p className="mb-4">{locales.form.intro}</p>
              <div className="flex flex-row mb-4">
                <div className="basis-full @lg:basis-1/2">
                  <Dropdown>
                    <Dropdown.Label>
                      {isHydrated === true &&
                      typeof registerFields.academicTitle.value !== "undefined"
                        ? registerFields.academicTitle.value
                        : locales.form.title.label}
                    </Dropdown.Label>
                    <Dropdown.List>
                      {Object.entries(locales.form.title.options).map(
                        // eslint-disable-next-line @typescript-eslint/no-unused-vars
                        ([_key, title]) => {
                          return (
                            <FormControl
                              {...getInputProps(registerFields.academicTitle, {
                                type: "radio",
                                value: title,
                              })}
                              key={title}
                            >
                              <FormControl.Label>{title}</FormControl.Label>
                            </FormControl>
                          );
                        }
                      )}
                    </Dropdown.List>
                  </Dropdown>
                  {typeof registerFields.academicTitle.errors !== "undefined" &&
                  registerFields.academicTitle.errors.length > 0 ? (
                    <div className="mb-10">
                      {registerFields.academicTitle.errors.map(
                        (error, index) => {
                          return (
                            <div
                              id={registerFields.academicTitle.errorId}
                              key={index}
                              className="text-sm font-semibold text-negative-600"
                            >
                              {error}
                            </div>
                          );
                        }
                      )}
                    </div>
                  ) : null}
                </div>
              </div>
              <div className="flex flex-col @lg:flex-row mb-4 gap-4">
                <Input
                  {...getInputProps(registerFields.firstName, {
                    type: "text",
                  })}
                  key="firstName"
                >
                  <Input.Label htmlFor={registerFields.firstName.id}>
                    {locales.form.firstName}
                  </Input.Label>
                  {typeof registerFields.firstName.errors !== "undefined" &&
                  registerFields.firstName.errors.length > 0
                    ? registerFields.firstName.errors.map((error) => (
                        <Input.Error
                          id={registerFields.firstName.errorId}
                          key={error}
                        >
                          {error}
                        </Input.Error>
                      ))
                    : null}
                </Input>
                <Input
                  {...getInputProps(registerFields.lastName, {
                    type: "text",
                  })}
                  key="lastName"
                >
                  <Input.Label htmlFor={registerFields.lastName.id}>
                    {locales.form.lastName}
                  </Input.Label>
                  {typeof registerFields.lastName.errors !== "undefined" &&
                  registerFields.lastName.errors.length > 0
                    ? registerFields.lastName.errors.map((error) => (
                        <Input.Error
                          id={registerFields.lastName.errorId}
                          key={error}
                        >
                          {error}
                        </Input.Error>
                      ))
                    : null}
                </Input>
              </div>
              <div className="mb-4">
                <Input
                  {...getInputProps(registerFields.email, { type: "text" })}
                  key="email"
                >
                  <Input.Label htmlFor={registerFields.email.id}>
                    {locales.form.email}
                  </Input.Label>
                  {typeof registerFields.email.errors !== "undefined" &&
                  registerFields.email.errors.length > 0
                    ? registerFields.email.errors.map((error) => (
                        <Input.Error
                          id={registerFields.email.errorId}
                          key={error}
                        >
                          {error}
                        </Input.Error>
                      ))
                    : null}
                </Input>
              </div>
              <div className="mb-4">
                <Input
                  {...getInputProps(registerFields.password, {
                    type: showPassword ? "text" : "password",
                  })}
                  key="password"
                >
                  <Input.Label htmlFor={registerFields.password.id}>
                    {locales.form.password.label}
                  </Input.Label>
                  {typeof registerFields.password.errors !== "undefined" &&
                  registerFields.password.errors.length > 0
                    ? registerFields.password.errors.map((error) => (
                        <Input.Error
                          id={registerFields.password.errorId}
                          key={error}
                        >
                          {error}
                        </Input.Error>
                      ))
                    : null}
                  {isHydrated === true ? (
                    <Input.Controls>
                      <div className="h-10 w-10">
                        <ShowPasswordButton
                          onClick={() => {
                            setShowPassword(!showPassword);
                          }}
                          aria-label={
                            showPassword
                              ? locales.form.password.hidePassword
                              : locales.form.password.showPassword
                          }
                        >
                          {showPassword ? (
                            <PublicVisibility aria-hidden="true" />
                          ) : (
                            <PrivateVisibility aria-hidden="true" />
                          )}
                        </ShowPasswordButton>
                      </div>
                    </Input.Controls>
                  ) : null}
                </Input>
              </div>
              <div className="mb-10">
                <div className="flex gap-2 items-center">
                  <Checkbox
                    {...getInputProps(registerFields.termsAccepted, {
                      type: "checkbox",
                    })}
                    required
                    key="termsAccepted"
                  />
                  <label htmlFor={registerFields.termsAccepted.id}>
                    {insertComponentsIntoLocale(locales.form.confirmation, [
                      <Link
                        key="terms-of-use-confirmation"
                        to="https://mint-vernetzt.de/terms-of-use-community-platform"
                        target="_blank"
                        rel="noreferrer noopener"
                        className="text-primary font-semibold hover:underline"
                      >
                        {" "}
                      </Link>,
                      <Link
                        key="privacy-policy-confirmation"
                        to="https://mint-vernetzt.de/privacy-policy-community-platform"
                        target="_blank"
                        rel="noreferrer noopener"
                        className="text-primary font-semibold hover:underline"
                      >
                        {" "}
                      </Link>,
                    ])}
                  </label>
                </div>
                {typeof registerFields.termsAccepted.errors !== "undefined" &&
                registerFields.termsAccepted.errors.length > 0 ? (
                  <div className="mb-10 ml-5">
                    {registerFields.termsAccepted.errors.map((error, index) => {
                      return (
                        <div
                          id={registerFields.termsAccepted.errorId}
                          key={index}
                          className="text-sm font-semibold text-negative-600"
                        >
                          {error}
                        </div>
                      );
                    })}
                  </div>
                ) : null}
              </div>
              {typeof registerForm.errors !== "undefined" &&
              registerForm.errors.length > 0 ? (
                <div className="mb-10">
                  {registerForm.errors.map((error, index) => {
                    return (
                      <div
                        id={registerForm.errorId}
                        key={index}
                        className="text-sm font-semibold text-negative-600"
                      >
                        {error}
                      </div>
                    );
                  })}
                </div>
              ) : null}

              <input
                {...getInputProps(registerFields.loginRedirect, {
                  type: "hidden",
                })}
                key="loginRedirect"
              />
              <div className="flex flex-row mb-8 items-center justify-end">
                <Button
                  type="submit"
                  // Don't disable button when js is disabled
                  disabled={
                    isHydrated
                      ? registerForm.dirty === false ||
                        registerForm.valid === false ||
                        isSubmitting
                      : false
                  }
                >
                  {locales.form.submit}
                </Button>
              </div>
            </Form>
          )}
        </div>
      </div>
    </div>
  );
}
