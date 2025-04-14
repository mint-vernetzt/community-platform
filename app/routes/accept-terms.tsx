import {
  redirect,
  type ActionFunctionArgs,
  type LoaderFunctionArgs,
} from "react-router";
import { useLoaderData, useSearchParams, useSubmit } from "react-router";
import { type SupabaseClient } from "@supabase/supabase-js";
import React from "react";
import { makeDomainFunction } from "domain-functions";
import { performMutation } from "remix-forms";
import { z } from "zod";
import { createAuthClient, getSessionUser } from "~/auth.server";
import { RemixFormsForm } from "~/components/RemixFormsForm/RemixFormsForm";
import { prismaClient } from "~/prisma.server";
import { detectLanguage } from "~/i18n.server";
import { languageModuleMap } from "~/locales/.server";
import { type AcceptTermsLocales } from "./accept-terms.server";
import { insertComponentsIntoLocale } from "~/lib/utils/i18n";

const schema = z.object({
  termsAccepted: z.boolean(),
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
      return { profile, locales };
    }
  }
  return redirect("/");
};

const createMutation = (locales: AcceptTermsLocales) => {
  return makeDomainFunction(
    schema,
    z.object({ authClient: z.unknown() })
  )(async (values, environment) => {
    const { termsAccepted } = values;
    const { authClient } = environment;

    if (!termsAccepted) {
      throw locales.error.notAccepted;
    }
    // TODO: can this type assertion be removed and proofen by code?
    const sessionUser = await getSessionUser(authClient as SupabaseClient);

    if (sessionUser === null) {
      throw locales.error.unauthorized;
    }
    await prismaClient.profile.update({
      where: { id: sessionUser.id },
      data: { termsAccepted, termsAcceptedAt: new Date() },
    });

    return values;
  });
};

export const action = async (args: ActionFunctionArgs) => {
  const { request } = args;

  const language = await detectLanguage(request);
  const locales = languageModuleMap[language]["accept-terms"];
  const { authClient } = createAuthClient(request);

  const result = await performMutation({
    request,
    schema,
    mutation: createMutation(locales),
    environment: { authClient: authClient },
  });

  if (result.success === true) {
    return redirect(result.data.redirectTo || "/dashboard");
  }
  return result;
};

function AcceptTerms() {
  const { locales } = useLoaderData<typeof loader>();
  const [urlSearchParams] = useSearchParams();
  const redirectTo = urlSearchParams.get("redirect_to");

  const submit = useSubmit();
  const handleKeyPress = (event: React.KeyboardEvent<HTMLFormElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      // TODO: fix type issue
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      if (event.target.getAttribute("name") !== "termsAccepted") {
        submit(event.currentTarget);
      }
    }
  };

  return (
    <div className="mv-w-full mv-mx-auto mv-px-4 @sm:mv-max-w-screen-container-sm @md:mv-max-w-screen-container-md @lg:mv-max-w-screen-container-lg @xl:mv-max-w-screen-container-xl @xl:mv-px-6 @2xl:mv-max-w-screen-container-2xl relative pt-20 pb-44">
      <div className="flex -mx-4 justify-center">
        <div className="@md:mv-shrink-0 @md:mv-grow-0 @md:mv-basis-1/2 px-4 pt-10 @lg:mv-pt-0">
          <h1 className="mb-4">{locales.content.headline}</h1>
          <RemixFormsForm
            method="post"
            schema={schema}
            onKeyDown={handleKeyPress}
          >
            {({ Field, Errors, register }) => (
              <>
                <div className="mb-8">
                  <div className="form-control checkbox-privacy">
                    <label className="label cursor-pointer items-start">
                      <input
                        name="redirectTo"
                        defaultValue={redirectTo || undefined}
                        hidden
                      />
                      <Field name="termsAccepted">
                        {({ Errors }) => {
                          const ForwardRefComponent = React.forwardRef<
                            HTMLInputElement,
                            React.DetailedHTMLProps<
                              React.InputHTMLAttributes<HTMLInputElement>,
                              HTMLInputElement
                            >
                          >((props, ref) => {
                            return (
                              <>
                                <input ref={ref} {...props} />
                              </>
                            );
                          });
                          ForwardRefComponent.displayName =
                            "ForwardRefComponent";
                          return (
                            <>
                              <ForwardRefComponent
                                type="checkbox"
                                className="checkbox checkbox-primary mr-4"
                                {...register("termsAccepted")}
                              />
                              <Errors />
                            </>
                          );
                        }}
                      </Field>
                      <span className="label-text">
                        {insertComponentsIntoLocale(
                          locales.content.confirmation,
                          [
                            <a
                              key="terms-of-use-confirmation"
                              href="https://mint-vernetzt.de/terms-of-use-community-platform"
                              target="_blank"
                              rel="noreferrer"
                              className="text-primary font-bold hover:underline"
                            >
                              {" "}
                            </a>,
                            <a
                              key="privacy-policy-confirmation"
                              href="https://mint-vernetzt.de/privacy-policy-community-platform"
                              target="_blank"
                              rel="noreferrer"
                              className="text-primary font-bold hover:underline"
                            >
                              {" "}
                            </a>,
                          ]
                        )}
                      </span>
                    </label>
                  </div>
                </div>
                <div className="mb-8">
                  <button type="submit" className="btn btn-primary">
                    {locales.content.submit}
                  </button>
                </div>
                <Errors />
              </>
            )}
          </RemixFormsForm>
        </div>
      </div>
    </div>
  );
}

export default AcceptTerms;
