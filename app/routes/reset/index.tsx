import { getFormProps, getInputProps, useForm } from "@conform-to/react";
import { getZodConstraint, parseWithZod } from "@conform-to/zod";
import { Button } from "@mint-vernetzt/components/src/molecules/Button";
import { Input } from "@mint-vernetzt/components/src/molecules/Input";
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
import { detectLanguage } from "~/i18n.server";
import {
  insertComponentsIntoLocale,
  insertParametersIntoLocale,
} from "~/lib/utils/i18n";
import { languageModuleMap } from "~/locales/.server";
import { createAuthClient, getSessionUser } from "../../auth.server";
import {
  requestPasswordChange,
  type ResetPasswordLocales,
} from "./index.server";
import { useIsSubmitting } from "~/lib/hooks/useIsSubmitting";

export const createRequestPasswordChangeSchema = (
  locales: ResetPasswordLocales
) => {
  return z.object({
    email: z
      .string({
        message: locales.validation.email,
      })
      .trim()
      .email(locales.validation.email),
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
  const locales = languageModuleMap[language]["reset/index"];

  return { locales, currentTimestamp: Date.now() };
};

export const action = async (args: ActionFunctionArgs) => {
  const { request } = args;
  const { authClient } = createAuthClient(request);

  const language = await detectLanguage(request);
  const locales = languageModuleMap[language]["reset/index"];

  // Conform
  const formData = await request.formData();
  const { submission } = await requestPasswordChange({
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

export default function Index() {
  const actionData = useActionData<typeof action>();
  const loaderData = useLoaderData<typeof loader>();
  const { locales, currentTimestamp } = loaderData;
  const navigation = useNavigation();
  const isHydrated = useHydrated();
  const isSubmitting = useIsSubmitting();
  const [urlSearchParams] = useSearchParams();
  const loginRedirect = urlSearchParams.get("login_redirect");

  const [requestPasswordChangeForm, requestPasswordChangeFields] = useForm({
    id: `request-password-change-${
      actionData?.currentTimestamp || currentTimestamp
    }`,
    constraint: getZodConstraint(createRequestPasswordChangeSchema(locales)),
    defaultValue: {
      loginRedirect: loginRedirect,
    },
    shouldValidate: "onBlur",
    shouldRevalidate: "onInput",
    lastResult: navigation.state === "idle" ? actionData?.submission : null,
    onValidate({ formData }) {
      const submission = parseWithZod(formData, {
        schema: createRequestPasswordChangeSchema(locales),
      });
      return submission;
    },
  });

  return (
    <div className="w-full mx-auto px-4 @sm:max-w-screen-container-sm @md:max-w-screen-container-md @lg:max-w-screen-container-lg @xl:max-w-screen-container-xl @xl:px-6 @2xl:max-w-screen-container-2xl relative">
      <div className="flex flex-col w-full items-center">
        <div className="w-full @sm:w-2/3 @md:w-1/2 @2xl:w-1/3">
          <div className="mb-6 mt-12">
            <Link
              to={`/login${
                loginRedirect !== null ? `?login_redirect=${loginRedirect}` : ""
              }`}
              className="text-primary font-bold"
              prefetch="intent"
            >
              {locales.login}
            </Link>
          </div>
          <h1 className="mb-8">{locales.response.headline}</h1>
          {typeof actionData !== "undefined" &&
          typeof actionData.submission.status !== "undefined" &&
          actionData.submission.status === "success" ? (
            <>
              <p className="mb-4">
                {insertComponentsIntoLocale(
                  insertParametersIntoLocale(locales.response.success, {
                    email: actionData.email,
                    systemMail: actionData.systemMail,
                  }),
                  [
                    <span key="email-highlight" className="font-semibold" />,
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
              <p>
                {insertComponentsIntoLocale(locales.response.notice, [
                  <span key="mint-id-highlight" className="font-semibold" />,
                  <Link
                    key="support-mail-link"
                    to="https://mint-id.org/"
                    rel="noopener noreferrer"
                    target="_blank"
                    className="text-primary font-semibold hover:underline"
                  >
                    {" "}
                  </Link>,
                ])}
              </p>
            </>
          ) : (
            <Form
              {...getFormProps(requestPasswordChangeForm)}
              method="post"
              preventScrollReset
              autoComplete="off"
            >
              <p className="mb-4">{locales.form.intro}</p>
              <div className="mb-10">
                <Input
                  {...getInputProps(requestPasswordChangeFields.email, {
                    type: "text",
                  })}
                  key="email"
                >
                  <Input.Label htmlFor={requestPasswordChangeFields.email.id}>
                    {locales.form.label.email}
                  </Input.Label>
                  {typeof requestPasswordChangeFields.email.errors !==
                    "undefined" &&
                  requestPasswordChangeFields.email.errors.length > 0
                    ? requestPasswordChangeFields.email.errors.map((error) => (
                        <Input.Error
                          id={requestPasswordChangeFields.email.errorId}
                          key={error}
                        >
                          {error}
                        </Input.Error>
                      ))
                    : null}
                </Input>
              </div>
              {typeof requestPasswordChangeForm.errors !== "undefined" &&
              requestPasswordChangeForm.errors.length > 0 ? (
                <div className="mb-10">
                  {requestPasswordChangeForm.errors.map((error, index) => {
                    return (
                      <div
                        id={requestPasswordChangeForm.errorId}
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
                {...getInputProps(requestPasswordChangeFields.loginRedirect, {
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
                      ? requestPasswordChangeForm.dirty === false ||
                        requestPasswordChangeForm.valid === false ||
                        isSubmitting
                      : false
                  }
                >
                  {locales.form.label.submit}
                </Button>
              </div>
            </Form>
          )}
        </div>
      </div>
    </div>
  );
}
