import { TextButton } from "@mint-vernetzt/components/src/molecules/TextButton";
import {
  Form,
  redirect,
  useLoaderData,
  type LoaderFunctionArgs,
} from "react-router";
import { insertComponentsIntoLocale } from "~/lib/utils/i18n";
import { invariantResponse } from "~/lib/utils/response";
import { languageModuleMap } from "~/locales/.server";
import { detectLanguage } from "~/root.server";
import { isBotRequest } from "~/utils.server";
import { getEventByToken } from "./confirm.server";
import { HoneypotInputs } from "remix-utils/honeypot/react";
import { HONEYPOT_CLASSNAME } from "~/honeypot.shared";

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
  const isValidToken = /^[0-9A-Fa-f]+$/g.test(tokenHash);
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

  const type = url.searchParams.get("type");

  const event = await getEventByToken({ token: tokenHash, type });
  if (event === null) {
    const url = new URL(
      `${process.env.COMMUNITY_BASE_URL}/auth/guest/not-found`
    );
    if (type !== null) {
      url.searchParams.set("type", type);
    }
    return redirect(url.toString());
  }

  invariantResponse(event !== null, "Event not found", { status: 404 });

  const language = await detectLanguage(request);
  const locales = languageModuleMap[language]["auth/guest/confirm"];

  return {
    tokenHash,
    confirmationRedirect,
    type,
    acceptTerms: type !== "revoke" ? true : undefined,
    locales,
    fullyBooked:
      event.participantLimit !== null &&
      event._count.participants + event.guests.length >= event.participantLimit,
  };
}

function GuestConfirm() {
  const {
    tokenHash,
    confirmationRedirect,
    type,
    acceptTerms,
    locales,
    fullyBooked,
  } = useLoaderData<typeof loader>();

  return (
    <div className="w-full mx-auto px-4 @sm:max-w-sm @md:max-w-md @lg:max-w-lg @xl:max-w-xl @xl:px-6 @2xl:max-w-2xl relative">
      <div className="flex flex-col w-full items-center">
        <div className="w-full @sm:w-2/3 @md:w-1/2 @2xl:w-1/3">
          <div className="mb-6 mt-12"> </div>
          {type === "revoke" ? (
            <>
              <h1 className="mb-4">{locales.revocation.title}</h1>
              <p className="mb-6">{locales.revocation.description}</p>
              <Form method="post" action="/auth/guest/verify">
                <HoneypotInputs className={HONEYPOT_CLASSNAME} />
                <input type="hidden" name="token_hash" value={tokenHash} />
                <input
                  type="hidden"
                  name="confirmation_redirect"
                  value={confirmationRedirect}
                />
                {typeof type === "string" && (
                  <input type="hidden" name="type" value={type} />
                )}
                {typeof acceptTerms === "boolean" && (
                  <input
                    type="hidden"
                    name="accept_terms"
                    value={acceptTerms.toString()}
                  />
                )}
                <button
                  type="submit"
                  className="h-auto min-h-0 whitespace-nowrap py-2 px-6 normal-case leading-6 inline-flex cursor-pointer outline-primary shrink-0 flex-wrap items-center justify-center rounded-lg text-center border-primary text-sm font-semibold border bg-primary text-white"
                >
                  {locales.revocation.action}
                </button>
              </Form>
            </>
          ) : (
            <>
              <h1 className="mb-4">{locales.confirmation.title}</h1>
              <p className="mb-6">
                {insertComponentsIntoLocale(locales.confirmation.description, [
                  <TextButton
                    key="terms-of-use-confirmation"
                    as="link"
                    to="/terms-of-use"
                    target="_blank"
                    rel="noreferrer noopener"
                    className="inline-flex"
                  />,
                  <TextButton
                    key="privacy-policy-confirmation"
                    as="link"
                    to="/privacy-policy"
                    target="_blank"
                    rel="noreferrer noopener"
                    className="inline-flex"
                  />,
                ])}
                {fullyBooked && (
                  <span className="block mt-2">
                    {locales.confirmation.fullyBooked}
                  </span>
                )}
              </p>
              <Form method="post" action="/auth/guest/verify">
                <HoneypotInputs className={HONEYPOT_CLASSNAME} />
                <input type="hidden" name="token_hash" value={tokenHash} />
                <input
                  type="hidden"
                  name="confirmation_redirect"
                  value={confirmationRedirect}
                />
                {typeof type === "string" && (
                  <input type="hidden" name="type" value={type} />
                )}
                {typeof acceptTerms === "boolean" && (
                  <input
                    type="hidden"
                    name="accept_terms"
                    value={acceptTerms.toString()}
                  />
                )}
                <button
                  type="submit"
                  className="h-auto min-h-0 whitespace-nowrap py-2 px-6 normal-case leading-6 inline-flex cursor-pointer outline-primary shrink-0 flex-wrap items-center justify-center rounded-lg text-center border-primary text-sm font-semibold border bg-primary text-white"
                >
                  {locales.confirmation.action}
                </button>
              </Form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default GuestConfirm;
