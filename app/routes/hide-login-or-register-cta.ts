import { data, type ActionFunctionArgs } from "react-router";
import { invariantResponse } from "~/lib/utils/response";
import { hideLoginOrRegisterCtaCookie } from "~/root.server";
import {
  HIDE_LOGIN_OR_REGISTER_CTA_COOKIE_NAME,
  HIDE_LOGIN_OR_REGISTER_CTA_COOKIE_VALUES,
} from "~/root.shared";

export async function action(args: ActionFunctionArgs) {
  const { request } = args;
  const formData = await request.formData();
  const hideLoginOrRegisterCta = formData.get(
    HIDE_LOGIN_OR_REGISTER_CTA_COOKIE_NAME
  );
  invariantResponse(
    hideLoginOrRegisterCta === HIDE_LOGIN_OR_REGISTER_CTA_COOKIE_VALUES.true ||
      hideLoginOrRegisterCta === HIDE_LOGIN_OR_REGISTER_CTA_COOKIE_VALUES.false,
    "Unsupported value for hideLoginOrRegisterCta cookie",
    {
      status: 400,
    }
  );
  const hideLoginOrRegisterCtaCookieHeaders = {
    "Set-Cookie": await hideLoginOrRegisterCtaCookie.serialize(
      hideLoginOrRegisterCta
    ),
  };
  return data(null, {
    headers: hideLoginOrRegisterCtaCookieHeaders,
  });
}
