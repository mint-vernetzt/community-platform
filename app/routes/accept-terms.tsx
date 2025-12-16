import { getFormProps, getInputProps, useForm } from "@conform-to/react";
import { getZodConstraint, parseWithZod } from "@conform-to/zod";
import { Button } from "@mint-vernetzt/components/src/molecules/Button";
import {
  Form,
  Link,
  redirect,
  useActionData,
  useLoaderData,
  useNavigation,
  useSearchParams,
  type ActionFunctionArgs,
  type LoaderFunctionArgs,
} from "react-router";
import { useHydrated } from "remix-utils/use-hydrated";
import { z } from "zod";
import {
  createAuthClient,
  getSessionUser,
  getSessionUserOrThrow,
} from "~/auth.server";
import { detectLanguage } from "~/i18n.server";
import { insertComponentsIntoLocale } from "~/lib/utils/i18n";
import { languageModuleMap } from "~/locales/.server";
import { prismaClient } from "~/prisma.server";
import { acceptTerms } from "./accept-terms.server";
import { useIsSubmitting } from "~/lib/hooks/useIsSubmitting";
import { Checkbox } from "~/components-next/Checkbox";
import { acceptTermsSchema } from "./accept-terms.shared";

export const loader = async (args: LoaderFunctionArgs) => {
  const { request } = args;

  const { authClient } = createAuthClient(request);
  const sessionUser = await getSessionUser(authClient);

  if (sessionUser !== null) {
    const profile = await prismaClient.profile.findFirst({
      where: { id: sessionUser.id },
      select: { termsAccepted: true },
    });
    if (profile !== null) {
      if (profile.termsAccepted === true) {
        return redirect("/dashboard");
      }
      const language = await detectLanguage(request);
      const locales = languageModuleMap[language]["accept-terms"];
      return { profile, locales, currentTimestamp: Date.now() };
    }
  }
  return redirect("/");
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { authClient } = createAuthClient(request);
  const sessionUser = await getSessionUserOrThrow(authClient);

  const language = await detectLanguage(request);
  const locales = languageModuleMap[language]["accept-terms"];

  const formData = await request.formData();
  const { submission } = await acceptTerms({
    formData,
    sessionUser,
    locales,
  });

  if (submission.status !== "success") {
    return submission.reply();
  }
  if (typeof submission.value.redirectTo !== "undefined") {
    return redirect(submission.value.redirectTo);
  }
  return redirect("/dashboard");
};

export default function AcceptTerms() {
  const actionData = useActionData<typeof action>();
  const loaderData = useLoaderData<typeof loader>();
  const { locales, currentTimestamp } = loaderData;
  const navigation = useNavigation();
  const isHydrated = useHydrated();
  const isSubmitting = useIsSubmitting();
  const [urlSearchParams] = useSearchParams();
  const redirectTo = urlSearchParams.get("redirect_to");

  const [acceptTermsForm, acceptTermsFields] = useForm({
    id: `accept-terms-${currentTimestamp}`,
    constraint: getZodConstraint(acceptTermsSchema),
    defaultValue: {
      redirectTo: redirectTo,
    },
    shouldValidate: "onBlur",
    shouldRevalidate: "onInput",
    lastResult: navigation.state === "idle" ? actionData : null,
    onValidate({ formData }) {
      const submission = parseWithZod(formData, {
        schema: acceptTermsSchema.transform((data, ctx) => {
          if (data.termsAccepted === false) {
            ctx.addIssue({
              code: "custom",
              message: locales.error.notAccepted,
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
      {...getFormProps(acceptTermsForm)}
      method="post"
      preventScrollReset
      autoComplete="off"
    >
      <>
        <div className="w-full mx-auto px-4 @sm:max-w-screen-container-sm @md:max-w-screen-container-md @lg:max-w-screen-container-lg @xl:max-w-screen-container-xl @xl:px-6 @2xl:max-w-screen-container-2xl relative">
          <div className="flex flex-col w-full items-center">
            <div className="w-full @sm:w-2/3 @md:w-1/2 @2xl:w-1/3">
              <h1 className="mb-8">{locales.content.headline}</h1>
              <div className="mb-4">
                <div className="flex gap-2 items-center">
                  <Checkbox
                    {...getInputProps(acceptTermsFields.termsAccepted, {
                      type: "checkbox",
                    })}
                    required
                    key="termsAccepted"
                  />
                  <label htmlFor={acceptTermsFields.termsAccepted.id}>
                    {insertComponentsIntoLocale(locales.content.confirmation, [
                      <Link
                        key="terms-of-use-confirmation"
                        to="https://mint-vernetzt.de/terms-of-use-community-platform"
                        target="_blank"
                        rel="noreferrer noopener"
                        className="text-primary font-semibold hover:underline"
                      >
                        {" "}
                      </Link>,
                      <Link
                        key="privacy-policy-confirmation"
                        to="https://mint-vernetzt.de/privacy-policy-community-platform"
                        target="_blank"
                        rel="noreferrer noopener"
                        className="text-primary font-semibold hover:underline"
                      >
                        {" "}
                      </Link>,
                    ])}
                  </label>
                </div>
              </div>
              {typeof acceptTermsForm.errors !== "undefined" &&
              acceptTermsForm.errors.length > 0 ? (
                <div className="mb-10">
                  {acceptTermsForm.errors.map((error, index) => {
                    return (
                      <div
                        id={acceptTermsForm.errorId}
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
                {...getInputProps(acceptTermsFields.redirectTo, {
                  type: "hidden",
                })}
                key="redirectTo"
              />
              <div className="flex flex-row mb-8 items-center justify-end">
                <Button
                  type="submit"
                  // Don't disable button when js is disabled
                  disabled={
                    isHydrated
                      ? acceptTermsForm.dirty === false ||
                        acceptTermsForm.valid === false ||
                        isSubmitting
                      : false
                  }
                >
                  {locales.content.submit}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </>
    </Form>
  );
}
