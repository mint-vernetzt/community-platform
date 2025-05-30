export const locale = {
  error: {
    missingConfirmationLink:
      "Did not provide a confirmation link search parameter",
    invalidConfirmationStructure:
      "The provided confirmation link has not the right structure",
    missingRedirect: "Did not provide a redirect_to search parameter",
    invalidRedirectUrlStructure:
      "The redirect_to url has not the right structure",
    invalidRedirectPathStructure:
      "The login_redirect path has not the right structure",
    missingToken: "Did not provide a token search parameter",
    tokenNoHex: "The token parameter is not a hex value",
    missingTypeSearch: "Did not provide a type search parameter",
    noEmailChange: "The type parameter is not of type email_change",
  },
  content: {
    headline: "E-Mail-Adresse ändern",
    intro:
      "Um Deine E-Mail-Adresse auf der MINTvernetzt-Plattform zu ändern, folge bitte diesem Link:",
    action: "Neue Mailadresse bestätigen",
  },
} as const;
