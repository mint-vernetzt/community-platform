export const locale = {
  content: {
    question: "Already a member?",
    login: "Login",
    create: "Create new profile",
    success:
      "The profile for <b>{{email}}</b> has been created. To complete the registration, please confirm the registration link in your emails within 24 hours, which we have sent you from <b>noreply@mint-vernetzt.de</b>. Please also check your spam folder. If you have already registered with this email address before and have forgotten your password, you can reset your password here:",
    reset: "Reset password",
  },
  form: {
    intro:
      "Here you can create your personal profile. The organizations, networks, or companies in which you are active can be added in the next step.",
    title: {
      label: "Title",
      options: {
        dr: "Dr.",
        prof: "Prof.",
        profdr: "Prof. Dr.",
      },
    },
    firstName: "First name",
    lastName: "Last name",
    email: "Email",
    password: "Password",
    acknowledgements: {
      intro: "I agree to the",
      termsOfUse: "terms of use",
      bridge: ". The",
      dataProtection: "data protection declaration",
      outro: "has been acknowledged.",
    },
    submit: "Create profile",
  },
  validation: {
    termsAccepted:
      "Please accept our terms of use and confirm that you have read the privacy policy.",
    firstName: {
      min: "Please enter your first name.",
    },
    lastName: {
      min: "Please enter your last name.",
    },
    email: {
      email: "Please enter a valid email address.",
      min: "Please enter a valid email address.",
    },
    password: {
      min: "Your password must be at least 8 characters long. Use numbers and symbols to make it more secure.",
    },
  },
} as const;
