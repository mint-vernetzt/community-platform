export const locale = {
  login: "Login",
  validation: {
    email: {
      email: "Please enter a valid email address.",
      min: "Please enter a valid email address.",
    },
  },
  response: {
    headline: "Reset password",
    done: {
      prefix: "An email to reset your password has been sent to",
      suffix: ".",
    },
    notice:
      "If you have not yet registered under this email address, you will not receive an email to reset your password.",
  },
  form: {
    intro:
      "Forgot your password? Enter your email address that you used to sign up. We will send you an email through which you can set a new password.",
    label: {
      email: "Email",
      submit: "Reset password",
    },
  },
} as const;
