import { useSearchParams, useSubmit } from "@remix-run/react";
import React from "react";
import { useTranslation } from "react-i18next";

const i18nNS = ["routes/verification"];
export const handle = {
  i18n: i18nNS,
};

export default function Index() {
  const submit = useSubmit();
  const [urlSearchParams] = useSearchParams();

  const { t } = useTranslation(i18nNS);

  // Verification point for confirmation links
  // Must be called on the client because hash parameters can only be accessed from the client
  React.useEffect(() => {
    const urlHashParams = new URLSearchParams(window.location.hash.slice(1));
    const type = urlHashParams.get("type");
    const accessToken = urlHashParams.get("access_token");
    const refreshToken = urlHashParams.get("refresh_token");
    const loginRedirect = urlSearchParams.get("login_redirect");
    const error = urlHashParams.get("error");
    const errorCode = urlHashParams.get("error_code");
    const errorDescription = urlHashParams.get("error_description");

    if (accessToken !== null && refreshToken !== null) {
      if (type === "signup") {
        submit(
          loginRedirect
            ? {
                login_redirect: loginRedirect,
                access_token: accessToken,
                refresh_token: refreshToken,
                type: type,
              }
            : {
                access_token: accessToken,
                refresh_token: refreshToken,
                type: type,
              },
          {
            action: "/register/verify",
          }
        );
        return;
      }
      if (type === "recovery") {
        submit(
          loginRedirect
            ? {
                login_redirect: loginRedirect,
                access_token: accessToken,
                refresh_token: refreshToken,
              }
            : { access_token: accessToken, refresh_token: refreshToken },
          {
            action: "/reset/set-password",
          }
        );
        return;
      }
      if (type === "email_change") {
        submit(
          {
            access_token: accessToken,
            refresh_token: refreshToken,
            type: type,
          },
          {
            action: "/reset/set-email",
          }
        );
        return;
      }
    }
    if (error !== null || errorCode !== null || errorDescription !== null) {
      alert(
        t("error.serverError", {
          error: error || "-/-",
          errorCode: errorCode || "-/-",
          errorDescription: errorDescription || "-/-",
        })
      );
      return;
    } else {
      submit(null, { action: "/login" });
    }
  }, [submit, urlSearchParams]);

  return <></>;
}
