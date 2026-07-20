import { redirect, useLoaderData, type LoaderFunctionArgs } from "react-router";
import { invariantResponse } from "~/lib/utils/response";
import { isBotRequest } from "~/utils.server";
import { confirmGuest, verifyConfirmationToken } from "./verify.server";
import { redirectWithToast } from "~/toast.server";
import { languageModuleMap } from "~/locales/.server";
import { detectLanguage } from "~/root.server";
import { insertComponentsIntoLocale } from "~/lib/utils/i18n";

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
      `/auth/guest/request-confirmation?token_hash=${tokenHash}&confirmation_redirect=${confirmationRedirect}`
    );
  }

  if (data === null) {
    const language = await detectLanguage(request);
    const locales = languageModuleMap[language]["auth/guest/verify"];
    return { locales, supportMail: process.env.SUPPORT_MAIL };
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

function GuestVerify() {
  const { locales, supportMail } = useLoaderData<typeof loader>();
  return (
    <div className="w-full mx-auto px-4 @sm:max-w-sm @md:max-w-md @lg:max-w-lg @xl:max-w-xl @xl:px-6 @2xl:max-w-2xl relative">
      <div className="flex flex-col w-full items-center">
        <div className="w-full @sm:w-2/3 @md:w-1/2 @2xl:w-1/3">
          <div className="mb-6 mt-12"> </div>
          <h1 className="mb-4">{locales.notFound.title}</h1>

          <p className="mb-6">
            {insertComponentsIntoLocale(locales.notFound.description, [
              <a
                href={`mailto:${supportMail}`}
                key="support-mail"
                className="underline hover:no-underline font-semibold"
              />,
            ])}
          </p>
        </div>
      </div>
    </div>
  );
}

export default GuestVerify;
