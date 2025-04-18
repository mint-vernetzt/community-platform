export const locale = {
  validation: {
    password: {
      min: "Your password must be at least 8 characters long.",
    },
    confirmPassword: {
      min: "Your password must be at least 8 characters long.",
    },
    accessToken: {
      min: "Please use the link from your email to change your password.",
    },
    refreshToken: {
      min: "Please use the link from your email to change your password.",
    },
  },
  error: {
    badRequest:
      "Did not provide access or refresh token to reset the password.",
    confirmation: "Your passwords do not match.",
  },
  form: {
    label: {
      password: "New password",
      confirmPassword: "Repeat password",
      submit: "Save password",
    },
  },
} as const;
