import {
  json,
  redirect,
  type ActionFunctionArgs,
  type LoaderFunctionArgs,
} from "@remix-run/node";
import { useSearchParams, useSubmit } from "@remix-run/react";
import { type SupabaseClient } from "@supabase/supabase-js";
import React from "react";
import { makeDomainFunction } from "domain-functions";
import { performMutation } from "remix-forms";
import { z } from "zod";
import { createAuthClient, getSessionUser } from "~/auth.server";
import { RemixFormsForm } from "~/components/RemixFormsForm/RemixFormsForm";
import { prismaClient } from "~/prisma.server";
import { type TFunction } from "i18next";
import i18next from "~/i18next.server";
import { Trans, useTranslation } from "react-i18next";
import { detectLanguage } from "~/root.server";

const i18nNS = ["routes-accept-terms"] as const;
export const handle = {
  i18n: i18nNS,
};

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
      return json({ profile });
    }
  }
  return redirect("/");
};

const createMutation = (t: TFunction) => {
  return makeDomainFunction(
    schema,
    z.object({ authClient: z.unknown() })
  )(async (values, environment) => {
    const { termsAccepted } = values;
    const { authClient } = environment;

    if (!termsAccepted) {
      throw t("error.notAccepted");
    }
    // TODO: can this type assertion be removed and proofen by code?
    const sessionUser = await getSessionUser(authClient as SupabaseClient);

    if (sessionUser === null) {
      throw t("error.unauthorized");
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

  const locale = await detectLanguage(request);
  const t = await i18next.getFixedT(locale, i18nNS);
  const { authClient } = createAuthClient(request);

  const result = await performMutation({
    request,
    schema,
    mutation: createMutation(t),
    environment: { authClient: authClient },
  });

  if (result.success === true) {
    return redirect(result.data.redirectTo || "/dashboard");
  }
  return result;
};

function AcceptTerms() {
  const [urlSearchParams] = useSearchParams();
  const redirectTo = urlSearchParams.get("redirect_to");

  const submit = useSubmit();
  const handleKeyPress = (event: React.KeyboardEvent<HTMLFormElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      // TODO: Type issue
      // @ts-ignore
      if (event.target.getAttribute("name") !== "termsAccepted") {
        submit(event.currentTarget);
      }
    }
  };

  const { t } = useTranslation(i18nNS);

  return (
    <div className="mv-w-full mv-mx-auto mv-px-4 @sm:mv-max-w-screen-container-sm @md:mv-max-w-screen-container-md @lg:mv-max-w-screen-container-lg @xl:mv-max-w-screen-container-xl @xl:mv-px-6 @2xl:mv-max-w-screen-container-2xl relative pt-20 pb-44">
      <div className="flex -mx-4 justify-center">
        <div className="@md:mv-shrink-0 @md:mv-grow-0 @md:mv-basis-1/2 px-4 pt-10 @lg:mv-pt-0">
          <h1 className="mb-4">{t("content.headline")}</h1>
          <RemixFormsForm
            method="post"
            schema={schema}
            hiddenFields={["redirectTo"]}
            values={{
              redirectTo: redirectTo,
            }}
            onKeyDown={handleKeyPress}
          >
            {({ Field, Errors, register }) => (
              <>
                <div className="mb-8">
                  <div className="form-control checkbox-privacy">
                    <label className="label cursor-pointer items-start">
                      <Field name="redirectTo" />
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
                        <Trans
                          i18nKey="content.confirmation"
                          ns={i18nNS}
                          components={[
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
                          ]}
                        />
                      </span>
                    </label>
                  </div>
                </div>
                <div className="mb-8">
                  <button type="submit" className="btn btn-primary">
                    {t("content.submit")}
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
