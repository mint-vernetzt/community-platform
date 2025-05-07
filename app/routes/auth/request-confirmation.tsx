import { getFormProps, getInputProps, useForm } from "@conform-to/react-v1";
import { getZodConstraint, parseWithZod } from "@conform-to/zod-v1";
import { Button } from "@mint-vernetzt/components/src/molecules/Button";
import { Input } from "@mint-vernetzt/components/src/molecules/Input";
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
import { detectLanguage } from "~/i18n.server";
import { insertParametersIntoLocale } from "~/lib/utils/i18n";
import { languageModuleMap } from "~/locales/.server";
import { redirectWithToast } from "~/toast.server";
import { createAuthClient, getSessionUser } from "../../auth.server";
import {
  requestConfirmation,
  type RequestConfirmationLocales,
} from "./request-confirmation.server";

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

export const createRequestConfirmationSchema = (
  locales: RequestConfirmationLocales
) => {
  return z.object({
    type: z.enum(["signup", "email_change", "recovery"]),
    email: z.string().email(locales.validation.email),
    loginRedirect: z.string().optional(),
  });
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

  if (submission.status !== "success") {
    return {
      submission: submission.reply(),
      currentTimestamp: Date.now(),
    };
  }

  return redirectWithToast(request.url, {
    key: "request-confirmation-success",
    message: insertParametersIntoLocale(locales.action.success, {
      email: submission.value.email,
    }),
  });
};

export default function RequestConfirmation() {
  const actionData = useActionData<typeof action>();
  const loaderData = useLoaderData<typeof loader>();
  const { locales, currentTimestamp } = loaderData;
  const navigation = useNavigation();
  const isHydrated = useHydrated();
  const [urlSearchParams] = useSearchParams();
  const loginRedirect = urlSearchParams.get("login_redirect");
  const type = urlSearchParams.get("type");

  const [requestConfirmationForm, requestConfirmationFields] = useForm({
    id: `request-confirmation-${
      actionData?.currentTimestamp || currentTimestamp
    }`,
    constraint: getZodConstraint(createRequestConfirmationSchema(locales)),
    defaultValue: {
      loginRedirect: loginRedirect,
      type: type,
    },
    shouldValidate: "onInput",
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
    <Form
      {...getFormProps(requestConfirmationForm)}
      method="post"
      preventScrollReset
      autoComplete="off"
    >
      <div className="mv-w-full mv-mx-auto mv-px-4 mv-min-h-screen @sm:mv-max-w-screen-container-sm @md:mv-max-w-screen-container-md @lg:mv-max-w-screen-container-lg @xl:mv-max-w-screen-container-xl @xl:mv-px-6 @2xl:mv-max-w-screen-container-2xl relative z-10">
        <div className="mv-flex mv-flex-col mv-w-full mv-items-center">
          <div className="mv-w-full @sm:mv-w-2/3 @md:mv-w-1/2 @2xl:mv-w-1/3">
            <h1 className="mv-mb-8">{locales.content.headline}</h1>
            <p className="mv-mb-4">{locales.content.description}</p>
            <div className="mv-mb-10">
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
              <div className="mv-mb-10">
                {requestConfirmationForm.errors.map((error, index) => {
                  return (
                    <div
                      id={requestConfirmationForm.errorId}
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
            <div className="mv-flex mv-flex-row -mv-mx-4 mv-mb-8 mv-items-center">
              <div className="mv-basis-6/12 mv-px-4">
                <Button
                  type="submit"
                  // Don't disable button when js is disabled
                  disabled={
                    isHydrated
                      ? requestConfirmationForm.dirty === false ||
                        requestConfirmationForm.valid === false
                      : false
                  }
                >
                  {locales.content.cta}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Form>
  );
}
