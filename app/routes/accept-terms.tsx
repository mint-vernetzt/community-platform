import {
  type ActionArgs,
  json,
  type LoaderArgs,
  redirect,
} from "@remix-run/node";
import { useSearchParams, useSubmit } from "@remix-run/react";
import { type SupabaseClient } from "@supabase/supabase-js";
import React from "react";
import { makeDomainFunction } from "remix-domains";
import { Form as RemixForm, performMutation } from "remix-forms";
import { z } from "zod";
import { createAuthClient, getSessionUser } from "~/auth.server";
import { prismaClient } from "~/prisma.server";
import { TFunction } from "i18next";
import i18next from "~/i18next.server";
import { Trans, useTranslation } from "react-i18next";

const i18nNS = ["routes/accept-terms"];
export const handle = {
  i18n: i18nNS,
};

const schema = z.object({
  termsAccepted: z.boolean(),
  redirectTo: z.string().optional(),
});

export const loader = async (args: LoaderArgs) => {
  const { request } = args;

  const response = new Response();
  const authClient = createAuthClient(request, response);
  const sessionUser = await getSessionUser(authClient);

  if (sessionUser !== null) {
    const profile = await prismaClient.profile.findFirst({
      where: { id: sessionUser.id },
      select: { termsAccepted: true },
    });
    if (profile !== null) {
      if (profile.termsAccepted === true) {
        return redirect("/dashboard", { headers: response.headers });
      }
      return json({ profile }, { headers: response.headers });
    }
  }
  return redirect("/", { headers: response.headers });
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

export const action = async (args: ActionArgs) => {
  const { request } = args;
  const response = new Response();
  const authClient = createAuthClient(request, response);
  const t = await i18next.getFixedT(request, i18nNS);

  const result = await performMutation({
    request,
    schema,
    mutation: createMutation(t),
    environment: { authClient: authClient },
  });

  if (result.success === true) {
    return redirect(result.data.redirectTo || "/dashboard", {
      headers: response.headers,
    });
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
      // @ts-ignore TODO: Type issue
      if (event.target.getAttribute("name") !== "termsAccepted") {
        submit(event.currentTarget);
      }
    }
  };

  const { t } = useTranslation(i18nNS);

  return (
    <div className="container relative pt-20 pb-44">
      <div className="flex -mx-4 justify-center">
        <div className="md:flex-1/2 px-4 pt-10 lg:pt-0">
          <h1 className="mb-4">{t("content.headline")}</h1>
          <RemixForm
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
                            JSX.IntrinsicElements["input"]
                          >((props, ref) => {
                            return (
                              <>
                                <input
                                  // TODO: can this type assertion be removed and proofen by code?
                                  ref={ref as React.RefObject<HTMLInputElement>}
                                  {...props}
                                />
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
                              href="https://mint-vernetzt.de/terms-of-use-community-platform"
                              target="_blank"
                              rel="noreferrer"
                              className="text-primary font-bold hover:underline"
                            />,
                            <a
                              href="https://mint-vernetzt.de/privacy-policy-community-platform"
                              target="_blank"
                              rel="noreferrer"
                              className="text-primary font-bold hover:underline"
                            />,
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
          </RemixForm>
        </div>
      </div>
    </div>
  );
}

export default AcceptTerms;
