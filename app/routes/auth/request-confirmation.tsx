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
import { detectLanguage } from "~/i18n.server";
import { useIsSubmitting } from "~/lib/hooks/useIsSubmitting";
import {
  insertComponentsIntoLocale,
  insertParametersIntoLocale,
} from "~/lib/utils/i18n";
import { languageModuleMap } from "~/locales/.server";
import { createAuthClient, getSessionUser } from "../../auth.server";
import { requestConfirmation } from "./request-confirmation.server";
import { createRequestConfirmationSchema } from "./request-confirmation.shared";

export const loader = async (args: LoaderFunctionArgs) => {
  const { request } = args;

  const { authClient } = createAuthClient(request);
  const sessionUser = await getSessionUser(authClient);
  if (sessionUser !== null) {
    return redirect("/dashboard");
  }

  const language = await detectLanguage(request);
  const locales = languageModuleMap[language]["auth/request-confirmation"];

  return { locales, currentTimestamp: Date.now() };
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const language = await detectLanguage(request);
  const locales = languageModuleMap[language]["auth/request-confirmation"];
  const { authClient } = createAuthClient(request);

  // Conform
  const formData = await request.formData();
  const { submission } = await requestConfirmation({
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

export default function RequestConfirmation() {
  const actionData = useActionData<typeof action>();
  const loaderData = useLoaderData<typeof loader>();
  const { locales, currentTimestamp } = loaderData;
  const navigation = useNavigation();
  const isHydrated = useHydrated();
  const isSubmitting = useIsSubmitting();
  const [urlSearchParams] = useSearchParams();
  const loginRedirect = urlSearchParams.get("login_redirect");
  const type = urlSearchParams.get("type");

  const [requestConfirmationForm, requestConfirmationFields] = useForm({
    id: `request-confirmation-${currentTimestamp}`,
    constraint: getZodConstraint(createRequestConfirmationSchema(locales)),
    defaultValue: {
      loginRedirect: loginRedirect,
      type: type,
    },
    shouldValidate: "onBlur",
    shouldRevalidate: "onInput",
    lastResult: navigation.state === "idle" ? actionData?.submission : null,
    onValidate({ formData }) {
      const submission = parseWithZod(formData, {
        schema: createRequestConfirmationSchema(locales),
      });
      return submission;
    },
  });

  return (
    <div className="w-full mx-auto px-4 @sm:max-w-screen-container-sm @md:max-w-screen-container-md @lg:max-w-screen-container-lg @xl:max-w-screen-container-xl @xl:px-6 @2xl:max-w-screen-container-2xl relative">
      <div className="flex flex-col w-full items-center">
        <div className="w-full @sm:w-2/3 @md:w-1/2 @2xl:w-1/3">
          <h1 className="mb-8">{locales.content.headline}</h1>
          {typeof actionData !== "undefined" &&
          typeof actionData.submission.status !== "undefined" &&
          actionData.submission.status === "success" ? (
            <p>
              {insertComponentsIntoLocale(
                insertParametersIntoLocale(locales.content.success, {
                  email: actionData.email,
                  systemMail: actionData.systemMail,
                  supportMail: actionData.supportMail,
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
          ) : (
            <Form
              {...getFormProps(requestConfirmationForm)}
              method="post"
              preventScrollReset
              autoComplete="off"
            >
              <p className="mb-4">{locales.content.description}</p>
              <div className="mb-10">
                <Input
                  {...getInputProps(requestConfirmationFields.email, {
                    type: "text",
                  })}
                  key="email"
                >
                  <Input.Label htmlFor={requestConfirmationFields.email.id}>
                    {locales.content.emailLabel}
                  </Input.Label>
                  {typeof requestConfirmationFields.email.errors !==
                    "undefined" &&
                  requestConfirmationFields.email.errors.length > 0
                    ? requestConfirmationFields.email.errors.map((error) => (
                        <Input.Error
                          id={requestConfirmationFields.email.errorId}
                          key={error}
                        >
                          {error}
                        </Input.Error>
                      ))
                    : null}
                </Input>
              </div>
              {typeof requestConfirmationForm.errors !== "undefined" &&
              requestConfirmationForm.errors.length > 0 ? (
                <div className="mb-10">
                  {requestConfirmationForm.errors.map((error, index) => {
                    return (
                      <div
                        id={requestConfirmationForm.errorId}
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
                {...getInputProps(requestConfirmationFields.loginRedirect, {
                  type: "hidden",
                })}
                key="loginRedirect"
              />
              <input
                {...getInputProps(requestConfirmationFields.type, {
                  type: "hidden",
                })}
                key="type"
              />
              <div className="flex flex-row -mx-4 mb-8 items-center">
                <div className="basis-6/12 px-4">
                  <Button
                    type="submit"
                    // Don't disable button when js is disabled
                    disabled={
                      isHydrated
                        ? requestConfirmationForm.dirty === false ||
                          requestConfirmationForm.valid === false ||
                          isSubmitting
                        : false
                    }
                  >
                    {locales.content.cta}
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
