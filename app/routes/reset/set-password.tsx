import { getFormProps, getInputProps, useForm } from "@conform-to/react";
import { getZodConstraint, parseWithZod } from "@conform-to/zod";
import { Button } from "@mint-vernetzt/components/src/molecules/Button";
import { Input } from "@mint-vernetzt/components/src/molecules/Input";
import { useState } from "react";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import {
  Form,
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
import { useIsSubmitting } from "~/lib/hooks/useIsSubmitting";
import { languageModuleMap } from "~/locales/.server";
import { detectLanguage } from "~/root.server";
import {
  createAuthClient,
  getSessionUserOrRedirectPathToLogin,
  getSessionUserOrThrow,
} from "../../auth.server";
import { setNewPassword, type SetPasswordLocales } from "./set-password.server";

export const createSetPasswordSchema = (locales: SetPasswordLocales) => {
  return z.object({
    password: z
      .string({
        message: locales.validation.password.required,
      })
      .min(8, locales.validation.password.min),
    confirmPassword: z
      .string({
        message: locales.validation.confirmPassword.required,
      })
      .min(8, locales.validation.confirmPassword.min),
    loginRedirect: z.string().optional(),
  });
};

export const loader = async (args: LoaderFunctionArgs) => {
  const { request } = args;
  const { authClient } = createAuthClient(request);
  const { sessionUser, redirectPath } =
    await getSessionUserOrRedirectPathToLogin(authClient, request);

  if (sessionUser === null && redirectPath !== null) {
    return redirect(redirectPath);
  }

  const language = await detectLanguage(request);
  const locales = languageModuleMap[language]["reset/set-password"];

  return { locales, currentTimestamp: Date.now() };
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { authClient } = createAuthClient(request);
  const sessionUser = await getSessionUserOrThrow(authClient);

  const language = await detectLanguage(request);
  const locales = languageModuleMap[language]["reset/set-password"];

  const formData = await request.formData();
  const { submission } = await setNewPassword({
    formData,
    sessionUser,
    locales,
  });

  if (submission.status !== "success") {
    return {
      submission: submission.reply(),
      currentTimestamp: Date.now(),
    };
  }
  return redirect(
    `/login${
      typeof submission.value.loginRedirect !== "undefined"
        ? `?login_redirect=${submission.value.loginRedirect}`
        : ""
    }`
  );
};

export default function SetPassword() {
  const actionData = useActionData<typeof action>();
  const loaderData = useLoaderData<typeof loader>();
  const { locales, currentTimestamp } = loaderData;
  const navigation = useNavigation();
  const isHydrated = useHydrated();
  const isSubmitting = useIsSubmitting();
  const [urlSearchParams] = useSearchParams();
  const loginRedirect = urlSearchParams.get("login_redirect");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [setPasswordForm, setPasswordFields] = useForm({
    id: `set-password-${actionData?.currentTimestamp || currentTimestamp}`,
    constraint: getZodConstraint(createSetPasswordSchema(locales)),
    defaultValue: {
      loginRedirect: loginRedirect,
    },
    shouldValidate: "onBlur",
    shouldRevalidate: "onInput",
    lastResult: navigation.state === "idle" ? actionData?.submission : null,
    onValidate({ formData }) {
      const submission = parseWithZod(formData, {
        schema: createSetPasswordSchema(locales).transform((data, ctx) => {
          if (data.password !== data.confirmPassword) {
            ctx.addIssue({
              code: "custom",
              message: locales.validation.passwordMismatch,
              path: ["confirmPassword"],
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
    <Form
      {...getFormProps(setPasswordForm)}
      method="post"
      preventScrollReset
      autoComplete="off"
    >
      <>
        <div className="w-full mx-auto px-4 @sm:max-w-screen-container-sm @md:max-w-screen-container-md @lg:max-w-screen-container-lg @xl:max-w-screen-container-xl @xl:px-6 @2xl:max-w-screen-container-2xl relative">
          <div className="flex flex-col w-full items-center">
            <div className="w-full @sm:w-2/3 @md:w-1/2 @2xl:w-1/3">
              <h1 className="mb-8">{locales.content.headline}</h1>
              <p className="mb-4">{locales.content.description}</p>

              <div className="mb-4">
                <Input
                  {...getInputProps(setPasswordFields.password, {
                    type: showPassword ? "text" : "password",
                  })}
                  key="password"
                >
                  <Input.Label htmlFor={setPasswordFields.password.id}>
                    {locales.form.label.password}
                  </Input.Label>
                  {typeof setPasswordFields.password.errors !== "undefined" &&
                  setPasswordFields.password.errors.length > 0
                    ? setPasswordFields.password.errors.map((error) => (
                        <Input.Error
                          id={setPasswordFields.password.errorId}
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
                              ? locales.form.hidePassword
                              : locales.form.showPassword
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
                <Input
                  {...getInputProps(setPasswordFields.confirmPassword, {
                    type: showConfirmPassword ? "text" : "password",
                  })}
                  key="confirmPassword"
                >
                  <Input.Label htmlFor={setPasswordFields.confirmPassword.id}>
                    {locales.form.label.confirmPassword}
                  </Input.Label>
                  {typeof setPasswordFields.confirmPassword.errors !==
                    "undefined" &&
                  setPasswordFields.confirmPassword.errors.length > 0
                    ? setPasswordFields.confirmPassword.errors.map((error) => (
                        <Input.Error
                          id={setPasswordFields.confirmPassword.errorId}
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
                            setShowConfirmPassword(!showConfirmPassword);
                          }}
                          aria-label={
                            showConfirmPassword
                              ? locales.form.hidePassword
                              : locales.form.showPassword
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
              {typeof setPasswordForm.errors !== "undefined" &&
              setPasswordForm.errors.length > 0 ? (
                <div className="mb-10">
                  {setPasswordForm.errors.map((error, index) => {
                    return (
                      <div
                        id={setPasswordForm.errorId}
                        key={index}
                        className="text-sm font-semibold text-negative-700"
                      >
                        {error}
                      </div>
                    );
                  })}
                </div>
              ) : null}

              <input
                {...getInputProps(setPasswordFields.loginRedirect, {
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
                      ? setPasswordForm.dirty === false ||
                        setPasswordForm.valid === false ||
                        isSubmitting
                      : false
                  }
                >
                  {locales.form.label.submit}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </>
    </Form>
  );
}
