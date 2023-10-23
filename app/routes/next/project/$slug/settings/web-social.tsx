import { TextButton } from "@mint-vernetzt/components";
import { redirect, type DataFunctionArgs } from "@remix-run/node";
import { Link, useLocation } from "@remix-run/react";
import { createAuthClient, getSessionUser } from "~/auth.server";
import { invariantResponse } from "~/lib/utils/response";
import { getRedirectPathOnProtectedProjectRoute } from "./utils.server";

export const loader = async (args: DataFunctionArgs) => {
  const { request, params } = args;
  const response = new Response();

  const authClient = createAuthClient(request, response);

  const sessionUser = await getSessionUser(authClient);

  // check slug exists (throw bad request if not)
  invariantResponse(params.slug !== undefined, "No valid route", {
    status: 400,
  });

  const redirectPath = await getRedirectPathOnProtectedProjectRoute({
    request,
    slug: params.slug,
    sessionUser,
    authClient,
  });

  if (redirectPath !== null) {
    return redirect(redirectPath, { headers: response.headers });
  }

  return null;
};

function WebSocial() {
  const location = useLocation();

  return (
    <>
      <TextButton arrowLeft size="large">
        <Link to={location.pathname} prefetch="intent">
          Website und Soziale Netwerke
        </Link>
      </TextButton>
      <h1>{location.pathname}</h1>
    </>
  );
}

export default WebSocial;
