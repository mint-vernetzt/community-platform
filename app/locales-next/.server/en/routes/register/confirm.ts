export const locale = {
  error: {
    badRequest1: "Did not provide a confirmation link search parameter",
    badRequest2:
      "The provided confirmation link does not have the right structure",
    badRequest3: "Did not provide a redirect_to search parameter",
    badRequest4: "The redirect_to URL does not have the right structure",
    badRequest5: "The login_redirect path does not have the right structure",
    badRequest6: "Did not provide a token search parameter",
    badRequest7: "The token parameter is not a hex value",
    badRequest8: "Did not provide a type search parameter",
    badRequest9: "The type parameter is not of type signup",
  },
  content: {
    headline: "Registration confirmation",
    intro:
      "Welcome to the STEM community! Please confirm the email address to activate your profile on the MINTvernetzt platform within 24 hours using the following link:",
    action: "Confirm registration",
  },
} as const;
