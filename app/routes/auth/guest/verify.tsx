import { type LoaderFunctionArgs } from "react-router";
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
  // Check if token is a valid base64url string
  const isValidToken = /^[A-Za-z0-9_-]+$/g.test(tokenHash);
  invariantResponse(isValidToken, "Invalid token", { status: 400 });

  const confirmationRedirect = url.searchParams.get("confirmation_redirect");
  invariantResponse(
    confirmationRedirect !== null &&
      confirmationRedirect.startsWith(process.env.COMMUNITY_BASE_URL),
    "Bad request",
    { status: 400 }
  );
  const { error, data } = await verifyConfirmationToken(tokenHash);

  if (error !== null || data === null) {
    throw new Response(error?.message ?? "Bad request", {
      status: 400,
    });
  }

  await confirmGuest(data.id);

  const language = await detectLanguage(request);
  const locales = languageModuleMap[language]["auth/guest/verify"];

  return redirectWithToast(confirmationRedirect, {
    id: "guest-confirmed",
    key: `guest-confirmed-${Date.now()}`,
    message: locales.message,
  });
}
