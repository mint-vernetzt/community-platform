export const locale = {
  login: "Login",
  validation: {
    email: "Please enter a valid email address.",
  },
  response: {
    headline: "Reset password",
    success:
      'An email to reset the password has been sent to <0>{{email}}</0>. To reset the password, please click within one hour on the "Reset password" link that we send you via <0>{{systemMail}}</0>. Please also check your spam folder. If you do not receive the email, feel free to contact our <1>support</1>.',
    notice:
      "If you have not registered with this email address, you will not receive an email to reset the password. The same applies if you are registered via <0>MINT-ID</0>. In this case, you can reset the password at <1>mint-id.org</1>.",
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
