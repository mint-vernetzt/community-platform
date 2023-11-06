import { Button, Input } from "@mint-vernetzt/components";
import { json, redirect, type DataFunctionArgs } from "@remix-run/node";
import { Form, useLoaderData } from "@remix-run/react";
import { createAuthClient, getSessionUser } from "~/auth.server";
import { invariantResponse } from "~/lib/utils/response";
import { getRedirectPathOnProtectedProjectRoute } from "../utils.server";

export const loader = async (args: DataFunctionArgs) => {
  const { request, params } = args;
  const response = new Response();

  const authClient = createAuthClient(request, response);
  const sessionUser = await getSessionUser(authClient);

  invariantResponse(
    typeof params.slug !== "undefined",
    'Route parameter "slug" not found',
    {
      status: 404,
    }
  );

  const redirectPath = await getRedirectPathOnProtectedProjectRoute({
    request,
    slug: params.slug,
    sessionUser,
    authClient,
  });

  if (redirectPath !== null) {
    return redirect(redirectPath, { headers: response.headers });
  }

  return json(
    { slug: params.slug, baseURL: process.env.COMMUNITY_BASE_URL },
    { headers: response.headers }
  );
};

function ChangeURL() {
  const loaderData = useLoaderData<typeof loader>();

  return (
    <>
      <p className="mv-mb-4">
        Aktuell ist Dein Projekt über folgende URL "{loaderData.baseURL}
        /project/
        <strong>{loaderData.slug}</strong>" zu erreichen.
      </p>
      <p className="mv-mb-4">
        Wenn Du die URL Deines Projekts änderst, dann ist Dein Projekt über den
        bisherigen Link, solltest Du ihn bereits geteilt haben, nicht mehr
        erreichbar.
      </p>
      <Form>
        <Input id="slug" defaultValue={loaderData.slug}>
          Projekt-URL
        </Input>
        <Button type="submit" level="negative">
          URL ändern
        </Button>
      </Form>
    </>
  );
}

export default ChangeURL;
