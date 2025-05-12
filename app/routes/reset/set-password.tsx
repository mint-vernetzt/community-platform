import { getFormProps, getInputProps, useForm } from "@conform-to/react-v1";
import { getZodConstraint, parseWithZod } from "@conform-to/zod-v1";
import { Button } from "@mint-vernetzt/components/src/molecules/Button";
import { CircleButton } from "@mint-vernetzt/components/src/molecules/CircleButton";
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
import { HidePassword } from "~/components-next/icons/HidePassword";
import { ShowPassword } from "~/components-next/icons/ShowPassword";
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
    password: z.string().min(8, locales.validation.password.min),
    confirmPassword: z.string().min(8, locales.validation.confirmPassword.min),
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
    shouldValidate: "onInput",
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
        <div className="mv-w-full mv-mx-auto mv-px-4 @sm:mv-max-w-screen-container-sm @md:mv-max-w-screen-container-md @lg:mv-max-w-screen-container-lg @xl:mv-max-w-screen-container-xl @xl:mv-px-6 @2xl:mv-max-w-screen-container-2xl mv-relative mv-z-10">
          <div className="mv-flex mv-flex-col mv-w-full mv-items-center">
            <div className="mv-w-full @sm:mv-w-2/3 @md:mv-w-1/2 @2xl:mv-w-1/3">
              <h1 className="mv-mb-8">{locales.content.headline}</h1>
              <p className="mv-mb-4">{locales.content.description}</p>

              <div className="mv-mb-4">
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
                      <div className="mv-h-10 mv-w-10">
                        <CircleButton
                          type="button"
                          onClick={() => {
                            setShowPassword(!showPassword);
                          }}
                          variant="outline"
                          fullSize
                          aria-label={
                            showPassword
                              ? locales.form.hidePassword
                              : locales.form.showPassword
                          }
                        >
                          {showPassword ? <HidePassword /> : <ShowPassword />}
                        </CircleButton>
                      </div>
                    </Input.Controls>
                  ) : null}
                </Input>
              </div>
              <div className="mv-mb-10">
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
                      <div className="mv-h-10 mv-w-10">
                        <CircleButton
                          type="button"
                          onClick={() => {
                            setShowConfirmPassword(!showConfirmPassword);
                          }}
                          variant="outline"
                          fullSize
                          aria-label={
                            showConfirmPassword
                              ? locales.form.hidePassword
                              : locales.form.showPassword
                          }
                        >
                          {showConfirmPassword ? (
                            <HidePassword />
                          ) : (
                            <ShowPassword />
                          )}
                        </CircleButton>
                      </div>
                    </Input.Controls>
                  ) : null}
                </Input>
              </div>
              {typeof setPasswordForm.errors !== "undefined" &&
              setPasswordForm.errors.length > 0 ? (
                <div className="mv-mb-10">
                  {setPasswordForm.errors.map((error, index) => {
                    return (
                      <div
                        id={setPasswordForm.errorId}
                        key={index}
                        className="mv-text-sm mv-font-semibold mv-text-negative-600"
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
              <div className="mv-flex mv-flex-row -mv-mx-4 mb-8 mv-items-center">
                <div className="mv-basis-6/12 mv-px-4">
                  <Button
                    type="submit"
                    // Don't disable button when js is disabled
                    disabled={
                      isHydrated
                        ? setPasswordForm.dirty === false ||
                          setPasswordForm.valid === false
                        : false
                    }
                  >
                    {locales.form.label.submit}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </>
    </Form>
  );
}
