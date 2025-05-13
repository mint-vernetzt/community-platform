import { getFormProps, getInputProps, useForm } from "@conform-to/react-v1";
import { getZodConstraint, parseWithZod } from "@conform-to/zod-v1";
import { Button } from "@mint-vernetzt/components/src/molecules/Button";
import {
  Form,
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
import { checkboxSchema } from "~/lib/utils/schemas";
import { languageModuleMap } from "~/locales/.server";
import { prismaClient } from "~/prisma.server";
import { acceptTerms } from "./accept-terms.server";
import { FormControl } from "~/components-next/FormControl";
import { useIsSubmitting } from "~/lib/hooks/useIsSubmitting";

export const acceptTermsSchema = z.object({
  termsAccepted: checkboxSchema,
  redirectTo: z.string().optional(),
});

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
    return {
      submission: submission.reply(),
      currentTimestamp: Date.now(),
    };
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
    id: `accept-terms-${actionData?.currentTimestamp || currentTimestamp}`,
    constraint: getZodConstraint(acceptTermsSchema),
    defaultValue: {
      redirectTo: redirectTo,
    },
    shouldValidate: "onInput",
    shouldRevalidate: "onInput",
    lastResult: navigation.state === "idle" ? actionData?.submission : null,
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
        <div className="mv-w-full mv-mx-auto mv-px-4 @sm:mv-max-w-screen-container-sm @md:mv-max-w-screen-container-md @lg:mv-max-w-screen-container-lg @xl:mv-max-w-screen-container-xl @xl:mv-px-6 @2xl:mv-max-w-screen-container-2xl mv-relative mv-z-10">
          <div className="mv-flex mv-flex-col mv-w-full mv-items-center">
            <div className="mv-w-full @sm:mv-w-2/3 @md:mv-w-1/2 @2xl:mv-w-1/3">
              <h1 className="mv-mb-8">{locales.content.headline}</h1>
              <div className="mv-mb-4 -mv-ml-5">
                <FormControl
                  {...getInputProps(acceptTermsFields.termsAccepted, {
                    type: "checkbox",
                  })}
                  key="termsAccepted"
                  labelPosition="right"
                >
                  <FormControl.Label>
                    <div className="mv-pl-2">
                      {insertComponentsIntoLocale(
                        locales.content.confirmation,
                        [
                          <a
                            key="terms-of-use-confirmation"
                            href="https://mint-vernetzt.de/terms-of-use-community-platform"
                            target="_blank"
                            rel="noreferrer noopener"
                            className="mv-text-primary mv-font-semibold hover:mv-underline"
                          >
                            {" "}
                          </a>,
                          <a
                            key="privacy-policy-confirmation"
                            href="https://mint-vernetzt.de/privacy-policy-community-platform"
                            target="_blank"
                            rel="noreferrer noopener"
                            className="mv-text-primary mv-font-semibold hover:mv-underline"
                          >
                            {" "}
                          </a>,
                        ]
                      )}
                    </div>
                  </FormControl.Label>
                </FormControl>
              </div>
              {typeof acceptTermsForm.errors !== "undefined" &&
              acceptTermsForm.errors.length > 0 ? (
                <div className="mv-mb-10">
                  {acceptTermsForm.errors.map((error, index) => {
                    return (
                      <div
                        id={acceptTermsForm.errorId}
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
                {...getInputProps(acceptTermsFields.redirectTo, {
                  type: "hidden",
                })}
                key="redirectTo"
              />
              <div className="mv-flex mv-flex-row mv-mb-8 mv-items-center mv-justify-end">
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
