import type { LoaderFunctionArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import HeaderLogo from "~/components/HeaderLogo/HeaderLogo";
import PageBackground from "../../components/PageBackground/PageBackground";
import { createAuthClient, getSessionUser } from "~/auth.server";

// How to build the confirmation url to test this functionality on dev?

// 1. Reset password
// 2. Copy the link from the received inbucket mail
// 3. Encode the link on https://www.url-encode-decode.com/
// 4. Add this as prefix: localhost:3000/reset/confirm-password?confirmation_link=<ENCODED CONFIRMATION LINK>
// 5. Now we have the link structure that we also receive on the server
// 6. Paste the whole link in the browser and visit it

export const loader = async (args: LoaderFunctionArgs) => {
  const { request } = args;

  const { authClient } = createAuthClient(request);
  const sessionUser = await getSessionUser(authClient);
  if (sessionUser !== null) {
    return redirect("/dashboard");
  }

  const url = new URL(request.url);

  // Get search param confirmation_link from url
  const confirmationLink = url.searchParams.get("confirmation_link");
  if (confirmationLink === null) {
    throw json("Did not provide a confirmation link search parameter", {
      status: 400,
    });
  }

  // Check if confirmationLink starts with https://${process.env.SUPABASE_URL}/auth/v1/verify
  if (
    !confirmationLink.startsWith(`${process.env.SUPABASE_URL}/auth/v1/verify?`)
  ) {
    throw json("The provided comfirmation link has not the right structure", {
      status: 400,
    });
  }

  // Generate URL object from confirmationLink
  const confirmationLinkUrl = new URL(confirmationLink);

  // Get search param redirect_to
  let redirectTo = confirmationLinkUrl.searchParams.get("redirect_to");
  if (redirectTo === null) {
    throw json("Did not provide a redirect_to search parameter", {
      status: 400,
    });
  }

  // Check if COMMUNITY_BASE_URL is present in .env
  if (process.env.COMMUNITY_BASE_URL === undefined) {
    throw json("COMMUNITY_BASE_URL is not defined in .env", { status: 500 });
  }

  // Check if redirectTo starts with https://${process.env.COMMUNITY_BASE_URL}.
  if (!redirectTo.startsWith(`${process.env.COMMUNITY_BASE_URL}`)) {
    throw json("The redirect_to url has not the right structure", {
      status: 400,
    });
  } else {
    // Check if redirectTo starts with https://${process.env.COMMUNITY_BASE_URL}/verification
    // If thats the case the user initialized the password reset
    // If not we were the ones who sent a password recovery manually from supabase.com and we need to add /verification here.
    if (
      !redirectTo.startsWith(`${process.env.COMMUNITY_BASE_URL}/verification`)
    ) {
      redirectTo = `${
        process.env.COMMUNITY_BASE_URL
      }/verification${redirectTo.slice(process.env.COMMUNITY_BASE_URL.length)}`;
    }
  }

  const redirectToUrl = new URL(redirectTo);

  // Get search param login_redirect if any exist
  const loginRedirect = redirectToUrl.searchParams.get("login_redirect");
  if (loginRedirect !== null) {
    const isValidPath = /^([-a-zA-Z0-9@:%._\\+~#?&/=]*)$/g.test(loginRedirect);
    if (!isValidPath) {
      throw json("The login_redirect path has not the right structure", {
        status: 400,
      });
    }
  }

  // Get search param token
  const token = confirmationLinkUrl.searchParams.get("token");
  if (token === null) {
    throw json("Did not provide a token search parameter", { status: 400 });
  }

  // Check if token is a hex value (only on production environment)
  if (process.env.NODE_ENV === "production") {
    const isHex = /^[0-9A-Fa-f]+$/g.test(token);
    if (!isHex) {
      throw json("The token parameter is not a hex value", { status: 400 });
    }
  }

  // Get search param type
  const type = confirmationLinkUrl.searchParams.get("type");
  if (type === null) {
    throw json("Did not provide a type search parameter", { status: 400 });
  }

  // Check if type === "recovery"
  if (type !== "recovery") {
    throw json("The type parameter is not of type recovery", { status: 400 });
  }

  // Build new URL -> {process.env.SUPABASE_URL}/auth/v1/verify?redirect_to=${process.env.COMMUNITY_BASE_URL}/verification&token=${token}&type=recovery
  const sanitizedConfirmationLink = `${
    process.env.SUPABASE_URL
  }/auth/v1/verify?redirect_to=${process.env.COMMUNITY_BASE_URL}/verification${
    loginRedirect !== null ? `?login_redirect=${loginRedirect}` : ""
  }&token=${token}&type=recovery`;

  return json({
    confirmationLink: sanitizedConfirmationLink,
  });
};

export default function Confirm() {
  const loaderData = useLoaderData<typeof loader>();

  return (
    <>
      <PageBackground imagePath="/images/login_background_image.jpg" />
      <div className="md:container md:mx-auto px-4 relative z-10">
        <div className="flex flex-row -mx-4 justify-end">
          <div className="basis-full md:basis-6/12 px-4 pt-3 pb-24 flex flex-row items-center">
            <div>
              <HeaderLogo />
            </div>
            <div className="ml-auto"></div>
          </div>
        </div>
        <div className="flex flex-col md:flex-row -mx-4">
          <div className="basis-full md:basis-6/12 px-4"> </div>
          <div className="basis-full md:basis-6/12 xl:basis-5/12 px-4">
            <h1 className="mb-4">Passwort zurücksetzen</h1>
            <>
              <p className="mb-4">
                Du hast dein Passwort vergessen? Klicke auf den untenstehenden
                Link, um dein Passwort zurückzusetzen:
              </p>
              <a href={loaderData.confirmationLink} className="btn btn-primary">
                Passwort zurücksetzen
              </a>
            </>
          </div>
        </div>
      </div>
    </>
  );
}
