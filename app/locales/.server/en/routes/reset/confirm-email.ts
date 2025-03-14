export const locale = {
  error: {
    missingConfirmationLink:
      "Did not provide a confirmation link search parameter",
    invalidConfirmationStructure:
      "The provided confirmation link does not have the right structure",
    missingRedirect: "Did not provide a redirect_to search parameter",
    invalidRedirectUrlStructure:
      "The redirect_to URL does not have the right structure",
    invalidRedirectPathStructure:
      "The login_redirect path does not have the right structure",
    missingToken: "Did not provide a token search parameter",
    tokenNoHex: "The token parameter is not a hex value",
    missingTypeSearch: "Did not provide a type search parameter",
    noEmailChange: "The type parameter is not of type email_change",
  },
  content: {
    headline: "Change email address",
    intro:
      "To change your email address on the MINTvernetzt platform, please follow this link:",
    action: "Confirm new email address",
  },
} as const;
