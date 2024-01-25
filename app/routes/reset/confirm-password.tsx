import type { LoaderArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { badRequest, serverError } from "remix-utils";
import HeaderLogo from "~/components/HeaderLogo/HeaderLogo";
import PageBackground from "../../components/PageBackground/PageBackground";
import { createAuthClient, getSessionUser } from "~/auth.server";
import i18next from "~/i18next.server";
import { useTranslation } from "react-i18next";
import { detectLanguage } from "~/root.server";

// How to build the confirmation url to test this functionality on dev?

// 1. Reset password
// 2. Copy the link from the received inbucket mail
// 3. Encode the link on https://www.url-encode-decode.com/
// 4. Add this as prefix: localhost:3000/reset/confirm-password?confirmation_link=<ENCODED CONFIRMATION LINK>
// 5. Now we have the link structure that we also receive on the server
// 6. Paste the whole link in the browser and visit it

const i18nNS = ["routes/reset/confirm-password"];
export const handle = {
  i18n: i18nNS,
};

export const loader = async (args: LoaderArgs) => {
  const { request } = args;

  const response = new Response();
  const authClient = createAuthClient(request, response);
  const locale = detectLanguage(request);
  const t = await i18next.getFixedT(locale, i18nNS);
  const sessionUser = await getSessionUser(authClient);
  if (sessionUser !== null) {
    return redirect("/dashboard", { headers: response.headers });
  }

  const url = new URL(request.url);

  // Get search param confirmation_link from url
  const confirmationLink = url.searchParams.get("confirmation_link");
  if (confirmationLink === null) {
    throw badRequest(t("error.missingConfirmationLink"));
  }

  // Check if confirmationLink starts with https://${process.env.SUPABASE_URL}/auth/v1/verify
  if (
    !confirmationLink.startsWith(`${process.env.SUPABASE_URL}/auth/v1/verify?`)
  ) {
    throw badRequest(t("error.invalidConfirmationStructure"));
  }

  // Generate URL object from confirmationLink
  const confirmationLinkUrl = new URL(confirmationLink);

  // Get search param redirect_to
  let redirectTo = confirmationLinkUrl.searchParams.get("redirect_to");
  if (redirectTo === null) {
    throw badRequest(t("error.missingRedirect"));
  }

  // Check if COMMUNITY_BASE_URL is present in .env
  if (process.env.COMMUNITY_BASE_URL === undefined) {
    throw serverError(t("error.noBaseUrl"));
  }

  // Check if redirectTo starts with https://${process.env.COMMUNITY_BASE_URL}.
  if (!redirectTo.startsWith(`${process.env.COMMUNITY_BASE_URL}`)) {
    throw badRequest(t("error.invalidRedirectUrlStructure"));
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
      throw badRequest(t("error.invalidRedirectPathStructure"));
    }
  }

  // Get search param token
  const token = confirmationLinkUrl.searchParams.get("token");
  if (token === null) {
    throw badRequest(t("error.missingToken"));
  }

  // Check if token is a hex value (only on production environment)
  if (process.env.NODE_ENV === "production") {
    const isHex = /^[0-9A-Fa-f]+$/g.test(token);
    if (!isHex) {
      throw badRequest(t("error.tokenNoHex"));
    }
  }

  // Get search param type
  const type = confirmationLinkUrl.searchParams.get("type");
  if (type === null) {
    throw badRequest(t("error.missingTypeSearch"));
  }

  // Check if type === "recovery"
  if (type !== "recovery") {
    throw badRequest(t("error.noRecovery"));
  }

  // Build new URL -> {process.env.SUPABASE_URL}/auth/v1/verify?redirect_to=${process.env.COMMUNITY_BASE_URL}/verification&token=${token}&type=recovery
  const sanitizedConfirmationLink = `${
    process.env.SUPABASE_URL
  }/auth/v1/verify?redirect_to=${process.env.COMMUNITY_BASE_URL}/verification${
    loginRedirect !== null ? `?login_redirect=${loginRedirect}` : ""
  }&token=${token}&type=recovery`;

  return json(
    {
      confirmationLink: sanitizedConfirmationLink,
    },
    { headers: response.headers }
  );
};

export default function Confirm() {
  const loaderData = useLoaderData<typeof loader>();
  const { t } = useTranslation(i18nNS);
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
            <h1 className="mb-4">{t("content.headline")}</h1>
            <>
              <p className="mb-4">{t("content.intro")}</p>
              <a href={loaderData.confirmationLink} className="btn btn-primary">
                {t("content.action")}
              </a>
            </>
          </div>
        </div>
      </div>
    </>
  );
}
