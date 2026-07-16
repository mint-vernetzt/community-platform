import { Link, useLoaderData, type LoaderFunctionArgs } from "react-router";
import { invariantResponse } from "~/lib/utils/response";
import { languageModuleMap } from "~/locales/.server";
import { detectLanguage } from "~/root.server";
import { isBotRequest } from "~/utils.server";

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

  const confirmationLinkValue = url.searchParams.get("confirmation_link");
  invariantResponse(confirmationLinkValue !== null, "Bad Request", {
    status: 400,
  });

  invariantResponse(
    confirmationLinkValue.startsWith(
      `${process.env.COMMUNITY_BASE_URL}/auth/guest/verify?`
    ),
    "Bad Request",
    { status: 400 }
  );

  const confirmationLink = new URL(confirmationLinkValue);
  // Validate token_hast
  const tokenHash = confirmationLink.searchParams.get("token_hash");
  invariantResponse(tokenHash !== null, "Bad Request", { status: 400 });
  // Check if token is a valid hex string
  const isValidToken = /^(pkce_)?[0-9A-Fa-f]+$/g.test(tokenHash);
  invariantResponse(isValidToken, "Bad Request", { status: 400 });

  const confirmationRedirect = confirmationLink.searchParams.get(
    "confirmation_redirect"
  );

  invariantResponse(
    confirmationRedirect !== null &&
      confirmationRedirect.startsWith(process.env.COMMUNITY_BASE_URL),
    "Bad request",
    { status: 400 }
  );

  const language = await detectLanguage(request);
  const locales = languageModuleMap[language]["auth/guest/confirm"];

  return {
    confirmationLink: confirmationLinkValue,
    locales,
  };
}

function GuestConfirm() {
  const { confirmationLink, locales } = useLoaderData<typeof loader>();

  return (
    <div className="w-full mx-auto px-4 @sm:max-w-sm @md:max-w-md @lg:max-w-lg @xl:max-w-xl @xl:px-6 @2xl:max-w-2xl relative">
      <div className="flex flex-col w-full items-center">
        <div className="w-full @sm:w-2/3 @md:w-1/2 @2xl:w-1/3">
          <div className="mb-6 mt-12"> </div>
          <h1 className="mb-4">{locales.title}</h1>

          <p className="mb-6">{locales.description}</p>
          <Link
            to={confirmationLink}
            className="h-auto min-h-0 whitespace-nowrap py-2 px-6 normal-case leading-6 inline-flex cursor-pointer outline-primary shrink-0 flex-wrap items-center justify-center rounded-lg text-center border-primary text-sm font-semibold border bg-primary text-white"
          >
            {locales.action}
          </Link>
        </div>
      </div>
    </div>
  );
}

export default GuestConfirm;
