import {
  json,
  redirect,
  type ActionArgs,
  type LoaderArgs,
} from "@remix-run/node";
import {
  Form,
  useActionData,
  useSearchParams,
  useSubmit,
} from "@remix-run/react";
import { type SupabaseClient } from "@supabase/supabase-js";
import React from "react";
import { makeDomainFunction } from "remix-domains";
import {
  Form as RemixForm,
  performMutation,
  type PerformMutation,
} from "remix-forms";
import { z, type Schema } from "zod";
import { createAuthClient, getSession, getSessionUser } from "~/auth.server";
import { prismaClient } from "~/prisma";

const schema = z.object({
  termsAccepted: z.boolean(),
  loginRedirect: z.string().optional(),
});

export const loader = async (args: LoaderArgs) => {
  const { request } = args;
  const cookieHeader = request.headers.get("Cookie");
  console.log({ cookieHeader });
  console.log({ request });
  const response = new Response();
  const authClient = createAuthClient(request, response);
  const session = await getSession(authClient);
  console.log("loader terms", { session });
  const sessionUser = await getSessionUser(authClient);
  console.log("loader terms", { sessionUser });
  console.log("sessionUser !== null", sessionUser !== null);

  console.log(response.headers);
  if (sessionUser !== null) {
    const profile = await prismaClient.profile.findFirst({
      where: { id: sessionUser.id },
      select: { termsAccepted: true },
    });
    console.log("profile !== null", profile !== null);
    if (profile !== null) {
      if (profile.termsAccepted === true) {
        console.log("profile.termsAccepted", profile.termsAccepted);
        return redirect("/dashboard", { headers: response.headers });
      }
      return json({ profile }, { headers: response.headers });
      // return { profile };
    }
  }
  console.log("hello!1!!!");
  return redirect("/", { headers: response.headers });
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

type ActionData = PerformMutation<z.infer<Schema>, z.infer<typeof schema>>;

export const action = async (args: ActionArgs) => {
  const { request } = args;
  const response = new Response();
  const authClient = createAuthClient(request, response);

  const formData = await request.formData();
  const termsAccepted = formData.get("termsAccepted") || false;
  if (!termsAccepted) {
    return json(
      { success: false, error: { termsAccepted: "failed!" } },
      { headers: response.headers }
    );
  }
  return redirect("/dashboard", { headers: response.headers });

  //   const result = await performMutation({
  //     request,
  //     schema,
  //     mutation,
  //     environment: { authClient: authClient },
  //   });

  //   if (result.success === true) {
  //     console.log("hello?");
  //     return redirect(result.data.loginRedirect || "/dashboard", {
  //       headers: response.headers,
  //     });
  //   }
  //   return result;
};

function AcceptTerms() {
  const actionData = useActionData<typeof action>();
  console.log(actionData);
  //   const [urlSearchParams] = useSearchParams();
  //   const loginRedirect = urlSearchParams.get("login_redirect");
  //   const submit = useSubmit();

  //   const handleKeyPress = (event: React.KeyboardEvent<HTMLFormElement>) => {
  //     if (event.key === "Enter") {
  //       event.preventDefault();
  //       // TODO: Type issue
  //       if (event.target.getAttribute("name") !== "termsAccepted") {
  //         submit(event.currentTarget);
  //       }
  //     }
  //   };

  return (
    <div className="container relative pt-20 pb-44">
      <div className="flex -mx-4 justify-center">
        <div className="md:flex-1/2 px-4 pt-10 lg:pt-0">
          <h1 className="mb-4">Nutzungsbedingungen akzeptieren</h1>

          <Form method="post">
            <div className="mb-8">
              <div className="form-control checkbox-privacy">
                <label className="label cursor-pointer items-start">
                  <input
                    type="checkbox"
                    className="checkbox checkbox-primary mr-4"
                    name="termsAccepted"
                  />
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
          </Form>
        </div>
      </div>
    </div>
  );
}

export default AcceptTerms;
