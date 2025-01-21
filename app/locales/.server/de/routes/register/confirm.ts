export const locale = {
  error: {
    badRequest1: "[en] Did not provide a confirmation link search parameter",
    badRequest2:
      "[en] The provided comfirmation link has not the right structure",
    badRequest3: "[en] Did not provide a redirect_to search parameter",
    badRequest4: "[en] The redirect_to url has not the right structure",
    badRequest5: "[en] The login_redirect path has not the right structure",
    badRequest6: "[en] Did not provide a token search parameter",
    badRequest7: "[en] The token parameter is not a hex value",
    badRequest8: "[en] Did not provide a type search parameter",
    badRequest9: "[en] The type parameter is not of type signup",
  },
  content: {
    headline: "[en] Registrierungsbestätigung",
    intro:
      "[en] Herzlich willkommen in der MINTcommunity! Bitte bestätige innerhalb von 24 Stunden die E-Mail-Adresse zur Aktivierung Deines Profils auf der MINTvernetzt-Plattform über den folgenden Link:",
    action: "[en] Registrierung bestätigen",
  },
} as const;
