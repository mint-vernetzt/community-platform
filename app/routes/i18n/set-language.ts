import { type LoaderFunctionArgs, json } from "@remix-run/node";
import { localeCookie } from "~/i18n.server";
import { invariantResponse } from "~/lib/utils/response";

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const searchParams = url.searchParams;
  const lng = searchParams.get("lng");
  invariantResponse(lng === "de" || lng === "en", "Invalid language", {
    status: 400,
  });
  return json(
    {},
    {
      headers: {
        "Set-Cookie": await localeCookie.serialize(lng),
      },
    }
  );
}
