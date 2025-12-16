import { getFormProps, getInputProps, useForm } from "@conform-to/react";
import { getZodConstraint, parseWithZod } from "@conform-to/zod";
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
import { ShowPasswordButton } from "~/components-next/ShowPasswordButton";
import { PrivateVisibility } from "~/components-next/icons/PrivateVisibility";
import { PublicVisibility } from "~/components-next/icons/PublicVisibility";
import { RichText } from "~/components/legacy/Richtext/RichText";
import { detectLanguage } from "~/i18n.server";
import { useIsSubmitting } from "~/lib/hooks/useIsSubmitting";
import { languageModuleMap } from "~/locales/.server";
import { createAuthClient, getSessionUser } from "../../auth.server";
import { login } from "./index.server";
import { createLoginSchema } from "./index.shared";

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
    return submission.reply();
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
    id: `login-${currentTimestamp}`,
    constraint: getZodConstraint(createLoginSchema(locales)),
    defaultValue: {
      email:
        typeof actionData?.initialValue?.email === "string"
          ? actionData?.initialValue?.email
          : "",
      password:
        typeof actionData?.initialValue?.password === "string"
          ? actionData?.initialValue?.password
          : "",
      loginRedirect: loginRedirect,
    },
    shouldValidate: "onBlur",
    shouldRevalidate: "onInput",
    lastResult: navigation.state === "idle" ? actionData : null,
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
        <div className="w-full mx-auto px-4 @sm:max-w-screen-container-sm @md:max-w-screen-container-md @lg:max-w-screen-container-lg @xl:max-w-screen-container-xl @xl:px-6 @2xl:max-w-screen-container-2xl relative">
          <div className="flex flex-col w-full items-center">
            <div className="w-full @sm:w-2/3 @md:w-1/2 @2xl:w-1/3">
              <div className="mb-6 mt-12">
                {locales.content.question}{" "}
                <Link
                  to={`/register${
                    loginRedirect ? `?login_redirect=${loginRedirect}` : ""
                  }`}
                  className="text-primary font-bold"
                  prefetch="intent"
                >
                  {locales.content.action}
                </Link>
              </div>
              <h1 className="mb-8">{locales.content.headline}</h1>

              {typeof loginForm.errors !== "undefined" &&
              loginForm.errors.length > 0 ? (
                <div>
                  {loginForm.errors.map((error, index) => {
                    return (
                      <div
                        key={index}
                        className="p-3 mb-3 bg-negative-100 text-negative-900 rounded-md"
                      >
                        <RichText id={loginForm.errorId} html={error} />
                      </div>
                    );
                  })}
                </div>
              ) : null}

              <div className="mb-4">
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
              <div className="mb-10">
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
                      <div className="h-10 w-10">
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
              <div className="flex flex-row mb-8 items-center justify-between">
                <Link
                  to={`/reset${
                    loginRedirect ? `?login_redirect=${loginRedirect}` : ""
                  }`}
                  className="text-primary font-bold"
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
