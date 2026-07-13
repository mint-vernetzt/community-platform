import { type LoaderFunctionArgs } from "react-router";
import { invariantResponse } from "~/lib/utils/response";
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

  invariantResponse(false, "Server Error during verification", { status: 500 });
}
