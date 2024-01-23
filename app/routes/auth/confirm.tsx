import type { LoaderFunctionArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { useLoaderData, useSearchParams } from "@remix-run/react";
import { type EmailOtpType } from "@supabase/supabase-js";
import { createAuthClient, getSessionUser } from "~/auth.server";
import HeaderLogo from "~/components/HeaderLogo/HeaderLogo";
import { invariantResponse } from "~/lib/utils/response";
import PageBackground from "../../components/PageBackground/PageBackground";

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
  invariantResponse(confirmationLink !== null, "Bad request", { status: 400 });
  invariantResponse(
    process.env.COMMUNITY_BASE_URL !== undefined,
    "Server error",
    { status: 500 }
  );
  // Check if confirmationLink starts with https://${process.env.SUPABASE_URL}/auth/v1/verify
  invariantResponse(
    confirmationLink.startsWith(
      `${process.env.COMMUNITY_BASE_URL}/auth/verify?`
    ),
    "Bad request",
    { status: 400 }
  );
  // Generate URL object from confirmationLink
  const confirmationLinkUrl = new URL(confirmationLink);
  // Get search param token_hash
  const tokenHash = confirmationLinkUrl.searchParams.get("token_hash");
  invariantResponse(
    tokenHash !== null && tokenHash.startsWith("pkce_"),
    "Bad request",
    { status: 400 }
  );
  const hash = tokenHash.substring(5);
  const isHex = /^[0-9A-Fa-f]+$/g.test(hash);
  invariantResponse(isHex, "Bad request", { status: 400 });
  // Get search param type
  const type = confirmationLinkUrl.searchParams.get(
    "type"
  ) as EmailOtpType | null;
  invariantResponse(type !== null, "Bad request", { status: 400 });
  // Check if type === "signup"
  invariantResponse(
    type === "signup" || type === "email_change" || type === "recovery",
    "Bad request",
    { status: 400 }
  );
  // Get search param login_redirect
  const loginRedirect = confirmationLinkUrl.searchParams.get("login_redirect");
  invariantResponse(
    loginRedirect !== null &&
      loginRedirect.startsWith(process.env.COMMUNITY_BASE_URL),
    "Bad request",
    { status: 400 }
  );

  // Build new URL
  const sanitizedConfirmationLink = `${process.env.COMMUNITY_BASE_URL}/auth/verify?token_hash=${tokenHash}&type=${type}&login_redirect=${loginRedirect}`;

  return json({
    confirmationLink: sanitizedConfirmationLink,
  });
};

export default function Confirm() {
  const loaderData = useLoaderData<typeof loader>();
  const [searchParams] = useSearchParams();
  const type = searchParams.get("type");

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
            <h1 className="mb-4">Registrierungsbestätigung</h1>
            <>
              <p className="mb-4">
                Herzlich willkommen in der MINTcommunity! Bitte bestätige
                innerhalb von 24 Stunden die E-Mail-Adresse zur Aktivierung
                Deines Profils auf der MINTvernetzt-Plattform über den folgenden
                Link:
              </p>
              <a href={loaderData.confirmationLink} className="btn btn-primary">
                Registrierung bestätigen
              </a>
            </>
            <h1 className="mb-4">E-Mail-Adresse ändern</h1>
            <>
              <p className="mb-4">
                Um Deine E-Mail-Adresse auf der MINTvernetzt-Plattform zu
                ändern, folge bitte diesem Link:
              </p>
              <a href={loaderData.confirmationLink} className="btn btn-primary">
                Neue Mailadresse bestätigen
              </a>
            </>
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
