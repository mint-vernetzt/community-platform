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

const mutation = makeDomainFunction(
  schema,
  z.object({ authClient: z.unknown() })
)(async (values, environment) => {
  const { termsAccepted } = values;
  const { authClient } = environment;

  if (!termsAccepted) {
    throw "Bitte akzeptiere unsere Nutzungsbedingungen und bestätige, dass Du die Datenschutzerklärung gelesen hast.";
  }
  // TODO: can this type assertion be removed and proofen by code?
  const sessionUser = await getSessionUser(authClient as SupabaseClient);

  if (sessionUser === null) {
    throw "Nicht autorisiert.";
  }
  await prismaClient.profile.update({
    where: { id: sessionUser.id },
    data: { termsAccepted, termsAcceptedAt: new Date() },
  });

  return values;
});

export const action = async (args: ActionFunctionArgs) => {
  const { request } = args;
  const { authClient } = createAuthClient(request);

  const result = await performMutation({
    request,
    schema,
    mutation,
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

  return (
    <div className="container relative pt-20 pb-44">
      <div className="flex -mx-4 justify-center">
        <div className="md:flex-1/2 px-4 pt-10 lg:pt-0">
          <h1 className="mb-4">Nutzungsbedingungen akzeptieren</h1>
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
                        Ich erkläre mich mit der Geltung der{" "}
                        <a
                          href="https://mint-vernetzt.de/terms-of-use-community-platform"
                          target="_blank"
                          rel="noreferrer"
                          className="text-primary font-bold hover:underline"
                        >
                          Nutzungsbedingungen
                        </a>{" "}
                        einverstanden. Die{" "}
                        <a
                          href="https://mint-vernetzt.de/privacy-policy-community-platform"
                          target="_blank"
                          rel="noreferrer"
                          className="text-primary font-bold hover:underline"
                        >
                          Datenschutzerklärung
                        </a>{" "}
                        habe ich zur Kenntnis genommen.
                      </span>
                    </label>
                  </div>
                </div>
                <div className="mb-8">
                  <button type="submit" className="btn btn-primary">
                    Bestätigen
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
