import { useLoaderData, type LoaderFunctionArgs } from "react-router";
import { RichText } from "~/components/legacy/Richtext/RichText";
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

  const language = await detectLanguage(request);
  const locales = languageModuleMap[language]["auth/guest/not-found"];

  const url = new URL(request.url);
  const type = url.searchParams.get("type");

  return {
    type,
    locales,
  };
}

function GuestNotFound() {
  const { locales, type } = useLoaderData<typeof loader>();
  return (
    <div className="w-full mx-auto px-4 @sm:max-w-sm @md:max-w-md @lg:max-w-lg @xl:max-w-xl @xl:px-6 @2xl:max-w-2xl relative">
      <div className="flex flex-col w-full items-center">
        <div className="w-full @sm:w-2/3 @md:w-1/2 @2xl:w-1/3">
          <div className="mb-6 mt-12"> </div>
          <h1 className="mb-4">
            {type === "revoke"
              ? locales.revocation.title
              : locales.registration.title}
          </h1>

          <RichText
            html={
              type === "revoke"
                ? locales.revocation.description
                : locales.registration.description
            }
          />
        </div>
      </div>
    </div>
  );
}

export default GuestNotFound;
