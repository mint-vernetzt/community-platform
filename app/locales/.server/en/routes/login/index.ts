export const locale = {
  validation: {
    email: "Please enter a valid email address.",
    password: {
      min: "Your password must be at least 8 characters long.",
      required: "Please enter your password.",
    },
  },
  error: {
    invalidCredentials:
      "Your login credentials (email or password) are incorrect. Please check your entries.",
    notConfirmed:
      'Your email address has not yet been confirmed. That\'s why we have sent you a new confirmation link. Please check your inbox and click on the confirmation link. If you haven\'t received an email, please check your spam folder or contact <a href="mailto:{{supportMail}}" className="mv-text-primary mv-font-bold hover:mv-underline">Support</a>.',
  },
  content: {
    headline: "Login",
    question: "Not a member yet?",
    action: "Register",
  },
  label: {
    email: "Email *",
    password: "Password *",
    showPassword: "Show password",
    hidePassword: "Hide password",
    submit: "Login",
    reset: "Forgot password?",
  },
} as const;
