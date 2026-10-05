import { data, type ActionFunctionArgs } from "react-router";
import { localeCookie } from "~/i18n.server";
import {
  LANGUAGE_COOKIE_NAME,
  SUPPORTED_COOKIE_LANGUAGES,
} from "~/i18n.shared";
import { invariantResponse } from "~/lib/utils/response";
import { ArrayElement } from "~/lib/utils/types";

export async function action(args: ActionFunctionArgs) {
  const { request } = args;
  const formData = await request.formData();
  const language = formData.get(LANGUAGE_COOKIE_NAME);
  invariantResponse(
    language !== null &&
      typeof language === "string" &&
      SUPPORTED_COOKIE_LANGUAGES.includes(
        language as ArrayElement<typeof SUPPORTED_COOKIE_LANGUAGES>
      ),
    "Unsupported language",
    {
      status: 400,
    }
  );
  const languageCookieHeaders = {
    "Set-Cookie": await localeCookie.serialize(language),
  };
  return data(null, {
    headers: languageCookieHeaders,
  });
}
