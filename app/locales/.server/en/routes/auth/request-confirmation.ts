export const locale = {
  validation: {
    email: "Please enter a valid email address.",
  },
  content: {
    headline: "Request new confirmation link",
    description:
      'Your confirmation link has expired. Remember that it is only valid for 1 hour. Here you can request a new one by entering your email address and clicking on "Request confirmation link".',
    emailLabel: "Email",
    cta: "Request confirmation link",
    success:
      "An email with the new confirmation link has been sent to <0>{{email}}</0>. To complete the registration, please confirm the registration link in your emails within one hour, which we will send you via <0>{{systemMail}}</0>. Please also check your spam folder. If you do not receive the email, feel free to contact our <1>support</1>.",
  },
} as const;
