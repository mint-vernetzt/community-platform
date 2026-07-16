import { getFormProps, getInputProps, useForm } from "@conform-to/react";
import { getZodConstraint, parseWithZod } from "@conform-to/zod";
import { Button } from "@mint-vernetzt/components/src/molecules/Button";
import {
  type ActionFunctionArgs,
  Form,
  Link,
  type LoaderFunctionArgs,
  redirect,
  useActionData,
  useLoaderData,
  useNavigation,
  useSearchParams,
} from "react-router";
import { useHydrated } from "remix-utils/use-hydrated";
import { createAuthClient, getSessionUser } from "~/auth.server";
import { useIsSubmitting } from "~/lib/hooks/useIsSubmitting";
import { invariantResponse } from "~/lib/utils/response";
import { languageModuleMap } from "~/locales/.server";
import { detectLanguage } from "~/root.server";
import { isBotRequest } from "~/utils.server";
import { createRequestConfirmationSchema } from "./request-confirmation.shared";
import { HoneypotInputs } from "remix-utils/honeypot/react";
import { HONEYPOT_CLASSNAME } from "~/honeypot.shared";
import { Input } from "@mint-vernetzt/components/src/molecules/Input";
import { checkHoneypot } from "~/honeypot.server";
import {
  getGuestByConfirmationToken,
  requestConfirmation,
} from "./request-confirmation.server";
import { captureException } from "@sentry/node";
import {
  insertComponentsIntoLocale,
  insertParametersIntoLocale,
} from "~/lib/utils/i18n";
import { redirectWithToast } from "~/toast.server";

export async function loader(args: LoaderFunctionArgs) {
  const { request } = args;

  if (process.env.NODE_ENV !== "test") {
    const isBot = isBotRequest(request.headers.get("user-agent"));
    invariantResponse(
      isBot === false,
      "Bots are not allowed to access this resource",
      { status: 403 }
    );
  }

  // Shouldn't we add this to each anon route?
  const { authClient } = createAuthClient(request);
  const sessionUser = await getSessionUser(authClient);
  if (sessionUser !== null) {
    return redirect("/dashboard");
  }

  const language = await detectLanguage(request);
  const locales =
    languageModuleMap[language]["auth/guest/request-confirmation"];

  const url = new URL(request.url);
  const tokenHash = url.searchParams.get("token_hash");
  invariantResponse(tokenHash !== null, "Bad request", { status: 400 });

  const guest = await getGuestByConfirmationToken(tokenHash);
  invariantResponse(guest !== null, "No guest found", { status: 400 });

  return {
    locales,
    email: guest.email,
    eventId: guest.event.id,
    baseUrl: process.env.COMMUNITY_BASE_URL,
  };
}

export async function action(args: ActionFunctionArgs) {
  const { request } = args;

  const language = await detectLanguage(request);
  const locales =
    languageModuleMap[language]["auth/guest/request-confirmation"];

  const formData = await request.formData();

  if (process.env.NODE_ENV !== "test") {
    await checkHoneypot(formData);
    const isBot = isBotRequest(request.headers.get("user-agent"));
    invariantResponse(
      isBot === false,
      "Bots are not allowed to access this resource",
      { status: 403 }
    );
  }

  const submission = parseWithZod(formData, {
    schema: createRequestConfirmationSchema({
      baseUrl: process.env.COMMUNITY_BASE_URL,
      locales,
    }),
  });

  if (submission.status !== "success") {
    return { submission: submission.reply() };
  }

  try {
    const result = await requestConfirmation({
      email: submission.value.email,
      eventId: submission.value.eventId,
      confirmationRedirect: submission.value.confirmationRedirect,
      locales: {
        mail: {
          confirmRegistration: {
            subject: locales.mail.confirmRegistration.subject,
          },
        },
      },
    });
    return {
      submission: submission.reply(),
      email: result.email,
      eventName: result.event.name,
      systemMail: process.env.SYSTEM_MAIL_SENDER,
      supportMail: process.env.SUPPORT_MAIL,
    };
  } catch (error) {
    captureException(error);
    return redirectWithToast(request.url, {
      id: "request-confirmation-error",
      key: `request-confirmation-error-${Date.now()}`,
      message: locales.errors.requestConfirmation,
      level: "negative",
    });
  }
}

function GuestRequestConfirmation() {
  const loaderData = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const { locales, baseUrl } = loaderData;
  const navigation = useNavigation();
  const isHydrated = useHydrated();
  const isSubmitting = useIsSubmitting();
  const [urlSearchParams] = useSearchParams();
  const confirmationRedirect = urlSearchParams.get("confirmation_redirect");

  const [form, fields] = useForm({
    id: "request-confirmation-form",
    constraint: getZodConstraint(
      createRequestConfirmationSchema({ baseUrl, locales })
    ),
    defaultValue: {
      email: loaderData.email,
      eventId: loaderData.eventId,
      confirmationRedirect,
    },
    shouldValidate: "onBlur",
    shouldRevalidate: "onInput",
    lastResult: navigation.state === "idle" ? actionData?.submission : null,
    onValidate({ formData }) {
      const submission = parseWithZod(formData, {
        schema: createRequestConfirmationSchema({ baseUrl, locales }),
      });
      return submission;
    },
  });

  return (
    <div className="w-full mx-auto px-4 @sm:max-w-sm @md:max-w-md @lg:max-w-lg @xl:max-w-xl @xl:px-6 @2xl:max-w-2xl relative">
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
              {...getFormProps(form)}
              method="post"
              preventScrollReset
              autoComplete="off"
            >
              <HoneypotInputs className={HONEYPOT_CLASSNAME} />
              <p className="mb-4">{locales.content.description}</p>
              <div className="mb-10">
                <Input
                  {...getInputProps(fields.email, {
                    type: "text",
                  })}
                  key="email"
                >
                  <Input.Label htmlFor={fields.email.id}>
                    {locales.content.emailLabel}
                  </Input.Label>
                  {typeof fields.email.errors !== "undefined" &&
                  fields.email.errors.length > 0
                    ? fields.email.errors.map((error) => (
                        <Input.Error id={fields.email.errorId} key={error}>
                          {error}
                        </Input.Error>
                      ))
                    : null}
                </Input>
              </div>
              {typeof form.errors !== "undefined" && form.errors.length > 0 && (
                <div className="mb-10">
                  {form.errors.map((error, index) => {
                    return (
                      <div
                        id={form.errorId}
                        key={index}
                        className="text-sm font-semibold text-negative-700"
                      >
                        {error}
                      </div>
                    );
                  })}
                </div>
              )}
              <input
                {...getInputProps(fields.confirmationRedirect, {
                  type: "hidden",
                })}
                key="confirmationRedirect"
              />
              <input
                {...getInputProps(fields.eventId, {
                  type: "hidden",
                })}
                key="eventId"
              />
              <div className="flex flex-row -mx-4 mb-8 items-center">
                <div className="basis-6/12 px-4">
                  <Button
                    type="submit"
                    // Don't disable button when js is disabled
                    disabled={
                      isHydrated ? form.valid === false || isSubmitting : false
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

export default GuestRequestConfirmation;
