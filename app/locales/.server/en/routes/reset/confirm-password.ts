export const locale = {
  error: {
    missingConfirmationLink:
      "Did not provide a confirmation link search parameter",
    invalidConfirmationStructure:
      "The provided confirmation link does not have the right structure",
    missingRedirect: "Did not provide a redirect_to search parameter",
    noBaseUrl: "COMMUNITY_BASE_URL is not defined in .env",
    invalidRedirectUrlStructure:
      "The redirect_to URL does not have the right structure",
    invalidRedirectPathStructure:
      "The login_redirect path does not have the right structure",
    missingToken: "Did not provide a token search parameter",
    tokenNoHex: "The token parameter is not a hex value",
    missingTypeSearch: "Did not provide a type search parameter",
    noRecovery: "The type parameter is not of type recovery",
  },
  content: {
    headline: "Reset password",
    intro:
      "Forgot your password? Click on the link below to reset your password:",
    action: "Reset password",
  },
} as const;
