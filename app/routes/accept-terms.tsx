import {
  redirect,
  type LoaderArgs,
  json,
  type ActionArgs,
} from "@remix-run/node";
import { Form, useActionData, useLoaderData } from "@remix-run/react";
import { unauthorized } from "remix-utils";

import { createAuthClient, getSessionOrThrow } from "~/auth.server";
import { prismaClient } from "~/prisma";

export const loader = async (args: LoaderArgs) => {
  const { request } = args;
  const response = new Response();

  const authClient = createAuthClient(request, response);
  const session = await getSessionOrThrow(authClient);

  if (session !== null) {
    const profile = await prismaClient.profile.findFirst({
      where: { id: session.user.id },
      select: { termsAccepted: true },
    });
    if (profile !== null) {
      if (profile.termsAccepted === true) {
        return redirect("/dashboard", { headers: response.headers });
      }
      return json({ profile }, { headers: response.headers });
    }
  }
  return redirect("/explore/organizations", { headers: response.headers });
};

export const action = async (args: ActionArgs) => {
  const { request } = args;
  const response = new Response();

  const authClient = createAuthClient(request, response);
  const session = await getSessionOrThrow(authClient);
  if (session === null) {
    throw unauthorized("Unauthorized");
  }

  const requestClone = request.clone(); // we need to clone request, because unpack formData can be used only once
  const formData = await requestClone.formData();

  const termsAccepted = formData.get("termsAccepted") === "on";

  if (termsAccepted === true) {
    console.log("SET TERMS ACCEPTED");
    return redirect("/dashboard", { headers: response.headers });
  }

  return json({ termsAccepted }, { headers: response.headers });
};

function AcceptTerms() {
  const loaderData = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();

  return (
    <Form method="post">
      <label>
        <input
          type="checkbox"
          name="termsAccepted"
          defaultChecked={
            actionData?.termsAccepted || loaderData.profile.termsAccepted
          }
        />
        I accept the terms and conditions
      </label>
      <button type="submit">Submit</button>
      {actionData?.termsAccepted === false && <p>ACCEPT TERMS!!!</p>}
    </Form>
  );
}

export default AcceptTerms;
