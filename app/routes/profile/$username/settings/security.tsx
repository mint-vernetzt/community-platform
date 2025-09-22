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
} from "react-router";
import { useHydrated } from "remix-utils/use-hydrated";
import { z } from "zod";
import {
  createAuthClient,
  getSessionUserOrRedirectPathToLogin,
  getSessionUserOrThrow,
} from "~/auth.server";
import { ShowPasswordButton } from "~/components-next/ShowPasswordButton";
import { PrivateVisibility } from "~/components-next/icons/PrivateVisibility";
import { PublicVisibility } from "~/components-next/icons/PublicVisibility";
import { detectLanguage } from "~/i18n.server";
import { useIsSubmitting } from "~/lib/hooks/useIsSubmitting";
import { insertComponentsIntoLocale } from "~/lib/utils/i18n";
import { invariantResponse } from "~/lib/utils/response";
import { getParamValueOrThrow } from "~/lib/utils/routes";
import { languageModuleMap } from "~/locales/.server";
import { redirectWithToast } from "~/toast.server";
import { deriveProfileMode } from "../utils.server";
import {
  changeEmail,
  changePassword,
  getProfileByUsername,
  type ProfileSecurityLocales,
} from "./security.server";

export const changeEmailSchema = (locales: ProfileSecurityLocales) => {
  return z.object({
    email: z
      .string({
        message: locales.validation.email.required,
      })
      .trim()
      .min(1, locales.validation.email.min)
      .email(locales.validation.email.required),
    confirmEmail: z
      .string({
        message: locales.validation.confirmEmail.required,
      })
      .trim()
      .min(1, locales.validation.confirmEmail.min)
      .email(locales.validation.confirmEmail.required),
  });
};

export const changePasswordSchema = (locales: ProfileSecurityLocales) => {
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
  });
};

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  const { authClient } = createAuthClient(request);

  const username = getParamValueOrThrow(params, "username");
  const profile = await getProfileByUsername(username);
  if (profile === null) {
    invariantResponse(false, "Profile not found", { status: 404 });
  }
  const { sessionUser, redirectPath } =
    await getSessionUserOrRedirectPathToLogin(authClient, request);

  if (sessionUser === null && redirectPath !== null) {
    return redirect(redirectPath);
  }
  const mode = await deriveProfileMode(sessionUser, username);
  invariantResponse(mode === "owner", "Not privileged", { status: 403 });

  const language = await detectLanguage(request);
  const locales =
    languageModuleMap[language]["profile/$username/settings/security"];

  const provider = sessionUser.app_metadata.provider || "email";

  return { provider, locales, currentTimestamp: Date.now() };
};

export const action = async ({ request, params }: ActionFunctionArgs) => {
  const language = await detectLanguage(request);
  const locales =
    languageModuleMap[language]["profile/$username/settings/security"];
  const { authClient } = createAuthClient(request);
  const username = getParamValueOrThrow(params, "username");
  const sessionUser = await getSessionUserOrThrow(authClient);
  const mode = await deriveProfileMode(sessionUser, username);
  invariantResponse(mode === "owner", locales.error.notPrivileged, {
    status: 403,
  });

  invariantResponse(
    sessionUser.app_metadata.provider !== "keycloak",
    locales.error.notAllowed,
    { status: 403 }
  );

  let result;
  const formData = await request.formData();
  const intent = formData.get("intent");
  invariantResponse(typeof intent === "string", locales.error.noStringIntent, {
    status: 400,
  });

  if (intent === "change-email") {
    result = await changeEmail({
      formData,
      sessionUser,
      locales,
    });
  } else if (intent === "change-password") {
    result = await changePassword({
      formData,
      sessionUser,
      locales,
    });
  } else {
    invariantResponse(false, locales.error.wrongIntent, {
      status: 400,
    });
  }

  if (
    result.submission !== undefined &&
    result.submission.status === "success" &&
    result.toast !== undefined
  ) {
    return redirectWithToast(request.url, result.toast);
  }
  return { submission: result.submission, currentTimestamp: Date.now() };
};

export default function Security() {
  const loaderData = useLoaderData<typeof loader>();
  const { locales, currentTimestamp } = loaderData;
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = useIsSubmitting();
  const isHydrated = useHydrated();

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [changePasswordForm, changePasswordFields] = useForm({
    id: `change-password-form-${
      actionData?.currentTimestamp || currentTimestamp
    }`,
    constraint: getZodConstraint(changePasswordSchema(locales)),
    shouldValidate: "onBlur",
    onValidate: (values) => {
      const submission = parseWithZod(values.formData, {
        schema: changePasswordSchema(locales).transform((data, ctx) => {
          if (data.password !== data.confirmPassword) {
            ctx.addIssue({
              code: "custom",
              message: locales.error.passwordMismatch,
              path: ["confirmPassword"],
            });
            return z.NEVER;
          }

          return { ...data };
        }),
      });
      return submission;
    },
    shouldRevalidate: "onInput",
    lastResult: navigation.state === "idle" ? actionData?.submission : null,
  });

  const [changeEmailForm, changeEmailFields] = useForm({
    id: `change-email-form-${actionData?.currentTimestamp || currentTimestamp}`,
    constraint: getZodConstraint(changeEmailSchema(locales)),
    shouldValidate: "onBlur",
    onValidate: (values) => {
      const submission = parseWithZod(values.formData, {
        schema: changeEmailSchema(locales).transform((data, ctx) => {
          if (data.email !== data.confirmEmail) {
            ctx.addIssue({
              code: "custom",
              message: locales.error.emailsDontMatch,
              path: ["confirmEmail"],
            });
            return z.NEVER;
          }

          return { ...data };
        }),
      });
      return submission;
    },
    shouldRevalidate: "onInput",
    lastResult: navigation.state === "idle" ? actionData?.submission : null,
  });

  return (
    <>
      <h1 className="mb-8">{locales.content.headline}</h1>
      {loaderData.provider === "keycloak" ? (
        <>
          <h4 className="mb-4 font-semibold">
            {locales.section.changePassword1.headline}
          </h4>
          <p className="mb-8">
            {insertComponentsIntoLocale(locales.section.changePassword1.intro, [
              <Link
                key="change-mint-id-password"
                to="https://mint-id.org"
                target="_blank"
                rel="noreferrer noopener"
                className="text-primary hover:underline"
              >
                {" "}
              </Link>,
            ])}
          </p>
        </>
      ) : (
        <>
          <h4 className="mb-4 font-semibold">
            {locales.section.changePassword2.headline}
          </h4>

          <p className="mb-8">{locales.section.changePassword2.intro}</p>

          <Form
            {...getFormProps(changePasswordForm)}
            method="post"
            autoComplete="off"
          >
            <div className="mb-4">
              <Input
                {...getInputProps(changePasswordFields.password, {
                  type: showPassword ? "text" : "password",
                })}
                key="password"
              >
                <Input.Label htmlFor={changePasswordFields.password.id}>
                  {locales.section.changePassword2.form.password.label}
                </Input.Label>
                {typeof changePasswordFields.password.errors !== "undefined" &&
                changePasswordFields.password.errors.length > 0
                  ? changePasswordFields.password.errors.map((error) => (
                      <Input.Error
                        id={changePasswordFields.password.errorId}
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
                            ? locales.section.changePassword2.form.hidePassword
                            : locales.section.changePassword2.form.showPassword
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
                {...getInputProps(changePasswordFields.confirmPassword, {
                  type: showConfirmPassword ? "text" : "password",
                })}
                key="confirmPassword"
              >
                <Input.Label htmlFor={changePasswordFields.confirmPassword.id}>
                  {locales.section.changePassword2.form.confirmPassword.label}
                </Input.Label>
                {typeof changePasswordFields.confirmPassword.errors !==
                  "undefined" &&
                changePasswordFields.confirmPassword.errors.length > 0
                  ? changePasswordFields.confirmPassword.errors.map((error) => (
                      <Input.Error
                        id={changePasswordFields.confirmPassword.errorId}
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
                            ? locales.section.changePassword2.form.hidePassword
                            : locales.section.changePassword2.form.showPassword
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
            <Button
              name="intent"
              value="change-password"
              type="submit"
              disabled={isSubmitting}
            >
              {locales.section.changePassword2.form.submit.label}
            </Button>
          </Form>

          <hr className="border-neutral-400 my-10 @lg:my-16" />

          <h4 className="mb-4 font-semibold">
            {locales.section.changeEmail.headline}
          </h4>

          <p className="mb-8">{locales.section.changeEmail.intro}</p>

          <Form
            {...getFormProps(changeEmailForm)}
            method="post"
            preventScrollReset
            autoComplete="off"
          >
            <div className="mb-4">
              <Input
                {...getInputProps(changeEmailFields.email, {
                  type: "email",
                })}
                key="email"
              >
                <Input.Label htmlFor={changeEmailFields.email.id}>
                  {locales.section.changeEmail.form.email.label}
                </Input.Label>
                {typeof changeEmailFields.email.errors !== "undefined" &&
                changeEmailFields.email.errors.length > 0
                  ? changeEmailFields.email.errors.map((error) => (
                      <Input.Error
                        id={changeEmailFields.email.errorId}
                        key={error}
                      >
                        {error}
                      </Input.Error>
                    ))
                  : null}
              </Input>
            </div>
            <div className="mb-10">
              <Input
                {...getInputProps(changeEmailFields.confirmEmail, {
                  type: "email",
                })}
                key="confirmEmail"
              >
                <Input.Label htmlFor={changeEmailFields.confirmEmail.id}>
                  {locales.section.changeEmail.form.confirmEmail.label}
                </Input.Label>
                {typeof changeEmailFields.confirmEmail.errors !== "undefined" &&
                changeEmailFields.confirmEmail.errors.length > 0
                  ? changeEmailFields.confirmEmail.errors.map((error) => (
                      <Input.Error
                        id={changeEmailFields.confirmEmail.errorId}
                        key={error}
                      >
                        {error}
                      </Input.Error>
                    ))
                  : null}
              </Input>
            </div>
            <Button
              name="intent"
              value="change-email"
              type="submit"
              disabled={isSubmitting}
            >
              {locales.section.changeEmail.form.submit.label}
            </Button>
          </Form>
        </>
      )}
    </>
  );
}
