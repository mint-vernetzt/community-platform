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
import { ShowPasswordButton } from "~/components-next/ShowPasswordButton";
import { PrivateVisibility } from "~/components-next/icons/PrivateVisibility";
import { PublicVisibility } from "~/components-next/icons/PublicVisibility";
import { RichText } from "~/components/Richtext/RichText";
import { detectLanguage } from "~/i18n.server";
import { useIsSubmitting } from "~/lib/hooks/useIsSubmitting";
import { languageModuleMap } from "~/locales/.server";
import { createAuthClient, getSessionUser } from "../../auth.server";
import { type LandingPageLocales } from "../index.server";
import { login, type LoginLocales } from "./index.server";

export const loader = async (args: LoaderFunctionArgs) => {
  const { request } = args;

  const { authClient } = createAuthClient(request);
  const sessionUser = await getSessionUser(authClient);
  if (sessionUser !== null) {
    return redirect("/dashboard");
  }

  const language = await detectLanguage(request);
  const locales = languageModuleMap[language]["login/index"];

  return { locales, currentTimestamp: Date.now() };
};

export const createLoginSchema = (
  locales: LoginLocales | LandingPageLocales["route"]
) => {
  return z.object({
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
    loginRedirect: z.string().optional(),
  });
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const language = await detectLanguage(request);
  const locales = languageModuleMap[language]["login/index"];
  const { authClient } = createAuthClient(request);

  // Conform
  const formData = await request.formData();
  const { submission } = await login({
    formData,
    request,
    authClient,
    locales,
  });

  if (submission.status !== "success") {
    return {
      submission: submission.reply(),
      currentTimestamp: Date.now(),
    };
  }

  if (typeof submission.value.loginRedirect !== "undefined") {
    return redirect(submission.value.loginRedirect, {
      headers: submission.value.headers,
    });
  } else {
    return redirect("/dashboard", {
      headers: submission.value.headers,
    });
  }
};

export default function Index() {
  const actionData = useActionData<typeof action>();
  const loaderData = useLoaderData<typeof loader>();
  const { locales, currentTimestamp } = loaderData;
  const navigation = useNavigation();
  const isHydrated = useHydrated();
  const isSubmitting = useIsSubmitting();
  const [urlSearchParams] = useSearchParams();
  const loginRedirect = urlSearchParams.get("login_redirect");
  const [showPassword, setShowPassword] = useState(false);

  const [loginForm, loginFields] = useForm({
    id: `login-${actionData?.currentTimestamp || currentTimestamp}`,
    constraint: getZodConstraint(createLoginSchema(locales)),
    defaultValue: {
      email:
        typeof actionData?.submission?.initialValue?.email === "string"
          ? actionData?.submission?.initialValue?.email
          : "",
      password:
        typeof actionData?.submission?.initialValue?.password === "string"
          ? actionData?.submission?.initialValue?.password
          : "",
      loginRedirect: loginRedirect,
    },
    shouldValidate: "onBlur",
    shouldRevalidate: "onInput",
    lastResult: navigation.state === "idle" ? actionData?.submission : null,
    onValidate({ formData }) {
      const submission = parseWithZod(formData, {
        schema: createLoginSchema(locales),
      });
      return submission;
    },
  });

  return (
    <Form {...getFormProps(loginForm)} method="post" autoComplete="off">
      <>
        <div className="mv-w-full mv-mx-auto mv-px-4 @sm:mv-max-w-screen-container-sm @md:mv-max-w-screen-container-md @lg:mv-max-w-screen-container-lg @xl:mv-max-w-screen-container-xl @xl:mv-px-6 @2xl:mv-max-w-screen-container-2xl mv-relative">
          <div className="mv-flex mv-flex-col mv-w-full mv-items-center">
            <div className="mv-w-full @sm:mv-w-2/3 @md:mv-w-1/2 @2xl:mv-w-1/3">
              <div className="mv-mb-6 mv-mt-12">
                {locales.content.question}{" "}
                <Link
                  to={`/register${
                    loginRedirect ? `?login_redirect=${loginRedirect}` : ""
                  }`}
                  className="mv-text-primary mv-font-bold"
                  prefetch="intent"
                >
                  {locales.content.action}
                </Link>
              </div>
              <h1 className="mv-mb-8">{locales.content.headline}</h1>

              {typeof loginForm.errors !== "undefined" &&
              loginForm.errors.length > 0 ? (
                <div>
                  {loginForm.errors.map((error, index) => {
                    return (
                      <div
                        key={index}
                        className="mv-p-3 mv-mb-3 mv-bg-negative-100 mv-text-negative-900 mv-rounded-md"
                      >
                        <RichText id={loginForm.errorId} html={error} />
                      </div>
                    );
                  })}
                </div>
              ) : null}

              <div className="mv-mb-4">
                <Input
                  {...getInputProps(loginFields.email, { type: "text" })}
                  key="email"
                >
                  <Input.Label htmlFor={loginFields.email.id}>
                    {locales.label.email}
                  </Input.Label>
                  {typeof loginFields.email.errors !== "undefined" &&
                  loginFields.email.errors.length > 0
                    ? loginFields.email.errors.map((error) => (
                        <Input.Error id={loginFields.email.errorId} key={error}>
                          {error}
                        </Input.Error>
                      ))
                    : null}
                </Input>
              </div>
              <div className="mv-mb-10">
                <Input
                  {...getInputProps(loginFields.password, {
                    type: showPassword ? "text" : "password",
                  })}
                  key="password"
                >
                  <Input.Label htmlFor={loginFields.password.id}>
                    {locales.label.password}
                  </Input.Label>
                  {typeof loginFields.password.errors !== "undefined" &&
                  loginFields.password.errors.length > 0
                    ? loginFields.password.errors.map((error) => (
                        <Input.Error
                          id={loginFields.password.errorId}
                          key={error}
                        >
                          {error}
                        </Input.Error>
                      ))
                    : null}
                  {isHydrated === true ? (
                    <Input.Controls>
                      <div className="mv-h-10 mv-w-10">
                        <ShowPasswordButton
                          onClick={() => {
                            setShowPassword(!showPassword);
                          }}
                          aria-label={
                            showPassword
                              ? locales.label.hidePassword
                              : locales.label.showPassword
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

              <input
                {...getInputProps(loginFields.loginRedirect, {
                  type: "hidden",
                })}
                key="loginRedirect"
              />
              <div className="mv-flex mv-flex-row mv-mb-8 mv-items-center mv-justify-between">
                <Link
                  to={`/reset${
                    loginRedirect ? `?login_redirect=${loginRedirect}` : ""
                  }`}
                  className="mv-text-primary mv-font-bold"
                  prefetch="intent"
                >
                  {locales.label.reset}
                </Link>
                <Button
                  type="submit"
                  // Don't disable button when js is disabled
                  disabled={
                    isHydrated
                      ? loginForm.dirty === false ||
                        loginForm.valid === false ||
                        isSubmitting
                      : false
                  }
                >
                  {locales.label.submit}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </>
    </Form>
  );
}
