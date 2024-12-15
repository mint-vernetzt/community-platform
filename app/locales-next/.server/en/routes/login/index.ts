export const login = {
  validation: {
    email: {
      email: "Please enter a valid email address.",
      min: "Please enter a valid email address.",
    },
    password: {
      min: "Your password must be at least 8 characters long.",
    },
  },
  error: {
    invalidCredentials:
      "Your login credentials (email or password) are incorrect. Please check your entries.",
    notConfirmed:
      "Your email address has not yet been confirmed. Please check your inbox and click on the confirmation link. If you haven't received an email, please check your spam folder or contact <0>Support</0>.",
    confirmationLinkExpired:
      "Your confirmation link has expired. Please contact <0>Support</0> to request a new one.",
  },
  content: {
    headline: "Login",
    question: "Not a member yet?",
    action: "Register",
  },
  label: {
    email: "Email",
    password: "Password",
    submit: "Login",
    reset: "Forgot password?",
  },
} as const;
