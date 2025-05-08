export const locale = {
  validation: {
    password: {
      min: "Your password must be at least 8 characters long.",
    },
    confirmPassword: {
      min: "Your password must be at least 8 characters long.",
    },
    passwordMismatch: "Your passwords do not match. Please try again.",
  },
  error: {
    badRequest:
      "Did not provide access or refresh token to reset the password.",
    confirmation: "Your passwords do not match.",
  },
  content: {
    headline: "Set new password",
    description:
      "Please enter your new password. Remember that it must be at least 8 characters long. For more security, we recommend using a minimum of 12 characters with uppercase and lowercase letters, numbers, and special characters.",
  },
  form: {
    label: {
      password: "New password",
      confirmPassword: "Repeat password",
      submit: "Save password",
    },
    showPassword: "Show password",
    hidePassword: "Hide password",
  },
} as const;
