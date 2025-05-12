import { getFormProps, getInputProps, useForm } from "@conform-to/react-v1";
import { getZodConstraint, parseWithZod } from "@conform-to/zod-v1";
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

export const createRequestPasswordChangeSchema = (
  locales: ResetPasswordLocales
) => {
  return z.object({
    email: z.string().email(locales.validation.email),
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
    shouldValidate: "onInput",
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
    <div className="mv-w-full mv-mx-auto mv-px-4 @sm:mv-max-w-screen-container-sm @md:mv-max-w-screen-container-md @lg:mv-max-w-screen-container-lg @xl:mv-max-w-screen-container-xl @xl:mv-px-6 @2xl:mv-max-w-screen-container-2xl relative z-10">
      <div className="mv-flex mv-flex-col mv-w-full mv-items-center">
        <div className="mv-w-full @sm:mv-w-2/3 @md:mv-w-1/2 @2xl:mv-w-1/3">
          <div className="mv-mb-6 mv-mt-12">
            <Link
              to={`/login${
                loginRedirect ? `?login_redirect=${loginRedirect}` : ""
              }`}
              className="text-primary font-bold"
            >
              {locales.login}
            </Link>
          </div>
          <h1 className="mb-8">{locales.response.headline}</h1>
          {typeof actionData !== "undefined" &&
          typeof actionData.submission.status !== "undefined" &&
          actionData.submission.status === "success" ? (
            <>
              <p className="mv-mb-4">
                {insertComponentsIntoLocale(
                  insertParametersIntoLocale(locales.response.success, {
                    email: actionData.email,
                    systemMail: actionData.systemMail,
                    supportMail: actionData.supportMail,
                  }),
                  [
                    <span key="email-highlight" className="mv-font-semibold" />,
                    <a
                      key="support-mail-link"
                      href="mailto:{{supportMail}}"
                      className="mv-text-primary mv-font-semibold hover:mv-underline"
                    >
                      {" "}
                    </a>,
                  ]
                )}
              </p>
              <p>
                {insertComponentsIntoLocale(locales.response.notice, [
                  <span key="mint-id-highlight" className="mv-font-semibold" />,
                  <a
                    key="support-mail-link"
                    href="https://mint-id.org/"
                    rel="noopener noreferrer"
                    target="_blank"
                    className="mv-text-primary mv-font-semibold hover:mv-underline"
                  >
                    {" "}
                  </a>,
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
              <p className="mv-mb-4">{locales.form.intro}</p>
              <div className="mv-mb-10">
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
                <div className="mv-mb-10">
                  {requestPasswordChangeForm.errors.map((error, index) => {
                    return (
                      <div
                        id={requestPasswordChangeForm.errorId}
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
                {...getInputProps(requestPasswordChangeFields.loginRedirect, {
                  type: "hidden",
                })}
                key="loginRedirect"
              />
              <div className="mv-flex mv-flex-row -mv-mx-4 mv-mb-8 mv-items-center">
                <div className="mv-basis-6/12 mv-px-4">
                  <Button
                    type="submit"
                    // Don't disable button when js is disabled
                    disabled={
                      isHydrated
                        ? requestPasswordChangeForm.dirty === false ||
                          requestPasswordChangeForm.valid === false
                        : false
                    }
                  >
                    {locales.form.label.submit}
                  </Button>
                </div>
              </div>
            </Form>
          )}
        </div>
      </div>
    </div>
  );
}
