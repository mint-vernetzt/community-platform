import { redirect, type LoaderFunctionArgs } from "react-router";
import { invariantResponse } from "~/lib/utils/response";
import { isBotRequest } from "~/utils.server";
import { confirmGuest, verifyConfirmationToken } from "./verify.server";
import { redirectWithToast } from "~/toast.server";
import { languageModuleMap } from "~/locales/.server";
import { detectLanguage } from "~/root.server";

export async function loader(args: LoaderFunctionArgs) {
  const { request } = args;

  if (process.env.NODE_ENV !== "test") {
    const isBot = isBotRequest(request.headers.get("user-agent"));
    invariantResponse(
      isBot === false,
      "Bots are not allowed to access this resource",
      { status: 403 }
    );
  }

  const url = new URL(request.url);
  const tokenHash = url.searchParams.get("token_hash");
  invariantResponse(tokenHash !== null, "Bad request", { status: 400 });
  // Check if token is a valid hex string
  const isValidToken = /^[0-9A-Fa-f]+$/g.test(tokenHash);
  invariantResponse(isValidToken, "Invalid token", { status: 400 });

  const confirmationRedirect = url.searchParams.get("confirmation_redirect");
  invariantResponse(
    confirmationRedirect !== null &&
      confirmationRedirect.startsWith(process.env.COMMUNITY_BASE_URL),
    "Bad request",
    { status: 400 }
  );

  const acceptTerms = url.searchParams.get("accept_terms");
  invariantResponse(acceptTerms === "true", "Bad Request", { status: 400 });

  const { error, data } = await verifyConfirmationToken(tokenHash);

  if (error !== null && error.code === "expired") {
    return redirect(
      `/auth/guest/request-confirmation?confirmation_redirect=${confirmationRedirect}`
    );
  }

  if (data === null) {
    throw new Response("No guest found", {
      status: 400,
    });
  }

  const language = await detectLanguage(request);
  const locales = languageModuleMap[language]["auth/guest/verify"];

  await confirmGuest({
    guestId: data.id,
    locales: {
      mail: {
        subject: locales.subject,
      },
    },
  });

  return redirectWithToast(confirmationRedirect, {
    id: "guest-confirmed",
    key: `guest-confirmed-${Date.now()}`,
    message: locales.message,
  });
}
